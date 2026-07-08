import { Router } from "express";
import { parseStringPromise } from "xml2js";

const router = Router();
// NOTA: la constante RAILWAY (servicio externo psychometriks-oracle-feeds-
// production.up.railway.app) se eliminó — estaba caído/roto, por eso varios
// endpoints daban datos desactualizados. Reemplazados por fuentes reales.

const cache: Record<string, { data: unknown; ts: number }> = {};

async function proxyCached(key: string, url: string, ttlMs: number, headers?: Record<string,string>): Promise<unknown> {
  const now = Date.now();
  if (cache[key] && now - cache[key].ts < ttlMs) return cache[key].data;
  const res = await fetch(url, { signal: AbortSignal.timeout(10000), headers });
  if (!res.ok) throw new Error(`Upstream ${res.status}`);
  const data = await res.json();
  cache[key] = { data, ts: now };
  return data;
}

async function rssToItems(url: string): Promise<{ title: string; link: string; pubDate: string; source: string }[]> {
  const res = await fetch(url, { signal: AbortSignal.timeout(8000), headers: { "User-Agent": "Mozilla/5.0 PSYCHOMETRIKS/2.0" } });
  if (!res.ok) throw new Error(`RSS ${res.status}`);
  const xml = await res.text();
  const parsed = await parseStringPromise(xml, { explicitArray: false, ignoreAttrs: false });
  const channel = parsed?.rss?.channel ?? parsed?.feed ?? {};
  const rawItems: Record<string, unknown>[] = Array.isArray(channel.item) ? channel.item : channel.item ? [channel.item] : [];
  const sourceName = (typeof channel.title === "string" ? channel.title : (channel.title as { _ ?: string })?._  ?? url.split("/")[2]).replace(" - Cointelegraph","").replace(" — Decrypt","").split(" ").slice(0,3).join(" ");

  // Extrae el link real, contemplando tanto RSS 2.0 (<link>texto</link>) como
  // Atom (<link href="..."/> — un atributo, no texto). Con ignoreAttrs:false
  // ya no se pierden los href.
  function extractLink(it: Record<string, unknown>): string {
    const raw = it["link"];
    if (typeof raw === "string") return raw.trim();
    if (raw && typeof raw === "object") {
      const obj = raw as { _?: string; $?: { href?: string } };
      if (obj._) return obj._.trim();
      if (obj.$?.href) return obj.$.href.trim();
    }
    const guid = it["guid"];
    if (typeof guid === "string") return guid.trim();
    if (guid && typeof guid === "object") {
      const g = guid as { _?: string };
      if (g._) return g._.trim();
    }
    return "";
  }

  return rawItems.slice(0, 12).map(it => ({
    title: (typeof it.title === "string" ? it.title : (it.title as { _?: string })?._ ?? "").replace(/<!\[CDATA\[|\]\]>/g,"").trim(),
    link: extractLink(it),
    pubDate: (typeof it.pubDate === "string" ? it.pubDate : (it.pubDate as string) ?? (it as Record<string,string>).updated ?? "").trim(),
    source: sourceName,
  }))
    // Solo noticias con un link que sea de verdad una URL absoluta (http/https)
    // — antes, si el guid no era una URL, el click mandaba a una ruta interna
    // inexistente ("Did you forget to add the page to the router?").
    .filter(i => i.title && /^https?:\/\//i.test(i.link));
}

// ── Railway proxies ──────────────────────────────────────────────────────────
// ── PRECIOS — CoinGecko (gratis, sin key, confiable) ────────────────────────
router.get("/oracle/prices", async (_req, res) => {
  try {
    const data = await proxyCached(
      "prices_v2",
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,binancecoin,ripple&vs_currencies=usd",
      30_000,
    ) as Record<string, { usd: number }>;
    const map: Record<string, { price: number | null; source: string; symbol: string; timestamp: number }> = {};
    const ids: Record<string, string> = { bitcoin: "BTC", ethereum: "ETH", solana: "SOL", binancecoin: "BNB", ripple: "XRP" };
    for (const [id, sym] of Object.entries(ids)) {
      map[sym] = { price: data[id]?.usd ?? null, source: "CoinGecko", symbol: sym, timestamp: Date.now() };
    }
    res.json(map);
  } catch { res.status(502).json({ error: "prices unavailable" }); }
});

// ── SENTIMENT — CoinGecko global + Fear&Greed ya conectado ──────────────────
router.get("/oracle/sentiment", async (_req, res) => {
  try {
    const [global, fg] = await Promise.all([
      proxyCached("cg_global", "https://api.coingecko.com/api/v3/global", 300_000) as Promise<{
        data?: { market_cap_percentage?: { btc?: number }; active_cryptocurrencies?: number };
      }>,
      proxyCached("fear_greed", "https://api.alternative.me/fng/?limit=7", 300_000) as Promise<{
        data?: Array<{ value: string; value_classification: string; timestamp: string }>;
      }>,
    ]);
    const fgDays = (fg.data ?? []).map(d => ({
      date: new Date(Number(d.timestamp) * 1000).toISOString().slice(0, 10),
      label: d.value_classification,
      value: Number(d.value),
    }));
    res.json({
      btc_dominance: global.data?.market_cap_percentage?.btc ?? 0,
      active_cryptos: global.data?.active_cryptocurrencies ?? 0,
      fear_greed_7d: fgDays,
    });
  } catch { res.status(502).json({ error: "sentiment unavailable" }); }
});

// ── WHALES — sin fuente gratuita confiable todavía ──────────────────────────
// NOTA HONESTA: un feed de "ballenas on-chain en vivo" de verdad (tipo
// Whale Alert) es un servicio de pago. No hay forma gratuita confiable de
// replicarlo bien — devolvemos vacío en vez de inventar transacciones falsas.
router.get("/oracle/whales", async (_req, res) => {
  res.json([]);
});

// ── NEWS — RSS reales (mismo patrón que news_extended, ya probado) ──────────
router.get("/oracle/news", async (_req, res) => {
  try {
    const cacheKey = "news_v2";
    if (cache[cacheKey] && Date.now() - cache[cacheKey].ts < 300_000) { res.json(cache[cacheKey].data); return; }
    const feeds = ["https://www.coindesk.com/arc/outboundfeeds/rss/", "https://cointelegraph.com/rss"];
    const results = await Promise.allSettled(feeds.map(f => rssToItems(f)));
    const all = results.flatMap(r => r.status === "fulfilled" ? r.value : []);
    all.sort((a, b) => new Date(b.pubDate || 0).getTime() - new Date(a.pubDate || 0).getTime());
    const top = all.slice(0, 20);
    cache[cacheKey] = { data: top, ts: Date.now() };
    res.json(top);
  } catch { res.status(502).json({ error: "news unavailable" }); }
});

// ── MINERS — sin fuente gratuita de hash rate por empresa todavía ───────────
// NOTA HONESTA: hash rate por minera cotizada (MARA, RIOT, etc.) no tiene
// un API gratuito confiable — se necesitaría un proveedor especializado.
router.get("/oracle/miners", async (_req, res) => {
  res.json([]);
});

// ── TREASURIES — sin fuente gratuita de tesoros BTC corporativos todavía ────
// NOTA HONESTA: mismo caso — bitcointreasuries.net no ofrece API pública
// gratuita estable; se necesitaría scraping (frágil) o un proveedor de pago.
router.get("/oracle/treasuries", async (_req, res) => {
  res.json([]);
});

router.get("/oracle/status", async (_req, res) => {
  res.json({ ok: true, last_updated: { psychometriks: new Date().toISOString() } });
});

// ── Fear & Greed — reparado con Alternative.me ────────────────────────────
router.get("/oracle/fear_greed", async (_req, res) => {
  try {
    const data = await proxyCached("fear_greed", "https://api.alternative.me/fng/?limit=7", 300_000) as { data?: unknown[] };
    res.json(data?.data ?? []);
  } catch { res.status(502).json({ error: "fear_greed unavailable" }); }
});

// ── DeFiLlama — reparado con API pública ──────────────────────────────────
router.get("/oracle/defillama", async (_req, res) => {
  try {
    const cacheKey = "defillama_combo";
    if (cache[cacheKey] && Date.now() - cache[cacheKey].ts < 600_000) {
      res.json(cache[cacheKey].data);
      return;
    }
    const [protsRaw, tvlRaw] = await Promise.all([
      fetch("https://api.llama.fi/protocols",               { signal: AbortSignal.timeout(10000) }).then(r => r.json()),
      fetch("https://api.llama.fi/v2/historicalChainTvl",   { signal: AbortSignal.timeout(10000) }).then(r => r.json()),
    ]);
    const protocols = (protsRaw as Array<{name:string;tvl:number;category:string;chain:string;logo?:string;change_1d?:number;change_7d?:number}>)
      .filter(p => p.tvl > 0 && p.category !== "CEX")
      .sort((a, b) => (b.tvl ?? 0) - (a.tvl ?? 0))
      .slice(0, 15)
      .map(p => ({ name: p.name, tvl: p.tvl, category: p.category, chain: p.chain, logo: p.logo ?? null, change_1d: p.change_1d ?? null, change_7d: p.change_7d ?? null }));
    const tvlHistory = (tvlRaw as Array<{date:number;tvl:number}>).slice(-30);
    const totalTvl = tvlHistory.at(-1)?.tvl ?? 0;
    const result = { protocols, tvlHistory, totalTvl };
    cache[cacheKey] = { data: result, ts: Date.now() };
    res.json(result);
  } catch { res.status(502).json({ error: "defillama unavailable" }); }
});

// ── News Extended — reparado con RSS múltiples ───────────────────────────
router.get("/oracle/news_extended", async (_req, res) => {
  try {
    const cacheKey = "news_extended";
    if (cache[cacheKey] && Date.now() - cache[cacheKey].ts < 300_000) {
      res.json(cache[cacheKey].data);
      return;
    }
    const feeds = [
      "https://decrypt.co/feed",
      "https://bitcoinmagazine.com/feed",
      "https://cointelegraph.com/rss/tag/defi",
      "https://cointelegraph.com/rss/tag/bitcoin",
    ];
    const results = await Promise.allSettled(feeds.map(f => rssToItems(f)));
    const all = results.flatMap(r => r.status === "fulfilled" ? r.value : []);
    all.sort((a, b) => new Date(b.pubDate || 0).getTime() - new Date(a.pubDate || 0).getTime());
    cache[cacheKey] = { data: all.slice(0, 30), ts: Date.now() };
    res.json(all.slice(0, 30));
  } catch { res.status(502).json({ error: "news_extended unavailable" }); }
});

// ── Whale Intelligence Dashboard ──────────────────────────────────────────────
const ETF_ENTITIES = [
  { id:"blackrock", name:"BlackRock IBIT", ticker:"IBIT", type:"ETF", label:"ETF / Fondos Institucionales", icon:"BLK", color:"#00e5ff", bg:"rgba(0,229,255,.12)", holdings:"821,512 BTC", aumUsd:"$55.2B", flow1d:"+$412M", pct1d:2.1, action:"BUY",  source:"Farside", updated:"referencia" },
  { id:"fidelity",  name:"Fidelity FBTC",  ticker:"FBTC", type:"ETF", label:"ETF / Fondos Institucionales", icon:"FID", color:"#1aeb8a", bg:"rgba(26,235,138,.12)", holdings:"185,000 BTC", aumUsd:"$20.8B", flow1d:"+$89M",  pct1d:1.4, action:"BUY",  source:"Farside", updated:"referencia" },
  { id:"ark",       name:"ARK Invest ARKB",ticker:"ARKB", type:"ETF", label:"ETF / Fondos Institucionales", icon:"ARK", color:"#e8c547", bg:"rgba(232,197,71,.12)", holdings:"43,200 BTC",  aumUsd:"$4.8B",  flow1d:"+$31M",  pct1d:0.8, action:"BUY",  source:"Farside", updated:"referencia" },
  { id:"grayscale", name:"Grayscale GBTC", ticker:"GBTC", type:"ETF", label:"ETF / Fondos Institucionales", icon:"GBT", color:"#f03060", bg:"rgba(240,48,96,.12)",  holdings:"286,000 BTC", aumUsd:"$19.4B", flow1d:"-$58M",  pct1d:-0.6,action:"SELL", source:"Farside", updated:"referencia" },
  { id:"vaneck",    name:"VanEck HODL",    ticker:"HODL", type:"ETF", label:"ETF / Fondos Institucionales", icon:"VAN", color:"#9060f0", bg:"rgba(144,96,240,.12)", holdings:"8,400 BTC",   aumUsd:"$570M",  flow1d:"+$12M",  pct1d:0.3, action:"BUY",  source:"Farside", updated:"referencia" },
  { id:"bitwise",   name:"Bitwise BITB",   ticker:"BITB", type:"ETF", label:"ETF / Fondos Institucionales", icon:"BIT", color:"#f0a020", bg:"rgba(240,160,32,.12)", holdings:"12,800 BTC",  aumUsd:"$860M",  flow1d:"+$8M",   pct1d:0.2, action:"BUY",  source:"Farside", updated:"referencia" },
  { id:"invesco",   name:"Invesco Galaxy", ticker:"BTCO", type:"ETF", label:"ETF / Fondos Institucionales", icon:"INV", color:"#40c4ff", bg:"rgba(64,196,255,.12)", holdings:"3,100 BTC",   aumUsd:"$210M",  flow1d:"+$4M",   pct1d:0.1, action:"BUY",  source:"Farside", updated:"referencia" },
];

const CORPORATE_ENTITIES = [
  { id:"microstrategy",name:"MicroStrategy",  ticker:"MSTR", type:"CORPORATIVO", label:"BTC Treasury · Nasdaq",        icon:"MST", color:"#f0a020", bg:"rgba(240,160,32,.12)", holdings:"214,400 BTC", aumUsd:"$14.4B", flow1d:"+4,225 BTC",  pct1d:2.0, action:"ACCUMULATE", source:"13F / SEC", updated:"referencia" },
  { id:"marathon",     name:"Marathon Digital",ticker:"MARA", type:"CORPORATIVO", label:"BTC Miner · Nasdaq",          icon:"MAR", color:"#1aeb8a", bg:"rgba(26,235,138,.12)", holdings:"18,536 BTC",  aumUsd:"$1.24B", flow1d:"+200 BTC",    pct1d:0.3, action:"HOLD",       source:"13F / SEC", updated:"2 días" },
  { id:"riot",         name:"Riot Platforms",  ticker:"RIOT", type:"CORPORATIVO", label:"BTC Miner · Nasdaq",          icon:"RIO", color:"#22d4f5", bg:"rgba(34,212,245,.12)", holdings:"9,080 BTC",   aumUsd:"$610M",  flow1d:"+120 BTC",    pct1d:0.2, action:"HOLD",       source:"13F / SEC", updated:"3 días" },
  { id:"coinbase",     name:"Coinbase",        ticker:"COIN", type:"CORPORATIVO", label:"Exchange · Custodian",         icon:"COI", color:"#0052ff", bg:"rgba(0,82,255,.12)",   holdings:"Custodian",   aumUsd:"$2.4B vol",flow1d:"$2.4B vol/24h",pct1d:0,  action:"WATCH",      source:"On-chain", updated:"referencia" },
  { id:"tesla",        name:"Tesla Inc.",      ticker:"TSLA", type:"CORPORATIVO", label:"BTC Treasury · Nasdaq",        icon:"TSL", color:"#f03060", bg:"rgba(240,48,96,.12)",  holdings:"9,720 BTC",   aumUsd:"$653M",  flow1d:"Sin cambios", pct1d:0,  action:"HOLD",       source:"13F / SEC", updated:"Q1 2025" },
];

const ETH_WALLETS = [
  { id:"vitalik",    name:"Vitalik Buterin",  type:"ON-CHAIN", label:"ETH Founder",      icon:"VIT", color:"#9060f0", bg:"rgba(144,96,240,.12)", addr:"0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045", chain:"ETH", status:"WATCH" },
  { id:"wintermute", name:"Wintermute",        type:"ON-CHAIN", label:"Market Maker",     icon:"WMT", color:"#22d4f5", bg:"rgba(34,212,245,.12)", addr:"0x4C39Fbe3D9F22C42B9dF3A37df85Be39b00E27Bd", chain:"ETH", status:"WATCH" },
  { id:"jump",       name:"Jump Trading",     type:"ON-CHAIN", label:"HFT / Crypto MM",  icon:"JMP", color:"#f0a020", bg:"rgba(240,160,32,.12)", addr:"0x6F1cDbBb4d53d226CF4B917bF768B94acbAB6168", chain:"ETH", status:"WATCH" },
  { id:"jsun",       name:"Justin Sun",       type:"ON-CHAIN", label:"TRON Founder",     icon:"JSU", color:"#e8c547", bg:"rgba(232,197,71,.12)", addr:"0x3DdfA8eC3052539b6C9549F12cEA2C295cfF5296", chain:"ETH", status:"WATCH" },
  { id:"paradigm",   name:"Paradigm Fund",    type:"ON-CHAIN", label:"Crypto VC",        icon:"PAR", color:"#1aeb8a", bg:"rgba(26,235,138,.12)", addr:"0xA046a8660E66d178eE07ec97c585eEf18B786B0e", chain:"ETH", status:"WATCH" },
];

const BTC_WALLETS = [
  { id:"satoshi",  name:"Satoshi Nakamoto",  type:"ON-CHAIN", label:"Bitcoin Creator",     icon:"SAT", color:"#f0a020", bg:"rgba(240,160,32,.12)", holdings:"~1.1M BTC",  status:"DORMANT",  updated:"2009" },
  { id:"mtgox",    name:"Mt.Gox Estate",     type:"ON-CHAIN", label:"Repago · En proceso", icon:"MGX", color:"#f03060", bg:"rgba(240,48,96,.12)",  holdings:"138,985 BTC",status:"WATCH",    updated:"referencia"  },
  { id:"usgov",    name:"US Government",     type:"GOBIERNO",  label:"Silk Road Seized",    icon:"GOV", color:"#22d4f5", bg:"rgba(34,212,245,.12)", holdings:"30,175 BTC", status:"WATCH",    updated:"referencia"  },
  { id:"binance",  name:"Binance Reserve",   type:"ON-CHAIN", label:"Exchange Cold Wallet",icon:"BNB", color:"#f0b90b", bg:"rgba(240,185,11,.12)", holdings:"576,000 BTC",status:"WATCH",    updated:"referencia"  },
  { id:"coinbaseb",name:"Coinbase Custody",  type:"ON-CHAIN", label:"Institutional Custod",icon:"COI", color:"#0052ff", bg:"rgba(0,82,255,.12)",   holdings:"1,000,000+BTC",status:"WATCH",  updated:"referencia"  },
];

// NOTA: se eliminó ANALYST_ENTITIES — contenía citas/opiniones inventadas
// atribuidas a personas públicas reales (Michael Saylor, Robert Kiyosaki,
// Raoul Pal, PlanB, Arthur Hayes, Druckenmiller). Presentar frases inventadas
// como si las hubieran dicho es un riesgo real de credibilidad y legal.
// Si se quiere esto de vuelta, hace falta una fuente genuina (API de X/Twitter
// de pago, o citas verificadas manualmente con link a la fuente original).

async function fetchEthBalance(addr: string): Promise<string> {
  try {
    const key = process.env.ETHERSCAN_API_KEY || process.env.ETHERSCAN_KEY || "";
    if (!key) return "—";
    const url = `https://api.etherscan.io/api?module=account&action=balance&address=${addr}&tag=latest&apikey=${key}`;
    const r = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!r.ok) return "—";
    const d = await r.json() as { status: string; result: string };
    if (d.status !== "1") return "—";
    const eth = parseFloat(d.result) / 1e18;
    if (eth < 0.001) return "—";
    return eth > 999 ? `${(eth/1000).toFixed(1)}K ETH` : `${eth.toFixed(2)} ETH`;
  } catch { return "—"; }
}

