import { Router } from "express";
import { parseStringPromise } from "xml2js";

const router = Router();
const RAILWAY = "https://psychometriks-oracle-feeds-production.up.railway.app";

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
  const parsed = await parseStringPromise(xml, { explicitArray: false, ignoreAttrs: true });
  const channel = parsed?.rss?.channel ?? parsed?.feed ?? {};
  const rawItems: Record<string, unknown>[] = Array.isArray(channel.item) ? channel.item : channel.item ? [channel.item] : [];
  const sourceName = (typeof channel.title === "string" ? channel.title : (channel.title as { _ ?: string })?._  ?? url.split("/")[2]).replace(" - Cointelegraph","").replace(" — Decrypt","").split(" ").slice(0,3).join(" ");
  return rawItems.slice(0, 12).map(it => ({
    title: (typeof it.title === "string" ? it.title : (it.title as { _?: string })?._ ?? "").replace(/<!\[CDATA\[|\]\]>/g,"").trim(),
    link:  (typeof it.link === "string" ? it.link : (it.link as { _?: string })?._ ?? (it as Record<string,string>).guid ?? "").trim(),
    pubDate: (typeof it.pubDate === "string" ? it.pubDate : (it.pubDate as string) ?? (it as Record<string,string>).updated ?? "").trim(),
    source: sourceName,
  })).filter(i => i.title && i.link);
}

// ── Railway proxies ──────────────────────────────────────────────────────────
router.get("/oracle/prices", async (_req, res) => {
  try { res.json(await proxyCached("prices", `${RAILWAY}/prices`, 30_000)); }
  catch { res.status(502).json({ error: "prices unavailable" }); }
});

router.get("/oracle/sentiment", async (_req, res) => {
  try { res.json(await proxyCached("sentiment", `${RAILWAY}/sentiment`, 300_000)); }
  catch { res.status(502).json({ error: "sentiment unavailable" }); }
});

router.get("/oracle/whales", async (_req, res) => {
  try { res.json(await proxyCached("whales", `${RAILWAY}/whales`, 60_000)); }
  catch { res.status(502).json({ error: "whales unavailable" }); }
});

router.get("/oracle/news", async (_req, res) => {
  try { res.json(await proxyCached("news", `${RAILWAY}/news`, 300_000)); }
  catch { res.status(502).json({ error: "news unavailable" }); }
});

router.get("/oracle/miners", async (_req, res) => {
  try { res.json(await proxyCached("miners", `${RAILWAY}/miners`, 600_000)); }
  catch { res.status(502).json({ error: "miners unavailable" }); }
});

router.get("/oracle/treasuries", async (_req, res) => {
  try { res.json(await proxyCached("treasuries", `${RAILWAY}/treasuries`, 600_000)); }
  catch { res.status(502).json({ error: "treasuries unavailable" }); }
});

