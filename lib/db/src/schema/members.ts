import { pgTable, serial, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const members = pgTable("psy_members", {
  id:              serial("id").primaryKey(),
  username:        text("username").notNull().unique(),
  passwordHash:    text("password_hash").notNull(),
  displayName:     text("display_name").notNull(),
  email:           text("email"),
  plan:            text("plan").notNull().default("basico"),
  expiresAt:       timestamp("expires_at",    { withTimezone: true }),
  active:          boolean("active").default(true).notNull(),
  emailVerified:   boolean("email_verified").default(false).notNull(),
  walletAddress:   text("wallet_address"),
  notes:           text("notes"),
  createdAt:       timestamp("created_at",    { withTimezone: true }).defaultNow().notNull(),
  updatedAt:       timestamp("updated_at",    { withTimezone: true }).defaultNow().notNull(),
});

export const insertMemberSchema = createInsertSchema(members).omit({ id: true, createdAt: true, updatedAt: true });
export type Member       = typeof members.$inferSelect;
export type InsertMember = z.infer<typeof insertMemberSchema>;