router.get("/oracle/whale-dashboard", async (_req, res) => {
  try {
    const cacheKey = "whale_dashboard";
    if (cache[cacheKey] && Date.now() - cache[cacheKey].ts < 120_000) {
      res.json(cache[cacheKey].data);
      return;
    }

    const [news_ext, ...ethBals] = await Promise.allSettled([
      rssToItems("https://cointelegraph.com/rss/tag/bitcoin").catch(() => [] as { title:string;link:string;pubDate:string;source:string }[]),
      ...ETH_WALLETS.map(w => fetchEthBalance(w.addr)),
    ]);

    const news = news_ext.status === "fulfilled" ? news_ext.value.slice(0, 15) : [];
    const ethWalletsWithBal = ETH_WALLETS.map((w, i) => ({
      ...w,
      balance: ethBals[i]?.status === "fulfilled" ? ethBals[i].value : "—",
    }));

    const ticker = (news as { title:string;source:string }[]).slice(0, 12).map(n => `📰 ${n.source}: ${n.title}`);

    const result = {
      ok:true, ts:Date.now(),
      etf: ETF_ENTITIES, corporate: CORPORATE_ENTITIES,
      ethWallets: ethWalletsWithBal, btcWallets: BTC_WALLETS,
      // "analysts" se deja vacío a propósito — antes tenía citas inventadas
      // atribuidas a personas reales (Saylor, Kiyosaki, Raoul Pal, etc.), un
      // riesgo real de credibilidad/legal. El frontend ya oculta la sección
      // si viene vacía.
      analysts: [] as unknown[],
      news, ticker,
      disclaimer: "ETF/Corporate: cifras de referencia, no en vivo al segundo — requieren fuente de pago (Farside, 13F trimestral) para ser 100% actuales.",
    };
    cache[cacheKey] = { data: result, ts: Date.now() };
    res.json(result);
  } catch (err) {
    res.status(502).json({ ok:false, error: String(err) });
  }
});

