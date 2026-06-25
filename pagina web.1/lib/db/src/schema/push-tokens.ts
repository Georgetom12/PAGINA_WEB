import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";

export const pushTokens = pgTable("psy_push_tokens", {
  id:              serial("id").primaryKey(),
  memberId:        integer("member_id").notNull(),
  memberUsername:  text("member_username").notNull(),
  expoToken:       text("expo_token").notNull(),
  createdAt:       timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type PushToken = typeof pushTokens.$inferSelect;
