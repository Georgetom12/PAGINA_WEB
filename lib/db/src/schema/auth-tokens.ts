import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";

export const authTokens = pgTable("psy_auth_tokens", {
  id:        serial("id").primaryKey(),
  memberId:  integer("member_id").notNull(),
  token:     text("token").notNull().unique(),
  type:      text("type").notNull(), // "verify_email" | "reset_password"
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt:    timestamp("used_at",    { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type AuthToken = typeof authTokens.$inferSelect;
