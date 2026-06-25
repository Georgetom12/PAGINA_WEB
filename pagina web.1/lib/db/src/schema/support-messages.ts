import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";

export const supportMessages = pgTable("psy_support_messages", {
  id:              serial("id").primaryKey(),
  memberId:        integer("member_id").notNull(),
  memberUsername:  text("member_username").notNull(),
  sender:          text("sender").notNull(), // "user" | "admin"
  message:         text("message").notNull(),
  readAt:          timestamp("read_at",    { withTimezone: true }),
  createdAt:       timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type SupportMessage = typeof supportMessages.$inferSelect;
