import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const signals = pgTable("psy_signals", {
  id:          serial("id").primaryKey(),
  channelSlug: text("channel_slug").default("default").notNull(),
  asset:       text("asset").notNull(),
  direction:   text("direction").notNull(),
  entry:       text("entry").notNull(),
  tp1:         text("tp1").notNull(),
  tp2:         text("tp2"),
  tp3:         text("tp3"),
  sl:          text("sl").notNull(),
  leverage:    text("leverage"),
  rr:          text("rr"),
  note:        text("note"),
  source:      text("source").default("MANUAL"),
  status:      text("status").default("ACTIVA").notNull(),
  tgMsgId:     text("tg_msg_id"),
  createdAt:   timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertSignalSchema = createInsertSchema(signals).omit({ id: true, createdAt: true });
export type Signal   = typeof signals.$inferSelect;
export type InsertSignal = z.infer<typeof insertSignalSchema>;
