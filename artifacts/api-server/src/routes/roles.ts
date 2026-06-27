import { Router } from "express";
import { db, rolesTable, staffTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import {
  CreateRoleBody,
  UpdateRoleBody,
  UpdateRoleParams,
  DeleteRoleParams,
} from "@workspace/api-zod";
import { requireAuth, requireOwner } from "../lib/auth.js";
import type { Role } from "@workspace/db";

const router = Router();

function serialize(r: Role) {
  return {
    id: r.id,
    name: r.name,
    canViewLeads: r.canViewLeads,
    canCreateLeads: r.canCreateLeads,
    canEditLeads: r.canEditLeads,
    canDeleteLeads: r.canDeleteLeads,
    canAssignLeads: r.canAssignLeads,
    canEmailLeads: r.canEmailLeads,
    canManageSEO: r.canManageSEO,
    canManageBlog: r.canManageBlog,
    createdAt: r.createdAt.toISOString(),
  };
}

router.get("/admin/roles", requireAuth, async (req, res) => {
  try {
    const rows = await db.select().from(rolesTable).orderBy(desc(rolesTable.createdAt));
    res.json(rows.map(serialize));
  } catch (err) {
    req.log.error({ err }, "Failed to list roles");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/admin/roles", requireAuth, requireOwner, async (req, res) => {
  try {
    const body = CreateRoleBody.parse(req.body);
    const existing = await db
      .select({ id: rolesTable.id })
      .from(rolesTable)
      .where(eq(rolesTable.name, body.name));
    if (existing.length > 0) {
      res.status(409).json({ error: "A role with that name already exists" });
      return;
    }
    const [role] = await db
      .insert(rolesTable)
      .values({
        name: body.name,
        canViewLeads: body.canViewLeads ?? true,
        canCreateLeads: body.canCreateLeads ?? false,
        canEditLeads: body.canEditLeads ?? false,
        canDeleteLeads: body.canDeleteLeads ?? false,
        canAssignLeads: body.canAssignLeads ?? false,
        canEmailLeads: body.canEmailLeads ?? false,
        canManageSEO: body.canManageSEO ?? false,
        canManageBlog: body.canManageBlog ?? false,
      })
      .returning();
    res.status(201).json(serialize(role));
  } catch (err) {
    req.log.error({ err }, "Failed to create role");
    res.status(400).json({ error: "Invalid input" });
  }
});

router.patch("/admin/roles/:id", requireAuth, requireOwner, async (req, res) => {
  try {
    const { id } = UpdateRoleParams.parse({ id: Number(req.params.id) });
    const body = UpdateRoleBody.parse(req.body);
    const updates: Partial<typeof rolesTable.$inferInsert> = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.canViewLeads !== undefined) updates.canViewLeads = body.canViewLeads;
    if (body.canCreateLeads !== undefined) updates.canCreateLeads = body.canCreateLeads;
    if (body.canEditLeads !== undefined) updates.canEditLeads = body.canEditLeads;
    if (body.canDeleteLeads !== undefined) updates.canDeleteLeads = body.canDeleteLeads;
    if (body.canAssignLeads !== undefined) updates.canAssignLeads = body.canAssignLeads;
    if (body.canEmailLeads !== undefined) updates.canEmailLeads = body.canEmailLeads;
    if (body.canManageSEO !== undefined) updates.canManageSEO = body.canManageSEO;
    if (body.canManageBlog !== undefined) updates.canManageBlog = body.canManageBlog;
    const [role] = await db
      .update(rolesTable)
      .set(updates)
      .where(eq(rolesTable.id, id))
      .returning();
    if (!role) { res.status(404).json({ error: "Not found" }); return; }
    res.json(serialize(role));
  } catch (err) {
    req.log.error({ err }, "Failed to update role");
    res.status(400).json({ error: "Invalid input" });
  }
});

router.delete("/admin/roles/:id", requireAuth, requireOwner, async (req, res) => {
  try {
    const { id } = DeleteRoleParams.parse({ id: Number(req.params.id) });
    // Unassign this role from any staff who currently hold it so they revert to
    // the view-only default rather than dangling at a deleted role id.
    await db.update(staffTable).set({ roleId: null }).where(eq(staffTable.roleId, id));
    await db.delete(rolesTable).where(eq(rolesTable.id, id));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to delete role");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
