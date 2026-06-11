import { Router } from "express";
import { db, staffTable } from "@workspace/db";
import { eq, desc, and, ne, count } from "drizzle-orm";
import {
  CreateStaffBody,
  UpdateStaffBody,
  UpdateStaffParams,
  DeleteStaffParams,
  ResetStaffPasswordBody,
  ResetStaffPasswordParams,
} from "@workspace/api-zod";
import { requireAuth, requireOwner, hashPassword, type AuthedRequest } from "../lib/auth.js";
import type { Staff } from "@workspace/db";

const router = Router();

function serialize(s: Staff) {
  return {
    id: s.id,
    name: s.name,
    username: s.username,
    email: s.email,
    role: s.role,
    active: s.active,
    createdAt: s.createdAt.toISOString(),
  };
}

router.get("/admin/staff", requireAuth, async (req, res) => {
  try {
    const rows = await db.select().from(staffTable).orderBy(desc(staffTable.createdAt));
    res.json(rows.map(serialize));
  } catch (err) {
    req.log.error({ err }, "Failed to list staff");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/admin/staff", requireAuth, requireOwner, async (req, res) => {
  try {
    const body = CreateStaffBody.parse(req.body);
    const existing = await db
      .select({ id: staffTable.id })
      .from(staffTable)
      .where(eq(staffTable.username, body.username));
    if (existing.length > 0) {
      res.status(409).json({ error: "Username already taken" });
      return;
    }
    const passwordHash = await hashPassword(body.password);
    const [staff] = await db
      .insert(staffTable)
      .values({
        name: body.name,
        username: body.username,
        email: body.email ?? null,
        role: body.role ?? "staff",
        passwordHash,
      })
      .returning();
    res.status(201).json(serialize(staff));
  } catch (err) {
    req.log.error({ err }, "Failed to create staff");
    res.status(400).json({ error: "Invalid input" });
  }
});

router.patch("/admin/staff/:id", requireAuth, requireOwner, async (req, res) => {
  try {
    const { id } = UpdateStaffParams.parse({ id: Number(req.params.id) });
    const body = UpdateStaffBody.parse(req.body);

    // Prevent demoting/deactivating the last active owner.
    if (body.role === "staff" || body.active === false) {
      const [{ owners }] = await db
        .select({ owners: count() })
        .from(staffTable)
        .where(and(eq(staffTable.role, "owner"), eq(staffTable.active, true), ne(staffTable.id, id)));
      if (Number(owners) === 0) {
        res.status(400).json({ error: "Cannot remove the last active owner" });
        return;
      }
    }

    const updates: Partial<typeof staffTable.$inferInsert> = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.email !== undefined) updates.email = body.email;
    if (body.role !== undefined) updates.role = body.role;
    if (body.active !== undefined) updates.active = body.active;

    const [staff] = await db
      .update(staffTable)
      .set(updates)
      .where(eq(staffTable.id, id))
      .returning();
    if (!staff) { res.status(404).json({ error: "Not found" }); return; }
    res.json(serialize(staff));
  } catch (err) {
    req.log.error({ err }, "Failed to update staff");
    res.status(400).json({ error: "Invalid input" });
  }
});

router.delete("/admin/staff/:id", requireAuth, requireOwner, async (req, res) => {
  try {
    const { id } = DeleteStaffParams.parse({ id: Number(req.params.id) });
    const self = (req as AuthedRequest).staff;
    if (self && self.id === id) {
      res.status(400).json({ error: "You cannot delete your own account" });
      return;
    }
    const [target] = await db.select().from(staffTable).where(eq(staffTable.id, id));
    if (!target) { res.status(404).json({ error: "Not found" }); return; }
    if (target.role === "owner") {
      const [{ owners }] = await db
        .select({ owners: count() })
        .from(staffTable)
        .where(and(eq(staffTable.role, "owner"), eq(staffTable.active, true), ne(staffTable.id, id)));
      if (Number(owners) === 0) {
        res.status(400).json({ error: "Cannot delete the last active owner" });
        return;
      }
    }
    await db.delete(staffTable).where(eq(staffTable.id, id));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to delete staff");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/admin/staff/:id/password", requireAuth, requireOwner, async (req, res) => {
  try {
    const { id } = ResetStaffPasswordParams.parse({ id: Number(req.params.id) });
    const body = ResetStaffPasswordBody.parse(req.body);
    const passwordHash = await hashPassword(body.password);
    const [staff] = await db
      .update(staffTable)
      .set({ passwordHash })
      .where(eq(staffTable.id, id))
      .returning();
    if (!staff) { res.status(404).json({ error: "Not found" }); return; }
    res.json(serialize(staff));
  } catch (err) {
    req.log.error({ err }, "Failed to reset password");
    res.status(400).json({ error: "Invalid input" });
  }
});

export default router;
