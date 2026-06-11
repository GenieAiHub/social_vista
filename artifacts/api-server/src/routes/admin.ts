import { Router } from "express";
import { db, servicesTable, contactsTable, contentBlocksTable } from "@workspace/db";
import { eq, count, sql } from "drizzle-orm";
import {
  AdminLoginBody,
  GetContentResponse,
  UpsertContentBody,
} from "@workspace/api-zod";

const router = Router();

const ADMIN_USERNAME = process.env.ADMIN_USERNAME ?? "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "socialvista2024";
const ADMIN_TOKEN = "sv-admin-token-secure-2024";

router.post("/admin/login", async (req, res) => {
  try {
    const body = AdminLoginBody.parse(req.body);
    if (body.username === ADMIN_USERNAME && body.password === ADMIN_PASSWORD) {
      res.json({ success: true, token: ADMIN_TOKEN });
    } else {
      res.status(401).json({ success: false, token: "" });
    }
  } catch (err) {
    req.log.error({ err }, "Failed to login");
    res.status(400).json({ error: "Invalid input" });
  }
});

router.get("/admin/stats", async (req, res) => {
  try {
    const [[{ total: totalContacts }], [{ unread: unreadContacts }], [{ total: totalServices }], [{ active: activeServices }]] = await Promise.all([
      db.select({ total: count() }).from(contactsTable),
      db.select({ unread: count() }).from(contactsTable).where(eq(contactsTable.isRead, false)),
      db.select({ total: count() }).from(servicesTable),
      db.select({ active: count() }).from(servicesTable).where(eq(servicesTable.active, true)),
    ]);
    res.json({
      totalContacts: Number(totalContacts),
      unreadContacts: Number(unreadContacts),
      totalServices: Number(totalServices),
      activeServices: Number(activeServices),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get stats");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/admin/content", async (req, res) => {
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

router.post("/admin/content", async (req, res) => {
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
