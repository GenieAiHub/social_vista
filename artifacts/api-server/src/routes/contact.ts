import { Router } from "express";
import { db, contactsTable, leadsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import {
  SubmitContactBody,
  ListContactsResponse,
  MarkContactReadParams,
} from "@workspace/api-zod";
import { requireAuth } from "../lib/auth.js";
import { sendContactAutoReply, sendNewLeadNotification } from "../lib/email.js";

const router = Router();

router.post("/contact", async (req, res) => {
  try {
    const body = SubmitContactBody.parse(req.body);
    const [contact] = await db.insert(contactsTable).values({
      name: body.name,
      email: body.email,
      phone: body.phone ?? null,
      message: body.message,
      service: body.service ?? null,
    }).returning();
    // Mirror every contact submission into the leads pipeline so staff can
    // track and follow up from one place.
    try {
      await db.insert(leadsTable).values({
        name: body.name,
        email: body.email,
        phone: body.phone ?? null,
        serviceInterest: body.service ?? null,
        message: body.message,
        source: "contact",
      });
    } catch (leadErr) {
      req.log.error({ err: leadErr }, "Failed to create lead from contact");
    }
    // Fire-and-forget emails: acknowledge the visitor and notify the agency.
    // These must never block or fail the request.
    void sendContactAutoReply({ to: body.email, name: body.name, service: body.service ?? null });
    void sendNewLeadNotification({
      name: body.name,
      email: body.email,
      phone: body.phone ?? null,
      service: body.service ?? null,
      message: body.message,
      source: "contact",
    });
    res.status(201).json({ ...contact, createdAt: contact.createdAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Failed to submit contact");
    res.status(400).json({ error: "Invalid input" });
  }
});

router.get("/admin/contacts", requireAuth, async (req, res) => {
  try {
    const contacts = await db
      .select()
      .from(contactsTable)
      .orderBy(desc(contactsTable.createdAt));
    res.json(ListContactsResponse.parse(contacts.map(c => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
    }))));
  } catch (err) {
    req.log.error({ err }, "Failed to list contacts");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/admin/contacts/:id/read", requireAuth, async (req, res) => {
  try {
    const { id } = MarkContactReadParams.parse({ id: Number(req.params.id) });
    const [contact] = await db
      .update(contactsTable)
      .set({ isRead: true })
      .where(eq(contactsTable.id, id))
      .returning();
    if (!contact) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ ...contact, createdAt: contact.createdAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Failed to mark contact read");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
