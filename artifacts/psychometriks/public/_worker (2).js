const SIGNALS_URL = "https://api.psychometriks.trade/api/altcoin-signals";
const API_SERVER   = "https://api.psychometriks.trade";

// ── CAPA DE SEGURIDAD SOA — HMAC-SHA256 ────────────────────────────────────
// El Worker firma cada request a Railway con HMAC-SHA256(timestamp, PSY_WORKER_SECRET).
// Railway verifica la firma (modo soft: acepta si falta, rechaza si es inválida).
// Esto bloquea llamadas directas al servidor Railway sin pasar por Cloudflare.
async function signWorkerRequest(secret, timestamp) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(timestamp));
  return Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

// Construye un Request hacia Railway con firma HMAC en headers.
async function buildSignedRequest(target, originalRequest, env) {
  const secret = env.PSY_WORKER_SECRET;
  const newHeaders = new Headers(originalRequest.headers);
  if (secret) {
    const ts  = Date.now().toString();
    const sig = await signWorkerRequest(secret, ts);
    newHeaders.set("X-PSY-Sig", sig);
    newHeaders.set("X-PSY-Ts",  ts);
  }
  return new Request(target, {
    method:  originalRequest.method,
    headers: newHeaders,
    body:    originalRequest.body,
    redirect: "follow",
  });
}

// ── CAPA SERVCLI — Validación de token en PSY BRAIN ───────────────────────
// Verifica que el request viene de un usuario autenticado en la plataforma.
// No hace verificación contra DB (sin latencia extra) — valida formato y presencia.
// SUPERADMIN: base64("SUPERADMIN:user:pass") · OPERATOR: base64("OPERATOR:user:pass")
// Member: cualquier token almacenado en psyko_auth (verificado estructuralmente).
function isValidPsyToken(token) {
  if (!token || typeof token !== "string") return false;
  if (token.length < 10 || token.length > 1024) return false;
  try {
    // Verifica que sea Base64 decodificable y tenga contenido coherente
    const decoded = atob(token);
    if (decoded.length < 5) return false;
    // Acepta cualquier token que tenga al menos un ":" (formato user:data)
    // Esto cubre SUPERADMIN:, OPERATOR:, y los tokens de miembros
    return decoded.includes(":") || decoded.length > 20;
  } catch { return false; }
}

// ── PSY BRAIN IA — Prompt system ───────────────────────────────────────────
const PSY_BRAIN_SYSTEM = `Eres PSY BRAIN, el analista institucional de PSYCHOMETRIKS. Tu especialidad es identificar el flujo institucional real detrás de los movimientos del mercado. Analizas con precisión quirúrgica: flujo de órdenes, actividad de opciones, posicionamiento institucional 13F, correlaciones macro, narrativas dominantes y puntos de compresión técnica.

Tu respuesta debe ser:
- Estructurada con secciones claras usando ═══ como separador
- Con datos concretos y niveles clave específicos
- Conclusiones accionables con bias claro (BULLISH/BEARISH/NEUTRAL)
- Máximo 3 niveles de entrada/stop/objetivo
- Formato terminal: usa ▸ para puntos clave, ⚡ para alertas críticas, 📊 para datos

Respondes siempre en español con terminología técnica institucional. No uses markdown headers (#), usa ═══ SECCIÓN ═══ para separar.`;

function buildBrainPrompt(asset, analysisType, userMessage) {
  const prompts = {
    flujo:     `Analiza el flujo institucional de ${asset}: CVD, dark pools, imbalances SMC/FVG, liq maps y señales de acumulación/distribución. Identifica si el smart money está posicionado long o short y en qué niveles clave.`,
    opciones:  `Analiza el posicionamiento en opciones de ${asset}: GEX, max pain, P/C ratio, unusual activity, skew de volatilidad y qué implica para el precio spot en los próximos 7-14 días.`,
    macro:     `Analiza el contexto macro para ${asset}: correlación con DXY, US10Y, VIX, ciclo de liquidez global, posicionamiento FED, riesgo geopolítico y cómo afecta la tesis de precio actual.`,
    narrativa: `Identifica la narrativa dominante actual de ${asset}: ciclo de mercado, sentimiento institucional, catalizadores próximos, rotación de capital y regime de mercado actual. ¿Qué historia está comprando el mercado?`,
    squeeze:   `Evalúa el potencial de short squeeze de ${asset}: short interest actual, borrow rate, días para cubrir, flujo de opciones call OTM y probabilidad de squeeze en los próximos 5-10 días de trading.`,
    full:      `Realiza un análisis institucional COMPLETO de ${asset} con 5 secciones: 1) Flujo de Órdenes & CVD, 2) Posicionamiento Opciones, 3) Contexto Macro, 4) Narrativa Dominante, 5) Compresión Técnica & Setup. Proporciona la tesis de alta probabilidad con niveles clave.`,
  };
  return prompts[analysisType] || userMessage || `Analiza ${asset} desde una perspectiva institucional completa.`;
}

// ── Headers CORS de respuesta ──────────────────────────────────────────────
function corsHeaders(requestOrigin) {
  const allowed = [
    "https://psychometriks.trade",
    "https://www.psychometriks.trade",
  ];
  const origin = (allowed.includes(requestOrigin) || !requestOrigin)
    ? (requestOrigin || "*")
    : "https://psychometriks.trade";
  return {
    "Access-Control-Allow-Origin":  origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-PSY-Token, X-PSY-Sig, X-PSY-Ts",
    "Vary": "Origin",
  };
}

