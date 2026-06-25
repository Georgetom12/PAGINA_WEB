import React, { useState, useEffect, useRef, useCallback } from "react";
import SiteNav from "@/components/site-nav";

function getAuth() {
  try {
    const r = localStorage.getItem("psyko_auth");
    if (!r) return null;
    const s = JSON.parse(r) as { role?: string; plan?: string; ts?: number; user?: string };
    if (Date.now() - (s.ts ?? 0) > 28_800_000) return null;
    return s;
  } catch { return null; }
}
function isElite(auth: ReturnType<typeof getAuth>) {
  if (!auth) return false;
  const role = auth.role ?? "";
  const plan = (auth.plan ?? "").toLowerCase();
  return role === "superadmin" || role === "operator" || plan === "institucional" || plan === "elite";
}

const ASSETS: Record<string, AssetItem[]> = {
  equities: [
    { sym:"AAPL", name:"Apple Inc.",       px:189.30, pct:+0.66, color:"#22d4f5", bg:"rgba(34,212,245,.12)", sector:"Tech",       mcap:"2.94T", pe:29.4, beta:1.24, rsi:58, si:"0.9%",  iv:"24%" },
    { sym:"NVDA", name:"NVIDIA Corp.",     px:875.40, pct:+2.77, color:"#aaff00", bg:"rgba(170,255,0,.12)",  sector:"Semi",       mcap:"2.16T", pe:67.3, beta:1.72, rsi:71, si:"2.8%",  iv:"48%" },
    { sym:"MSFT", name:"Microsoft Corp.",  px:415.20, pct:-0.68, color:"#1aeb8a", bg:"rgba(26,235,138,.12)", sector:"Tech",       mcap:"3.08T", pe:36.2, beta:0.89, rsi:52, si:"0.7%",  iv:"22%" },
    { sym:"AMZN", name:"Amazon.com",       px:182.50, pct:+0.50, color:"#f0a020", bg:"rgba(240,160,32,.12)", sector:"E-Commerce", mcap:"1.90T", pe:58.4, beta:1.15, rsi:55, si:"1.2%",  iv:"28%" },
    { sym:"GOOGL", name:"Alphabet Inc.",   px:172.30, pct:-0.38, color:"#40c4ff", bg:"rgba(64,196,255,.12)", sector:"Tech",       mcap:"2.13T", pe:23.8, beta:1.06, rsi:49, si:"0.6%",  iv:"21%" },
    { sym:"META", name:"Meta Platforms",   px:503.10, pct:+1.70, color:"#b060ff", bg:"rgba(176,96,255,.12)", sector:"Social",     mcap:"1.29T", pe:26.1, beta:1.28, rsi:62, si:"1.2%",  iv:"32%" },
    { sym:"TSLA", name:"Tesla Inc.",       px:248.50, pct:-1.70, color:"#f03060", bg:"rgba(240,48,96,.12)",  sector:"EV",         mcap:"790B",  pe:51.2, beta:2.01, rsi:44, si:"22.3%", iv:"68%" },
    { sym:"JPM",  name:"JPMorgan Chase",   px:202.40, pct:+1.05, color:"#22d4f5", bg:"rgba(34,212,245,.1)",  sector:"Bank",       mcap:"583B",  pe:11.8, beta:1.12, rsi:63, si:"1.1%",  iv:"18%" },
    { sym:"NFLX", name:"Netflix Inc.",     px:628.00, pct:+1.58, color:"#f03060", bg:"rgba(240,48,96,.12)",  sector:"Stream",     mcap:"268B",  pe:44.3, beta:1.33, rsi:65, si:"3.1%",  iv:"38%" },
    { sym:"COST", name:"Costco Wholesale", px:872.00, pct:+0.62, color:"#1aeb8a", bg:"rgba(26,235,138,.1)",  sector:"Retail",     mcap:"386B",  pe:52.4, beta:0.86, rsi:60, si:"1.8%",  iv:"19%" },
  ],
  indices: [
    { sym:"SPX",   name:"S&P 500 Index",  px:5214.08,  pct:+0.35, color:"#1aeb8a", bg:"rgba(26,235,138,.12)", sector:"Índice",     mcap:"—", pe:21.4, beta:1.0,  rsi:62, si:"—", iv:"14%" },
    { sym:"NDX",   name:"NASDAQ 100",     px:18162.40, pct:+0.46, color:"#22d4f5", bg:"rgba(34,212,245,.12)", sector:"Índice",     mcap:"—", pe:28.6, beta:1.15, rsi:64, si:"—", iv:"18%" },
    { sym:"DJI",   name:"Dow Jones 30",   px:39131.50, pct:+0.12, color:"#40c4ff", bg:"rgba(64,196,255,.1)",  sector:"Índice",     mcap:"—", pe:19.2, beta:0.88, rsi:58, si:"—", iv:"12%" },
    { sym:"RUT",   name:"Russell 2000",   px:2048.30,  pct:-0.60, color:"#f03060", bg:"rgba(240,48,96,.1)",   sector:"Índice",     mcap:"—", pe:16.8, beta:1.22, rsi:44, si:"—", iv:"22%" },
    { sym:"VIX",   name:"Volatility Index",px:14.82,   pct:-6.03, color:"#f0a020", bg:"rgba(240,160,32,.12)", sector:"Volatilidad",mcap:"—", pe:null, beta:null, rsi:32, si:"—", iv:"—"  },
  ],
  macro: [
    { sym:"DXY",   name:"US Dollar Index",   px:104.23, pct:+0.33, color:"#e8c547", bg:"rgba(232,197,71,.12)", sector:"Divisa",    mcap:"—", pe:null, beta:null, rsi:56, si:"—", iv:"7%"  },
    { sym:"XAU",   name:"Gold / USD",         px:2334.50,pct:+0.18, color:"#e8c547", bg:"rgba(232,197,71,.12)", sector:"Commodity", mcap:"—", pe:null, beta:null, rsi:58, si:"—", iv:"15%" },
    { sym:"WTI",   name:"Crude Oil WTI",      px:78.45,  pct:-0.82, color:"#f0a020", bg:"rgba(240,160,32,.12)", sector:"Commodity", mcap:"—", pe:null, beta:null, rsi:46, si:"—", iv:"28%" },
    { sym:"US10Y", name:"US 10Y Treasury",    px:4.35,   pct:+1.17, color:"#9060f0", bg:"rgba(144,96,240,.12)", sector:"Bonos",     mcap:"—", pe:null, beta:null, rsi:61, si:"—", iv:"—"  },
    { sym:"US2Y",  name:"US 2Y Treasury",     px:4.70,   pct:+0.64, color:"#b060ff", bg:"rgba(176,96,255,.1)",  sector:"Bonos",     mcap:"—", pe:null, beta:null, rsi:58, si:"—", iv:"—"  },
  ],
  crypto: [
    { sym:"BTC", name:"Bitcoin",  px:67420, pct:+1.23, color:"#f0a020", bg:"rgba(240,160,32,.12)", sector:"Crypto L1", mcap:"1.32T", pe:null, beta:null, rsi:62, si:"—", iv:"58%" },
    { sym:"ETH", name:"Ethereum", px:3842,  pct:+0.87, color:"#9060f0", bg:"rgba(144,96,240,.12)", sector:"Crypto L1", mcap:"462B",  pe:null, beta:null, rsi:58, si:"—", iv:"65%" },
    { sym:"SOL", name:"Solana",   px:148.20,pct:+2.40, color:"#b060ff", bg:"rgba(176,96,255,.12)", sector:"Crypto L1", mcap:"66B",   pe:null, beta:null, rsi:68, si:"—", iv:"82%" },
    { sym:"BNB", name:"BNB",      px:580.00,pct:+0.45, color:"#f0b90b", bg:"rgba(240,185,11,.12)", sector:"Crypto L1", mcap:"84B",   pe:null, beta:null, rsi:55, si:"—", iv:"72%" },
    { sym:"XRP", name:"Ripple",   px:0.52,  pct:-0.30, color:"#22d4f5", bg:"rgba(34,212,245,.1)",  sector:"Crypto L2", mcap:"28B",   pe:null, beta:null, rsi:45, si:"—", iv:"90%" },
  ],
};