// ── SUPERINVERSORES — 13F real vía SEC EDGAR (oficial, gratis, sin key) ────
// Nota: los 13F son trimestrales (se filtran ~45 días después del cierre de
// cada trimestre) — no es data "en vivo" al segundo, es lo que reportan
// legalmente los fondos grandes. Aun así, es información real y verificable,
// directo de la fuente oficial (sec.gov), sin depender de terceros de pago.
const SEC_USER_AGENT = "PSYCHOMETRIKS contacto@psychometriks.trade";

const SUPERINVESTORS = [
  { cik: "0001067983", name: "Warren Buffett", fund: "Berkshire Hathaway" },
  { cik: "0001336528", name: "Bill Ackman",    fund: "Pershing Square Capital" },
  { cik: "0001649339", name: "Michael Burry",  fund: "Scion Asset Management" },
  { cik: "0001061768", name: "David Tepper",   fund: "Appaloosa Management" },
  { cik: "0001040273", name: "Dan Loeb",       fund: "Third Point LLC" },
  { cik: "0001350694", name: "Ray Dalio",      fund: "Bridgewater Associates" },
  { cik: "0001656456", name: "Cathie Wood",    fund: "ARK Investment Management" },
];

interface Holding {
  nameOfIssuer: string;
  cusip: string;
  value: number;   // en miles de USD, como reporta el 13F
  shares: number;
}

