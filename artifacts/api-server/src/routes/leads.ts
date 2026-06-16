import { Router } from "express";
import { db, leadsTable, leadActivitiesTable, staffTable } from "@workspace/db";
import { eq, desc, and, type SQL } from "drizzle-orm";
import {
  CreateLeadBody,
  UpdateLeadBody,
  UpdateLeadParams,
  DeleteLeadParams,
  ListLeadsQueryParams,
  ReplyToLeadBody,
  ReplyToLeadParams,
  ListLeadActivitiesParams,
  CreateLeadActivityParams,
  CreateLeadActivityBody,
  ListRecentActivitiesQueryParams,
  ImportLeadsBody,
} from "@workspace/api-zod";
import { requireAuth, requirePermission, type AuthedRequest, type AuthUser } from "../lib/auth.js";
import {
  sendLeadReply,
  sendContactedNotice,
  sendAppointmentConfirmation,
} from "../lib/email.js";
import { markEmailAssetUsedByUrl } from "../lib/email-assets.js";
import type { Lead, LeadActivity } from "@workspace/db";

const router = Router();

export function serializeLead(l: Lead) {
  return {
    ...l,
    lastContactedAt: l.lastContactedAt ? l.lastContactedAt.toISOString() : null,
    createdAt: l.createdAt.toISOString(),
    updatedAt: l.updatedAt.toISOString(),
  };
}

function serializeActivity(a: LeadActivity) {
  return {
    ...a,
    createdAt: a.createdAt.toISOString(),
  };
}

/**
 * Human-readable note describing how a lead first entered the pipeline,
 * keyed by its `source`. Used for the "created" timeline event.
 */
export function createdNoteForSource(source: string): string {
  switch (source) {
    case "chat":
      return "Captured from AI chat assistant";
    case "contact":
      return "Captured from contact form";
    case "manual":
      return "Created manually by staff";
    case "import":
      return "Imported from spreadsheet";
    default:
      return `Captured from ${source}`;
  }
}

/**
 * Append an activity row to a lead's timeline. Fire-and-forget friendly:
 * timeline logging must never break the underlying lead operation, so callers
 * may `void` this and failures are swallowed by the caller's try/catch.
 */
export async function logActivity(input: {
  leadId: number;
  type: string;
  note?: string | null;
  author?: AuthUser;
}) {
  await db.insert(leadActivitiesTable).values({
    leadId: input.leadId,
    type: input.type,
    note: input.note ?? null,
    authorId: input.author?.id ?? null,
    authorName: input.author?.name ?? null,
  });
}

router.get("/admin/leads", requireAuth, requirePermission("canViewLeads"), async (req, res) => {
  try {
    const query = ListLeadsQueryParams.parse(req.query);
    const conditions: SQL[] = [];
    if (query.status) conditions.push(eq(leadsTable.status, query.status));
    if (query.source) conditions.push(eq(leadsTable.source, query.source));
    const rows = await db
      .select()
      .from(leadsTable)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(leadsTable.createdAt));
    res.json(rows.map(serializeLead));
  } catch (err) {
    req.log.error({ err }, "Failed to list leads");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/admin/leads", requireAuth, requirePermission("canCreateLeads"), async (req, res) => {
  try {
    const author = (req as AuthedRequest).staff;
    const body = CreateLeadBody.parse(req.body);
    const source = body.source ?? "manual";
    const [lead] = await db
      .insert(leadsTable)
      .values({
        name: body.name,
        email: body.email ?? null,
        phone: body.phone ?? null,
        whatsapp: body.whatsapp ?? null,
        serviceInterest: body.serviceInterest ?? null,
        message: body.message ?? null,
        preferredTime: body.preferredTime ?? null,
        source,
      })
      .returning();
    try {
      await logActivity({
        leadId: lead.id,
        type: "created",
        note: createdNoteForSource(source),
        author,
      });
    } catch (err) {
      req.log.error({ err }, "Failed to record lead activity");
    }
    res.status(201).json(serializeLead(lead));
  } catch (err) {
    req.log.error({ err }, "Failed to create lead");
    res.status(400).json({ error: "Invalid input" });
  }
});

router.post("/admin/leads/import", requireAuth, requirePermission("canCreateLeads"), async (req, res) => {
  try {
    const author = (req as AuthedRequest).staff;
    const body = ImportLeadsBody.parse(req.body);
    const source = body.source ?? "import";
    const errors: { row: number; error: string }[] = [];
    let imported = 0;
    for (let i = 0; i < body.leads.length; i++) {
      const row = body.leads[i];
      try {
        const [lead] = await db
          .insert(leadsTable)
          .values({
            name: row.name,
            email: row.email ?? null,
            phone: row.phone ?? null,
            whatsapp: row.whatsapp ?? null,
            serviceInterest: row.serviceInterest ?? null,
            message: row.message ?? null,
            preferredTime: row.preferredTime ?? null,
            source,
          })
          .returning();
        imported++;
        try {
          await logActivity({
            leadId: lead.id,
            type: "created",
            note: createdNoteForSource(source),
            author,
          });
        } catch (err) {
          req.log.error({ err }, "Failed to record lead activity");
        }
      } catch (err) {
        req.log.error({ err }, "Failed to import lead row");
        errors.push({ row: i + 1, error: "Could not import this row" });
      }
    }
    res.json({ imported, failed: errors.length, errors });
  } catch (err) {
    req.log.error({ err }, "Failed to import leads");
    res.status(400).json({ error: "Invalid input" });
  }
});

