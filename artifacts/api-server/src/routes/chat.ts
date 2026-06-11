import { Router } from "express";
import Groq from "groq-sdk";
import { SendChatMessageBody } from "@workspace/api-zod";

const router = Router();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `You are a helpful AI assistant for Social Vista, a leading social media agency. You help potential clients learn about Social Vista's services and answer their questions.

Social Vista offers:
- Social Media Management & Strategy (Instagram, Facebook, Twitter/X, LinkedIn, TikTok)
- WhatsApp Chatbot Development & Automation
- WhatsApp Business Messaging Campaigns
- Zoom Meetings Manager & Scheduling Solutions
- Software Consultancy & Custom Development
- Crypto Projects & Web3 Development
- SaaS Development & Product Building
- Content Creation & Influencer Marketing
- Paid Ads Management (Meta, Google, LinkedIn)
- SEO & Digital Marketing

Be concise, friendly, and professional. Always guide users toward booking a consultation or filling out the contact form. Do NOT make up specific pricing — direct them to contact Social Vista for a custom quote. Keep responses under 150 words.`;

router.post("/chat", async (req, res) => {
  try {
    const body = SendChatMessageBody.parse(req.body);

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: body.message },
      ],
      max_tokens: 256,
      temperature: 0.7,
    });

    const reply = completion.choices[0]?.message?.content ?? "I'm here to help! Please contact us at Social Vista for more information.";
    res.json({ reply });
  } catch (err) {
    req.log.error({ err }, "Chat error");
    res.status(500).json({ reply: "I'm having trouble right now. Please reach out to us directly through the contact form." });
  }
});

export default router;