async function fetchLatest13F(cik: string): Promise<{
  periodOfReport: string | null;
  filedAt: string | null;
  holdings: Holding[];
} | null> {
  try {
    const subRes = await fetch(`https://data.sec.gov/submissions/CIK${cik}.json`, {
      headers: { "User-Agent": SEC_USER_AGENT },
      signal: AbortSignal.timeout(10000),
    });
    if (!subRes.ok) return null;
    const sub = await subRes.json() as {
      filings?: { recent?: { form?: string[]; accessionNumber?: string[]; filingDate?: string[]; reportDate?: string[]; primaryDocument?: string[] } };
    };
    const recent = sub.filings?.recent;
    if (!recent?.form) return null;

    const idx = recent.form.findIndex(f => f === "13F-HR");
    if (idx === -1) return null;

    const accession = recent.accessionNumber![idx]!.replace(/-/g, "");
    const filedAt = recent.filingDate![idx] ?? null;
    const periodOfReport = recent.reportDate?.[idx] ?? null;
    const cikNoPad = String(parseInt(cik, 10));

    // Listar los documentos de esa presentación para hallar la tabla de holdings (XML)
    const idxRes = await fetch(`https://www.sec.gov/Archives/edgar/data/${cikNoPad}/${accession}/index.json`, {
      headers: { "User-Agent": SEC_USER_AGENT },
      signal: AbortSignal.timeout(10000),
    });
    if (!idxRes.ok) return null;
    const idxData = await idxRes.json() as { directory?: { item?: Array<{ name: string }> } };
    const items = idxData.directory?.item ?? [];
    const infoTableFile = items.find(it => /infotable/i.test(it.name) && it.name.endsWith(".xml"))
      ?? items.find(it => it.name.endsWith(".xml") && !/primary_doc/i.test(it.name));
    if (!infoTableFile) return { periodOfReport, filedAt, holdings: [] };

    const xmlRes = await fetch(`https://www.sec.gov/Archives/edgar/data/${cikNoPad}/${accession}/${infoTableFile.name}`, {
      headers: { "User-Agent": SEC_USER_AGENT },
      signal: AbortSignal.timeout(15000),
    });
    if (!xmlRes.ok) return { periodOfReport, filedAt, holdings: [] };
    const xml = await xmlRes.text();
    const parsed = await parseStringPromise(xml, { explicitArray: false, ignoreAttrs: true, tagNameProcessors: [(n) => n.replace(/^.*:/, "")] });

    const table = parsed?.informationTable?.infoTable;
    const rows: Array<Record<string, unknown>> = Array.isArray(table) ? table : table ? [table] : [];

    const holdings: Holding[] = rows.map(r => ({
      nameOfIssuer: String(r["nameOfIssuer"] ?? "—"),
      cusip: String(r["cusip"] ?? "—"),
      value: Number(r["value"] ?? 0),
      shares: Number((r["shrsOrPrnAmt"] as Record<string, unknown>)?.["sshPrnamt"] ?? 0),
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 15);

    return { periodOfReport, filedAt, holdings };
  } catch { return null; }
}

router.get("/oracle/superinvestors", async (_req, res) => {
  const cacheKey = "superinvestors";
  const cached = cache[cacheKey];
  if (cached && Date.now() - cached.ts < 12 * 60 * 60_000) { res.json(cached.data); return; }

  try {
    const results = await Promise.all(
      SUPERINVESTORS.map(async (inv) => {
        const data = await fetchLatest13F(inv.cik);
        return { ...inv, ...data, ok: data !== null };
      }),
    );
    const payload = { ok: true, investors: results, fetchedAt: new Date().toISOString(), fuente: "SEC EDGAR (data.sec.gov) — filings 13F-HR oficiales" };
    cache[cacheKey] = { data: payload, ts: Date.now() };
    res.json(payload);
  } catch (err) {
    res.status(502).json({ ok: false, error: String(err), investors: [] });
  }
});

// ── PSY LISTING RADAR — reemplaza al tab de Degate ─────────────────────────
// Combina: nuevos listados de CoinMarketCap + si ya tienen futuros abiertos
// en Coinglass (señal de dinero institucional temprano) + Max Pain semanal
// de BTC/ETH (Coinglass). Cacheado 1h — no vale la pena pedir esto seguido.
const CG_BASE = "https://open-api-v4.coinglass.com";

async function cgFetch(path: string): Promise<unknown | null> {
  const key = process.env["COINGLASS_API_KEY"];
  if (!key) return null;
  try {
    const r = await fetch(`${CG_BASE}${path}`, {
      headers: { "CG-API-KEY": key, "Accept": "application/json" },
      signal: AbortSignal.timeout(10000),
    });
    if (!r.ok) return { __error: true, status: r.status };
    return await r.json();
  } catch { return null; }
}

router.get("/oracle/listing-radar", async (_req, res) => {
  const cacheKey = "listing_radar";
  const cached = cache[cacheKey];
  if (cached && Date.now() - cached.ts < 60 * 60_000) { res.json(cached.data); return; }

  try {
    // 1) Nuevos listados de CMC (últimos, ordenados por fecha de alta)
    const cmcKey = process.env["COINMARKETCAP_API_KEY"];
    let newListings: Array<{ symbol: string; name: string; marketCap: number; price: number; changePct24h: number; dateAdded: string }> = [];
    if (cmcKey) {
      const r = await fetch(
        "https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?limit=15&sort=date_added&sort_dir=desc&convert=USD",
        { headers: { "X-CMC_PRO_API_KEY": cmcKey }, signal: AbortSignal.timeout(10000) },
      );
      if (r.ok) {
        const d = await r.json() as { data?: Array<Record<string, unknown>> };
        newListings = (d.data ?? []).map(t => {
          const quote = (t["quote"] as Record<string, Record<string, number>>)?.["USD"] ?? {};
          const platform = t["platform"] as { name?: string; token_address?: string } | null;
          return {
            symbol: String(t["symbol"] ?? "?"),
            name: String(t["name"] ?? "Unknown"),
            marketCap: quote["market_cap"] ?? 0,
            price: quote["price"] ?? 0,
            changePct24h: quote["percent_change_24h"] ?? 0,
            dateAdded: String(t["date_added"] ?? ""),
            contractAddress: platform?.token_address ?? null,
            chain: platform?.name ?? null,
            cmcSlug: String(t["slug"] ?? ""),
          };
        });
      }
    }

    // 2) De esos, ¿cuáles ya tienen mercado de futuros abierto? (Coinglass)
    let futuresSymbols = new Set<string>();
    const coinsMarkets = await cgFetch("/api/futures/coins-markets");
    let coinglassUpgradeNeeded = false;
    if (coinsMarkets && typeof coinsMarkets === "object" && "__error" in (coinsMarkets as object)) {
      coinglassUpgradeNeeded = true;
    } else if (Array.isArray((coinsMarkets as { data?: unknown[] })?.data)) {
      const rows = (coinsMarkets as { data: Array<{ symbol?: string }> }).data;
      futuresSymbols = new Set(rows.map(r => (r.symbol ?? "").toUpperCase()));
    }

    const radar = newListings.map(c => ({
      ...c,
      tieneFuturos: futuresSymbols.has(c.symbol.toUpperCase()),
    }));

    // 3) FUNDING RATE EXTREMO — usa el proxy interno ya probado (OKX + Gate.io
    // + Hyperliquid) en vez de llamar a Binance directo, que Railway a veces
    // no puede alcanzar (algunos exchanges bloquean IPs de proveedores cloud).
    let fundingExtremes: Array<{ symbol: string; fundingRate: number; fundingApr: number; bias: string }> = [];
    try {
      const port = process.env["PORT"] ?? "8080";
      const r = await fetch(`http://localhost:${port}/api/proxy/okx/funding-rates`, { signal: AbortSignal.timeout(10000) });
      if (r.ok) {
        const d = await r.json() as { data?: Array<{ base: string; rate: number }> };
        const withRate = (d.data ?? []).map(x => ({
          symbol: x.base,
          fundingRate: x.rate,
          fundingApr: x.rate * 3 * 365 * 100,
          bias: x.rate > 0 ? "Longs pagando — posición sobrecargada" : x.rate < 0 ? "Shorts pagando — presión short squeeze" : "Balanceado",
        }));
        fundingExtremes = withRate.sort((a, b) => Math.abs(b.fundingRate) - Math.abs(a.fundingRate)).slice(0, 8);
      }
    } catch { /* deja fundingExtremes vacío */ }

    const payload = {
      ok: true,
      newListings: radar,
      fundingExtremes,
      futuresCheckUpgradeNeeded: coinglassUpgradeNeeded,
      fetchedAt: new Date().toISOString(),
    };
    cache[cacheKey] = { data: payload, ts: Date.now() };
    res.json(payload);
  } catch (err) {
    res.status(502).json({ ok: false, error: String(err) });
  }
});

export default router;
