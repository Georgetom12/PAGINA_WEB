import { Router, Request, Response } from "express";
import { db, psyApiKeys } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

// ── Cache simple (evita re-consultar FMP en cada apertura del tab) ─────────
const _cache = new Map<string, { data: unknown; exp: number }>();
function cGet<T>(k: string): T | null {
  const e = _cache.get(k);
  return e && Date.now() < e.exp ? (e.data as T) : null;
}
function cSet<T>(k: string, d: T, ms: number) {
  _cache.set(k, { data: d, exp: Date.now() + ms });
}

// ─── FMP — Income Statement (usado por Equities Command Center → Financials) ──
// NOTA: este endpoint faltaba por completo — el frontend lo llamaba pero
// no existía ninguna ruta, por eso "Financials" nunca cargó nada real.
router.get("/proxy/fmp/income-statement", async (req: Request, res: Response) => {
  const key = process.env["FMP_API_KEY"];
  if (!key) { res.status(503).json({ ok: false, error: "FMP_API_KEY no configurado" }); return; }

  const symbol = String(req.query["symbol"] ?? "").toUpperCase().trim();
  const period = req.query["period"] === "quarter" ? "quarter" : "annual";
  const limit  = Math.min(parseInt(String(req.query["limit"] ?? "5")) || 5, 20);
  if (!symbol) { res.status(400).json({ ok: false, error: "symbol requerido" }); return; }

  try {
    const url = `https://financialmodelingprep.com/stable/income-statement?symbol=${encodeURIComponent(symbol)}&period=${period}&limit=${limit}&apikey=${key}`;
    const r = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!r.ok) { res.json({ ok: false, error: `FMP respondió ${r.status}` }); return; }
    const data = await r.json() as Array<Record<string, unknown>>;
    if (!Array.isArray(data) || data.length === 0) { res.json({ ok: false, error: "Sin datos disponibles para este símbolo" }); return; }

    // Orden cronológico ascendente (el más viejo primero) — así el frontend
    // puede calcular CAGR/YoY comparando el último contra el anterior.
    const sorted = [...data].reverse().map(d => ({
      date: d["date"] ?? "",
      fiscalYear: String(d["fiscalYear"] ?? d["calendarYear"] ?? ""),
      period: d["period"] ?? period,
      revenue: Number(d["revenue"] ?? 0),
      grossProfit: Number(d["grossProfit"] ?? 0),
      operatingIncome: Number(d["operatingIncome"] ?? 0),
      netIncome: Number(d["netIncome"] ?? 0),
      ebitda: Number(d["ebitda"] ?? 0),
      eps: Number(d["eps"] ?? 0),
      epsDiluted: Number(d["epsDiluted"] ?? d["eps"] ?? 0),
      researchAndDevelopmentExpenses: Number(d["researchAndDevelopmentExpenses"] ?? 0),
    }));
    res.json({ ok: true, data: sorted });
  } catch (err) {
    res.json({ ok: false, error: String(err) });
  }
});

// ─── Trusted origins (internal traffic — always allowed) ─────────────────────
const TRUSTED_ORIGINS = [
  "https://psychometriks.trade",
  "https://www.psychometriks.trade",
];

function isInternalRequest(req: Request): boolean {
  const origin  = (req.headers["origin"]  as string | undefined)?.trim() ?? "";
  const referer = (req.headers["referer"] as string | undefined)?.trim() ?? "";
  // Check both Origin and Referer headers
  return TRUSTED_ORIGINS.some(o => origin.startsWith(o) || referer.startsWith(o));
}

// ─── Access + rate limiter ────────────────────────────────────────────────────
const RATE_PRO = 120; // req/min with valid active key

interface Bucket { count: number; reset: number }
const buckets = new Map<string, Bucket>();

