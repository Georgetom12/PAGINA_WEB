import { pgTable, serial, text, boolean, timestamp, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const psyWatchlist = pgTable("psy_watchlist", {
  id: serial("id").primaryKey(),
  username: text("username").notNull(),
  symbol: text("symbol").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const psyAlerts = pgTable("psy_alerts", {
  id: serial("id").primaryKey(),
  username: text("username").notNull(),
  symbol: text("symbol").notNull(),
  metric: text("metric").notNull(), // "price" | "rsi"
  condition: text("condition").notNull(), // "above" | "below"
  threshold: numeric("threshold").notNull(),
  active: boolean("active").default(true).notNull(),
  triggeredAt: timestamp("triggered_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const psyExchangeKeys = pgTable("psy_exchange_keys", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  exchange: text("exchange").notNull().default("binance"),
  apiKeyEnc: text("api_key_enc").notNull(),
  apiSecretEnc: text("api_secret_enc").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const psyTrackRecord = pgTable("psy_track_record", {
  id: serial("id").primaryKey(),
  symbol: text("symbol").notNull(),
  motor: text("motor").notNull(),
  direccion: text("direccion").notNull(),
  entrada: numeric("entrada"),
  resultadoPct: numeric("resultado_pct"),
  estado: text("estado").notNull().default("PENDIENTE"), // PENDIENTE | GANADA | PERDIDA
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  closedAt: timestamp("closed_at", { withTimezone: true }),
});

export const insertWatchlistSchema = createInsertSchema(psyWatchlist).omit({ id: true, createdAt: true });
export const insertAlertSchema = createInsertSchema(psyAlerts).omit({ id: true, createdAt: true, triggeredAt: true });
export type Watchlist = typeof psyWatchlist.$inferSelect;
export type Alert = typeof psyAlerts.$inferSelect;
export type ExchangeKey = typeof psyExchangeKeys.$inferSelect;
export type TrackRecord = typeof psyTrackRecord.$inferSelect;