router.patch("/admin/leads/:id", requireAuth, async (req, res) => {
  try {
    const author = (req as AuthedRequest).staff;
    const { id } = UpdateLeadParams.parse({ id: Number(req.params.id) });
    const body = UpdateLeadBody.parse(req.body);
    // This endpoint covers two distinct permissions: changing the assignee
    // requires canAssignLeads, while status/notes/contacted changes require
    // canEditLeads. Gate each kind of change against the caller's permissions.
    const perms = author?.permissions;
    const touchesAssignment = body.assignedTo !== undefined;
    const touchesEdit =
      body.status !== undefined || body.adminNotes !== undefined || body.markContacted !== undefined;
    if (touchesAssignment && !perms?.canAssignLeads) {
      res.status(403).json({ error: "You don't have permission to assign leads." });
      return;
    }
    if (touchesEdit && !perms?.canEditLeads) {
      res.status(403).json({ error: "You don't have permission to edit leads." });
      return;
    }
    const [existing] = await db
      .select()
      .from(leadsTable)
      .where(eq(leadsTable.id, id));
    if (!existing) { res.status(404).json({ error: "Not found" }); return; }
    const updates: Partial<typeof leadsTable.$inferInsert> = {};
    if (body.status !== undefined) updates.status = body.status;
    if (body.assignedTo !== undefined) updates.assignedTo = body.assignedTo;
    if (body.adminNotes !== undefined) updates.adminNotes = body.adminNotes;
    const markedContacted = Boolean(body.markContacted || body.status === "contacted");
    if (markedContacted) {
      updates.lastContactedAt = new Date();
    }
    const [lead] = await db
      .update(leadsTable)
      .set(updates)
      .where(eq(leadsTable.id, id))
      .returning();
    if (!lead) { res.status(404).json({ error: "Not found" }); return; }
    // Record timeline events for each meaningful change in this update.
    const events: { type: string; note: string | null }[] = [];
    if (body.status !== undefined && body.status !== existing.status) {
      events.push({ type: "status_change", note: `Status changed from ${existing.status} to ${body.status}` });
    }
    if (body.assignedTo !== undefined && body.assignedTo !== existing.assignedTo) {
      let assignmentNote = "Lead unassigned";
      if (body.assignedTo != null) {
        const [assignee] = await db
          .select({ name: staffTable.name })
          .from(staffTable)
          .where(eq(staffTable.id, body.assignedTo));
        assignmentNote = `Lead assigned to ${assignee?.name ?? `staff #${body.assignedTo}`}`;
      }
      events.push({ type: "assignment", note: assignmentNote });
    }
    if (body.adminNotes !== undefined && (body.adminNotes ?? "") !== (existing.adminNotes ?? "")) {
      events.push({ type: "note", note: body.adminNotes || "Internal note cleared" });
    }
    if (markedContacted && body.status !== "contacted") {
      events.push({ type: "contacted", note: "Marked as contacted" });
    }
    for (const ev of events) {
      try {
        await logActivity({ leadId: id, type: ev.type, note: ev.note, author });
      } catch (err) {
        req.log.error({ err }, "Failed to record lead activity");
      }
    }
    // Notify the lead by email when their status transitions to a new stage.
    // Fire-and-forget — email must never block or fail the update.
    if (lead.email && body.status !== undefined && body.status !== existing.status) {
      if (body.status === "contacted") {
        void sendContactedNotice({ to: lead.email, name: lead.name });
      } else if (body.status === "booked") {
        void sendAppointmentConfirmation({
          to: lead.email,
          name: lead.name,
          preferredTime: lead.preferredTime,
        });
      }
    }
    res.json(serializeLead(lead));
  } catch (err) {
    req.log.error({ err }, "Failed to update lead");
    res.status(400).json({ error: "Invalid input" });
  }
});