async function checkAccess(req: Request, res: Response): Promise<boolean> {
  // Internal traffic from psychometriks.trade → always allowed, no rate limit
  if (isInternalRequest(req)) return true;

  // External request: must have a valid active API key
  const apiKey = ((req.query.apiKey ?? req.headers["x-api-key"]) as string | undefined)?.trim();

  if (!apiKey) {
    res.status(403).json({
      error: "API Key requerida",
      message: "Este endpoint requiere una API Key activa. Obtené la tuya en https://psychometriks.trade/pricing",
      docs: "https://psychometriks.trade/api-docs",
    });
    return false;
  }

  try {
    const rows = await db.select().from(psyApiKeys).where(eq(psyApiKeys.key, apiKey)).limit(1);
    const keyRow = rows[0];

    if (!keyRow) {
      res.status(403).json({ error: "API Key inválida" });
      return false;
    }
    if (!keyRow.active) {
      res.status(403).json({ error: "API Key inactiva. Contactá al equipo PSYCHOMETRIKS para activarla." });
      return false;
    }

    // Valid key — apply rate limit
    db.update(psyApiKeys).set({ lastUsedAt: new Date() }).where(eq(psyApiKeys.key, apiKey)).catch(() => {});

    const id     = "key:" + apiKey;
    const now    = Date.now();
    const bucket = buckets.get(id) ?? { count: 0, reset: now + 60_000 };
    if (now > bucket.reset) { bucket.count = 0; bucket.reset = now + 60_000; }
    bucket.count++;
    buckets.set(id, bucket);

    res.setHeader("X-RateLimit-Limit",     RATE_PRO);
    res.setHeader("X-RateLimit-Remaining", Math.max(0, RATE_PRO - bucket.count));
    res.setHeader("X-RateLimit-Reset",     Math.ceil(bucket.reset / 1000));

    if (bucket.count > RATE_PRO) {
      res.status(429).json({
        error: "Rate limit excedido (120 req/min)",
        resetAt: new Date(bucket.reset).toISOString(),
      });
      return false;
    }

    return true;
  } catch {
    // DB unavailable — fail open for external (don't break the API entirely)
    res.status(503).json({ error: "Servicio temporalmente no disponible" });
    return false;
  }
}

async function proxyFetch(url: string, res: Response, req: Request) {
  try {
    const r = await fetch(url, {
      headers: { "Accept": "application/json", "User-Agent": "Mozilla/5.0" },
    });
    if (!r.ok) {
      res.status(r.status).json({ error: `Upstream error ${r.status}` });
      return;
    }
    const data = await r.json();
    res.setHeader("Cache-Control", "public, max-age=300");
    res.json(data);
  } catch (err) {
    req.log.error({ err, url }, "market-proxy fetch error");
    res.status(502).json({ error: "Proxy fetch failed" });
  }
}

// ─── Kraken ──────────────────────────────────────────────────────────────────
router.get("/proxy/kraken/ohlc", async (req: Request, res: Response) => {
  if (!await checkAccess(req, res)) return;
  const { pair = "XBTUSD", interval = "10080", since = "" } = req.query as Record<string, string>;
  const url = since
    ? `https://api.kraken.com/0/public/OHLC?pair=${pair}&interval=${interval}&since=${since}`
    : `https://api.kraken.com/0/public/OHLC?pair=${pair}&interval=${interval}`;
  await proxyFetch(url, res, req);
});

router.get("/proxy/kraken/price", async (req: Request, res: Response) => {
  if (!await checkAccess(req, res)) return;
  const { pair = "XBTUSD" } = req.query as Record<string, string>;
  await proxyFetch(`https://api.kraken.com/0/public/Ticker?pair=${pair}`, res, req);
});

// ─── OKX ─────────────────────────────────────────────────────────────────────
router.get("/proxy/okx/candles", async (req: Request, res: Response) => {
  if (!await checkAccess(req, res)) return;
  const { instId = "BTC-USDT-SWAP", bar = "1D", limit = "300" } = req.query as Record<string, string>;
  await proxyFetch(
    `https://www.okx.com/api/v5/market/history-candles?instId=${instId}&bar=${bar}&limit=${limit}`,
    res, req
  );
});

