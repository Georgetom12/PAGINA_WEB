import { pgTable, text, boolean, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const psyApiKeys = pgTable("psy_api_keys", {
  key:          text("key").primaryKey(),
  username:     text("username").notNull(),
  label:        text("label").notNull().default("API Developer"),
  active:       boolean("active").notNull().default(false),
  activatedAt:  timestamp("activated_at"),
  expiresAt:    timestamp("expires_at"),
  lastUsedAt:   timestamp("last_used_at"),
  requestsToday: integer("requests_today").notNull().default(0),
  resetDate:    text("reset_date").notNull().default(""),
  createdAt:    timestamp("created_at").notNull().defaultNow(),
});

export const insertPsyApiKeySchema = createInsertSchema(psyApiKeys);
export type InsertPsyApiKey = z.infer<typeof insertPsyApiKeySchema>;
export type PsyApiKey = typeof psyApiKeys.$inferSelect;
