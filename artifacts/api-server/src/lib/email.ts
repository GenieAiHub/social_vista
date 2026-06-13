import { Resend } from "resend";
import { logger } from "./logger.js";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "Social Vista <onboarding@resend.dev>";
const AGENCY_NOTIFICATION_EMAIL = process.env.AGENCY_NOTIFICATION_EMAIL;

let client: Resend | null = null;

function getClient(): Resend | null {
  if (!RESEND_API_KEY) return null;
  if (!client) client = new Resend(RESEND_API_KEY);
  return client;
}

export function isEmailEnabled(): boolean {
  return Boolean(RESEND_API_KEY);
}

interface SendArgs {
  to: string;
  subject: string;
  html: string;
  text: string;
}

/**
 * Sends an email via Resend. Never throws — email is a best-effort side effect
 * and must not break the request that triggered it. Returns true on success.
 */
async function send({ to, subject, html, text }: SendArgs): Promise<boolean> {
  const resend = getClient();
  if (!resend) {
    logger.warn({ to, subject }, "Email skipped: RESEND_API_KEY is not configured");
    return false;
  }
  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
      text,
    });
    if (error) {
      logger.error({ err: error, to, subject }, "Resend reported an error sending email");
      return false;
    }
    logger.info({ to, subject }, "Email sent");
    return true;
  } catch (err) {
    logger.error({ err, to, subject }, "Failed to send email");
    return false;
  }
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Converts plain text (with newlines) into safe HTML paragraphs. */
function textToHtml(input: string): string {
  return escapeHtml(input)
    .split(/\n{2,}/)
    .map((para) => `<p style="margin:0 0 16px;line-height:1.6;">${para.replace(/\n/g, "<br/>")}</p>`)
    .join("");
}

/** Wraps body HTML in the Social Vista branded shell. */
function layout(bodyHtml: string): string {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#0f0f17;font-family:Arial,Helvetica,sans-serif;color:#1a1a2e;">
    <div style="max-width:560px;margin:0 auto;padding:32px 16px;">
      <div style="background:linear-gradient(135deg,#ec4899,#8b5cf6);border-radius:16px 16px 0 0;padding:28px 32px;">
        <h1 style="margin:0;color:#ffffff;font-size:22px;letter-spacing:0.5px;">Social Vista</h1>
        <p style="margin:6px 0 0;color:#f5e9ff;font-size:13px;">Social media that moves the needle</p>
      </div>
      <div style="background:#ffffff;border-radius:0 0 16px 16px;padding:32px;">
        ${bodyHtml}
      </div>
      <p style="text-align:center;color:#6b7280;font-size:12px;margin:24px 0 0;">
        Social Vista &middot; This message was sent because you contacted us.
      </p>
    </div>
  </body>
</html>`;
}

export type LeadTemplateId = "intro" | "appointment" | "followup" | "proposal" | "promo";

interface TemplateTheme {
  bg: string;
  headerBg: string;
  headerColor: string;
  tagline: string;
  taglineColor: string;
  signoff: string;
}

/**
 * Visual themes for staff-composed lead replies. The client mirrors these in
 * `email-templates.ts` for the WYSIWYG preview, so keep the palettes in sync.
 */
const TEMPLATE_THEMES: Record<LeadTemplateId, TemplateTheme> = {
  intro: {
    bg: "#0f0f17",
    headerBg: "linear-gradient(135deg,#ec4899,#8b5cf6)",
    headerColor: "#ffffff",
    tagline: "Social media that moves the needle",
    taglineColor: "#f5e9ff",
    signoff: "Warm regards,<br/>The Social Vista Team",
  },
  appointment: {
    bg: "#0e0a1f",
    headerBg: "linear-gradient(135deg,#7c3aed,#a855f7)",
    headerColor: "#ffffff",
    tagline: "Let's find a time that works",
    taglineColor: "#ede9fe",
    signoff: "See you soon,<br/>The Social Vista Team",
  },
  followup: {
    bg: "#06201f",
    headerBg: "linear-gradient(135deg,#14b8a6,#0ea5e9)",
    headerColor: "#ffffff",
    tagline: "Just checking in",
    taglineColor: "#cffafe",
    signoff: "Talk soon,<br/>The Social Vista Team",
  },
  proposal: {
    bg: "#0a0a0a",
    headerBg: "linear-gradient(135deg,#1f2937,#111827)",
    headerColor: "#fbbf24",
    tagline: "A proposal crafted for you",
    taglineColor: "#fde68a",
    signoff: "To your growth,<br/>The Social Vista Team",
  },
  promo: {
    bg: "#1a0a00",
    headerBg: "linear-gradient(135deg,#f97316,#ec4899)",
    headerColor: "#ffffff",
    tagline: "A little something for you",
    taglineColor: "#ffe4d6",
    signoff: "Cheers,<br/>The Social Vista Team",
  },
};

/**
 * Renders a staff-composed message inside a themed branded shell. `bodyHtml`
 * should already be escaped/sanitized (use textToHtml).
 */
export function renderLeadTemplate(
  templateId: LeadTemplateId,
  args: { name: string; bodyHtml: string },
): string {
  const theme = TEMPLATE_THEMES[templateId] ?? TEMPLATE_THEMES.intro;
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:${theme.bg};font-family:Arial,Helvetica,sans-serif;color:#1a1a2e;">
    <div style="max-width:560px;margin:0 auto;padding:32px 16px;">
      <div style="background:${theme.headerBg};border-radius:16px 16px 0 0;padding:28px 32px;">
        <h1 style="margin:0;color:${theme.headerColor};font-size:22px;letter-spacing:0.5px;">Social Vista</h1>
        <p style="margin:6px 0 0;color:${theme.taglineColor};font-size:13px;">${theme.tagline}</p>
      </div>
      <div style="background:#ffffff;border-radius:0 0 16px 16px;padding:32px;">
        <p style="margin:0 0 16px;font-size:16px;font-weight:bold;">Hi ${escapeHtml(args.name)},</p>
        ${args.bodyHtml}
        <p style="margin:16px 0 0;line-height:1.6;">${theme.signoff}</p>
      </div>
      <p style="text-align:center;color:#6b7280;font-size:12px;margin:24px 0 0;">
        Social Vista &middot; This message was sent because you contacted us.
      </p>
    </div>
  </body>
</html>`;
}