router.get("/proxy/okx/oi", async (req: Request, res: Response) => {
  if (!await checkAccess(req, res)) return;
  const { instId = "BTC-USDT-SWAP" } = req.query as Record<string, string>;
  await proxyFetch(
    `https://www.okx.com/api/v5/public/open-interest?instType=SWAP&instId=${instId}`,
    res, req
  );
});

router.get("/proxy/okx/oi-history", async (req: Request, res: Response) => {
  if (!await checkAccess(req, res)) return;
  const { instId = "BTC-USDT-SWAP", period = "1D", limit = "300" } = req.query as Record<string, string>;
  await proxyFetch(
    `https://www.okx.com/api/v5/rubik/stat/contracts/open-interest-volume?ccy=BTC&period=${period}&limit=${limit}`,
    res, req
  );
});

// ─── BingX ────────────────────────────────────────────────────────────────────
// (julio 20 2026 — BingX bloquea llamadas directas desde el navegador,
// "BingX: ninguno de sus endpoints respondió, posible bloqueo CORS", igual
// que le pasaba antes a MEXC. La única forma real de evitarlo es que el
// pedido salga del SERVIDOR (Railway), no del navegador — CORS es una
// restricción que el navegador aplica, un fetch server-to-server no la sufre.)
router.get("/proxy/bingx/ticker", async (req: Request, res: Response) => {
  if (!await checkAccess(req, res)) return;
  const { symbol = "BTC-USDT" } = req.query as Record<string, string>;
  await proxyFetch(`https://open-api.bingx.com/openApi/swap/v2/quote/ticker?symbol=${symbol}`, res, req);
});

router.get("/proxy/bingx/depth", async (req: Request, res: Response) => {
  if (!await checkAccess(req, res)) return;
  const { symbol = "BTC-USDT", limit = "100" } = req.query as Record<string, string>;
  await proxyFetch(`https://open-api.bingx.com/openApi/swap/v2/quote/depth?symbol=${symbol}&limit=${limit}`, res, req);
});

router.get("/proxy/bingx/funding-rate", async (req: Request, res: Response) => {
  if (!await checkAccess(req, res)) return;
  const { symbol = "BTC-USDT", limit = "24" } = req.query as Record<string, string>;
  await proxyFetch(`https://open-api.bingx.com/openApi/swap/v2/quote/fundingRate?symbol=${symbol}&limit=${limit}`, res, req);
});

router.get("/proxy/bingx/open-interest", async (req: Request, res: Response) => {
  if (!await checkAccess(req, res)) return;
  const { symbol = "BTC-USDT" } = req.query as Record<string, string>;
  await proxyFetch(`https://open-api.bingx.com/openApi/swap/v2/quote/openInterest?symbol=${symbol}`, res, req);
});

// ─── NewsData.io (Crypto) ───────────────────────────────────────────────────────
// (julio 20 2026 — CryptoPanic descontinuó su plan gratis el 1 de abril de
// 2026. Reemplazado por NewsData.io. La key va acá en el backend, leída de
// la variable de Railway NEWSDATA_API_KEY — NO en el archivo estático
// liquid-map.html, para que nunca quede visible en el código fuente que
// llega al navegador.)
router.get("/proxy/newsdata/crypto", async (req: Request, res: Response) => {
  if (!await checkAccess(req, res)) return;
  const key = process.env["NEWSDATA_API_KEY"];
  if (!key) { res.json({ status: "error", error: "NEWSDATA_API_KEY no configurado en Railway", results: [] }); return; }
  const { language = "en" } = req.query as Record<string, string>;
  await proxyFetch(`https://newsdata.io/api/1/crypto?apikey=${key}&language=${language}`, res, req);
});

// ─── Coinbase ─────────────────────────────────────────────────────────────────
router.get("/proxy/coinbase/price", async (req: Request, res: Response) => {
  if (!await checkAccess(req, res)) return;
  const { pair = "BTC-USD" } = req.query as Record<string, string>;
  await proxyFetch(`https://api.coinbase.com/v2/prices/${pair}/spot`, res, req);
});

