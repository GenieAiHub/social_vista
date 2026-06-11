import { Router } from "express";
import { db, servicesTable, contactsTable, contentBlocksTable, leadsTable, staffTable } from "@workspace/db";
import { eq, count, sql } from "drizzle-orm";
import {
  AdminLoginBody,
  GetContentResponse,
  UpsertContentBody,
} from "@workspace/api-zod";
import { requireAuth, verifyPassword, signToken, type AuthedRequest } from "../lib/auth.js";

const router = Router();

router.post("/admin/login", async (req, res) => {
  try {
    const body = AdminLoginBody.parse(req.body);
    const [staff] = await db
      .select()
      .from(staffTable)
      .where(eq(staffTable.username, body.username));

    if (!staff || !staff.active || !(await verifyPassword(body.password, staff.passwordHash))) {
      res.status(401).json({ success: false });
      return;
    }

    const user = { id: staff.id, username: staff.username, name: staff.name, role: staff.role };
    const token = signToken(user);
    res.json({
      success: true,
      token,
      user: { ...user, email: staff.email, active: staff.active, createdAt: staff.createdAt.toISOString() },
    });
  } catch (err) {
    req.log.error({ err }, "Failed to login");
    res.status(400).json({ error: "Invalid input" });
  }
});

router.get("/admin/me", requireAuth, async (req, res) => {
  try {
    const self = (req as AuthedRequest).staff!;
    const [staff] = await db.select().from(staffTable).where(eq(staffTable.id, self.id));
    if (!staff || !staff.active) { res.status(401).json({ error: "Unauthorized" }); return; }
    res.json({
      id: staff.id,
      name: staff.name,
      username: staff.username,
      email: staff.email,
      role: staff.role,
      active: staff.active,
      createdAt: staff.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get current user");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/admin/stats", requireAuth, async (req, res) => {
  try {
    const [
      [{ total: totalContacts }],
      [{ unread: unreadContacts }],
      [{ total: totalServices }],
      [{ active: activeServices }],
      [{ total: totalLeads }],
      [{ fresh: newLeads }],
    ] = await Promise.all([
      db.select({ total: count() }).from(contactsTable),
      db.select({ unread: count() }).from(contactsTable).where(eq(contactsTable.isRead, false)),
      db.select({ total: count() }).from(servicesTable),
      db.select({ active: count() }).from(servicesTable).where(eq(servicesTable.active, true)),
      db.select({ total: count() }).from(leadsTable),
      db.select({ fresh: count() }).from(leadsTable).where(eq(leadsTable.status, "new")),
    ]);
    res.json({
      totalContacts: Number(totalContacts),
      unreadContacts: Number(unreadContacts),
      totalServices: Number(totalServices),
      activeServices: Number(activeServices),
      totalLeads: Number(totalLeads),
      newLeads: Number(newLeads),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get stats");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/admin/content", requireAuth, async (req, res) => {
  try {
    const blocks = await db.select().from(contentBlocksTable);
    res.json(GetContentResponse.parse(blocks.map(b => ({
      ...b,
      updatedAt: b.updatedAt.toISOString(),
    }))));
  } catch (err) {
    req.log.error({ err }, "Failed to get content");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/admin/content", requireAuth, async (req, res) => {
  try {
    const body = UpsertContentBody.parse(req.body);
    const [block] = await db
      .insert(contentBlocksTable)
      .values({ key: body.key, value: body.value })
      .onConflictDoUpdate({
        target: contentBlocksTable.key,
        set: { value: body.value, updatedAt: sql`now()` },
      })
      .returning();
    res.json({ ...block, updatedAt: block.updatedAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Failed to upsert content");
    res.status(400).json({ error: "Invalid input" });
  }
});

export default router;
