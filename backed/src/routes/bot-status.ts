import { Router, type Request, type Response } from "express";
import { db, signals, channels } from "@workspace/db";
import { desc, gte, and } from "drizzle-orm";

const router = Router();

// Server start time (module-level, resets on each deploy/restart)
const SERVER_START = new Date();

// ── PnL calculator ────────────────────────────────────────────────────────
// Calculates R-multiples from signal statuses.
// TP1 ✅ → +1R  |  TP2 ✅ → +2R  |  CERRADA ✅ → +1R  |  INVALIDADA ❌ → -1R
function calcRMultiple(status: string, rr: string | null): number {
  if (status === "INVALIDADA ❌") return -1;
  if (status === "ACTIVA") return 0;

  // Parse rr like "1:2.5" → reward = 2.5
  let reward = 1;
  if (rr) {
    const m = rr.match(/1\s*[:\/]\s*([\d.]+)/);
    if (m) reward = parseFloat(m[1]!);
  }

  if (status === "TP2 ✅") return reward;
  if (status === "TP1 ✅" || status === "CERRADA ✅") return Math.min(reward, 2);
  return 0;
}

function formatPnL(r: number): string {
  const sign = r > 0 ? "+" : "";
  return `${sign}${r.toFixed(2)}R`;
}

function formatUptime(start: Date): string {
  const ms = Date.now() - start.getTime();
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

// ── GET /api/bot-status ───────────────────────────────────────────────────
router.get("/bot-status", async (req: Request, res: Response) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [allTodaySignals, lastSignalArr, allChannels] = await Promise.all([
      db.select().from(signals).where(gte(signals.createdAt, todayStart)),
      db.select().from(signals).orderBy(desc(signals.createdAt)).limit(1),
      db.select({ id: channels.id, name: channels.name, active: channels.active }).from(channels),
    ]);

    const lastSignal = lastSignalArr[0] ?? null;

    // PnL calculation
    const todayPnLR = allTodaySignals.reduce((acc, s) => acc + calcRMultiple(s.status, s.rr), 0);
    const todayClosed  = allTodaySignals.filter(s => s.status !== "ACTIVA").length;
    const todayActive  = allTodaySignals.filter(s => s.status === "ACTIVA").length;
    const todayWins    = allTodaySignals.filter(s => s.status.startsWith("TP") || s.status === "CERRADA ✅").length;
    const todayLosses  = allTodaySignals.filter(s => s.status === "INVALIDADA ❌").length;
    const winRate      = todayClosed > 0 ? Math.round((todayWins / todayClosed) * 100) : 0;

    const activeChannels = allChannels.filter(c => c.active).length;

    res.json({
      ok: true,
      bot: {
        active: true,
        uptime: formatUptime(SERVER_START),
        startedAt: SERVER_START.toISOString(),
        environment: process.env["NODE_ENV"] ?? "production",
        activeChannels,
        totalChannels: allChannels.length,
      },
      lastSignal: lastSignal
        ? {
            id: lastSignal.id,
            asset: lastSignal.asset,
            direction: lastSignal.direction,
            entry: lastSignal.entry,
            tp1: lastSignal.tp1,
            sl: lastSignal.sl,
            status: lastSignal.status,
            leverage: lastSignal.leverage,
            rr: lastSignal.rr,
            source: lastSignal.source,
            createdAt: lastSignal.createdAt,
          }
        : null,
      today: {
        date: todayStart.toLocaleDateString("es-EC", { weekday: "long", day: "numeric", month: "long" }),
        signals: allTodaySignals.length,
        active: todayActive,
        closed: todayClosed,
        wins: todayWins,
        losses: todayLosses,
        winRate,
        pnlR: todayPnLR,
        pnlFormatted: formatPnL(todayPnLR),
      },
    });
  } catch (err) {
    req.log.error({ err }, "bot-status error");
    res.status(500).json({ error: "Error al obtener estado del bot" });
  }
});

export { SERVER_START, formatPnL, calcRMultiple, formatUptime };
export default router;
