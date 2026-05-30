import { pgTable, serial, text, boolean, timestamp } from "drizzle-orm/pg-core";

export const psyWhitelist = pgTable("psy_whitelist", {
  id:         serial("id").primaryKey(),
  email:      text("email").notNull().unique(),
  createdAt:  timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  notified:   boolean("notified").default(false).notNull(),
  notifiedAt: timestamp("notified_at", { withTimezone: true }),
});

export type PsyWhitelistEntry = typeof psyWhitelist.$inferSelect;