/**
 * Automated acknowledgement sent to a visitor right after they submit the
 * public contact form.
 */
export async function sendContactAutoReply(args: {
  to: string;
  name: string;
  service?: string | null;
}): Promise<boolean> {
  const greeting = `Hi ${args.name},`;
  const serviceLine = args.service
    ? `We saw you're interested in <strong>${escapeHtml(args.service)}</strong> — great choice.`
    : "We're excited to learn more about your goals.";
  const bodyHtml = layout(`
    <p style="margin:0 0 16px;font-size:16px;font-weight:bold;">${escapeHtml(greeting)}</p>
    <p style="margin:0 0 16px;line-height:1.6;">Thanks for reaching out to Social Vista! We've received your message and a member of our team will be in touch shortly.</p>
    <p style="margin:0 0 16px;line-height:1.6;">${serviceLine}</p>
    <p style="margin:0;line-height:1.6;">Talk soon,<br/>The Social Vista Team</p>
  `);
  const text = `${greeting}\n\nThanks for reaching out to Social Vista! We've received your message and a member of our team will be in touch shortly.\n\nTalk soon,\nThe Social Vista Team`;
  return send({ to: args.to, subject: "Thanks for contacting Social Vista", html: bodyHtml, text });
}

/**
 * A staff member's manual reply to a lead, composed in the admin portal.
 */
export async function sendLeadReply(args: {
  to: string;
  name: string;
  subject: string;
  message: string;
  templateId?: LeadTemplateId | null;
}): Promise<boolean> {
  const bodyHtml = renderLeadTemplate(args.templateId ?? "intro", {
    name: args.name,
    bodyHtml: textToHtml(args.message),
  });
  const text = `Hi ${args.name},\n\n${args.message}\n\nWarm regards,\nThe Social Vista Team`;
  return send({ to: args.to, subject: args.subject, html: bodyHtml, text });
}

/**
 * Automated note sent when a lead is moved to the "contacted" stage from the
 * status dropdown (no custom message).
 */
