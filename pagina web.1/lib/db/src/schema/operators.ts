import { pgTable, serial, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const operators = pgTable("psy_operators", {
  id:          serial("id").primaryKey(),
  username:    text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: text("display_name").notNull(),
  active:      boolean("active").default(true).notNull(),
  createdBy:   text("created_by").default("superadmin").notNull(),
  createdAt:   timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertOperatorSchema = createInsertSchema(operators).omit({ id: true, createdAt: true });
export type Operator       = typeof operators.$inferSelect;
export type InsertOperator = z.infer<typeof insertOperatorSchema>;