// ─── Multi-Exchange Funding Rates (OKX + Gate.io + Hyperliquid) ──────────────
const FUNDING_BASES = [
  "BTC","ETH","SOL","BNB","XRP","ADA","DOGE","AVAX","LINK","DOT",
  "MATIC","LTC","ATOM","NEAR","APT","ARB","OP","INJ","SUI","TIA",
];
const FETCH_HEADERS = { "Accept": "application/json", "User-Agent": "Mozilla/5.0" };

interface FundingEntry {
  symbol: string; base: string; rate: number;
  price: number; change: number; nextFundingTime?: number; source: string;
}

async function fetchOKXFunding(): Promise<FundingEntry[]> {
  const results = await Promise.allSettled(
    FUNDING_BASES.map(async (base) => {
      const instId = `${base}-USDT-SWAP`;
      const [fr, tk] = await Promise.all([
        fetch(`https://www.okx.com/api/v5/public/funding-rate?instId=${instId}`, { headers: FETCH_HEADERS, signal: AbortSignal.timeout(6000) }),
        fetch(`https://www.okx.com/api/v5/market/ticker?instId=${instId}`, { headers: FETCH_HEADERS, signal: AbortSignal.timeout(6000) }),
      ]);
      const fd = await fr.json() as { data?: { fundingRate: string; nextFundingTime: string }[] };
      const td = await tk.json() as { data?: { last: string; open24h: string }[] };
      const f = fd.data?.[0]; const t = td.data?.[0];
      if (!f) throw new Error("no data");
      const price = parseFloat(t?.last ?? "0");
      const open24h = parseFloat(t?.open24h ?? "0");
      return { base, symbol: base + "USDT", rate: parseFloat(f.fundingRate), price,
        change: open24h > 0 ? ((price - open24h) / open24h) * 100 : 0,
        nextFundingTime: parseInt(f.nextFundingTime), source: "OKX" };
    })
  );
  return results.filter(r => r.status === "fulfilled").map(r => (r as PromiseFulfilledResult<FundingEntry>).value);
}

async function fetchGateioFunding(): Promise<FundingEntry[]> {
  const r = await fetch("https://api.gateio.ws/api/v4/futures/usdt/tickers", { headers: FETCH_HEADERS, signal: AbortSignal.timeout(8000) });
  if (!r.ok) throw new Error(`Gate.io HTTP ${r.status}`);
  const raw = await r.json() as { contract: string; last: string; funding_rate: string; change_percentage: string }[];
  const baseSet = new Set(FUNDING_BASES);
  return raw
    .filter(x => baseSet.has(x.contract.replace("_USDT", "")))
    .map(x => {
      const base = x.contract.replace("_USDT", "");
      return { base, symbol: base + "USDT", rate: parseFloat(x.funding_rate), price: parseFloat(x.last),
        change: parseFloat(x.change_percentage ?? "0"), source: "Gate.io" };
    });
}

async function fetchHyperliquidFunding(): Promise<FundingEntry[]> {
  const r = await fetch("https://api.hyperliquid.xyz/info", {
    method: "POST", headers: { ...FETCH_HEADERS, "Content-Type": "application/json" },
    body: JSON.stringify({ type: "metaAndAssetCtxs" }), signal: AbortSignal.timeout(8000),
  });
  if (!r.ok) throw new Error(`Hyperliquid HTTP ${r.status}`);
  const [meta, ctxs] = await r.json() as [
    { universe: { name: string }[] },
    { funding: string; markPx: string; dayNtlVlm: string }[]
  ];
  const baseSet = new Set(FUNDING_BASES);
  return meta.universe
    .map((asset, i) => ({ asset, ctx: ctxs[i]! }))
    .filter(({ asset }) => baseSet.has(asset.name))
    .map(({ asset, ctx }) => ({
      base: asset.name, symbol: asset.name + "USDT",
      rate: parseFloat(ctx.funding),   // Hyperliquid returns 8h rate directly
      price: parseFloat(ctx.markPx), change: 0, source: "Hyperliquid",
    }));
}

