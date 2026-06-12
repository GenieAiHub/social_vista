import { Router } from "express";
import { db, leadsTable } from "@workspace/db";
import { eq, desc, and, type SQL } from "drizzle-orm";
import {
  CreateLeadBody,
  UpdateLeadBody,
  UpdateLeadParams,
  DeleteLeadParams,
  ListLeadsQueryParams,
  ReplyToLeadBody,
  ReplyToLeadParams,
} from "@workspace/api-zod";
import { requireAuth } from "../lib/auth.js";
import {
  sendLeadReply,
  sendContactedNotice,
  sendAppointmentConfirmation,
} from "../lib/email.js";
import type { Lead } from "@workspace/db";

const router = Router();

export function serializeLead(l: Lead) {
  return {
    ...l,
    createdAt: l.createdAt.toISOString(),
    updatedAt: l.updatedAt.toISOString(),
  };
}

router.get("/admin/leads", requireAuth, async (req, res) => {
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

router.post("/admin/leads", requireAuth, async (req, res) => {
  try {
    const body = CreateLeadBody.parse(req.body);
    const [lead] = await db
      .insert(leadsTable)
      .values({
        name: body.name,
        email: body.email ?? null,
        phone: body.phone ?? null,
        serviceInterest: body.serviceInterest ?? null,
        message: body.message ?? null,
        preferredTime: body.preferredTime ?? null,
        source: body.source ?? "manual",
      })
      .returning();
    res.status(201).json(serializeLead(lead));
  } catch (err) {
    req.log.error({ err }, "Failed to create lead");
    res.status(400).json({ error: "Invalid input" });
  }
});

router.patch("/admin/leads/:id", requireAuth, async (req, res) => {
  try {
    const { id } = UpdateLeadParams.parse({ id: Number(req.params.id) });
    const body = UpdateLeadBody.parse(req.body);
    const [existing] = await db
      .select()
      .from(leadsTable)
      .where(eq(leadsTable.id, id));
    if (!existing) { res.status(404).json({ error: "Not found" }); return; }
    const updates: Partial<typeof leadsTable.$inferInsert> = {};
    if (body.status !== undefined) updates.status = body.status;
    if (body.assignedTo !== undefined) updates.assignedTo = body.assignedTo;
    if (body.adminNotes !== undefined) updates.adminNotes = body.adminNotes;
    const [lead] = await db
      .update(leadsTable)
      .set(updates)
      .where(eq(leadsTable.id, id))
      .returning();
    if (!lead) { res.status(404).json({ error: "Not found" }); return; }
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

router.post("/admin/leads/:id/reply", requireAuth, async (req, res) => {
  try {
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
    const sent = await sendLeadReply({
      to: existing.email,
      name: existing.name,
      subject: body.subject,
      message: body.message,
    });
    if (!sent) {
      res.status(502).json({ error: "Email could not be sent. Check the Resend configuration." });
      return;
    }
    // A successful reply advances a brand-new lead to "contacted", but never
    // regresses a lead that's already further along (booked/closed/contacted).
    const nextStatus = existing.status === "new" ? "contacted" : existing.status;
    const [lead] = await db
      .update(leadsTable)
      .set({ status: nextStatus })
      .where(eq(leadsTable.id, id))
      .returning();
    res.json(serializeLead(lead));
  } catch (err) {
    req.log.error({ err }, "Failed to send lead reply");
    res.status(400).json({ error: "Invalid input" });
  }
});

router.delete("/admin/leads/:id", requireAuth, async (req, res) => {
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
