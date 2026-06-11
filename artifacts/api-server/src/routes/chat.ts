import { Router } from "express";
import Groq from "groq-sdk";
import { db, servicesTable } from "@workspace/db";
import { SendChatMessageBody } from "@workspace/api-zod";
import { servicesKnowledge, normalizeKey } from "../lib/services-knowledge.js";

const router = Router();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const BASE_PROMPT = `You are the Social Vista AI assistant — a friendly, knowledgeable digital growth consultant for Social Vista, a full-service digital agency.

Your job:
- Help potential clients understand what Social Vista offers and which service fits their needs.
- Answer questions accurately using ONLY the services and details in the knowledge base below. If something is not covered, say you'll connect them with the team rather than inventing details.
- When a user describes a goal or problem, recommend the most relevant service(s) and briefly explain why.
- Be concise, warm, and professional. Keep replies under ~150 words and use short paragraphs or bullet points.
- Never invent specific prices, timelines, or guarantees. For pricing or a custom plan, guide them to book a free consultation or fill out the contact form.
- Always end with a helpful next step (e.g., "Want me to point you to the right service?" or "Ready to book a free consultation?").

=== SOCIAL VISTA SERVICES KNOWLEDGE BASE ===
`;

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
      buildKnowledgeBase(active) +
      `\n\n=== END KNOWLEDGE BASE ===\nContact: direct the user to the contact form on the website or to book a free consultation for tailored advice and pricing.`;

    const history = (body.history ?? [])
      .slice(-8)
      .map((t) => ({ role: t.role, content: t.content }));

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        ...history,
        { role: "user", content: body.message },
      ],
      max_tokens: 350,
      temperature: 0.6,
    });

    const reply =
      completion.choices[0]?.message?.content ??
      "I'm here to help! Please contact us at Social Vista for more information.";
    res.json({ reply });
  } catch (err) {
    req.log.error({ err }, "Chat error");
    res.status(500).json({
      reply:
        "I'm having trouble right now. Please reach out to us directly through the contact form.",
    });
  }
});

export default router;
