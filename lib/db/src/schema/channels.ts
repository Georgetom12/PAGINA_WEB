import { pgTable, serial, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const channels = pgTable("psy_channels", {
  id:          serial("id").primaryKey(),
  slug:        text("slug").notNull().unique(),
  name:        text("name").notNull(),
  description: text("description"),
  color:       text("color").default("#00e5ff").notNull(),
  botToken:    text("bot_token").notNull(),
  channelId:   text("channel_id").notNull(),
  inviteLink:  text("invite_link"),
  active:      boolean("active").default(true).notNull(),
  createdAt:   timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertChannelSchema = createInsertSchema(channels).omit({ id: true, createdAt: true });
export type Channel       = typeof channels.$inferSelect;
export type InsertChannel = z.infer<typeof insertChannelSchema>;