export async function sendContactedNotice(args: {
  to: string;
  name: string;
}): Promise<boolean> {
  const bodyHtml = layout(`
    <p style="margin:0 0 16px;font-size:16px;font-weight:bold;">Hi ${escapeHtml(args.name)},</p>
    <p style="margin:0 0 16px;line-height:1.6;">Just a quick note to let you know a member of the Social Vista team has picked up your inquiry and will be reaching out with the next steps.</p>
    <p style="margin:0;line-height:1.6;">We're looking forward to working with you!<br/>The Social Vista Team</p>
  `);
  const text = `Hi ${args.name},\n\nJust a quick note to let you know a member of the Social Vista team has picked up your inquiry and will be reaching out with the next steps.\n\nWe're looking forward to working with you!\nThe Social Vista Team`;
  return send({ to: args.to, subject: "We've received your inquiry — Social Vista", html: bodyHtml, text });
}

/**
 * Appointment confirmation sent when a lead is moved to the "booked" stage.
 */
export async function sendAppointmentConfirmation(args: {
  to: string;
  name: string;
  preferredTime?: string | null;
}): Promise<boolean> {
  const timeBlock = args.preferredTime
    ? `<div style="margin:0 0 16px;padding:16px;background:#f5f3ff;border-left:4px solid #8b5cf6;border-radius:8px;">
         <p style="margin:0;font-size:13px;color:#6b7280;">Your requested time</p>
         <p style="margin:4px 0 0;font-size:16px;font-weight:bold;color:#1a1a2e;">${escapeHtml(args.preferredTime)}</p>
       </div>`
    : "";
  const bodyHtml = layout(`
    <p style="margin:0 0 16px;font-size:16px;font-weight:bold;">Hi ${escapeHtml(args.name)},</p>
    <p style="margin:0 0 16px;line-height:1.6;">Your appointment with Social Vista is confirmed! 🎉</p>
    ${timeBlock}
    <p style="margin:0 0 16px;line-height:1.6;">We'll send any further details ahead of the meeting. If you need to reschedule, just reply to this email.</p>
    <p style="margin:0;line-height:1.6;">See you soon,<br/>The Social Vista Team</p>
  `);
  const text = `Hi ${args.name},\n\nYour appointment with Social Vista is confirmed!${args.preferredTime ? `\n\nYour requested time: ${args.preferredTime}` : ""}\n\nWe'll send any further details ahead of the meeting. If you need to reschedule, just reply to this email.\n\nSee you soon,\nThe Social Vista Team`;
  return send({ to: args.to, subject: "Your appointment is confirmed — Social Vista", html: bodyHtml, text });
}

/**
 * Internal notification to the agency when a new lead lands. No-op unless
 * AGENCY_NOTIFICATION_EMAIL is configured.
 */
export async function sendNewLeadNotification(args: {
  name: string;
  email?: string | null;
  phone?: string | null;
  service?: string | null;
  message?: string | null;
  source: string;
}): Promise<boolean> {
  if (!AGENCY_NOTIFICATION_EMAIL) return false;
  const rows = [
    ["Name", args.name],
    ["Email", args.email ?? "—"],
    ["Phone", args.phone ?? "—"],
    ["Service", args.service ?? "—"],
    ["Source", args.source],
    ["Message", args.message ?? "—"],
  ]
    .map(
      ([label, value]) =>
        `<tr><td style="padding:6px 12px;color:#6b7280;font-size:13px;white-space:nowrap;vertical-align:top;">${label}</td><td style="padding:6px 12px;color:#1a1a2e;font-size:14px;">${escapeHtml(String(value))}</td></tr>`,
    )
    .join("");
  const bodyHtml = layout(`
    <p style="margin:0 0 16px;font-size:16px;font-weight:bold;">New lead received</p>
    <table style="width:100%;border-collapse:collapse;background:#faf9ff;border-radius:8px;">${rows}</table>
  `);
  const text = `New lead received\n\nName: ${args.name}\nEmail: ${args.email ?? "—"}\nPhone: ${args.phone ?? "—"}\nService: ${args.service ?? "—"}\nSource: ${args.source}\nMessage: ${args.message ?? "—"}`;
  return send({
    to: AGENCY_NOTIFICATION_EMAIL,
    subject: `New lead: ${args.name}`,
    html: bodyHtml,
    text,
  });
}