interface AssetItem {
  sym: string; name: string; px: number; pct: number;
  color: string; bg: string; sector: string; mcap: string;
  pe: number | null; beta: number | null; rsi: number; si: string; iv: string;
}

const ANALYSIS_TYPES = [
  { key:"completo",    label:"COMPLETO",    desc:"Análisis 360°" },
  { key:"tecnico",     label:"TÉCNICO",     desc:"Multi-timeframe" },
  { key:"fundamental", label:"FUNDAMENTAL", desc:"Valuación DCF" },
  { key:"macro",       label:"MACRO",       desc:"DXY · Tasas · VIX" },
  { key:"opciones",    label:"OPCIONES",    desc:"GEX · Skew · IV" },
  { key:"wyckoff",     label:"WYCKOFF",     desc:"Fases A-E" },
  { key:"elliott",     label:"ELLIOTT",     desc:"Conteo de ondas" },
  { key:"setup",       label:"SETUP",       desc:"Entrada · SL · TP" },
  { key:"riesgo",      label:"RIESGO",      desc:"VaR · Hedges" },
];

function buildPrompt(asset: AssetItem, type: string): string {
  const up = asset.pct >= 0;
  const context = `ACTIVO: ${asset.sym} — ${asset.name}
PRECIO ACTUAL: $${typeof asset.px === "number" ? asset.px.toFixed(2) : asset.px} (${up ? "+" : ""}${asset.pct.toFixed(2)}% hoy)
SECTOR: ${asset.sector}
MARKET CAP: ${asset.mcap || "N/A"}
P/E: ${asset.pe ?? "N/A"}x | BETA: ${asset.beta ?? "N/A"} | RSI(14): ${asset.rsi ?? "N/A"}
SHORT INTEREST: ${asset.si} | IV: ${asset.iv}

CONTEXTO MACRO HOY:
- SPX: 5,214 (+0.35%) | VIX: 14.82 (-6%)
- DXY: 104.23 (+0.33%) — Dólar fuerte
- US10Y: 4.35% — Tasas elevadas
- Gold: $2,334 | WTI: $78.45
- BTC: $67,420 (+1.23%)
- Fed: Sin cambios hasta junio — 3 recortes esperados en 2024`;

  const prompts: Record<string, string> = {
    completo: `Eres PSY BRAIN, el analista institucional de PSYCHOMETRIKS. Produce un análisis profesional completo en español sobre ${asset.sym}.

${context}

Estructura tu análisis en estas secciones exactas:

**PANORAMA EJECUTIVO**
Resumen de 2-3 oraciones del estado actual del activo y la oportunidad.

**ANÁLISIS TÉCNICO**
Estado técnico completo: tendencia primaria, EMAs clave, RSI, MACD, niveles de soporte/resistencia críticos, patrón de precio actual, volumen.

**CONTEXTO MACRO & CATALIZADORES**
Cómo afecta el macro actual (DXY, tasas, VIX) a este activo específicamente. Catalizadores próximos.

**NARRATIVA INSTITUCIONAL**
Qué está haciendo el dinero inteligente: flujo de opciones, dark pools, sentimiento de grandes fondos.

**SETUP OPERATIVO**
Señal clara: STRONG BUY / BUY / HOLD / SELL / STRONG SELL.
Entrada sugerida, Stop Loss, Take Profit (TP1, TP2, TP3), Risk/Reward.

**RIESGOS PRINCIPALES**
Top 3 riesgos que podrían invalidar la tesis.

Escribe con convicción de analista institucional senior. Sé específico con números. En español profesional.`,

    tecnico: `Eres PSY BRAIN, analista técnico institucional de PSYCHOMETRIKS. Análisis técnico PROFUNDO de ${asset.sym}.

${context}

Cubre: tendencia multi-timeframe (mensual/semanal/diario/4H), EMAs 20/50/200, RSI con divergencias, MACD, Bollinger Bands, niveles de soporte/resistencia de alta probabilidad, volumen y su confirmación, patrones de velas clave recientes, zonas de liquidez (stops acumulados).

Da niveles numéricos exactos. Sé quirúrgico. En español.`,

    fundamental: `Eres PSY BRAIN, analista fundamental de PSYCHOMETRIKS. Análisis fundamental PROFUNDO de ${asset.sym}.

${context}

Cubre: modelo de negocio y moat competitivo, métricas financieras clave (revenue growth, márgenes, FCF, deuda), valuación relativa (PER vs sector, PEG, EV/EBITDA), calidad de earnings, pipeline de productos, ventajas competitivas estructurales, riesgos regulatorios, DCF simplificado con escenarios base/bull/bear.

Habla como un analista de buy-side de Goldman Sachs. En español.`,

    macro: `Eres PSY BRAIN, estratega macro de PSYCHOMETRIKS. Análisis MACRO de ${asset.sym}.

${context}

Cubre: correlación histórica con DXY, US10Y, VIX y su implicación actual, sensibilidad a política Fed, exposición geográfica y riesgo FX, beta vs SPX en diferentes regímenes de mercado, posición en el ciclo económico actual, narrativas macro que lo impulsan o frenan.

En español, con perspectiva macro-global.`,

    opciones: `Eres PSY BRAIN, especialista en opciones de PSYCHOMETRIKS. Análisis de OPCIONES de ${asset.sym}.

${context}

Cubre: flujo de opciones inusual reciente (calls/puts sweeps), IV actual vs IV histórico (IV rank/percentile), estructura de término (contango/backwardation), skew call/put, Open Interest concentración por strikes (Max Pain implicado), Gamma Exposure en niveles clave, estrategias de opciones óptimas para el setup actual (con strikes y expiraciones sugeridas), IV crush risk si hay earnings próximos.

Habla como un trader de opciones institucional. En español.`,

    wyckoff: `Eres PSY BRAIN, experto en metodología Wyckoff de PSYCHOMETRIKS. Análisis WYCKOFF de ${asset.sym}.

${context}

Identifica y justifica con precisión:
- Fase actual del ciclo Wyckoff (A, B, C, D o E dentro de Acumulación/Distribución)
- Eventos Wyckoff identificados: PS, SC, AR, ST, Spring/UTAD, SOS/SOW, LPS/LPSY
- ¿Es un Spring genuino o trampa? ¿Qué dice el volumen?
- Composite Operator: ¿qué está haciendo el dinero institucional?
- Proyección de precio basada en la estructura Wyckoff

Sé muy específico con los niveles de precio de cada evento. En español.`,

    elliott: `Eres PSY BRAIN, especialista en Elliott Wave de PSYCHOMETRIKS. Análisis ELLIOTT WAVE de ${asset.sym}.

${context}

Produce:
- Conteo de ondas actual en timeframe primario (semanal/diario)
- Conteo alternativo con probabilidades
- Onda actual: número, carácter, extensión esperada
- Ratios Fibonacci clave: retrocesos y extensiones proyectadas
- Reglas violadas o confirmadas del conteo principal
- Target de precio con Fibonacci extensions
- Invalidación: nivel donde el conteo queda inválido

Usa nomenclatura estándar Elliott. Muy específico con precios. En español.`,

    setup: `Eres PSY BRAIN, estratega de trading de PSYCHOMETRIKS. SETUP OPERATIVO para ${asset.sym}.

${context}

Dame el setup más claro y accionable para HOY o esta semana:

TIPO DE SETUP: (breakout/pullback/reversal/continuation/etc)
TIMEFRAME PRIMARIO: 
CONFLUENCIAS QUE LO CONFIRMAN: (mínimo 3)
ZONA DE ENTRADA EXACTA: $_____ a $_____
TRIGGER DE ENTRADA: (qué necesito ver para entrar)
STOP LOSS: $_____ (justificación con ATR o estructura)
TP1: $_____ | TP2: $_____ | TP3: $_____
RISK/REWARD: ___:1
TAMAÑO DE POSICIÓN: (% del portfolio recomendado)
TIEMPO DE VIDA DEL TRADE: (scalp/swing/posicional)
INVALIDACIÓN: (qué evento/nivel cancela el setup)

Luego un párrafo explicando por qué este setup es de alta probabilidad. En español.`,

    riesgo: `Eres PSY BRAIN, gestor de riesgo institucional de PSYCHOMETRIKS. Análisis de RIESGOS de ${asset.sym}.

${context}

Análisis de riesgo completo:
- VaR (Value at Risk) estimado a 1 día y 1 semana
- Drawdown máximo histórico y escenario de repetición
- Top 5 riesgos específicos del activo (regulatorio, competitivo, macro, técnico, liquidez)
- Correlación con activos de riesgo
- Riesgo de liquidez: bid-ask spread, volumen promedio, slippage estimado
- Riesgo de eventos: earnings, FDA, FOMC, etc próximos
- Tail risks: escenarios extremos de baja probabilidad pero alto impacto
- Recomendación de hedge: cómo cubrir una posición long en este activo
- Tamaño máximo de posición recomendado en función del riesgo

Habla como un CRO (Chief Risk Officer). En español.`,
  };

  return prompts[type] || prompts.completo;
}