router.get("/proxy/okx/funding-rates", async (req: Request, res: Response) => {
  const [okxR, gateR, hlR] = await Promise.allSettled([
    fetchOKXFunding(),
    fetchGateioFunding(),
    fetchHyperliquidFunding(),
  ]);

  // Merge: lowest priority first, highest overwrites (OKX = best)
  const byBase = new Map<string, FundingEntry>();
  if (hlR.status === "fulfilled")   hlR.value.forEach(r => byBase.set(r.base, r));
  if (gateR.status === "fulfilled") gateR.value.forEach(r => byBase.set(r.base, r));
  if (okxR.status === "fulfilled")  okxR.value.forEach(r => byBase.set(r.base, r));

  const data = FUNDING_BASES.map(b => byBase.get(b)).filter(Boolean) as FundingEntry[];

  const sources = {
    okx:         okxR.status  === "fulfilled" ? okxR.value.length  : 0,
    gateio:      gateR.status === "fulfilled" ? gateR.value.length : 0,
    hyperliquid: hlR.status   === "fulfilled" ? hlR.value.length   : 0,
  };

  req.log.info({ sources }, "funding-rates multi-exchange");
  res.setHeader("Cache-Control", "public, max-age=60");
  res.json({ data, sources, ts: Date.now() });
});

// ─── Signals — PSY-ULT2 engine (interno, mismo servidor) ─────────────────────
router.get("/proxy/signals/altcoins", async (req: Request, res: Response) => {
  if (!await checkAccess(req, res)) return;
  const port = process.env["PORT"] ?? "8080";
  await proxyFetch(`http://localhost:${port}/api/altcoin-signals`, res, req);
});

// ─── FMP — Insider Trading (Form 4) ─────────────────────────────────────────
router.get("/proxy/fmp/insider-trading", async (req: Request, res: Response) => {
  const key = process.env["FMP_API_KEY"];
  if (!key) { res.json({ ok: false, error: "FMP_API_KEY no configurado" }); return; }
  const symbol = String(req.query["symbol"] ?? "").toUpperCase().trim();
  const limit  = Math.min(parseInt(String(req.query["limit"] ?? "20")) || 20, 100);
  if (!symbol) { res.status(400).json({ ok: false, error: "symbol requerido" }); return; }

  try {
    const url = `https://financialmodelingprep.com/stable/insider-trading/search?symbol=${encodeURIComponent(symbol)}&page=0&limit=${limit}&apikey=${key}`;
    const r = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (r.status === 401 || r.status === 402 || r.status === 403) {
      res.json({ ok: false, error: "Tu plan de FMP no incluye insider trading — requiere upgrade" });
      return;
    }
    if (!r.ok) { res.json({ ok: false, error: `FMP respondió ${r.status}` }); return; }
    const data = await r.json() as Array<Record<string, unknown>>;
    if (!Array.isArray(data)) { res.json({ ok: false, error: "Respuesta inesperada de FMP" }); return; }
    res.json({
      ok: true,
      data: data.map(d => ({
        date: d["transactionDate"] ?? d["filingDate"] ?? "",
        name: d["reportingName"] ?? "—",
        title: d["typeOfOwner"] ?? "—",
        type: String(d["transactionType"] ?? "").toUpperCase().includes("P") ? "BUY"
              : String(d["transactionType"] ?? "").toUpperCase().includes("S") ? "SELL" : "OTRO",
        shares: Number(d["securitiesTransacted"] ?? 0),
        price: Number(d["price"] ?? 0),
      })),
    });
  } catch (err) { res.json({ ok: false, error: String(err) }); }
});

