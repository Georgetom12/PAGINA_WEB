import { pgTable, serial, integer, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { channels } from "./channels";

export const channelBots = pgTable("psy_channel_bots", {
  id:         serial("id").primaryKey(),
  channelId:  integer("channel_id").notNull().references(() => channels.id, { onDelete: "cascade" }),
  label:      text("label").notNull(),
  botToken:   text("bot_token").notNull(),
  active:     boolean("active").default(true).notNull(),
  createdAt:  timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type ChannelBot       = typeof channelBots.$inferSelect;
export type InsertChannelBot = typeof channelBots.$inferInsert;
