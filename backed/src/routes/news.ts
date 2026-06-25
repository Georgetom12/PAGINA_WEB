import { Router, Request, Response } from "express";

const router = Router();

export interface NewsItem {
  title: string;
  link: string;
  source: string;
  type: "crypto" | "stocks";
  publishedAt: string;
  description?: string;
}

interface NewsCache {
  crypto: NewsItem[];
  stocks: NewsItem[];
  lastFetch: number;
}

const _cache: NewsCache = { crypto: [], stocks: [], lastFetch: 0 };
const CACHE_TTL = 10 * 60 * 1000;

const CRYPTO_FEEDS = [
  { url: "https://www.coindesk.com/arc/outboundfeeds/rss/", source: "CoinDesk" },
  { url: "https://cointelegraph.com/rss", source: "CoinTelegraph" },
  { url: "https://decrypt.co/feed", source: "Decrypt" },
  { url: "https://bitcoinmagazine.com/.rss/full/", source: "Bitcoin Mag" },
  { url: "https://cryptopanic.com/news/rss/", source: "CryptoPanic" },
  { url: "https://www.theblock.co/rss.xml", source: "The Block" },
];

const STOCKS_FEEDS = [
  { url: "https://feeds.reuters.com/reuters/businessNews", source: "Reuters" },
  { url: "https://finance.yahoo.com/news/rssindex", source: "Yahoo Finance" },
  { url: "https://www.cnbc.com/id/100003114/device/rss/rss.html", source: "CNBC Markets" },
  { url: "https://www.cnbc.com/id/10000664/device/rss/rss.html", source: "CNBC Economy" },
  { url: "https://www.investing.com/rss/news_25.rss", source: "Investing.com" },
  { url: "https://feeds.content.dowjones.io/public/rss/mw_realtimeheadlines", source: "MarketWatch" },
];

function stripCDATA(s: string): string {
  return s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim();
}