// ─── FMP — Dividendos ────────────────────────────────────────────────────────
router.get("/proxy/fmp/dividends", async (req: Request, res: Response) => {
  const key = process.env["FMP_API_KEY"];
  if (!key) { res.json({ ok: false, error: "FMP_API_KEY no configurado" }); return; }
  const symbol = String(req.query["symbol"] ?? "").toUpperCase().trim();
  if (!symbol) { res.status(400).json({ ok: false, error: "symbol requerido" }); return; }

  try {
    const url = `https://financialmodelingprep.com/stable/dividends?symbol=${encodeURIComponent(symbol)}&limit=12&apikey=${key}`;
    const r = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!r.ok) { res.json({ ok: false, error: `FMP respondió ${r.status}` }); return; }
    const data = await r.json() as Array<{ date?: string; dividend?: number; adjDividend?: number; yield?: number; frequency?: string }>;
    if (!Array.isArray(data) || data.length === 0) { res.json({ ok: true, data: null }); return; }

    // Suma los pagos de los últimos 12 meses para estimar el dividendo anual real
    const oneYearAgo = Date.now() - 365 * 24 * 60 * 60 * 1000;
    const last12mo = data.filter(d => d.date && new Date(d.date).getTime() >= oneYearAgo);
    const annualDividend = last12mo.reduce((sum, d) => sum + (d.adjDividend ?? d.dividend ?? 0), 0);

    res.json({
      ok: true,
      data: {
        annualDividend: +annualDividend.toFixed(4),
        frequency: data[0]?.frequency ?? "—",
        lastPaymentDate: data[0]?.date ?? null,
        history: data.slice(0, 8).map(d => ({ date: d.date, amount: d.adjDividend ?? d.dividend ?? 0 })),
      },
    });
  } catch (err) { res.json({ ok: false, error: String(err) }); }
});

// ─── FMP — Institutional Ownership (13F) ────────────────────────────────────
// NOTA: este dataset suele requerir un plan de pago de FMP (no el gratuito de
// 250 llamadas/día) — si tu key no lo incluye, esto devuelve ok:false con un
// mensaje claro en vez de fallar en silencio o mostrar datos falsos.
router.get("/proxy/fmp/institutional-ownership", async (req: Request, res: Response) => {
  const key = process.env["FMP_API_KEY"];
  if (!key) { res.json({ ok: false, error: "FMP_API_KEY no configurado" }); return; }
  const symbol = String(req.query["symbol"] ?? "").toUpperCase().trim();
  if (!symbol) { res.status(400).json({ ok: false, error: "symbol requerido" }); return; }

  const now = new Date();
  const year = now.getFullYear();
  const quarter = Math.max(1, Math.floor((now.getMonth()) / 3)); // trimestre ya cerrado

  try {
    const url = `https://financialmodelingprep.com/stable/institutional-ownership/symbol-positions-summary?symbol=${encodeURIComponent(symbol)}&year=${year}&quarter=${quarter}&apikey=${key}`;
    const r = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (r.status === 401 || r.status === 402 || r.status === 403) {
      res.json({ ok: false, error: "Requiere upgrade de plan FMP — el dataset 13F/institucional no está en el plan gratuito", requiresUpgrade: true });
      return;
    }
    if (!r.ok) { res.json({ ok: false, error: `FMP respondió ${r.status}` }); return; }
    const data = await r.json();
    res.json({ ok: true, data });
  } catch (err) { res.json({ ok: false, error: String(err) }); }
});

