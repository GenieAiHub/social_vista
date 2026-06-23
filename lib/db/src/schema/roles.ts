import { pgTable, text, serial, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const rolesTable = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  canViewLeads: boolean("can_view_leads").notNull().default(true),
  canCreateLeads: boolean("can_create_leads").notNull().default(false),
  canEditLeads: boolean("can_edit_leads").notNull().default(false),
  canDeleteLeads: boolean("can_delete_leads").notNull().default(false),
  canAssignLeads: boolean("can_assign_leads").notNull().default(false),
  canEmailLeads: boolean("can_email_leads").notNull().default(false),
  canManageSEO: boolean("can_manage_seo").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertRoleSchema = createInsertSchema(rolesTable).omit({ id: true, createdAt: true });
export type InsertRole = z.infer<typeof insertRoleSchema>;
export type Role = typeof rolesTable.$inferSelect;
