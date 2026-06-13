import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { staffTable } from "./staff";

export const emailAssetsTable = pgTable("email_assets", {
  id: serial("id").primaryKey(),
  data: text("data").notNull(),
  mimeType: text("mime_type").notNull(),
  filename: text("filename"),
  createdBy: integer("created_by").references(() => staffTable.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  // Set the moment an asset is embedded in an email that was successfully sent.
  // Used assets are kept indefinitely (recipients' clients fetch them by URL
  // long after sending); only never-used assets are eligible for pruning.
  usedAt: timestamp("used_at", { withTimezone: true }),
});

export const insertEmailAssetSchema = createInsertSchema(emailAssetsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertEmailAsset = z.infer<typeof insertEmailAssetSchema>;
export type EmailAsset = typeof emailAssetsTable.$inferSelect;
