import { Router } from "express";
import Groq from "groq-sdk";
import { db, servicesTable, leadsTable } from "@workspace/db";
import { SendChatMessageBody } from "@workspace/api-zod";
import { servicesKnowledge, normalizeKey } from "../lib/services-knowledge.js";
import { logActivity, createdNoteForSource } from "./leads.js";
import type {
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from "groq-sdk/resources/chat/completions";

const router = Router();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const MODEL = "llama-3.3-70b-versatile";

const BASE_PROMPT = `You are the Social Vista AI assistant — a warm, sharp digital growth consultant for Social Vista, a full-service digital agency.

YOUR GOAL: have a natural, helpful conversation that guides the visitor toward booking a free consultation or appointment, and capture their details when they're interested.

HOW TO BEHAVE:
- Be consultative, not a brochure. Ask ONE focused question at a time to understand the visitor's business, goal, or problem — then recommend the most relevant service(s) and briefly explain why.
- Keep replies short (2-4 sentences or a few bullets). Be warm and concrete.
- NEVER repeat the same question or pitch twice. If the visitor already answered, move forward. Do not loop.
- Answer questions using ONLY the knowledge base below. If something isn't covered (specific prices, timelines, guarantees), say the team will tailor it on a free consultation — never invent details.
- Drive gently toward a next step: "Would you like to book a free consultation?" or "Want me to set up an appointment with our team?"

CAPTURING A LEAD (important):
- When the visitor shows clear interest (wants a consultation, an appointment, a quote, or to be contacted), collect: their name, a contact (email or phone), what service/goal they're interested in, and — if they want an appointment — their preferred date/time.
- Ask for any MISSING piece one at a time; don't demand everything at once. A name plus one contact method is the minimum.
- Once you have at least a name and one contact method, call the save_consultation_lead tool to record it. Do NOT mention the tool. After saving, warmly confirm that the team will reach out (and confirm their preferred time if they gave one).
- Only call the tool once per set of details unless the visitor gives new/updated information.`;

const tools: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "save_consultation_lead",
      description:
        "Record a visitor as a lead when they want a consultation, appointment, quote, or to be contacted. Requires at least a name and one contact method (email or phone).",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "The visitor's full name." },
          email: { type: "string", description: "The visitor's email address, if provided." },
          phone: { type: "string", description: "The visitor's phone/WhatsApp number, if provided." },
          serviceInterest: {
            type: "string",
            description: "The service or goal the visitor is interested in.",
          },
          preferredTime: {
            type: "string",
            description: "Preferred date/time for an appointment, in the visitor's own words, if given.",
          },
          message: {
            type: "string",
            description: "A short summary of what the visitor wants or their situation.",
          },
        },
        required: ["name"],
      },
    },
  },
];

function buildKnowledgeBase(
  services: { title: string; description: string; category: string }[],
): string {
  if (services.length === 0) {
    return "No services are currently listed. Invite the user to contact Social Vista directly.";
  }
  return services
    .map((s) => {
      const k = servicesKnowledge[normalizeKey(s.title)];
      const lines = [`## ${s.title} (${s.category})`];
      if (k) {
        lines.push(`Tagline: ${k.tagline}`);
        lines.push(`Overview: ${k.summary}`);
        lines.push(`Key benefits: ${k.benefits.join("; ")}`);
        lines.push(`What's included: ${k.deliverables.join("; ")}`);
        lines.push(`Ideal for: ${k.idealFor}`);
      } else {
        lines.push(`Overview: ${s.description}`);
      }
      return lines.join("\n");
    })
    .join("\n\n");
}

interface LeadArgs {
  name?: string;
  email?: string;
  phone?: string;
  serviceInterest?: string;
  preferredTime?: string;
  message?: string;
}

router.post("/chat", async (req, res) => {
  try {
    const body = SendChatMessageBody.parse(req.body);

    const dbServices = await db
      .select()
      .from(servicesTable)
      .orderBy(servicesTable.sortOrder);
    const active = dbServices.filter((s) => s.active);

    const systemPrompt =
      BASE_PROMPT +
      "\n\n=== SOCIAL VISTA SERVICES KNOWLEDGE BASE ===\n" +
      buildKnowledgeBase(active) +
      `\n\n=== END KNOWLEDGE BASE ===`;

    const history = (body.history ?? [])
      .slice(-8)
      .map((t) => ({ role: t.role, content: t.content }));

    const messages: ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      ...history,
      { role: "user", content: body.message },
    ];

    const first = await groq.chat.completions.create({
      model: MODEL,
      messages,
      tools,
      tool_choice: "auto",
      max_tokens: 400,
      temperature: 0.6,
    });

    const choice = first.choices[0]?.message;
    const toolCalls = choice?.tool_calls ?? [];

    if (toolCalls.length === 0) {
      const reply =
        choice?.content ??
        "I'm here to help! Please contact us at Social Vista for more information.";
      res.json({ reply, leadCaptured: false });
      return;
    }

    // Execute tool calls (save the lead) and feed results back for a natural confirmation.
    messages.push({
      role: "assistant",
      content: choice?.content ?? "",
      tool_calls: toolCalls,
    });

    let leadCaptured = false;
    for (const call of toolCalls) {
      let result = "Lead not saved.";
      if (call.function.name === "save_consultation_lead") {
        try {
          const args = JSON.parse(call.function.arguments || "{}") as LeadArgs;
          if (args.name && (args.email || args.phone)) {
            const [lead] = await db.insert(leadsTable).values({
              name: args.name,
              email: args.email ?? null,
              phone: args.phone ?? null,
              serviceInterest: args.serviceInterest ?? null,
              preferredTime: args.preferredTime ?? null,
              message: args.message ?? null,
              source: "chat",
            }).returning();
            try {
              await logActivity({
                leadId: lead.id,
                type: "created",
                note: createdNoteForSource("chat"),
              });
            } catch (actErr) {
              req.log.error({ err: actErr }, "Failed to record lead activity");
            }
            leadCaptured = true;
            result = "Lead saved successfully. The team will follow up.";
          } else {
            result = "Need at least a name and one contact method (email or phone) before saving.";
          }
        } catch (toolErr) {
          req.log.error({ err: toolErr }, "Failed to save lead from chat");
          result = "There was an error saving the lead.";
        }
      }
      messages.push({
        role: "tool",
        tool_call_id: call.id,
        content: result,
      });
    }

    const second = await groq.chat.completions.create({
      model: MODEL,
      messages,
      max_tokens: 400,
      temperature: 0.6,
    });

    const reply =
      second.choices[0]?.message?.content ??
      (leadCaptured
        ? "Thanks! I've passed your details to our team — they'll reach out shortly."
        : "Could you share your name and an email or phone number so our team can reach you?");

    res.json({ reply, leadCaptured });
  } catch (err) {
    req.log.error({ err }, "Chat error");
    res.status(500).json({
      reply:
        "I'm having trouble right now. Please reach out to us directly through the contact form.",
      leadCaptured: false,
    });
  }
});

export default router;
