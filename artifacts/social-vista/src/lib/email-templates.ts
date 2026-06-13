export type LeadTemplateId = "intro" | "appointment" | "followup" | "proposal" | "promo";

interface TemplateTheme {
  bg: string;
  headerBg: string;
  headerColor: string;
  tagline: string;
  taglineColor: string;
  signoff: string;
}

export interface TemplatePreset {
  id: LeadTemplateId;
  label: string;
  description: string;
  subject: string;
  body: string;
  theme: TemplateTheme;
}

// These themes mirror TEMPLATE_THEMES in the server's email.ts. Keep the two in
// sync so the admin WYSIWYG preview matches the email that's actually sent.
export const TEMPLATE_PRESETS: TemplatePreset[] = [
  {
    id: "intro",
    label: "Introduction",
    description: "Warm first reply to a fresh inquiry.",
    subject: "Thanks for reaching out to Social Vista",
    body: "Thanks so much for getting in touch! I'd love to learn more about your goals and how we can help your brand grow on social.\n\nAre you free for a quick 15-minute call this week?",
    theme: {
      bg: "#0f0f17",
      headerBg: "linear-gradient(135deg,#ec4899,#8b5cf6)",
      headerColor: "#ffffff",
      tagline: "Social media that moves the needle",
      taglineColor: "#f5e9ff",
      signoff: "Warm regards,<br/>The Social Vista Team",
    },
  },
  {
    id: "appointment",
    label: "Appointment",
    description: "Propose or confirm a meeting time.",
    subject: "Let's book your Social Vista strategy call",
    body: "I'd love to set up a time to chat about your goals.\n\nDo any of these work for you?\n• Tuesday at 2:00 PM\n• Wednesday at 11:00 AM\n• Thursday at 4:00 PM\n\nJust reply with what suits you best and I'll send a calendar invite.",
    theme: {
      bg: "#0e0a1f",
      headerBg: "linear-gradient(135deg,#7c3aed,#a855f7)",
      headerColor: "#ffffff",
      tagline: "Let's find a time that works",
      taglineColor: "#ede9fe",
      signoff: "See you soon,<br/>The Social Vista Team",
    },
  },
  {
    id: "followup",
    label: "Follow-up",
    description: "Gentle nudge for a quiet lead.",
    subject: "Just checking in — Social Vista",
    body: "I wanted to circle back on my last note. I know things get busy!\n\nIf you're still interested in growing your social presence, I'm happy to answer any questions or put together a quick plan for you.",
    theme: {
      bg: "#06201f",
      headerBg: "linear-gradient(135deg,#14b8a6,#0ea5e9)",
      headerColor: "#ffffff",
      tagline: "Just checking in",
      taglineColor: "#cffafe",
      signoff: "Talk soon,<br/>The Social Vista Team",
    },
  },
  {
    id: "proposal",
    label: "Proposal",
    description: "Premium, polished pitch with next steps.",
    subject: "Your Social Vista proposal",
    body: "Thank you for the great conversation. Based on what you shared, here's how we'd approach your social media growth:\n\n• Content strategy tailored to your audience\n• Consistent, on-brand posting across channels\n• Monthly reporting on the metrics that matter\n\nI've attached the full proposal. Let me know your thoughts!",
    theme: {
      bg: "#0a0a0a",
      headerBg: "linear-gradient(135deg,#1f2937,#111827)",
      headerColor: "#fbbf24",
      tagline: "A proposal crafted for you",
      taglineColor: "#fde68a",
      signoff: "To your growth,<br/>The Social Vista Team",
    },
  },
  {
    id: "promo",
    label: "Promotion",
    description: "Bright, upbeat offer or announcement.",
    subject: "A special offer from Social Vista 🎉",
    body: "We're running a limited-time offer for new clients and thought of you!\n\nSign up this month and get your first month of content planning on us.\n\nReady to get started? Just reply to this email and we'll take care of the rest.",
    theme: {
      bg: "#1a0a00",
      headerBg: "linear-gradient(135deg,#f97316,#ec4899)",
      headerColor: "#ffffff",
      tagline: "A little something for you",
      taglineColor: "#ffe4d6",
      signoff: "Cheers,<br/>The Social Vista Team",
    },
  },
];

export function getPreset(id: LeadTemplateId): TemplatePreset {
  return TEMPLATE_PRESETS.find((t) => t.id === id) ?? TEMPLATE_PRESETS[0];
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function textToHtml(input: string): string {
  return escapeHtml(input)
    .split(/\n{2,}/)
    .map((para) => `<p style="margin:0 0 16px;line-height:1.6;">${para.replace(/\n/g, "<br/>")}</p>`)
    .join("");
}

export type ImagePlacement = "banner" | "inline";

function safeImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  // Preview runs same-origin, so relative asset paths are valid here too.
  if (!/^(https?:\/\/|\/)/i.test(trimmed)) return null;
  return escapeHtml(trimmed);
}

/**
 * Renders the full branded email HTML for the live preview. Mirrors
 * renderLeadTemplate on the server so what staff see matches what is sent.
 */
export function renderPreview(
  id: LeadTemplateId,
  args: {
    name: string;
    message: string;
    imageUrl?: string | null;
    imagePlacement?: ImagePlacement | null;
  },
): string {
  const { theme } = getPreset(id);
  const name = args.name.trim() || "there";
  const safeUrl = safeImageUrl(args.imageUrl);
  const placement: ImagePlacement = args.imagePlacement ?? "banner";
  const banner =
    safeUrl && placement === "banner"
      ? `<img src="${safeUrl}" alt="" style="display:block;width:100%;max-width:560px;height:auto;border:0;border-radius:16px 16px 0 0;" />`
      : "";
  const inline =
    safeUrl && placement === "inline"
      ? `<img src="${safeUrl}" alt="" style="display:block;width:100%;max-width:496px;height:auto;border:0;border-radius:12px;margin:0 0 16px;" />`
      : "";
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:${theme.bg};font-family:Arial,Helvetica,sans-serif;color:#1a1a2e;">
    <div style="max-width:560px;margin:0 auto;padding:32px 16px;">
      ${banner}
      <div style="background:${theme.headerBg};${banner ? "" : "border-radius:16px 16px 0 0;"}padding:28px 32px;">
        <h1 style="margin:0;color:${theme.headerColor};font-size:22px;letter-spacing:0.5px;">Social Vista</h1>
        <p style="margin:6px 0 0;color:${theme.taglineColor};font-size:13px;">${theme.tagline}</p>
      </div>
      <div style="background:#ffffff;border-radius:0 0 16px 16px;padding:32px;">
        <p style="margin:0 0 16px;font-size:16px;font-weight:bold;">Hi ${escapeHtml(name)},</p>
        ${inline}
        ${textToHtml(args.message)}
        <p style="margin:16px 0 0;line-height:1.6;">${theme.signoff}</p>
      </div>
      <p style="text-align:center;color:#6b7280;font-size:12px;margin:24px 0 0;">
        Social Vista &middot; This message was sent because you contacted us.
      </p>
    </div>
  </body>
</html>`;
}
