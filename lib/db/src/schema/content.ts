import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const contentBlocksTable = pgTable("content_blocks", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertContentBlockSchema = createInsertSchema(contentBlocksTable).omit({ id: true, updatedAt: true });
export type InsertContentBlock = z.infer<typeof insertContentBlockSchema>;
export type ContentBlock = typeof contentBlocksTable.$inferSelect;