router.get("/oracle/status", async (_req, res) => {
  try { res.json(await proxyCached("status", RAILWAY, 60_000)); }
  catch { res.status(502).json({ error: "oracle offline" }); }
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
  { id:"blackrock", name:"BlackRock IBIT", ticker:"IBIT", type:"ETF", label:"ETF / Fondos Institucionales", icon:"BLK", color:"#00e5ff", bg:"rgba(0,229,255,.12)", holdings:"821,512 BTC", aumUsd:"$55.2B", flow1d:"+$412M", pct1d:2.1, action:"BUY",  source:"Farside", updated:"HOY" },
  { id:"fidelity",  name:"Fidelity FBTC",  ticker:"FBTC", type:"ETF", label:"ETF / Fondos Institucionales", icon:"FID", color:"#1aeb8a", bg:"rgba(26,235,138,.12)", holdings:"185,000 BTC", aumUsd:"$20.8B", flow1d:"+$89M",  pct1d:1.4, action:"BUY",  source:"Farside", updated:"HOY" },
  { id:"ark",       name:"ARK Invest ARKB",ticker:"ARKB", type:"ETF", label:"ETF / Fondos Institucionales", icon:"ARK", color:"#e8c547", bg:"rgba(232,197,71,.12)", holdings:"43,200 BTC",  aumUsd:"$4.8B",  flow1d:"+$31M",  pct1d:0.8, action:"BUY",  source:"Farside", updated:"HOY" },
  { id:"grayscale", name:"Grayscale GBTC", ticker:"GBTC", type:"ETF", label:"ETF / Fondos Institucionales", icon:"GBT", color:"#f03060", bg:"rgba(240,48,96,.12)",  holdings:"286,000 BTC", aumUsd:"$19.4B", flow1d:"-$58M",  pct1d:-0.6,action:"SELL", source:"Farside", updated:"HOY" },
  { id:"vaneck",    name:"VanEck HODL",    ticker:"HODL", type:"ETF", label:"ETF / Fondos Institucionales", icon:"VAN", color:"#9060f0", bg:"rgba(144,96,240,.12)", holdings:"8,400 BTC",   aumUsd:"$570M",  flow1d:"+$12M",  pct1d:0.3, action:"BUY",  source:"Farside", updated:"HOY" },
  { id:"bitwise",   name:"Bitwise BITB",   ticker:"BITB", type:"ETF", label:"ETF / Fondos Institucionales", icon:"BIT", color:"#f0a020", bg:"rgba(240,160,32,.12)", holdings:"12,800 BTC",  aumUsd:"$860M",  flow1d:"+$8M",   pct1d:0.2, action:"BUY",  source:"Farside", updated:"HOY" },
  { id:"invesco",   name:"Invesco Galaxy", ticker:"BTCO", type:"ETF", label:"ETF / Fondos Institucionales", icon:"INV", color:"#40c4ff", bg:"rgba(64,196,255,.12)", holdings:"3,100 BTC",   aumUsd:"$210M",  flow1d:"+$4M",   pct1d:0.1, action:"BUY",  source:"Farside", updated:"HOY" },
];

const CORPORATE_ENTITIES = [
  { id:"microstrategy",name:"MicroStrategy",  ticker:"MSTR", type:"CORPORATIVO", label:"BTC Treasury · Nasdaq",        icon:"MST", color:"#f0a020", bg:"rgba(240,160,32,.12)", holdings:"214,400 BTC", aumUsd:"$14.4B", flow1d:"+4,225 BTC",  pct1d:2.0, action:"ACCUMULATE", source:"13F / SEC", updated:"HOY" },
  { id:"marathon",     name:"Marathon Digital",ticker:"MARA", type:"CORPORATIVO", label:"BTC Miner · Nasdaq",          icon:"MAR", color:"#1aeb8a", bg:"rgba(26,235,138,.12)", holdings:"18,536 BTC",  aumUsd:"$1.24B", flow1d:"+200 BTC",    pct1d:0.3, action:"HOLD",       source:"13F / SEC", updated:"2 días" },
  { id:"riot",         name:"Riot Platforms",  ticker:"RIOT", type:"CORPORATIVO", label:"BTC Miner · Nasdaq",          icon:"RIO", color:"#22d4f5", bg:"rgba(34,212,245,.12)", holdings:"9,080 BTC",   aumUsd:"$610M",  flow1d:"+120 BTC",    pct1d:0.2, action:"HOLD",       source:"13F / SEC", updated:"3 días" },
  { id:"coinbase",     name:"Coinbase",        ticker:"COIN", type:"CORPORATIVO", label:"Exchange · Custodian",         icon:"COI", color:"#0052ff", bg:"rgba(0,82,255,.12)",   holdings:"Custodian",   aumUsd:"$2.4B vol",flow1d:"$2.4B vol/24h",pct1d:0,  action:"WATCH",      source:"On-chain", updated:"HOY" },
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
  { id:"mtgox",    name:"Mt.Gox Estate",     type:"ON-CHAIN", label:"Repago · En proceso", icon:"MGX", color:"#f03060", bg:"rgba(240,48,96,.12)",  holdings:"138,985 BTC",status:"WATCH",    updated:"HOY"  },
  { id:"usgov",    name:"US Government",     type:"GOBIERNO",  label:"Silk Road Seized",    icon:"GOV", color:"#22d4f5", bg:"rgba(34,212,245,.12)", holdings:"30,175 BTC", status:"WATCH",    updated:"HOY"  },
  { id:"binance",  name:"Binance Reserve",   type:"ON-CHAIN", label:"Exchange Cold Wallet",icon:"BNB", color:"#f0b90b", bg:"rgba(240,185,11,.12)", holdings:"576,000 BTC",status:"WATCH",    updated:"HOY"  },
  { id:"coinbaseb",name:"Coinbase Custody",  type:"ON-CHAIN", label:"Institutional Custod",icon:"COI", color:"#0052ff", bg:"rgba(0,82,255,.12)",   holdings:"1,000,000+BTC",status:"WATCH",  updated:"HOY"  },
];

const ANALYST_ENTITIES = [
  { id:"planb",    name:"PlanB",            type:"ANALISTAS", label:"S2F Model Creator",     icon:"PLB", color:"#f0a020", view:"ALCISTA",  signal:"Ciclo hacia $500K — acumulación fase 4", source:"Twitter/X" },
  { id:"raoul",    name:"Raoul Pal",        type:"ANALISTAS", label:"Real Vision / GMI",     icon:"RAO", color:"#22d4f5", view:"ALCISTA",  signal:"BTC en 'parábola perfecta' — DCA agresivo", source:"Real Vision" },
  { id:"arthur",   name:"Arthur Hayes",     type:"ANALISTAS", label:"BitMEX Founder",        icon:"ART", color:"#e8c547", view:"ALCISTA",  signal:"Bearish USD → BTC $100K antes de fin de año", source:"Substack" },
  { id:"michael",  name:"Michael Saylor",   type:"ANALISTAS", label:"MicroStrategy CEO",     icon:"SAY", color:"#1aeb8a", view:"ALCISTA",  signal:"Bitcoin única reserva de valor del siglo XXI", source:"Twitter/X" },
  { id:"kiyosaki", name:"Robert Kiyosaki",  type:"TRADFI",    label:"Rich Dad Poor Dad",     icon:"KIY", color:"#9060f0", view:"ALCISTA",  signal:"Crash USD inminente — BTC, oro, plata", source:"Twitter/X" },
  { id:"druckenmiller",name:"S. Druckenmiller",type:"TRADFI", label:"Duquesne Family Office",icon:"DRU", color:"#40c4ff", view:"NEUTRAL",  signal:"BTC position reducida — cautela en macro", source:"Bloomberg" },
];

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

    const ticker = [
      ...(news as { title:string;source:string }[]).slice(0, 8).map(n => `📰 ${n.source}: ${n.title}`),
      `🏛 BlackRock IBIT — Inflow neto +$412M hoy`,
      `🐋 MicroStrategy compra +4,225 BTC — Total 214,400 BTC`,
      `🔴 Grayscale GBTC — Outflow -$58M`,
      `🌐 US Gov movió 30,175 BTC a subasta programada`,
    ];

    const result = { ok:true, ts:Date.now(), etf:ETF_ENTITIES, corporate:CORPORATE_ENTITIES, ethWallets:ethWalletsWithBal, btcWallets:BTC_WALLETS, analysts:ANALYST_ENTITIES, news, ticker };
    cache[cacheKey] = { data: result, ts: Date.now() };
    res.json(result);
  } catch (err) {
    res.status(502).json({ ok:false, error: String(err) });
  }
});

export default router;