router.post("/admin/leads/:id/reply", requireAuth, requirePermission("canEmailLeads"), async (req, res) => {
  try {
    const author = (req as AuthedRequest).staff;
    const { id } = ReplyToLeadParams.parse({ id: Number(req.params.id) });
    const body = ReplyToLeadBody.parse(req.body);
    const [existing] = await db
      .select()
      .from(leadsTable)
      .where(eq(leadsTable.id, id));
    if (!existing) { res.status(404).json({ error: "Not found" }); return; }
    if (!existing.email) {
      res.status(400).json({ error: "This lead has no email address to reply to" });
      return;
    }
    // The client sends a relative asset path (e.g. /api/email-assets/12). Email
    // clients fetch images by absolute URL, so resolve it against an origin
    // before embedding. Prefer the configured canonical origin (PUBLIC_APP_URL)
    // and only fall back to the request host when it isn't set, so outbound
    // email links don't depend on a (spoofable) Host header.
    let imageUrl: string | null = body.imageUrl ?? null;
    if (imageUrl && imageUrl.startsWith("/")) {
      const configured = process.env.PUBLIC_APP_URL?.replace(/\/$/, "");
      if (configured) {
        imageUrl = `${configured}${imageUrl}`;
      } else {
        const proto = (req.headers["x-forwarded-proto"] as string | undefined)?.split(",")[0] ?? req.protocol;
        const host = req.get("host");
        imageUrl = host ? `${proto}://${host}${imageUrl}` : imageUrl;
      }
    }
    const sent = await sendLeadReply({
      to: existing.email,
      name: existing.name,
      subject: body.subject,
      message: body.message,
      templateId: body.templateId,
      imageUrl,
      imagePlacement: body.imagePlacement,
    });
    if (!sent) {
      res.status(502).json({ error: "Email could not be sent. Check the Resend configuration." });
      return;
    }
    // The image was actually delivered, so keep its asset indefinitely (the
    // recipient's email client will fetch it by URL). This also excludes it
    // from the orphaned-asset cleanup sweep. Best-effort, never blocks.
    void markEmailAssetUsedByUrl(imageUrl);
    // A successful reply advances a brand-new lead to "contacted", but never
    // regresses a lead that's already further along (booked/closed/contacted).
    const nextStatus = existing.status === "new" ? "contacted" : existing.status;
    const [lead] = await db
      .update(leadsTable)
      .set({ status: nextStatus })
      .where(eq(leadsTable.id, id))
      .returning();
    try {
      await logActivity({
        leadId: id,
        type: "email",
        note: `Sent email reply: ${body.subject}`,
        author,
      });
    } catch (err) {
      req.log.error({ err }, "Failed to record lead activity");
    }
    res.json(serializeLead(lead));
  } catch (err) {
    req.log.error({ err }, "Failed to send lead reply");
    res.status(400).json({ error: "Invalid input" });
  }
});

router.get("/admin/leads/:id/activities", requireAuth, requirePermission("canViewLeads"), async (req, res) => {
  try {
    const { id } = ListLeadActivitiesParams.parse({ id: Number(req.params.id) });
    const rows = await db
      .select()
      .from(leadActivitiesTable)
      .where(eq(leadActivitiesTable.leadId, id))
      .orderBy(desc(leadActivitiesTable.createdAt));
    res.json(rows.map(serializeActivity));
  } catch (err) {
    req.log.error({ err }, "Failed to list lead activities");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/admin/activities", requireAuth, requirePermission("canViewLeads"), async (req, res) => {
  try {
    const { limit } = ListRecentActivitiesQueryParams.parse(req.query);
    const rows = await db
      .select({
        id: leadActivitiesTable.id,
        leadId: leadActivitiesTable.leadId,
        leadName: leadsTable.name,
        type: leadActivitiesTable.type,
        note: leadActivitiesTable.note,
        authorId: leadActivitiesTable.authorId,
        authorName: leadActivitiesTable.authorName,
        createdAt: leadActivitiesTable.createdAt,
      })
      .from(leadActivitiesTable)
      .innerJoin(leadsTable, eq(leadActivitiesTable.leadId, leadsTable.id))
      .orderBy(desc(leadActivitiesTable.createdAt))
      .limit(limit ?? 15);
    res.json(rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })));
  } catch (err) {
    req.log.error({ err }, "Failed to list recent activities");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/admin/leads/:id/activities", requireAuth, requirePermission("canEditLeads"), async (req, res) => {
  try {
    const author = (req as AuthedRequest).staff;
    const { id } = CreateLeadActivityParams.parse({ id: Number(req.params.id) });
    const body = CreateLeadActivityBody.parse(req.body);
    const [existing] = await db
      .select({ id: leadsTable.id })
      .from(leadsTable)
      .where(eq(leadsTable.id, id));
    if (!existing) { res.status(404).json({ error: "Not found" }); return; }
    const [activity] = await db
      .insert(leadActivitiesTable)
      .values({
        leadId: id,
        type: body.type ?? "log",
        note: body.note,
        authorId: author?.id ?? null,
        authorName: author?.name ?? null,
      })
      .returning();
    res.status(201).json(serializeActivity(activity));
  } catch (err) {
    req.log.error({ err }, "Failed to create lead activity");
    res.status(400).json({ error: "Invalid input" });
  }
});

router.delete("/admin/leads/:id", requireAuth, requirePermission("canDeleteLeads"), async (req, res) => {
  try {
    const { id } = DeleteLeadParams.parse({ id: Number(req.params.id) });
    await db.delete(leadsTable).where(eq(leadsTable.id, id));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to delete lead");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