function stripHtml(s: string): string {
  return s
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#8216;/g, "\u2018")
    .replace(/&#8217;/g, "\u2019")
    .replace(/&#8220;/g, "\u201c")
    .replace(/&#8221;/g, "\u201d")
    .replace(/&#8211;/g, "\u2013")
    .replace(/&#8212;/g, "\u2014")
    .replace(/&#8230;/g, "\u2026")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
    .replace(/\s+/g, " ")
    .trim();
}

function parseRss(xml: string, source: string, type: "crypto" | "stocks"): NewsItem[] {
  const items = xml.match(/<item>([\s\S]*?)<\/item>/g) ?? [];
  return items
    .slice(0, 10)
    .map((item) => {
      const title = stripHtml(stripCDATA(item.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? ""));
      const rawLink = stripHtml(item.match(/<link>([\s\S]*?)<\/link>/)?.[1] ?? "").trim();
      const pubDate = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1]?.trim() ?? "";
      const rawDesc = item.match(/<description>([\s\S]*?)<\/description>/)?.[1] ?? "";
      const description = stripHtml(stripCDATA(rawDesc)).slice(0, 220);
      return {
        title,
        link: rawLink && rawLink.startsWith("http") ? rawLink : "#",
        source,
        type,
        publishedAt: pubDate || new Date().toISOString(),
        description,
      };
    })
    .filter((item) => item.title.length > 8);
}

async function fetchFeed(
  url: string,
  source: string,
  type: "crypto" | "stocks"
): Promise<NewsItem[]> {
  try {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; PSYCHOMETRIKS/1.0; +https://psychometriks.app)",
        Accept: "application/rss+xml, application/xml, text/xml, */*",
      },
    });
    clearTimeout(tid);
    if (!res.ok) return [];
    const xml = await res.text();
    return parseRss(xml, source, type);
  } catch {
    return [];
  }
}

const FALLBACK_CRYPTO: NewsItem[] = [
  {
    title: "Bitcoin se consolida sobre soporte clave mientras institucionales acumulan",
    link: "#",
    source: "PSY Intel",
    type: "crypto",
    publishedAt: new Date().toISOString(),
    description: "El mercado cripto muestra signos de acumulación institucional en niveles de soporte clave.",
  },
  {
    title: "Ethereum activa FVG semanal — potencial reversión alcista en desarrollo",
    link: "#",
    source: "PSY Intel",
    type: "crypto",
    publishedAt: new Date().toISOString(),
    description: "ETH completa mitigación de order block en temporalidad 4H con señales de absorción.",
  },
  {
    title: "Funding rate neutral en BTC: mercado sin sobreposicionamiento",
    link: "#",
    source: "PSY Intel",
    type: "crypto",
    publishedAt: new Date().toISOString(),
    description: "Tasas de financiamiento en rango neutro sugieren movimiento direccional próximo.",
  },
  {
    title: "Liquidaciones cripto superan $200M — shorts atrapados en rally nocturno",
    link: "#",
    source: "PSY Intel",
    type: "crypto",
    publishedAt: new Date().toISOString(),
    description: "Cascada de short liquidations durante sesión asiática despeja el camino al alza.",
  },
  {
    title: "DeFi TVL rompe resistencia de $120B — ecosistema on-chain en expansión",
    link: "#",
    source: "PSY Intel",
    type: "crypto",
    publishedAt: new Date().toISOString(),
    description: "Total Value Locked en protocolos DeFi alcanza máximos del año con flujos netos positivos.",
  },
];

const FALLBACK_STOCKS: NewsItem[] = [
  {
    title: "S&P 500 cierra positivo liderado por sector tecnológico y semiconductores",
    link: "#",
    source: "PSY Intel",
    type: "stocks",
    publishedAt: new Date().toISOString(),
    description: "Índice americano extiende racha alcista con volumen superior al promedio de 20 días.",
  },
  {
    title: "DXY bajo presión: dólar cede terreno ante expectativas de recorte Fed",
    link: "#",
    source: "PSY Intel",
    type: "stocks",
    publishedAt: new Date().toISOString(),
    description: "El índice del dólar retrocede a soporte de 103 mientras mercados descuentan pausa de la Fed.",
  },
  {
    title: "NVIDIA supera estimaciones: EPS de $6.12 vs $5.90 esperado por el mercado",
    link: "#",
    source: "PSY Intel",
    type: "stocks",
    publishedAt: new Date().toISOString(),
    description: "Las 7 Magníficas lideran el rally del Nasdaq con NVDA subiendo +8% afterhours.",
  },
  {
    title: "VIX cae a 15 — mercado en modo complacencia antes de datos de empleo",
    link: "#",
    source: "PSY Intel",
    type: "stocks",
    publishedAt: new Date().toISOString(),
    description: "Índice de volatilidad en mínimos sugiere posicionamiento alcista pero riesgo de reversión.",
  },
  {
    title: "Fed mantiene tasas en 4.25% — próxima reunión con datos de inflación como clave",
    link: "#",
    source: "PSY Intel",
    type: "stocks",
    publishedAt: new Date().toISOString(),
    description: "Powell mantiene tono hawkish pero mercados descuentan dos recortes antes de fin de año.",
  },
];

async function refreshCache(): Promise<void> {
  const [cryptoResults, stocksResults] = await Promise.all([
    Promise.all(CRYPTO_FEEDS.map((f) => fetchFeed(f.url, f.source, "crypto"))),
    Promise.all(STOCKS_FEEDS.map((f) => fetchFeed(f.url, f.source, "stocks"))),
  ]);

  const sortByDate = (a: NewsItem, b: NewsItem) => {
    const da = new Date(a.publishedAt).getTime() || 0;
    const db = new Date(b.publishedAt).getTime() || 0;
    return db - da;
  };

  const cryptoRaw = cryptoResults.flat().sort(sortByDate);
  const stocksRaw = stocksResults.flat().sort(sortByDate);

  _cache.crypto = cryptoRaw.length >= 3 ? cryptoRaw : [...cryptoRaw, ...FALLBACK_CRYPTO].slice(0, 20);
  _cache.stocks = stocksRaw.length >= 3 ? stocksRaw : [...stocksRaw, ...FALLBACK_STOCKS].slice(0, 20);
  _cache.lastFetch = Date.now();
}

export async function getNews(): Promise<NewsCache> {
  const stale = Date.now() - _cache.lastFetch > CACHE_TTL;
  const empty = _cache.crypto.length === 0 && _cache.stocks.length === 0;
  if (stale || empty) {
    await refreshCache();
  }
  return _cache;
}

router.get("/news", async (req: Request, res: Response) => {
  const type = (req.query["type"] as string) ?? "crypto";
  const news = await getNews();
  const items = type === "stocks" ? news.stocks : news.crypto;
  res.json({ ok: true, items, cachedAt: new Date(_cache.lastFetch).toISOString(), total: items.length });
});

router.get("/news/context", async (_req: Request, res: Response) => {
  const news = await getNews();
  const lines: string[] = [
    ...news.crypto.slice(0, 6).map((n) => `[CRYPTO] ${n.title} — ${n.source}`),
    ...news.stocks.slice(0, 6).map((n) => `[BOLSA/MACRO] ${n.title} — ${n.source}`),
  ];
  res.json({ ok: true, headlines: lines.join("\n"), cachedAt: new Date(_cache.lastFetch).toISOString() });
});

export default router;
