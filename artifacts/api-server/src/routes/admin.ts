import { Router } from "express";
import { db, servicesTable, contactsTable, contentBlocksTable, leadsTable, staffTable, rolesTable } from "@workspace/db";
import { eq, count, sql } from "drizzle-orm";
import {
  AdminLoginBody,
  GetContentResponse,
  UpsertContentBody,
} from "@workspace/api-zod";
import { requireAuth, verifyPassword, signToken, resolvePermissions, type AuthedRequest } from "../lib/auth.js";
import type { Role, Staff } from "@workspace/db";

const router = Router();

/** Build the StaffMember response payload for an authenticated user, resolving role + permissions. */
async function buildUserPayload(staff: Staff) {
  let roleRow: Role | null = null;
  if (staff.roleId != null) {
    const [row] = await db.select().from(rolesTable).where(eq(rolesTable.id, staff.roleId)).limit(1);
    roleRow = row ?? null;
  }
  return {
    id: staff.id,
    name: staff.name,
    username: staff.username,
    email: staff.email,
    role: staff.role,
    roleId: roleRow ? roleRow.id : null,
    roleName: roleRow ? roleRow.name : null,
    permissions: resolvePermissions(staff.role, roleRow),
    active: staff.active,
    createdAt: staff.createdAt.toISOString(),
  };
}

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

    const token = signToken({ id: staff.id, username: staff.username, name: staff.name, role: staff.role });
    res.json({
      success: true,
      token,
      user: await buildUserPayload(staff),
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
    res.json(await buildUserPayload(staff));
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
