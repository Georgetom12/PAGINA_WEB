import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const apiConfigTable = pgTable("api_config", {
  keyName:     text("key_name").primaryKey(),
  keyValue:    text("key_value").notNull(),
  description: text("description").notNull().default(""),
  updatedAt:   timestamp("updated_at").notNull().defaultNow(),
});

export const insertApiConfigSchema = createInsertSchema(apiConfigTable);
export type InsertApiConfig = z.infer<typeof insertApiConfigSchema>;
export type ApiConfig = typeof apiConfigTable.$inferSelect;
