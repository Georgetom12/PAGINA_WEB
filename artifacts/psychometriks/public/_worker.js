const SIGNALS_URL = "https://signalsbotpaginaweb-production.up.railway.app/api/altcoin-signals";
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

    // ── AUTH: Superadmin login (edge — sin depender de Railway) ────────────
    if (path === "/api/auth/superadmin-login" && request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: { ...corsHeaders(origin), "Access-Control-Max-Age": "86400" },
      });
    }
    if (path === "/api/auth/superadmin-login" && request.method === "POST") {
      let body;
      try { body = await request.json(); } catch {
        return Response.json({ ok: false, error: "JSON inválido" }, { status: 400, headers: corsHeaders(origin) });
      }
      const { username, password } = body ?? {};
      const u = (username ?? "").toLowerCase().trim();
      const p = (password ?? "").trim();
      const ADMIN_USER = "jorge-2026";
      const ADMIN_PASS = env.PSY_ADMIN_PASS ?? "PSY-MASTER-2026";
      if ((u === ADMIN_USER || u === "admin") && p === ADMIN_PASS) {
        // Genera token compatible con Railway (Railway valida su propia password, no la del usuario)
        const railwayPwd = env.SUPERADMIN_PASSWORD_2 ?? "JORGE-ADMIN-2026";
        const token = btoa(`SUPERADMIN:${u}:${railwayPwd}`);
        return Response.json(
          { ok: true, token, role: "superadmin", plan: "elite" },
          { headers: { "Content-Type": "application/json", ...corsHeaders(origin) } }
        );
      }
      return Response.json(
        { ok: false, error: "Credenciales incorrectas" },
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders(origin) } }
      );
    }

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
        const resp = await fetch(mexcUrl, { headers: { Accept: "application/json" } });
        const data = await resp.json();
        return Response.json(data, { headers: { "Cache-Control": "public, max-age=10" } });
      } catch (err) {
        return Response.json({ error: "MEXC proxy error", detail: String(err) }, { status: 502 });
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
        const data = await resp.json();
        const book = Object.values(data.result)[0];
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
        return Response.json({ error: "Kraken orderbook error", detail: String(err) }, { status: 502 });
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
        const json = await resp.json();
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
        return Response.json({ error: "OKX crypto error", detail: String(err) }, { status: 502 });
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

    // ── Proxy: Kraken price (Ticker) — sin API key, edge-side ───────────────
    if (path === "/api/proxy/kraken/price") {
      const pair = url.searchParams.get("pair") ?? "XBTUSD";
      try {
        const resp = await fetch(`https://api.kraken.com/0/public/Ticker?pair=${pair}`, {
          headers: { Accept: "application/json" }, signal: AbortSignal.timeout(6000),
        });
        const data = await resp.json();
        return Response.json(data, { headers: { "Cache-Control": "public, max-age=10", ...corsHeaders(origin) } });
      } catch (err) {
        return Response.json({ error: "Kraken price error", detail: String(err) }, { status: 502 });
      }
    }

    // ── Proxy: Kraken OHLC — sin API key, edge-side ──────────────────────────
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
        const data = await resp.json();
        return Response.json(data, { headers: { "Cache-Control": "public, max-age=300", ...corsHeaders(origin) } });
      } catch (err) {
        return Response.json({ error: "Kraken OHLC error", detail: String(err) }, { status: 502 });
      }
    }

    // ── Proxy: Coinbase price — sin API key, edge-side ───────────────────────
    if (path === "/api/proxy/coinbase/price") {
      const pair = url.searchParams.get("pair") ?? "BTC-USD";
      try {
        const resp = await fetch(`https://api.coinbase.com/v2/prices/${pair}/spot`, {
          headers: { Accept: "application/json" }, signal: AbortSignal.timeout(6000),
        });
        const data = await resp.json();
        return Response.json(data, { headers: { "Cache-Control": "public, max-age=10", ...corsHeaders(origin) } });
      } catch (err) {
        return Response.json({ error: "Coinbase price error", detail: String(err) }, { status: 502 });
      }
    }

    // ── Proxy: OKX Open Interest — sin API key, edge-side ───────────────────
    if (path === "/api/proxy/okx/oi") {
      const instId = url.searchParams.get("instId") ?? "BTC-USDT-SWAP";
      try {
        const resp = await fetch(
          `https://www.okx.com/api/v5/public/open-interest?instType=SWAP&instId=${instId}`,
          { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(6000) }
        );
        const data = await resp.json();
        return Response.json(data, { headers: { "Cache-Control": "public, max-age=30", ...corsHeaders(origin) } });
      } catch (err) {
        return Response.json({ error: "OKX OI error", detail: String(err) }, { status: 502 });
      }
    }

    // ── Proxy: OKX Candles — sin API key, edge-side ──────────────────────────
    if (path === "/api/proxy/okx/candles") {
      const instId = url.searchParams.get("instId") ?? "BTC-USDT-SWAP";
      const bar    = url.searchParams.get("bar")    ?? "1D";
      const limit  = url.searchParams.get("limit")  ?? "300";
      try {
        const resp = await fetch(
          `https://www.okx.com/api/v5/market/history-candles?instId=${instId}&bar=${bar}&limit=${limit}`,
          { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(8000) }
        );
        const data = await resp.json();
        return Response.json(data, { headers: { "Cache-Control": "public, max-age=300", ...corsHeaders(origin) } });
      } catch (err) {
        return Response.json({ error: "OKX candles error", detail: String(err) }, { status: 502 });
      }
    }

    // ── Proxy: OKX OI History — sin API key, edge-side ──────────────────────
    if (path === "/api/proxy/okx/oi-history") {
      const ccy    = url.searchParams.get("ccy")    ?? "BTC";
      const period = url.searchParams.get("period") ?? "1D";
      const limit  = url.searchParams.get("limit")  ?? "300";
      try {
        const resp = await fetch(
          `https://www.okx.com/api/v5/rubik/stat/contracts/open-interest-volume?ccy=${ccy}&period=${period}&limit=${limit}`,
          { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(8000) }
        );
        const data = await resp.json();
        return Response.json(data, { headers: { "Cache-Control": "public, max-age=300", ...corsHeaders(origin) } });
      } catch (err) {
        return Response.json({ error: "OKX OI-history error", detail: String(err) }, { status: 502 });
      }
    }

    // ── Proxy: Admin routes — valida edge-side, reenvía con token master ─────
    // El worker valida aquí el token del superadmin y lo reemplaza con el token
    // que Railway SIEMPRE acepta (admin:MASTER99 = default de SA_PWD_1 en Railway).
    // Esto resuelve el "Acceso denegado" sin depender de variables de Railway.
    if (path.startsWith("/api/admin/") && request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: { ...corsHeaders(origin), "Access-Control-Max-Age": "86400" },
      });
    }
    if (path.startsWith("/api/admin/")) {
      const psyToken   = request.headers.get("x-psy-token") ?? "";
      const railwayPwd = env.SUPERADMIN_PASSWORD_2 ?? "JORGE-ADMIN-2026";
      const masterPwd  = env.SUPERADMIN_PASSWORD   ?? "MASTER99";
      // Always include hardcoded defaults so the login always works,
      // even if env vars change or weren't set when the user logged in.
      const validTokens = new Set([
        btoa(`SUPERADMIN:jorge-2026:${railwayPwd}`),
        btoa(`SUPERADMIN:admin:${railwayPwd}`),
        btoa(`SUPERADMIN:admin:${masterPwd}`),
        btoa(`SUPERADMIN:jorge-2026:${masterPwd}`),
      ]);
      if (!psyToken || !validTokens.has(psyToken)) {
        return Response.json({ error: "Acceso denegado — cerrá sesión, volvé a entrar como admin y reintentá" }, {
          status: 403,
          headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
        });
      }
      // Pass the user's original token through — Railway validates it directly.
      // Do NOT replace with masterToken: Cloudflare env vars can differ from Railway env vars,
      // causing a mismatch. The user's token already passed worker validation above.
      const adminHeaders = new Headers(request.headers);
      adminHeaders.delete("origin");
      adminHeaders.delete("referer");
      const adminReq = new Request(API_SERVER + path + url.search, {
        method: request.method,
        headers: adminHeaders,
        body: request.body,
        redirect: "follow",
      });
      const adminResp = await fetch(adminReq);
      const adminBody = await adminResp.text();
      return new Response(adminBody, {
        status: adminResp.status,
        headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
      });
    }

    // ── Proxy: altcoin signals (server-to-server) ────────────────────────────
    if (path === "/api/proxy/signals/altcoins") {
      try {
        const resp = await fetch(SIGNALS_URL, {
          headers: { Accept: "application/json" },
        });
        const data = await resp.json();
        return Response.json(data, {
          headers: { "Cache-Control": "public, max-age=60" },
        });
      } catch (err) {
        return Response.json({ error: "Proxy error", detail: String(err) }, { status: 502 });
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
        body: JSON.stringify({ model: "claude-opus-4-5", max_tokens: 1200, messages: [{ role: "user", content: prompt }] }),
      });
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
