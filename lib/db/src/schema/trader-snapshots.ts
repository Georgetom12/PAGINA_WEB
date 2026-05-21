import { pgTable, serial, text, numeric, bigint, index, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const traderSnapshotsTable = pgTable("trader_snapshots", {
  id:             serial("id").primaryKey(),
  traderId:       text("trader_id").notNull(),
  displayName:    text("display_name").notNull(),
  coin:           text("coin").notNull(),
  exchange:       text("exchange").notNull(),
  position:       text("position").notNull(),
  oiUsd:          numeric("oi_usd"),
  pnl24h:         numeric("pnl_24h"),
  pnlCumulative:  numeric("pnl_cumulative").default("0"),
  winRate:        numeric("win_rate"),
  priceChange24h: numeric("price_change_24h"),
  fundingRate:    numeric("funding_rate"),
  signal:         text("signal"),
  ts:             bigint("ts", { mode: "number" }).notNull(),
  createdAt:      timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("trader_snapshots_tid_ts_idx").on(t.traderId, t.ts),
  index("trader_snapshots_ts_idx").on(t.ts),
]);

export const insertTraderSnapshotSchema = createInsertSchema(traderSnapshotsTable).omit({ id: true, createdAt: true });
export type InsertTraderSnapshot = z.infer<typeof insertTraderSnapshotSchema>;
export type TraderSnapshot = typeof traderSnapshotsTable.$inferSelect;