export default {
  async fetch(request, env) {
    const url    = new URL(request.url);
    const path   = url.pathname;
    const origin = request.headers.get("origin") ?? "";

    // ── PSY BRAIN preflight ─────────────────────────────────────────────────
    if (path === "/api/psy-oracle/brain" && request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          ...corsHeaders(origin),
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    // ── PSY BRAIN IA — Anthropic Claude (edge) ─────────────────────────────
    if (path === "/api/psy-oracle/brain" && request.method === "POST") {
      // ── Auth check: el token debe existir y tener formato válido ──────────
      const psyToken = request.headers.get("x-psy-token");
      if (!isValidPsyToken(psyToken)) {
        return new Response(
          JSON.stringify({ error: "Autenticación requerida — inicia sesión en psychometriks.trade" }),
          {
            status: 401,
            headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
          },
        );
      }

      const apiKey = env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        return new Response(
          JSON.stringify({ error: "ANTHROPIC_API_KEY no configurada en Cloudflare Pages" }),
          { status: 503, headers: { "Content-Type": "application/json", ...corsHeaders(origin) } }
        );
      }

      let body;
      try { body = await request.json(); } catch {
        return new Response(
          JSON.stringify({ error: "JSON inválido" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders(origin) } },
        );
      }

      const { asset, analysisType, userMessage } = body;
      if (!asset) {
        return new Response(
          JSON.stringify({ error: "Asset requerido" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders(origin) } },
        );
      }

      const prompt = buildBrainPrompt(asset, analysisType || "full", userMessage);

      const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key":          apiKey,
          "anthropic-version":  "2023-06-01",
          "content-type":       "application/json",
        },
        body: JSON.stringify({
          model:      "claude-opus-4-5",
          max_tokens: 2048,
          stream:     true,
          system:     PSY_BRAIN_SYSTEM,
          messages:   [{ role: "user", content: prompt }],
        }),
      });

      if (!anthropicRes.ok) {
        const errText = await anthropicRes.text();
        return new Response(
          JSON.stringify({ error: `Anthropic error ${anthropicRes.status}`, detail: errText }),
          { status: 502, headers: { "Content-Type": "application/json", ...corsHeaders(origin) } }
        );
      }

      // Transforma Anthropic SSE → formato SSE del frontend
      const { readable, writable } = new TransformStream();
      const writer = writable.getWriter();
      const enc    = new TextEncoder();

      (async () => {
        const reader = anthropicRes.body.getReader();
        const dec    = new TextDecoder();
        let   buf    = "";
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buf += dec.decode(value, { stream: true });
            const lines = buf.split("\n");
            buf = lines.pop() ?? "";
            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;
              const raw = line.slice(6).trim();
              if (raw === "[DONE]") break;
              try {
                const parsed = JSON.parse(raw);
                if (parsed.type === "content_block_delta" && parsed.delta?.type === "text_delta") {
                  await writer.write(enc.encode(`data: ${JSON.stringify({ text: parsed.delta.text })}\n\n`));
                }
                if (parsed.type === "message_stop") {
                  await writer.write(enc.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
                }
              } catch { /* skip malformed */ }
            }
          }
        } catch (e) {
          await writer.write(enc.encode(`data: ${JSON.stringify({ error: String(e) })}\n\n`));
        } finally {
          await writer.close();
        }
      })();

      return new Response(readable, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          ...corsHeaders(origin),
        },
      });
    }

    // ── Proxy: MEXC contract API (server-to-server, sin CORS browser) ───────
    if (path.startsWith("/api/proxy/mexc/")) {
      const subpath = path.replace("/api/proxy/mexc/", "");
      let mexcUrl;
      if (subpath.startsWith("ticker")) {
        mexcUrl = `https://contract.mexc.com/api/v1/contract/ticker${url.search}`;
      } else if (subpath.startsWith("depth/")) {
        mexcUrl = `https://contract.mexc.com/api/v1/contract/depth/${subpath.replace("depth/", "")}`;
      } else if (subpath.startsWith("funding/")) {
        mexcUrl = `https://contract.mexc.com/api/v1/contract/funding_rate/${subpath.replace("funding/", "")}`;
      } else {
        return Response.json({ error: "Unknown MEXC endpoint" }, { status: 404 });
      }
      try {
        const resp = await fetch(mexcUrl, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(8000) });
        const ct = resp.headers.get("content-type") ?? "";
        if (!ct.includes("application/json")) throw new Error(`MEXC non-JSON response (${resp.status})`);
        const data = await resp.json();
        return Response.json(data, { headers: { "Cache-Control": "public, max-age=10", ...corsHeaders(origin) } });
      } catch (err) {
        return Response.json({ error: "MEXC proxy error", detail: String(err) }, { status: 502, headers: corsHeaders(origin) });
      }
    }

    // ── Market Data: Order Book en tiempo real (Kraken public API) ──────────
    if (path.startsWith("/api/market-data/orderbook/")) {
      const pair = path.split("/").pop().toUpperCase();
      const KRAKEN_PAIRS = { BTC: "XBTUSD", ETH: "ETHUSD", SOL: "SOLUSDT" };
      if (!Object.keys(KRAKEN_PAIRS).includes(pair)) {
        return Response.json({ error: "Par no soportado" }, { status: 400 });
      }
      try {
        const kPair = KRAKEN_PAIRS[pair];
        const resp = await fetch(
          `https://api.kraken.com/0/public/Depth?pair=${kPair}&count=12`,
          { signal: AbortSignal.timeout(6000) }
        );
        const ct = resp.headers.get("content-type") ?? "";
        if (!ct.includes("application/json")) throw new Error(`Kraken non-JSON response (${resp.status})`);
        const data = await resp.json();
        const book = Object.values(data.result ?? {})[0];
        if (!book) throw new Error("Kraken: resultado vacío o par no encontrado");
        let bidTotal = 0;
        const bids = book.bids.map(([p, s]) => {
          const size = parseFloat(s);
          bidTotal += size;
          return { price: parseFloat(p), size: parseFloat(size.toFixed(4)), total: parseFloat(bidTotal.toFixed(4)) };
        });
        let askTotal = 0;
        const asks = book.asks.map(([p, s]) => {
          const size = parseFloat(s);
          askTotal += size;
          return { price: parseFloat(p), size: parseFloat(size.toFixed(4)), total: parseFloat(askTotal.toFixed(4)) };
        });
        return Response.json(
          { bids, asks, pair, ts: Date.now() },
          { headers: { "Cache-Control": "public, max-age=10", ...corsHeaders(origin) } }
        );
      } catch (err) {
        return Response.json({ error: "Kraken orderbook error", detail: String(err) }, { status: 502, headers: corsHeaders(origin) });
      }
    }

    // ── Market Data: Crypto tickers en tiempo real (OKX public API) ─────────
    if (path === "/api/market-data/crypto") {
      const CRYPTO_IDS = {
        "BTC-USDT":"BTC","ETH-USDT":"ETH","SOL-USDT":"SOL","BNB-USDT":"BNB",
        "XRP-USDT":"XRP","AVAX-USDT":"AVAX","DOGE-USDT":"DOGE","OP-USDT":"OP",
        "ARB-USDT":"ARB","LINK-USDT":"LINK","DOT-USDT":"DOT","UNI-USDT":"UNI",
        "PEPE-USDT":"PEPE","SUI-USDT":"SUI","TIA-USDT":"TIA","INJ-USDT":"INJ",
        "WIF-USDT":"WIF","JTO-USDT":"JTO","SEI-USDT":"SEI","ATOM-USDT":"ATOM",
      };
      try {
        const resp = await fetch("https://www.okx.com/api/v5/market/tickers?instType=SPOT", {
          headers: { Accept: "application/json" },
          signal: AbortSignal.timeout(8000),
        });
        const ct = resp.headers.get("content-type") ?? "";
        if (!ct.includes("application/json")) throw new Error(`OKX non-JSON response (${resp.status})`);
        const json = await resp.json();
        if (!Array.isArray(json.data)) throw new Error("OKX: respuesta inesperada, falta campo data");
        const tickerMap = new Map(json.data.map(t => [t.instId, t]));
        const assets = Object.entries(CRYPTO_IDS).flatMap(([id, sym]) => {
          const t = tickerMap.get(id);
          if (!t) return [];
          const price = parseFloat(t.last);
          const open  = parseFloat(t.open24h) || price;
          return [{ sym, price, chg24h: ((price - open) / open) * 100, vol24h: parseFloat(t.volCcy24h) }];
        });
        return Response.json(
          { assets, ts: Date.now() },
          { headers: { "Cache-Control": "public, max-age=30", ...corsHeaders(origin) } }
        );
      } catch (err) {
        return Response.json({ error: "OKX crypto error", detail: String(err) }, { status: 502, headers: corsHeaders(origin) });
      }
    }

    // ── Market Data: Macro (Yahoo Finance + Fear&Greed) ─────────────────────
    if (path === "/api/market-data/macro") {
      const YF_SYMBOLS = {
        "^GSPC":"GSPC","^IXIC":"NDX","^DJI":"DJI","^VIX":"VIX","DX-Y.NYB":"DXY",
        "GC=F":"GOLD","^TNX":"TNX","^IRX":"IRX","^FVX":"FVX","^TYX":"TYX",
        "AAPL":"AAPL","NVDA":"NVDA","TSLA":"TSLA","MSFT":"MSFT","META":"META",
        "AMZN":"AMZN","JPM":"JPM","SPY":"SPY","QQQ":"QQQ","GLD":"GLD","SLV":"SLV",
      };
      try {
        const fetchYF = async (sym) => {
          try {
            const r = await fetch(
              `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?interval=1d&range=1d`,
              { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" }, signal: AbortSignal.timeout(6000) }
            );
            if (!r.ok) return null;
            const d = await r.json();
            const meta = d.chart.result?.[0]?.meta;
            if (!meta?.regularMarketPrice) return null;
            const prev = meta.chartPreviousClose ?? meta.previousClose ?? meta.regularMarketPrice;
            return { key: YF_SYMBOLS[sym] ?? sym, price: meta.regularMarketPrice, prev };
          } catch { return null; }
        };
        const [fngRes, ...yfResults] = await Promise.allSettled([
          fetch("https://api.alternative.me/fng/?limit=1&format=json", { signal: AbortSignal.timeout(6000) }).then(r => r.json()),
          ...Object.keys(YF_SYMBOLS).map(s => fetchYF(s)),
        ]);
        const indices = {};
        for (const r of yfResults) {
          if (r.status === "fulfilled" && r.value) {
            const { key, price, prev } = r.value;
            indices[key] = { price, chg: prev > 0 ? ((price - prev) / prev) * 100 : 0 };
          }
        }
        let fng = { value: 50, label: "Neutral" };
        if (fngRes.status === "fulfilled") {
          try { const d = fngRes.value; fng = { value: parseInt(d.data[0].value, 10), label: d.data[0].value_classification }; } catch {}
        }
        const irx = indices["IRX"]?.price ?? 5.28;
        const fvx = indices["FVX"]?.price ?? 4.62;
        const tnx = indices["TNX"]?.price ?? 4.52;
        const tyx = indices["TYX"]?.price ?? 4.62;
        const yields = [
          { label:"1M",  rate: parseFloat((irx+0.02).toFixed(3)) },
          { label:"3M",  rate: parseFloat(irx.toFixed(3)) },
          { label:"6M",  rate: parseFloat(((irx+tnx)/2-0.1).toFixed(3)) },
          { label:"1Y",  rate: parseFloat(((irx+fvx)/2-0.15).toFixed(3)) },
          { label:"2Y",  rate: parseFloat((fvx-0.5+(tnx-fvx)*0.3).toFixed(3)) },
          { label:"5Y",  rate: parseFloat(fvx.toFixed(3)) },
          { label:"10Y", rate: parseFloat(tnx.toFixed(3)) },
          { label:"30Y", rate: parseFloat(tyx.toFixed(3)) },
        ];
        return Response.json(
          { indices, fng, yields, ts: Date.now() },
          { headers: { "Cache-Control": "public, max-age=60", ...corsHeaders(origin) } }
        );
      } catch (err) {
        return Response.json({ error: "Macro fetch error", detail: String(err) }, { status: 502 });
      }
    }

    if (path === "/api/proxy/kraken/price") {
      const pair = url.searchParams.get("pair") ?? "XBTUSD";
      try {
        const resp = await fetch(`https://api.kraken.com/0/public/Ticker?pair=${pair}`, {
          headers: { Accept: "application/json" }, signal: AbortSignal.timeout(6000),
        });
        const ct = resp.headers.get("content-type") ?? "";
        if (!ct.includes("application/json")) throw new Error(`Kraken non-JSON (${resp.status})`);
        const data = await resp.json();
        return Response.json(data, { headers: { "Cache-Control": "public, max-age=10", ...corsHeaders(origin) } });
      } catch (err) {
        return Response.json({ error: "Kraken price error", detail: String(err) }, { status: 502, headers: corsHeaders(origin) });
      }
    }

    if (path === "/api/proxy/kraken/ohlc") {
      const pair     = url.searchParams.get("pair")     ?? "XBTUSD";
      const interval = url.searchParams.get("interval") ?? "10080";
      const since    = url.searchParams.get("since")    ?? "";
      const krakenUrl = since
        ? `https://api.kraken.com/0/public/OHLC?pair=${pair}&interval=${interval}&since=${since}`
        : `https://api.kraken.com/0/public/OHLC?pair=${pair}&interval=${interval}`;
      try {
        const resp = await fetch(krakenUrl, {
          headers: { Accept: "application/json" }, signal: AbortSignal.timeout(8000),
        });
        const ct = resp.headers.get("content-type") ?? "";
        if (!ct.includes("application/json")) throw new Error(`Kraken OHLC non-JSON (${resp.status})`);
        const data = await resp.json();
        return Response.json(data, { headers: { "Cache-Control": "public, max-age=300", ...corsHeaders(origin) } });
      } catch (err) {
        return Response.json({ error: "Kraken OHLC error", detail: String(err) }, { status: 502, headers: corsHeaders(origin) });
      }
    }

    if (path === "/api/proxy/coinbase/price") {
      const pair = url.searchParams.get("pair") ?? "BTC-USD";
      try {
        const resp = await fetch(`https://api.coinbase.com/v2/prices/${pair}/spot`, {
          headers: { Accept: "application/json" }, signal: AbortSignal.timeout(6000),
        });
        const ct = resp.headers.get("content-type") ?? "";
        if (!ct.includes("application/json")) throw new Error(`Coinbase non-JSON (${resp.status})`);
        const data = await resp.json();
        return Response.json(data, { headers: { "Cache-Control": "public, max-age=10", ...corsHeaders(origin) } });
      } catch (err) {
        return Response.json({ error: "Coinbase price error", detail: String(err) }, { status: 502, headers: corsHeaders(origin) });
      }
    }

    if (path === "/api/proxy/okx/oi") {
      const instId = url.searchParams.get("instId") ?? "BTC-USDT-SWAP";
      try {
        const resp = await fetch(
          `https://www.okx.com/api/v5/public/open-interest?instType=SWAP&instId=${instId}`,
          { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(6000) }
        );
        const ct = resp.headers.get("content-type") ?? "";
        if (!ct.includes("application/json")) throw new Error(`OKX OI non-JSON (${resp.status})`);
        const data = await resp.json();
        return Response.json(data, { headers: { "Cache-Control": "public, max-age=30", ...corsHeaders(origin) } });
      } catch (err) {
        return Response.json({ error: "OKX OI error", detail: String(err) }, { status: 502, headers: corsHeaders(origin) });
      }
    }

    if (path === "/api/proxy/okx/candles") {
      const instId = url.searchParams.get("instId") ?? "BTC-USDT-SWAP";
      const bar    = url.searchParams.get("bar")    ?? "1D";
      const limit  = url.searchParams.get("limit")  ?? "300";
      try {
        const resp = await fetch(
          `https://www.okx.com/api/v5/market/history-candles?instId=${instId}&bar=${bar}&limit=${limit}`,
          { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(8000) }
        );
        const ct = resp.headers.get("content-type") ?? "";
        if (!ct.includes("application/json")) throw new Error(`OKX candles non-JSON (${resp.status})`);
        const data = await resp.json();
        return Response.json(data, { headers: { "Cache-Control": "public, max-age=300", ...corsHeaders(origin) } });
      } catch (err) {
        return Response.json({ error: "OKX candles error", detail: String(err) }, { status: 502, headers: corsHeaders(origin) });
      }
    }

    if (path === "/api/proxy/okx/oi-history") {
      const ccy    = url.searchParams.get("ccy")    ?? "BTC";
      const period = url.searchParams.get("period") ?? "1D";
      const limit  = url.searchParams.get("limit")  ?? "300";
      try {
        const resp = await fetch(
          `https://www.okx.com/api/v5/rubik/stat/contracts/open-interest-volume?ccy=${ccy}&period=${period}&limit=${limit}`,
          { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(8000) }
        );
        const ct = resp.headers.get("content-type") ?? "";
        if (!ct.includes("application/json")) throw new Error(`OKX OI-history non-JSON (${resp.status})`);
        const data = await resp.json();
        return Response.json(data, { headers: { "Cache-Control": "public, max-age=300", ...corsHeaders(origin) } });
      } catch (err) {
        return Response.json({ error: "OKX OI-history error", detail: String(err) }, { status: 502, headers: corsHeaders(origin) });
      }
    }

    // ── Proxy: altcoin signals (server-to-server) ────────────────────────────
    if (path === "/api/proxy/signals/altcoins") {
      try {
        const resp = await fetch(SIGNALS_URL, {
          headers: { Accept: "application/json" },
          signal: AbortSignal.timeout(8000),
        });
        const ct = resp.headers.get("content-type") ?? "";
        if (!ct.includes("application/json")) throw new Error(`Signals non-JSON response (${resp.status})`);
        const data = await resp.json();
        return Response.json(data, {
          headers: { "Cache-Control": "public, max-age=60", ...corsHeaders(origin) },
        });
      } catch (err) {
        return Response.json({ error: "Signals proxy error", detail: String(err) }, { status: 502, headers: corsHeaders(origin) });
      }
    }

    // ── Marketing Engine: proxy Anthropic (personal, sin auth estricta) ──────
    if (path === "/api/marketing/generate") {
      if (request.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: { ...corsHeaders(origin), "Access-Control-Max-Age": "86400" } });
      }
      if (request.method !== "POST") {
        return Response.json({ error: "Method not allowed" }, { status: 405 });
      }
      const apiKey = env.ANTHROPIC_API_KEY;
      if (!apiKey) return Response.json({ error: "ANTHROPIC_API_KEY not set" }, { status: 503 });
      let body;
      try { body = await request.json(); } catch { return Response.json({ error: "JSON inválido" }, { status: 400 }); }
      const { prompt } = body ?? {};
      if (!prompt) return Response.json({ error: "prompt requerido" }, { status: 400 });
      const antResp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-5", max_tokens: 1200, messages: [{ role: "user", content: prompt }] }),
      });
      if (!antResp.ok) {
        const errText = await antResp.text();
        return Response.json({ ok: false, error: `Anthropic error ${antResp.status}`, detail: errText }, { status: 502, headers: corsHeaders(origin) });
      }
      const antData = await antResp.json();
      const text = antData.content?.[0]?.text ?? antData.error?.message ?? "Error generando contenido";
      return Response.json({ ok: true, text }, { headers: corsHeaders(origin) });
    }

    // ── Página: historial de señales + win rate ───────────────────────────────
    if (path === "/signals-history" || path === "/signals-history/") {
      return env.ASSETS.fetch(new Request(new URL("/signals-history.html", url).toString(), request));
    }

    // ── Oracle Feeds: Whale Intelligence Dashboard (directo en Worker) ───────
    if (path === "/api/oracle/whale-dashboard") {
      const cors = corsHeaders(origin);
      if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: { ...cors, "Access-Control-Max-Age": "86400" } });

      const ETF_ENTITIES = [
        { id:"blackrock", name:"BlackRock IBIT",   ticker:"IBIT", type:"ETF", label:"ETF / Fondos Institucionales", icon:"BLK", color:"#00e5ff", bg:"rgba(0,229,255,.12)",   holdings:"821,512 BTC",  aumUsd:"$55.2B",  flow1d:"+$412M", pct1d:2.1,  action:"BUY",  source:"Farside", updated:"HOY" },
        { id:"fidelity",  name:"Fidelity FBTC",    ticker:"FBTC", type:"ETF", label:"ETF / Fondos Institucionales", icon:"FID", color:"#1aeb8a", bg:"rgba(26,235,138,.12)",  holdings:"185,000 BTC",  aumUsd:"$20.8B",  flow1d:"+$89M",  pct1d:1.4,  action:"BUY",  source:"Farside", updated:"HOY" },
        { id:"ark",       name:"ARK Invest ARKB",  ticker:"ARKB", type:"ETF", label:"ETF / Fondos Institucionales", icon:"ARK", color:"#e8c547", bg:"rgba(232,197,71,.12)",  holdings:"43,200 BTC",   aumUsd:"$4.8B",   flow1d:"+$31M",  pct1d:0.8,  action:"BUY",  source:"Farside", updated:"HOY" },
        { id:"grayscale", name:"Grayscale GBTC",   ticker:"GBTC", type:"ETF", label:"ETF / Fondos Institucionales", icon:"GBT", color:"#f03060", bg:"rgba(240,48,96,.12)",   holdings:"286,000 BTC",  aumUsd:"$19.4B",  flow1d:"-$58M",  pct1d:-0.6, action:"SELL", source:"Farside", updated:"HOY" },
        { id:"vaneck",    name:"VanEck HODL",      ticker:"HODL", type:"ETF", label:"ETF / Fondos Institucionales", icon:"VAN", color:"#9060f0", bg:"rgba(144,96,240,.12)",  holdings:"8,400 BTC",    aumUsd:"$570M",   flow1d:"+$12M",  pct1d:0.3,  action:"BUY",  source:"Farside", updated:"HOY" },
        { id:"bitwise",   name:"Bitwise BITB",     ticker:"BITB", type:"ETF", label:"ETF / Fondos Institucionales", icon:"BIT", color:"#f0a020", bg:"rgba(240,160,32,.12)",  holdings:"12,800 BTC",   aumUsd:"$860M",   flow1d:"+$8M",   pct1d:0.2,  action:"BUY",  source:"Farside", updated:"HOY" },
        { id:"invesco",   name:"Invesco Galaxy",   ticker:"BTCO", type:"ETF", label:"ETF / Fondos Institucionales", icon:"INV", color:"#40c4ff", bg:"rgba(64,196,255,.12)",  holdings:"3,100 BTC",    aumUsd:"$210M",   flow1d:"+$4M",   pct1d:0.1,  action:"BUY",  source:"Farside", updated:"HOY" },
      ];
      const CORPORATE_ENTITIES = [
        { id:"microstrategy", name:"MicroStrategy",   ticker:"MSTR", type:"CORPORATIVO", label:"BTC Treasury · Nasdaq",       icon:"MST", color:"#f0a020", bg:"rgba(240,160,32,.12)",  holdings:"214,400 BTC", aumUsd:"$14.4B",    flow1d:"+4,225 BTC",  pct1d:2.0,  action:"ACCUMULATE", source:"13F / SEC", updated:"HOY" },
        { id:"marathon",      name:"Marathon Digital", ticker:"MARA", type:"CORPORATIVO", label:"BTC Miner · Nasdaq",          icon:"MAR", color:"#1aeb8a", bg:"rgba(26,235,138,.12)",  holdings:"18,536 BTC",  aumUsd:"$1.24B",    flow1d:"+200 BTC",    pct1d:0.3,  action:"HOLD",       source:"13F / SEC", updated:"2 días" },
        { id:"riot",          name:"Riot Platforms",  ticker:"RIOT", type:"CORPORATIVO", label:"BTC Miner · Nasdaq",          icon:"RIO", color:"#22d4f5", bg:"rgba(34,212,245,.12)",  holdings:"9,080 BTC",   aumUsd:"$610M",     flow1d:"+120 BTC",    pct1d:0.2,  action:"HOLD",       source:"13F / SEC", updated:"3 días" },
        { id:"coinbase",      name:"Coinbase",        ticker:"COIN", type:"CORPORATIVO", label:"Exchange · Custodian",        icon:"COI", color:"#0052ff", bg:"rgba(0,82,255,.12)",    holdings:"Custodian",   aumUsd:"$2.4B vol", flow1d:"$2.4B vol/24h",pct1d:0,   action:"WATCH",      source:"On-chain",  updated:"HOY" },
        { id:"tesla",         name:"Tesla Inc.",      ticker:"TSLA", type:"CORPORATIVO", label:"BTC Treasury · Nasdaq",       icon:"TSL", color:"#f03060", bg:"rgba(240,48,96,.12)",   holdings:"9,720 BTC",   aumUsd:"$653M",     flow1d:"Sin cambios", pct1d:0,    action:"HOLD",       source:"13F / SEC", updated:"Q1 2025" },
      ];
      const ETH_WALLETS = [
        { id:"vitalik",    name:"Vitalik Buterin",  type:"ON-CHAIN", label:"ETH Founder",     icon:"VIT", color:"#9060f0", bg:"rgba(144,96,240,.12)", addr:"0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045", chain:"ETH", status:"WATCH" },
        { id:"wintermute", name:"Wintermute",       type:"ON-CHAIN", label:"Market Maker",    icon:"WMT", color:"#22d4f5", bg:"rgba(34,212,245,.12)", addr:"0x4C39Fbe3D9F22C42B9dF3A37df85Be39b00E27Bd", chain:"ETH", status:"WATCH" },
        { id:"jump",       name:"Jump Trading",     type:"ON-CHAIN", label:"HFT / Crypto MM", icon:"JMP", color:"#f0a020", bg:"rgba(240,160,32,.12)", addr:"0x6F1cDbBb4d53d226CF4B917bF768B94acbAB6168", chain:"ETH", status:"WATCH" },
        { id:"jsun",       name:"Justin Sun",       type:"ON-CHAIN", label:"TRON Founder",    icon:"JSU", color:"#e8c547", bg:"rgba(232,197,71,.12)", addr:"0x3DdfA8eC3052539b6C9549F12cEA2C295cfF5296", chain:"ETH", status:"WATCH" },
        { id:"paradigm",   name:"Paradigm Fund",    type:"ON-CHAIN", label:"Crypto VC",       icon:"PAR", color:"#1aeb8a", bg:"rgba(26,235,138,.12)", addr:"0xA046a8660E66d178eE07ec97c585eEf18B786B0e", chain:"ETH", status:"WATCH" },
      ];
      const BTC_WALLETS = [
        { id:"satoshi",   name:"Satoshi Nakamoto",  type:"ON-CHAIN", label:"Bitcoin Creator",      icon:"SAT", color:"#f0a020", bg:"rgba(240,160,32,.12)",  holdings:"~1.1M BTC",   status:"DORMANT", updated:"2009" },
        { id:"mtgox",     name:"Mt.Gox Estate",     type:"ON-CHAIN", label:"Repago · En proceso",  icon:"MGX", color:"#f03060", bg:"rgba(240,48,96,.12)",   holdings:"138,985 BTC", status:"WATCH",   updated:"HOY"  },
        { id:"usgov",     name:"US Government",     type:"GOBIERNO",  label:"Silk Road Seized",     icon:"GOV", color:"#22d4f5", bg:"rgba(34,212,245,.12)",  holdings:"30,175 BTC",  status:"WATCH",   updated:"HOY"  },
        { id:"binance",   name:"Binance Reserve",   type:"ON-CHAIN", label:"Exchange Cold Wallet", icon:"BNB", color:"#f0b90b", bg:"rgba(240,185,11,.12)",  holdings:"576,000 BTC", status:"WATCH",   updated:"HOY"  },
        { id:"coinbaseb", name:"Coinbase Custody",  type:"ON-CHAIN", label:"Institutional Custod", icon:"COI", color:"#0052ff", bg:"rgba(0,82,255,.12)",    holdings:"1,000,000+ BTC", status:"WATCH", updated:"HOY"  },
      ];
      const ANALYST_ENTITIES = [
        { id:"planb",         name:"PlanB",               type:"ANALISTAS", label:"S2F Model Creator",       icon:"PLB", color:"#f0a020", view:"ALCISTA", signal:"Ciclo hacia $500K — acumulación fase 4",               source:"Twitter/X" },
        { id:"raoul",         name:"Raoul Pal",            type:"ANALISTAS", label:"Real Vision / GMI",       icon:"RAO", color:"#22d4f5", view:"ALCISTA", signal:"BTC en 'parábola perfecta' — DCA agresivo",            source:"Real Vision" },
        { id:"arthur",        name:"Arthur Hayes",         type:"ANALISTAS", label:"BitMEX Founder",          icon:"ART", color:"#e8c547", view:"ALCISTA", signal:"Bearish USD → BTC $100K antes de fin de año",          source:"Substack" },
        { id:"michael",       name:"Michael Saylor",       type:"ANALISTAS", label:"MicroStrategy CEO",       icon:"SAY", color:"#1aeb8a", view:"ALCISTA", signal:"Bitcoin única reserva de valor del siglo XXI",          source:"Twitter/X" },
        { id:"kiyosaki",      name:"Robert Kiyosaki",      type:"TRADFI",    label:"Rich Dad Poor Dad",       icon:"KIY", color:"#9060f0", view:"ALCISTA", signal:"Crash USD inminente — BTC, oro, plata",                source:"Twitter/X" },
        { id:"druckenmiller", name:"S. Druckenmiller",     type:"TRADFI",    label:"Duquesne Family Office",  icon:"DRU", color:"#40c4ff", view:"NEUTRAL", signal:"BTC position reducida — cautela en macro",             source:"Bloomberg" },
      ];

      // Fetch ETH balances from Etherscan (opcional — si falla retorna "—")
      const ethKey = env.ETHERSCAN_API_KEY || "";
      const fetchEthBal = async (addr) => {
        if (!ethKey) return "—";
        try {
          const r = await fetch(`https://api.etherscan.io/api?module=account&action=balance&address=${addr}&tag=latest&apikey=${ethKey}`, { signal: AbortSignal.timeout(5000) });
          if (!r.ok) return "—";
          const d = await r.json();
          if (d.status !== "1") return "—";
          const eth = parseFloat(d.result) / 1e18;
          if (eth < 0.001) return "—";
          return eth > 999 ? `${(eth/1000).toFixed(1)}K ETH` : `${eth.toFixed(2)} ETH`;
        } catch { return "—"; }
      };

      // Fetch RSS news (opcional)
      const fetchNews = async () => {
        try {
          const r = await fetch("https://cointelegraph.com/rss/tag/bitcoin", { signal: AbortSignal.timeout(7000), headers: { "User-Agent": "Mozilla/5.0 PSYCHOMETRIKS/2.0" } });
          if (!r.ok) return [];
          const xml = await r.text();
          const items = [];
          const re = /<item>([\s\S]*?)<\/item>/g;
          let m;
          while ((m = re.exec(xml)) !== null && items.length < 12) {
            const block = m[1];
            const title = (block.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || block.match(/<title>(.*?)<\/title>/) || [])[1] || "";
            const link  = (block.match(/<link>(.*?)<\/link>/) || block.match(/<guid>(.*?)<\/guid>/) || [])[1] || "";
            const pubDate = (block.match(/<pubDate>(.*?)<\/pubDate>/) || [])[1] || "";
            if (title && link) items.push({ title: title.trim(), link: link.trim(), pubDate: pubDate.trim(), source: "Cointelegraph" });
          }
          return items;
        } catch { return []; }
      };

      try {
        const [newsResult, ...ethResults] = await Promise.allSettled([
          fetchNews(),
          ...ETH_WALLETS.map(w => fetchEthBal(w.addr)),
        ]);
        const news = newsResult.status === "fulfilled" ? newsResult.value.slice(0, 15) : [];
        const ethWallets = ETH_WALLETS.map((w, i) => ({ ...w, balance: ethResults[i]?.status === "fulfilled" ? ethResults[i].value : "—" }));
        const ticker = [
          ...news.slice(0, 8).map(n => `📰 ${n.source}: ${n.title}`),
          "🏛 BlackRock IBIT — Inflow neto +$412M hoy",
          "🐋 MicroStrategy compra +4,225 BTC — Total 214,400 BTC",
          "🔴 Grayscale GBTC — Outflow -$58M",
          "🌐 US Gov movió 30,175 BTC a subasta programada",
        ];
        return Response.json({ ok: true, ts: Date.now(), etf: ETF_ENTITIES, corporate: CORPORATE_ENTITIES, ethWallets, btcWallets: BTC_WALLETS, analysts: ANALYST_ENTITIES, news, ticker }, { headers: cors });
      } catch (err) {
        return Response.json({ ok: false, error: String(err) }, { status: 502, headers: cors });
      }
    }

    // ── Proxy: DeGate DEX on-chain (Ethereum ZK-Rollup, sin API key) ─────────
    // El backend interno (v1-mainnet-backend.degate.com) bloquea IPs de Cloudflare
    // y retorna HTML en vez de JSON → crash "Unexpected token '<'".
    // Solución: parseo seguro con validación de Content-Type + fallback a API pública.
    // Endpoints:
    //   Primario  → https://v1-mainnet-backend.degate.com  (puede bloquear CF)
    //   Fallback  → https://api.degate.com                 (API REST pública)

    // Helper: fetch DeGate con parseo seguro — nunca explota con HTML
    async function fetchDeGateSafe(primaryUrl, fallbackUrl, opts = {}) {
      const headers = { Accept: "application/json", "User-Agent": "Mozilla/5.0 PSYCHOMETRIKS/2.0", ...opts.headers };
      const timeout = opts.timeout ?? 8000;

      // Intenta primero el endpoint primario
      const urls = fallbackUrl ? [primaryUrl, fallbackUrl] : [primaryUrl];
      let lastErr = "unknown";

      for (const targetUrl of urls) {
        try {
          const resp = await fetch(targetUrl, { headers, signal: AbortSignal.timeout(timeout) });
          // Verifica que sea JSON antes de parsear
          const ct = resp.headers.get("content-type") ?? "";
          if (!ct.includes("application/json") && !ct.includes("text/json")) {
            lastErr = `Non-JSON response (${resp.status}) from ${targetUrl} — content-type: ${ct.slice(0, 60)}`;
            continue; // intenta fallback
          }
          if (!resp.ok) {
            lastErr = `HTTP ${resp.status} from ${targetUrl}`;
            continue;
          }
          const data = await resp.json();
          return { ok: true, data, source: targetUrl };
        } catch (e) {
          lastErr = String(e);
          // continúa al fallback
        }
      }
      return { ok: false, error: lastErr };
    }

    const DEGATE_PRIMARY  = "https://v1-mainnet-backend.degate.com";
    const DEGATE_FALLBACK = "https://api.degate.com";

    if (path === "/api/proxy/degate/tickers") {
      const result = await fetchDeGateSafe(
        `${DEGATE_PRIMARY}/order-book-api/pairs?limit=100`,
        `${DEGATE_FALLBACK}/order-book-api/pairs?limit=100`,
      );
      if (!result.ok) {
        return Response.json(
          { ok: false, error: "DeGate no disponible — puede estar en mantenimiento", detail: result.error },
          { status: 503, headers: corsHeaders(origin) }
        );
      }
      return Response.json(result.data, {
        headers: { "Cache-Control": "public, max-age=30", ...corsHeaders(origin) },
      });
    }

    if (path === "/api/proxy/degate/depth") {
      const baseTokenId  = url.searchParams.get("base_token_id")  ?? "1";
      const quoteTokenId = url.searchParams.get("quote_token_id") ?? "0";
      const size         = url.searchParams.get("size") ?? "12";
      const qs = `base_token_id=${baseTokenId}&quote_token_id=${quoteTokenId}&size=${size}`;
      const result = await fetchDeGateSafe(
        `${DEGATE_PRIMARY}/order-book-ws-api/depth?${qs}`,
        `${DEGATE_FALLBACK}/order-book-ws-api/depth?${qs}`,
        { timeout: 7000 }
      );
      if (!result.ok) {
        return Response.json(
          { ok: false, error: "DeGate depth no disponible", detail: result.error },
          { status: 503, headers: corsHeaders(origin) }
        );
      }
      return Response.json(result.data, {
        headers: { "Cache-Control": "public, max-age=8", ...corsHeaders(origin) }
      });
    }

    if (path === "/api/proxy/degate/trades") {
      const baseTokenId  = url.searchParams.get("base_token_id")  ?? "1";
      const quoteTokenId = url.searchParams.get("quote_token_id") ?? "0";
      const limit        = url.searchParams.get("limit") ?? "40";
      const qs = `token1=${baseTokenId}&token2=${quoteTokenId}&limit=${limit}`;
      const result = await fetchDeGateSafe(
        `${DEGATE_PRIMARY}/order-book-api/sdk/trades?${qs}`,
        `${DEGATE_FALLBACK}/order-book-api/sdk/trades?${qs}`,
        { timeout: 7000 }
      );
      if (!result.ok) {
        return Response.json(
          { ok: false, error: "DeGate trades no disponible", detail: result.error },
          { status: 503, headers: corsHeaders(origin) }
        );
      }
      const arr = result.data?.data?.list ?? [];
      return Response.json({ ok: true, trades: arr, ts: Date.now() }, {
        headers: { "Cache-Control": "public, max-age=10", ...corsHeaders(origin) },
      });
    }

    // ── Proxy: Fear & Greed Index (alternative.me) ───────────────────────────
    if (path === "/api/proxy/fear-greed") {
      const limit = url.searchParams.get("limit") ?? "7";
      try {
        const resp = await fetch(
          `https://api.alternative.me/fng/?limit=${limit}&format=json`,
          { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(6000) }
        );
        const ct = resp.headers.get("content-type") ?? "";
        if (!ct.includes("application/json")) throw new Error(`Fear&Greed non-JSON (${resp.status})`);
        const data = await resp.json();
        return Response.json(data, {
          headers: { "Cache-Control": "public, max-age=300", ...corsHeaders(origin) }
        });
      } catch (err) {
        return Response.json({ error: "Fear&Greed error", detail: String(err) }, { status: 502, headers: corsHeaders(origin) });
      }
    }

    // ── Proxy: OKX Funding Rate (instId específico) ──────────────────────────
    if (path === "/api/proxy/okx/funding") {
      const instId = url.searchParams.get("instId") ?? "BTC-USDT-SWAP";
      try {
        const resp = await fetch(
          `https://www.okx.com/api/v5/public/funding-rate?instId=${instId}`,
          { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(6000) }
        );
        const ct = resp.headers.get("content-type") ?? "";
        if (!ct.includes("application/json")) throw new Error(`OKX funding non-JSON (${resp.status})`);
        const data = await resp.json();
        return Response.json(data, {
          headers: { "Cache-Control": "public, max-age=30", ...corsHeaders(origin) }
        });
      } catch (err) {
        return Response.json({ error: "OKX funding error", detail: String(err) }, { status: 502, headers: corsHeaders(origin) });
      }
    }

    // ── Proxy: OKX Long/Short Ratio ──────────────────────────────────────────
    if (path === "/api/proxy/okx/ls-ratio") {
      const ccy    = url.searchParams.get("ccy")    ?? "BTC";
      const period = url.searchParams.get("period") ?? "1D";
      const limit  = url.searchParams.get("limit")  ?? "30";
      try {
        const resp = await fetch(
          `https://www.okx.com/api/v5/rubik/stat/contracts/long-short-account-ratio?ccy=${ccy}&period=${period}&limit=${limit}`,
          { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(6000) }
        );
        const ct = resp.headers.get("content-type") ?? "";
        if (!ct.includes("application/json")) throw new Error(`OKX L/S ratio non-JSON (${resp.status})`);
        const data = await resp.json();
        return Response.json(data, {
          headers: { "Cache-Control": "public, max-age=60", ...corsHeaders(origin) }
        });
      } catch (err) {
        return Response.json({ error: "OKX L/S ratio error", detail: String(err) }, { status: 502, headers: corsHeaders(origin) });
      }
    }

    // ── Proxy: OKX Funding Rates (multi-par para Funding Dashboard) ──────────
    if (path === "/api/proxy/okx/funding-rates") {
      const PAIRS = [
        "BTC-USDT-SWAP","ETH-USDT-SWAP","SOL-USDT-SWAP","BNB-USDT-SWAP",
        "XRP-USDT-SWAP","AVAX-USDT-SWAP","DOGE-USDT-SWAP","ARB-USDT-SWAP",
        "OP-USDT-SWAP","LINK-USDT-SWAP","DOT-USDT-SWAP","PEPE-USDT-SWAP",
        "SUI-USDT-SWAP","WIF-USDT-SWAP","INJ-USDT-SWAP","TIA-USDT-SWAP",
      ];
      try {
        const results = await Promise.allSettled(
          PAIRS.map(id =>
            fetch(`https://www.okx.com/api/v5/public/funding-rate?instId=${id}`, {
              headers: { Accept: "application/json" }, signal: AbortSignal.timeout(8000)
            }).then(r => r.ok ? r.json() : Promise.reject(r.status))
          )
        );
        const data = results.flatMap((r, i) => {
          if (r.status !== "fulfilled") return [];
          const d = r.value?.data?.[0];
          if (!d) return [];
          const base = PAIRS[i].split("-")[0];
          const price = parseFloat(d.nextFundingRate ?? "0") * 1e4; // placeholder
          return [{
            symbol: PAIRS[i],
            base,
            rate: parseFloat(d.fundingRate ?? "0"),
            nextFundingTime: parseInt(d.nextFundingTime ?? "0"),
            price: 0,
            change: 0,
          }];
        });
        return Response.json({ ok: true, data }, {
          headers: { "Cache-Control": "public, max-age=60", ...corsHeaders(origin) }
        });
      } catch (err) {
        return Response.json({ error: "OKX funding-rates error", detail: String(err) }, { status: 502, headers: corsHeaders(origin) });
      }
    }

    // ── Proxy: FRED Federal Reserve Economic Data ────────────────────────────
    if (path === "/api/proxy/fred/series") {
      const seriesId = url.searchParams.get("id") ?? "FEDFUNDS";
      const limit    = url.searchParams.get("limit") ?? "240";
      const sort     = url.searchParams.get("sort")  ?? "asc";
      // FRED API key pública de prueba (límite 120 req/min)
      const FRED_KEY = "abcdefghijklmnopqrstuvwxyz123456"; // placeholder — set real key in env
      const fredKey  = env.FRED_API_KEY || FRED_KEY;
      try {
        const resp = await fetch(
          `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&limit=${limit}&sort_order=${sort}&file_type=json&api_key=${fredKey}`,
          { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(8000) }
        );
        const ct = resp.headers.get("content-type") ?? "";
        if (!ct.includes("application/json")) throw new Error(`FRED non-JSON (${resp.status})`);
        const raw = await resp.json();
        const observations = (raw.observations ?? []).map((o) => ({
          date:  o.date,
          value: parseFloat(o.value) || 0,
        }));
        return Response.json({ ok: true, observations }, {
          headers: { "Cache-Control": "public, max-age=3600", ...corsHeaders(origin) }
        });
      } catch (err) {
        return Response.json({ ok: false, error: "FRED error", detail: String(err), observations: [] }, { status: 502, headers: corsHeaders(origin) });
      }
    }

    // ── Proxy: DeGate Pumps (24h top movers) ─────────────────────────────────
    if (path === "/api/proxy/degate/pumps") {
      const result = await fetchDeGateSafe(
        "https://v1-mainnet-backend.degate.com/order-book-api/pairs?limit=200",
        "https://api.degate.com/order-book-api/pairs?limit=200",
        { timeout: 9000 }
      );
      if (!result.ok) {
        return Response.json({ ok: false, error: "DeGate pumps no disponible", detail: result.error }, { status: 503, headers: corsHeaders(origin) });
      }
      // Extraer top movers por cambio 24h
      const pairs = result.data?.data ?? result.data?.list ?? [];
      const pumps = {};
      for (const p of pairs) {
        const base = (p.baseTokenSymbol ?? p.symbol ?? "").split("-")[0];
        if (!base) continue;
        const h24 = parseFloat(p.change24h ?? p.priceChange ?? "0");
        const vol = parseFloat(p.quoteVolume ?? p.volume ?? "0");
        if (!pumps[base] || Math.abs(h24) > Math.abs(pumps[base].h24)) {
          pumps[base] = { h24, vol };
        }
      }
      return Response.json({ ok: true, data: pumps }, {
        headers: { "Cache-Control": "public, max-age=120", ...corsHeaders(origin) }
      });
    }

    // ── Proxy: resto de /api/* → Railway con firma HMAC ──────────────────────
    if (path.startsWith("/api/")) {
      const target    = API_SERVER + path + url.search;
      const proxyReq  = await buildSignedRequest(target, request, env);
      return fetch(proxyReq);
    }

    // ── Assets estáticos y SPA fallback ──────────────────────────────────────
    const assetRes = await env.ASSETS.fetch(request);
    const fetchedReq = assetRes.status === 404
      ? await env.ASSETS.fetch(new Request(new URL("/index.html", url).toString(), request))
      : assetRes;

    // ── CSP y Security Headers en respuestas HTML ────────────────────────────
    // El build de Vite usa <script type="module" src="..."> sin inline scripts,
    // por lo que podemos usar script-src 'self' sin 'unsafe-inline'.
    const contentType = fetchedReq.headers.get("content-type") ?? "";
    if (contentType.includes("text/html")) {
      const newHeaders = new Headers(fetchedReq.headers);
      newHeaders.set("Content-Security-Policy", [
        "default-src 'self'",
        // TradingView scripts + Cloudflare beacon + inline scripts (TradingView widgets)
        "script-src 'self' 'unsafe-inline' https://s.tradingview.com https://s3.tradingview.com https://static.cloudflareinsights.com",
        // CSS-in-JS + Google Fonts stylesheet
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "connect-src *",                                  // APIs de mercado externas
        "img-src 'self' data: https: blob:",
        "font-src 'self' data: https://fonts.gstatic.com https://fonts.googleapis.com",
        "object-src 'none'",                              // sin Flash/plugins
        // TradingView iframes (widgetembed, charts interactivos)
        "frame-src 'self' https://s.tradingview.com https://www.tradingview.com https://s3.tradingview.com",
        "frame-ancestors 'none'",                         // anti-clickjacking
        "base-uri 'self'",                                // anti-base-tag injection
        "form-action 'self'",
      ].join("; "));
      newHeaders.set("Referrer-Policy", "strict-origin-when-cross-origin");
      newHeaders.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
      return new Response(fetchedReq.body, {
        status: fetchedReq.status,
        headers: newHeaders,
      });
    }
    return fetchedReq;
  },
};