function formatAnalysisText(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '<strong style="color:#e8c547;font-size:0.8rem;letter-spacing:0.1em;display:block;margin:14px 0 6px;">$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em style="color:#dceaf5;">$1</em>')
    .replace(/^→ (.+)$/gm, '<div style="padding-left:12px;margin:3px 0;color:#b8d0e0;">→ $1</div>')
    .replace(/\n\n/g, '</p><p style="margin-top:10px;">')
    .replace(/\n/g, "<br>");
}

function fmtPx(px: number): string {
  if (px > 999) return px.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return px.toFixed(2);
}

export default function PsyBrain() {
  const auth = getAuth();
  const [currentGroup, setCurrentGroup] = useState<keyof typeof ASSETS>("equities");
  const [currentAsset, setCurrentAsset] = useState<AssetItem | null>(null);
  const [currentType, setCurrentType] = useState("completo");
  const [assetSearch, setAssetSearch] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [analysisText, setAnalysisText] = useState("");
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [showThinking, setShowThinking] = useState(false);
  const [thinkingMsg, setThinkingMsg] = useState("LEYENDO SEÑALES DE MERCADO...");
  const [errorMsg, setErrorMsg] = useState("");
  const [score, setScore] = useState(0);
  const [clock, setClock] = useState("");
  const [history, setHistory] = useState<{ asset: string; type: string; ts: string }[]>([]);
  const messagesRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const iv = setInterval(() => {
      const now = new Date();
      const utc = now.getTime() + now.getTimezoneOffset() * 60000;
      const est = new Date(utc + 3600000 * -5);
      const f = (n: number) => String(n).padStart(2, "0");
      setClock(`${f(est.getHours())}:${f(est.getMinutes())}:${f(est.getSeconds())} EST`);
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  const filteredAssets = (ASSETS[currentGroup] || []).filter(a =>
    assetSearch === "" ||
    a.sym.includes(assetSearch.toUpperCase()) ||
    a.name.toLowerCase().includes(assetSearch.toLowerCase())
  );

  const selectAsset = useCallback((asset: AssetItem) => {
    setCurrentAsset(asset);
    setCurrentType("completo");
    setAnalysisText("");
    setShowAnalysis(false);
    setErrorMsg("");
    const s = Math.floor(55 + Math.random() * 35);
    setScore(s);
    runAnalysis(asset, "completo");
  }, []);

  const runAnalysis = useCallback(async (asset: AssetItem, type: string) => {
    if (isStreaming) return;

    setShowThinking(true);
    setShowAnalysis(false);
    setErrorMsg("");
    setAnalysisText("");
    setIsStreaming(true);

    const thinkMsgs = [
      "LEYENDO SEÑALES DE MERCADO...",
      "PROCESANDO ESTRUCTURA TÉCNICA...",
      "CORRELACIONANDO DATOS MACRO...",
      "EVALUANDO FLUJO INSTITUCIONAL...",
      "GENERANDO ANÁLISIS...",
    ];
    let idx = 0;
    const thinkIv = setInterval(() => {
      setThinkingMsg(thinkMsgs[idx % thinkMsgs.length]);
      idx++;
    }, 800);

    abortRef.current = new AbortController();

    try {
      const prompt = buildPrompt(asset, type);
      const resp = await fetch("/api/psy-brain/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
        signal: abortRef.current.signal,
      });

      if (!resp.ok) throw new Error(`Error ${resp.status}`);

      clearInterval(thinkIv);
      setShowThinking(false);
      setShowAnalysis(true);

      const reader = resp.body!.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let full = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6).trim();
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.done) break;
              if (parsed.text) {
                full += parsed.text;
                setAnalysisText(full);
                if (messagesRef.current) messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
              }
              if (parsed.error) throw new Error(parsed.error);
            } catch {}
          }
        }
      }

      setHistory(prev => [{ asset: asset.sym, type, ts: new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }) }, ...prev.slice(0, 9)]);
    } catch (err: unknown) {
      clearInterval(thinkIv);
      setShowThinking(false);
      if ((err as Error).name !== "AbortError") {
        setErrorMsg(`Error al conectar con PSY BRAIN: ${(err as Error).message}`);
      }
    } finally {
      setIsStreaming(false);
    }
  }, [isStreaming]);

  const handleTypeChange = (type: string) => {
    if (isStreaming || !currentAsset) return;
    setCurrentType(type);
    runAnalysis(currentAsset, type);
  };

  if (!auth || !isElite(auth)) {
    return (
      <div style={{ minHeight: "100vh", background: "#020406", color: "#dceaf5", fontFamily: "'JetBrains Mono', monospace" }}>
        <SiteNav />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "80vh", gap: 16 }}>
          <div style={{ fontSize: "2rem" }}>🧠</div>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: "1.5rem", fontWeight: 800, color: "#e8c547" }}>PSY BRAIN</div>
          <div style={{ color: "#5a8099", fontSize: "0.8rem", letterSpacing: "0.1em" }}>REQUIERE PLAN ELITE</div>
          <a href="/pricing" style={{ marginTop: 8, padding: "10px 24px", background: "rgba(232,197,71,0.1)", border: "1px solid #e8c54780", color: "#e8c547", textDecoration: "none", fontSize: "0.75rem", letterSpacing: "0.1em" }}>VER PLANES →</a>
        </div>
      </div>
    );
  }

  const scoreColor = score > 75 ? "#1aeb8a" : score > 50 ? "#22d4f5" : "#f0a020";
  const circumference = 188.5;
  const offset = circumference - (score / 100) * circumference;

  const GROUPS = [
    { key: "equities", label: "ACCIONES" },
    { key: "indices",  label: "ÍNDICES"  },
    { key: "macro",    label: "MACRO"    },
    { key: "crypto",   label: "CRYPTO"   },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#020406", color: "#dceaf5", fontFamily: "'JetBrains Mono', monospace", overflow: "hidden" }}>
      <SiteNav />

      {/* Header */}
      <div style={{ borderBottom: "1px solid #1e3650", background: "rgba(5,11,18,0.9)", display: "grid", gridTemplateColumns: "auto 1fr auto", alignItems: "center", height: 48, position: "sticky", top: 64, zIndex: 50, padding: "0 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, border: "1px solid #c9a82c", borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(232,197,71,.08)", fontFamily: "'Syne',sans-serif", fontSize: "0.6rem", fontWeight: 800, color: "#e8c547" }}>PSY</div>
          <div>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "0.8rem", fontWeight: 700, color: "#f0f8ff", letterSpacing: "0.05em" }}>PSY BRAIN</div>
            <div style={{ fontSize: "0.45rem", color: "#e8c547", letterSpacing: "0.2em" }}>ANALISTA IA INSTITUCIONAL</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", border: "1px solid #1e3650", borderRadius: 20, background: "rgba(26,235,138,.04)" }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#1aeb8a", animation: "pulse 2.5s ease-in-out infinite" }} />
            <span style={{ fontSize: "0.55rem", color: "#1aeb8a", letterSpacing: "0.12em" }}>SISTEMA ACTIVO</span>
          </div>
          <div style={{ fontSize: "0.55rem", color: "#3d6480", padding: "4px 10px", border: "1px solid #1e3650", borderRadius: 20 }}>claude-sonnet-4</div>
        </div>
        <div style={{ fontSize: "0.65rem", color: "#22d4f5", letterSpacing: "0.05em" }}>{clock}</div>
      </div>

      {/* 3-column layout */}
      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr 300px", height: "calc(100vh - 112px)", overflow: "hidden" }}>

        {/* LEFT — Asset selector */}
        <div style={{ borderRight: "1px solid #1e3650", background: "#050b12", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Group tabs */}
          <div style={{ padding: "10px 12px 0", borderBottom: "1px solid #1e3650", flexShrink: 0 }}>
            <div style={{ fontSize: "0.48rem", color: "#3d6480", letterSpacing: "0.2em", marginBottom: 8 }}>SELECCIONAR ACTIVO</div>
            <div style={{ display: "flex", gap: 2, marginBottom: -1 }}>
              {GROUPS.map(g => (
                <button key={g.key} onClick={() => { setCurrentGroup(g.key as keyof typeof ASSETS); setAssetSearch(""); }}
                  style={{ flex: 1, padding: "5px 4px", border: "none", borderBottom: currentGroup === g.key ? "2px solid #e8c547" : "2px solid transparent", background: "transparent", color: currentGroup === g.key ? "#e8c547" : "#5a8099", fontSize: "0.42rem", letterSpacing: "0.1em", cursor: "pointer", transition: "all .15s" }}>
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search */}
          <div style={{ padding: "8px 12px", borderBottom: "1px solid #172a3f", flexShrink: 0 }}>
            <input
              value={assetSearch} onChange={e => setAssetSearch(e.target.value)}
              placeholder="Buscar activo..."
              style={{ width: "100%", background: "#0c1825", border: "1px solid #1e3650", borderRadius: 5, color: "#dceaf5", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.65rem", padding: "6px 10px", outline: "none" }}
            />
          </div>

          {/* Asset list */}
          <div style={{ flex: 1, overflowY: "auto", padding: "4px 6px" }}>
            {filteredAssets.map(asset => {
              const up = asset.pct >= 0;
              const isActive = currentAsset?.sym === asset.sym;
              return (
                <div key={asset.sym} onClick={() => selectAsset(asset)}
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 8px", borderRadius: 5, cursor: "pointer", transition: "all .15s", border: `1px solid ${isActive ? "rgba(34,212,245,.25)" : "transparent"}`, background: isActive ? "rgba(34,212,245,.06)" : "transparent", marginBottom: 2 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Syne', sans-serif", fontSize: "0.5rem", fontWeight: 700, flexShrink: 0, background: asset.bg, border: `1px solid ${asset.color}40`, color: asset.color }}>
                    {asset.sym.substring(0, 2)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "0.72rem", fontWeight: 600, color: isActive ? "#22d4f5" : "#b8d0e0", transition: "color .15s" }}>{asset.sym}</div>
                    <div style={{ fontSize: "0.5rem", color: "#3d6480", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: 1 }}>{asset.name}</div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: "0.68rem", color: "#dceaf5" }}>{fmtPx(asset.px)}</div>
                    <div style={{ fontSize: "0.55rem", marginTop: 1, color: up ? "#1aeb8a" : "#f03060" }}>{up ? "+" : ""}{asset.pct.toFixed(2)}%</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Analysis history */}
          {history.length > 0 && (
            <div style={{ borderTop: "1px solid #1e3650", padding: "8px 12px", flexShrink: 0 }}>
              <div style={{ fontSize: "0.45rem", color: "#3d6480", letterSpacing: "0.2em", marginBottom: 6 }}>HISTORIAL RECIENTE</div>
              {history.slice(0, 4).map((h, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.55rem", color: "#5a8099", marginBottom: 3 }}>
                  <span>{h.asset} · {h.type.toUpperCase()}</span>
                  <span>{h.ts}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CENTER — Analysis */}
        <div style={{ display: "flex", flexDirection: "column", overflow: "hidden", background: "#020406" }}>
          {!currentAsset ? (
            /* Hero state */
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: 40, textAlign: "center" }}>
              <div style={{ fontSize: "3rem", opacity: 0.3 }}>🧠</div>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "1.6rem", fontWeight: 800, color: "#f0f8ff", letterSpacing: "-0.02em" }}>PSY BRAIN</div>
              <div style={{ fontSize: "0.65rem", color: "#3d6480", letterSpacing: "0.15em" }}>ANALISTA INSTITUCIONAL · IA</div>
              <div style={{ fontSize: "0.7rem", color: "#5a8099", maxWidth: 400, lineHeight: 1.8, marginTop: 8 }}>
                Selecciona un activo del panel izquierdo para activar el análisis institucional con Claude Sonnet 4.
              </div>
              <div style={{ display: "flex", gap: 16, marginTop: 16, flexWrap: "wrap", justifyContent: "center" }}>
                {["BTC", "NVDA", "SPX", "XAU"].map(sym => {
                  const asset = Object.values(ASSETS).flat().find(a => a.sym === sym);
                  return asset ? (
                    <button key={sym} onClick={() => { setCurrentGroup(sym === "BTC" ? "crypto" : sym === "SPX" ? "indices" : sym === "XAU" ? "macro" : "equities"); selectAsset(asset); }}
                      style={{ padding: "8px 16px", background: "rgba(34,212,245,.06)", border: "1px solid rgba(34,212,245,.2)", color: "#22d4f5", fontSize: "0.7rem", letterSpacing: "0.1em", cursor: "pointer", transition: "all .2s" }}>
                      {sym}
                    </button>
                  ) : null;
                })}
              </div>
            </div>
          ) : (
            /* Active state */
            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
              {/* Asset header */}
              <div style={{ padding: "12px 20px", borderBottom: "1px solid #172a3f", background: "#050b12", flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Syne',sans-serif", fontSize: "0.6rem", fontWeight: 700, background: currentAsset.bg, border: `1px solid ${currentAsset.color}50`, color: currentAsset.color }}>
                    {currentAsset.sym.substring(0, 2)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "1rem", fontWeight: 600, color: "#f0f8ff" }}>{currentAsset.sym}</div>
                    <div style={{ fontSize: "0.55rem", color: "#5a8099" }}>{currentAsset.name} · {currentAsset.sector}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "1.1rem", color: currentAsset.pct >= 0 ? "#1aeb8a" : "#f03060" }}>{fmtPx(currentAsset.px)}</div>
                    <div style={{ fontSize: "0.65rem", color: currentAsset.pct >= 0 ? "#1aeb8a" : "#f03060" }}>{currentAsset.pct >= 0 ? "▲" : "▼"} {Math.abs(currentAsset.pct).toFixed(2)}%</div>
                  </div>
                </div>
              </div>

              {/* Analysis type buttons */}
              <div style={{ padding: "8px 16px", borderBottom: "1px solid #172a3f", display: "flex", gap: 4, flexWrap: "wrap", flexShrink: 0, background: "#040810" }}>
                {ANALYSIS_TYPES.map(t => (
                  <button key={t.key} onClick={() => handleTypeChange(t.key)} disabled={isStreaming}
                    style={{ padding: "5px 10px", border: `1px solid ${currentType === t.key ? "#e8c547" : "#1e3650"}`, background: currentType === t.key ? "rgba(232,197,71,.1)" : "transparent", color: currentType === t.key ? "#e8c547" : "#5a8099", fontSize: "0.55rem", letterSpacing: "0.08em", cursor: isStreaming ? "default" : "pointer", transition: "all .15s", opacity: isStreaming && currentType !== t.key ? 0.5 : 1 }}>
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Analysis output */}
              <div ref={messagesRef} style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
                {showThinking && (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "40px 0" }}>
                    <div style={{ width: 40, height: 40, border: "2px solid #1e3650", borderTop: "2px solid #e8c547", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                    <div style={{ fontSize: "0.7rem", color: "#e8c547", letterSpacing: "0.1em", animation: "fadePulse 1.5s ease-in-out infinite" }}>{thinkingMsg}</div>
                  </div>
                )}

                {showAnalysis && analysisText && (
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(232,197,71,.1)", border: "1px solid #e8c54760", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.55rem", fontWeight: 700, color: "#e8c547" }}>PSY</div>
                      <div>
                        <div style={{ fontSize: "0.7rem", color: "#e8c547", letterSpacing: "0.08em" }}>PSY BRAIN · {currentType.toUpperCase()} · {currentAsset.sym}</div>
                        <div style={{ fontSize: "0.5rem", color: "#3d6480", marginTop: 1 }}>{isStreaming ? "Generando análisis..." : "Análisis completado"}</div>
                      </div>
                    </div>
                    <div style={{ background: "#0c1825", border: "1px solid #172a3f", borderLeft: "3px solid #e8c547", padding: "16px 18px", fontSize: "0.72rem", lineHeight: 1.8, color: "#b8d0e0" }}
                      dangerouslySetInnerHTML={{ __html: formatAnalysisText(analysisText) + (isStreaming ? '<span style="display:inline-block;width:7px;height:12px;background:#e8c547;animation:blink 0.7s step-end infinite;margin-left:2px;vertical-align:text-bottom;"></span>' : "") }}
                    />
                  </div>
                )}

                {errorMsg && (
                  <div style={{ background: "rgba(240,48,96,.06)", border: "1px solid rgba(240,48,96,.3)", padding: "16px 18px", fontSize: "0.7rem", color: "#f03060", lineHeight: 1.6 }}>
                    ⚠ {errorMsg}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT — Metrics panel */}
        <div style={{ borderLeft: "1px solid #1e3650", background: "#050b12", overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
          {currentAsset ? (
            <>
              {/* PSY Score */}
              <div style={{ background: "#0c1825", border: "1px solid #172a3f", padding: 16, textAlign: "center" }}>
                <div style={{ fontSize: "0.48rem", color: "#3d6480", letterSpacing: "0.2em", marginBottom: 12 }}>PSY SCORE</div>
                <div style={{ position: "relative", display: "inline-block" }}>
                  <svg width="100" height="100" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#172a3f" strokeWidth="4" />
                    <circle cx="50" cy="50" r="40" fill="none" strokeWidth="4"
                      stroke={scoreColor}
                      strokeDasharray={circumference}
                      strokeDashoffset={offset}
                      strokeLinecap="round"
                      transform="rotate(-90 50 50)"
                      style={{ transition: "stroke-dashoffset 1.5s ease, stroke 0.5s ease" }}
                    />
                  </svg>
                  <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center" }}>
                    <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "1.4rem", fontWeight: 800, color: scoreColor, lineHeight: 1 }}>{score}</div>
                    <div style={{ fontSize: "0.45rem", color: "#3d6480" }}>/100</div>
                  </div>
                </div>
                {[
                  { name: "Técnico",      score: currentAsset.rsi,                color: "#22d4f5" },
                  { name: "Macro",        score: Math.floor(40 + Math.random() * 50), color: "#e8c547" },
                  { name: "Institucional",score: Math.floor(45 + Math.random() * 40), color: "#9060f0" },
                  { name: "Opciones",     score: Math.floor(35 + Math.random() * 55), color: "#1aeb8a" },
                ].map(d => (
                  <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
                    <div style={{ width: 5, height: 5, borderRadius: "50%", background: d.color, flexShrink: 0 }} />
                    <span style={{ fontSize: "0.55rem", color: "#5a8099", flex: 1 }}>{d.name}</span>
                    <span style={{ fontSize: "0.6rem", color: d.color, fontWeight: 600 }}>{d.score}</span>
                  </div>
                ))}
              </div>

              {/* Key metrics */}
              <div style={{ background: "#0c1825", border: "1px solid #172a3f", padding: 12 }}>
                <div style={{ fontSize: "0.48rem", color: "#3d6480", letterSpacing: "0.2em", marginBottom: 10 }}>MÉTRICAS CLAVE</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                  {[
                    { lbl: "MARKET CAP", val: currentAsset.mcap || "—", col: "var(--c,#dceaf5)" },
                    { lbl: "P/E RATIO",  val: currentAsset.pe ? `${currentAsset.pe}x` : "—", col: "#dceaf5" },
                    { lbl: "BETA",       val: currentAsset.beta ? currentAsset.beta.toFixed(2) : "—", col: "#dceaf5" },
                    { lbl: "RSI (14)",   val: String(currentAsset.rsi) || "—", col: (currentAsset.rsi ?? 50) > 70 ? "#f03060" : (currentAsset.rsi ?? 50) < 30 ? "#1aeb8a" : "#dceaf5" },
                    { lbl: "SHORT INT.", val: currentAsset.si || "—", col: "#dceaf5" },
                    { lbl: "IV",         val: currentAsset.iv || "—", col: "#dceaf5" },
                  ].map(m => (
                    <div key={m.lbl} style={{ background: "#08111c", border: "1px solid #172a3f", padding: "7px 9px" }}>
                      <div style={{ fontSize: "0.45rem", color: "#3d6480", letterSpacing: "0.1em", marginBottom: 3 }}>{m.lbl}</div>
                      <div style={{ fontSize: "0.75rem", fontFamily: "'Syne',sans-serif", fontWeight: 700, color: m.col }}>{m.val}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Confluence */}
              <div style={{ background: "#0c1825", border: "1px solid #172a3f", padding: 12 }}>
                <div style={{ fontSize: "0.48rem", color: "#3d6480", letterSpacing: "0.2em", marginBottom: 10 }}>CONFLUENCIA</div>
                {[
                  { lbl: "Momentum",    val: currentAsset.rsi,                        color: "#22d4f5" },
                  { lbl: "Tendencia",   val: currentAsset.pct > 0 ? 72 : 35,          color: "#1aeb8a" },
                  { lbl: "Volumen",     val: Math.floor(45 + Math.random() * 40),      color: "#e8c547" },
                  { lbl: "Sentimiento", val: Math.floor(40 + Math.random() * 50),      color: "#9060f0" },
                  { lbl: "Smart Money", val: Math.floor(50 + Math.random() * 45),      color: "#f0a020" },
                  { lbl: "Opciones",    val: Math.floor(35 + Math.random() * 55),      color: "#1aeb8a" },
                ].map(d => (
                  <div key={d.lbl} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: "0.55rem", color: "#5a8099", width: 72, flexShrink: 0 }}>{d.lbl}</span>
                    <div style={{ flex: 1, height: 3, background: "#1e3650", borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ height: "100%", background: d.color, width: `${d.val}%`, transition: "width 1s ease" }} />
                    </div>
                    <span style={{ fontSize: "0.55rem", color: d.color, width: 24, textAlign: "right" }}>{d.val}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, opacity: 0.3 }}>
              {[80, 60, 90, 40].map((h, i) => (
                <div key={i} style={{ background: "#0c1825", border: "1px solid #172a3f", height: h, borderRadius: 4 }} />
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1;box-shadow:0 0 4px #1aeb8a;} 50%{opacity:.5;box-shadow:none;} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes fadePulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: #1e3650; }
      `}</style>
    </div>
  );
}