// ─── FMP — Dividendos por LOTE (para las tarjetas resumen del tab Dividendos) ─
// Cacheado 12h — los dividendos no cambian seguido, no vale la pena re-pedir
// 20 símbolos cada vez que alguien abre el tab.
router.get("/proxy/fmp/dividends-batch", async (req: Request, res: Response) => {
  const key = process.env["FMP_API_KEY"];
  if (!key) { res.json({ ok: false, error: "FMP_API_KEY no configurado" }); return; }

  const symbolsParam = String(req.query["symbols"] ?? "");
  const symbols = symbolsParam.split(",").map(s => s.trim().toUpperCase()).filter(Boolean).slice(0, 30);
  if (!symbols.length) { res.status(400).json({ ok: false, error: "symbols requerido (separados por coma)" }); return; }

  const cacheKey = `divbatch_${symbols.join(",")}`;
  const cached = cGet<Record<string, { annualDividend: number; yield: number } | null>>(cacheKey);
  if (cached) { res.json({ ok: true, data: cached, cached: true }); return; }

  try {
    const results = await Promise.allSettled(symbols.map(async (sym) => {
      const [divRes, quoteRes] = await Promise.all([
        fetch(`https://financialmodelingprep.com/stable/dividends?symbol=${sym}&limit=12&apikey=${key}`, { signal: AbortSignal.timeout(8000) }),
        fetch(`https://financialmodelingprep.com/stable/quote?symbol=${sym}&apikey=${key}`, { signal: AbortSignal.timeout(8000) }),
      ]);
      const divData = divRes.ok ? await divRes.json() as Array<{ date?: string; dividend?: number; adjDividend?: number }> : [];
      const quoteData = quoteRes.ok ? await quoteRes.json() as Array<{ price?: number }> : [];
      const price = quoteData[0]?.price ?? 0;

      if (!Array.isArray(divData) || divData.length === 0 || price <= 0) return [sym, null] as const;

      const oneYearAgo = Date.now() - 365 * 24 * 60 * 60 * 1000;
      const last12mo = divData.filter(d => d.date && new Date(d.date).getTime() >= oneYearAgo);
      const annualDividend = last12mo.reduce((sum, d) => sum + (d.adjDividend ?? d.dividend ?? 0), 0);
      if (annualDividend <= 0) return [sym, null] as const;

      return [sym, { annualDividend: +annualDividend.toFixed(4), yield: +((annualDividend / price) * 100).toFixed(2) }] as const;
    }));

    const out: Record<string, { annualDividend: number; yield: number } | null> = {};
    for (const r of results) {
      if (r.status === "fulfilled") out[r.value[0]] = r.value[1];
    }
    cSet(cacheKey, out, 12 * 60 * 60_000);
    res.json({ ok: true, data: out, cached: false });
  } catch (err) { res.json({ ok: false, error: String(err) }); }
});

// ─── NewsAPI — noticias en vivo (usado por Oracle Feeds dentro de Whale Intel) ─
// NOTA: este endpoint no existía — el frontend lo llamaba pero nunca hubo
// ruta que lo atendiera, por eso el fetch fallaba en silencio.
router.get("/proxy/news", async (req: Request, res: Response) => {
  const key = process.env["NEWS_API_KEY"];
  if (!key) { res.json({ ok: false, error: "NEWS_API_KEY no configurado", articles: [] }); return; }

  const q = String(req.query["q"] ?? "bitcoin crypto ethereum blockchain");
  const pageSize = Math.min(parseInt(String(req.query["pageSize"] ?? "20")) || 20, 100);
  const lang = String(req.query["lang"] ?? "en");

  try {
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(q)}&pageSize=${pageSize}&language=${lang}&sortBy=publishedAt&apiKey=${key}`;
    const r = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!r.ok) { res.json({ ok: false, error: `NewsAPI respondió ${r.status}`, articles: [] }); return; }
    const d = await r.json() as {
      status: string;
      articles?: Array<{ title?: string; url?: string; publishedAt?: string; source?: { name?: string } }>;
    };
    if (d.status !== "ok") { res.json({ ok: false, error: "NewsAPI status no-ok", articles: [] }); return; }

    const articles = (d.articles ?? [])
      // Solo artículos con URL real (absoluta) — evita el bug de antes donde
      // links inválidos mandaban a una página inexistente del router.
      .filter(a => a.title && a.url && /^https?:\/\//i.test(a.url))
      .map(a => ({
        title: a.title!,
        url: a.url!,
        publishedAt: a.publishedAt ?? new Date().toISOString(),
        source: a.source?.name ?? "—",
      }));

    res.json({ ok: true, articles });
  } catch (err) {
    res.json({ ok: false, error: String(err), articles: [] });
  }
});

export default router;
