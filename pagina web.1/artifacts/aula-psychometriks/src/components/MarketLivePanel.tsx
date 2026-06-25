import React, { useState, useEffect, useCallback, useRef } from "react";
import { User } from "../auth/types";

interface MarketQuote {
  symbol: string; name: string; price: number; change: number;
  changePct: number; volume: number; marketCap?: number;
  high?: number; low?: number; high52w?: number; low52w?: number;
  pe?: number; currency: string;
}

interface MarketData {
  stocks: MarketQuote[]; forex: MarketQuote[]; commodities: MarketQuote[];
}

interface AIState { text: string; loading: boolean; symbol: string | null; }

const API_BASE = "/api";

const MAG7 = new Set(["AAPL","MSFT","AMZN","GOOGL","META","NVDA","TSLA"]);

const COMMODITY_NAMES: Record<string, string> = {
  "GC=F": "Oro (XAU/USD)", "SI=F": "Plata (XAG/USD)", "CL=F": "Petróleo WTI",
  "BZ=F": "Petróleo Brent", "NG=F": "Gas Natural", "HG=F": "Cobre",
  "PL=F": "Platino", "KC=F": "Café", "ZW=F": "Trigo", "ZC=F": "Maíz",
};

const FOREX_NAMES: Record<string, string> = {
  "EURUSD=X": "EUR/USD", "GBPUSD=X": "GBP/USD", "USDJPY=X": "USD/JPY",
  "USDCHF=X": "USD/CHF", "AUDUSD=X": "AUD/USD", "USDCAD=X": "USD/CAD",
  "NZDUSD=X": "NZD/USD", "EURGBP=X": "EUR/GBP", "EURJPY=X": "EUR/JPY",
  "GBPJPY=X": "GBP/JPY",
};

type Tab = "stocks" | "forex" | "commodities";
type Filter = "todos" | "mag7" | "tech" | "finance";

function pct(v: number) { return v >= 0 ? `+${v.toFixed(2)}%` : `${v.toFixed(2)}%`; }
function fmtPrice(v: number, currency = "USD") {
  if (currency !== "USD") return v.toFixed(4);
  if (v >= 1000) return `$${v.toLocaleString("en", { maximumFractionDigits: 0 })}`;
  if (v >= 10)   return `$${v.toFixed(2)}`;
  if (v >= 0.1)  return `$${v.toFixed(3)}`;
  return `$${v.toFixed(5)}`;
}

function MiniBar({ changePct }: { changePct: number }) {
  const pct = Math.min(Math.abs(changePct) / 5, 1);
  const color = changePct >= 0 ? "#00e676" : "#ff1744";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, height: 16 }}>
      <div style={{
        height: 4, borderRadius: 2,
        width: `${Math.max(pct * 60, 4)}px`,
        background: color, opacity: 0.7, flexShrink: 0,
      }} />
      <span style={{ color, fontSize: 11, fontFamily: "'Share Tech Mono',monospace", fontWeight: 700 }}>
        {pct_str(changePct)}
      </span>
    </div>
  );
}

function pct_str(v: number) { return v >= 0 ? `+${v.toFixed(2)}%` : `${v.toFixed(2)}%`; }

function QuoteRow({
  q, onAI, isAnalyzing, isSelected
}: {
  q: MarketQuote;
  onAI: (q: MarketQuote) => void;
  isAnalyzing: boolean;
  isSelected: boolean;
}) {
  const up = q.changePct >= 0;
  const isMag7 = MAG7.has(q.symbol);
  const displayName = COMMODITY_NAMES[q.symbol] || FOREX_NAMES[q.symbol] || q.name;

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "2.5fr 1.2fr 1.2fr 1fr auto",
      alignItems: "center", gap: 8,
      padding: "10px 16px",
      borderBottom: "1px solid var(--border)",
      background: isSelected ? "rgba(0,229,255,0.04)" : "transparent",
      transition: "background 0.15s",
    }}>
      {/* Name */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {isMag7 && (
          <span style={{
            fontSize: 8, background: "rgba(255,215,0,0.15)", border: "1px solid rgba(255,215,0,0.3)",
            color: "#ffd700", padding: "1px 5px", borderRadius: 2,
            fontFamily: "'Share Tech Mono',monospace", letterSpacing: 1, flexShrink: 0,
          }}>MAG7</span>
        )}
        <div>
          <div style={{
            fontFamily: "'Share Tech Mono',monospace", fontSize: 12,
            color: "var(--text)", fontWeight: 700, letterSpacing: 1,
          }}>{q.symbol.replace("=X","").replace("=F","")}</div>
          <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 1, lineHeight: 1.2 }}>{displayName}</div>
        </div>
      </div>
      {/* Price */}
      <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 13, color: "var(--text)", fontWeight: 700 }}>
        {fmtPrice(q.price, q.currency)}
      </div>
      {/* Change */}
      <MiniBar changePct={q.changePct} />
      {/* P/E */}
      <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 11, color: "var(--muted)" }}>
        {q.pe ? `P/E ${q.pe.toFixed(1)}` : "—"}
      </div>
      {/* AI btn */}
      <button
        onClick={() => onAI(q)}
        disabled={isAnalyzing}
        style={{
          background: isSelected ? "rgba(224,64,251,0.15)" : "rgba(224,64,251,0.06)",
          border: `1px solid ${isSelected ? "#e040fb66" : "#e040fb22"}`,
          color: "#e040fb", fontSize: 11, fontFamily: "'Share Tech Mono',monospace",
          padding: "4px 10px", cursor: isAnalyzing ? "wait" : "pointer",
          letterSpacing: 0.5, transition: "all 0.2s",
          opacity: isAnalyzing && !isSelected ? 0.4 : 1,
        }}
      >
        {isAnalyzing && isSelected ? "⏳" : "PSY IA"}
      </button>
    </div>
  );
}

function AIPanel({ ai, onClose }: { ai: AIState; onClose: () => void }) {
  return (
    <div style={{
      background: "var(--bg2)", border: "1px solid rgba(224,64,251,0.25)",
      borderRadius: 6, padding: 20, position: "relative",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 6, height: 6, borderRadius: "50%",
            background: "#e040fb", animation: ai.loading ? "pulse 1s infinite" : "none",
          }} />
          <span style={{
            fontFamily: "'Orbitron',monospace", fontSize: 10,
            color: "#e040fb", letterSpacing: 3,
          }}>PSY IA — ANÁLISIS {ai.symbol}</span>
        </div>
        <button onClick={onClose} style={{
          background: "none", border: "none", color: "var(--muted)",
          cursor: "pointer", fontSize: 16, padding: "2px 6px",
        }}>✕</button>
      </div>
      {ai.loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[85, 60, 75, 50, 65].map((w, i) => (
            <div key={i} style={{
              height: 11, background: "var(--border)", borderRadius: 2,
              width: `${w}%`, animation: `pulse 1.5s ${i * 0.15}s infinite`,
            }} />
          ))}
        </div>
      ) : (
        <div style={{
          fontFamily: "'Rajdhani',sans-serif", fontSize: 14,
          color: "var(--muted)", lineHeight: 1.7, whiteSpace: "pre-wrap",
        }}>
          {ai.text}
        </div>
      )}
    </div>
  );
}

interface Props { currentUser: User; }

export function MarketLivePanel({ currentUser: _ }: Props) {
  const [tab, setTab]     = useState<Tab>("stocks");
  const [filter, setFilter] = useState<Filter>("todos");
  const [data, setData]   = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]  = useState<string | null>(null);
  const [ai, setAi]       = useState<AIState>({ text: "", loading: false, symbol: null });
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const r = await fetch(`${API_BASE}/market/all`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const d = await r.json() as MarketData;
      setData(d); setLastUpdate(new Date());
    } catch (e) {
      setError("Error cargando datos de mercado — reintentando en 60s");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchData();
    timerRef.current = setInterval(fetchData, 60_000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [fetchData]);

  const requestAI = useCallback(async (q: MarketQuote) => {
    const displayName = COMMODITY_NAMES[q.symbol] || FOREX_NAMES[q.symbol] || q.name;
    setAi({ text: "", loading: true, symbol: q.symbol });
    try {
      const r = await fetch(`${API_BASE}/psy-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Análisis profesional completo de ${displayName} (${q.symbol}). Precio actual: ${fmtPrice(q.price, q.currency)} (${pct(q.changePct)} 24h). ${q.pe ? `P/E: ${q.pe.toFixed(1)}.` : ""} ${q.high52w ? `Máximo 52 semanas: ${fmtPrice(q.high52w, q.currency)}, Mínimo: ${fmtPrice(q.low52w ?? 0, q.currency)}.` : ""} Dame: 1) Contexto actual del activo, 2) Niveles técnicos clave (zonas de demanda/oferta, OB relevantes), 3) Sesgo institucional y qué está pasando con el dinero grande, 4) Qué vigilar esta semana. Sé contundente y específico con números.`,
        }),
      });
      const d = await r.json() as { reply?: string };
      setAi({ text: d.reply ?? "Sin respuesta del modelo.", loading: false, symbol: q.symbol });
    } catch {
      setAi({ text: "Error al contactar PSY IA. Intenta de nuevo.", loading: false, symbol: q.symbol });
    }
  }, []);

  // Filter stocks
  const visibleStocks = (data?.stocks ?? []).filter(q => {
    if (filter === "mag7")    return MAG7.has(q.symbol);
    if (filter === "tech")    return ["AAPL","MSFT","AMZN","GOOGL","META","NVDA","TSLA","NFLX","AMD","INTC","CRM","ORCL","ADBE","UBER","COIN"].includes(q.symbol);
    if (filter === "finance") return ["JPM","GS","MS","BAC","WFC","SPY","QQQ","DIA","IWM"].includes(q.symbol);
    return true;
  });

  const currentList = tab === "stocks" ? visibleStocks : tab === "forex" ? (data?.forex ?? []) : (data?.commodities ?? []);

  const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: "stocks",      label: "ACCIONES",    icon: "📈" },
    { id: "forex",       label: "FOREX",       icon: "💱" },
    { id: "commodities", label: "COMMODITIES", icon: "🥇" },
  ];

  const bullish  = currentList.filter(q => q.changePct > 0).length;
  const bearish  = currentList.filter(q => q.changePct < 0).length;
  const topGain  = [...currentList].sort((a,b) => b.changePct - a.changePct)[0];
  const topLoss  = [...currentList].sort((a,b) => a.changePct - b.changePct)[0];

  return (
    <div style={{ padding: "24px 24px 40px", maxWidth: 1200, margin: "0 auto" }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#00e676", display: "inline-block", animation: "pulse 1.5s infinite" }} />
          <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 10, color: "#00e676", letterSpacing: 4 }}>MERCADOS EN VIVO</span>
          {lastUpdate && (
            <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color: "var(--muted)", marginLeft: "auto" }}>
              ↻ {lastUpdate.toLocaleTimeString("es-EC")}
            </span>
          )}
        </div>
        <h1 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 32, letterSpacing: 4, margin: 0, lineHeight: 1 }}>
          ACCIONES <span style={{ color: "var(--cyan)" }}>& MERCADOS</span>
        </h1>
        <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 6, fontFamily: "'Rajdhani',sans-serif" }}>
          Mag7 · S&P 500 · NASDAQ · Forex · Commodities · 30+ pares con análisis IA
        </p>
      </div>

      {/* ── Summary cards ── */}
      {data && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 20 }}>
          {[
            { l: "ALCISTAS", v: `${bullish}/${currentList.length}`, c: "#00e676" },
            { l: "BAJISTAS",  v: `${bearish}/${currentList.length}`, c: "#ff1744" },
            { l: "MAYOR GANADOR",  v: topGain ? `${topGain.symbol.replace("=X","").replace("=F","")} ${pct(topGain.changePct)}` : "—", c: "#00e676" },
            { l: "MAYOR PÉRDIDA", v: topLoss ? `${topLoss.symbol.replace("=X","").replace("=F","")} ${pct(topLoss.changePct)}` : "—", c: "#ff1744" },
          ].map((s,i) => (
            <div key={i} style={{
              background: "var(--bg2)", border: "1px solid var(--border)",
              borderRadius: 4, padding: "12px 14px",
            }}>
              <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color: "var(--muted)", letterSpacing: 2, marginBottom: 4 }}>{s.l}</div>
              <div style={{ fontFamily: "'Orbitron',monospace", fontSize: 14, color: s.c, fontWeight: 700 }}>{s.v}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Tabs ── */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--border)", marginBottom: 0 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setFilter("todos"); }}
            style={{
              background: "none", border: "none", borderBottom: `2px solid ${tab === t.id ? "var(--cyan)" : "transparent"}`,
              color: tab === t.id ? "var(--cyan)" : "var(--muted)",
              padding: "10px 18px", cursor: "pointer",
              fontFamily: "'Share Tech Mono',monospace", fontSize: 11, letterSpacing: 2,
              transition: "all 0.2s", marginBottom: -1,
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
        <button onClick={fetchData} disabled={loading}
          style={{
            marginLeft: "auto", background: "none", border: "none",
            color: loading ? "var(--muted)" : "var(--cyan)",
            cursor: loading ? "wait" : "pointer",
            fontFamily: "'Share Tech Mono',monospace", fontSize: 10,
            padding: "10px 16px", letterSpacing: 1,
          }}>
          {loading ? "⏳ CARGANDO..." : "↺ ACTUALIZAR"}
        </button>
      </div>

      {/* ── Stock filters ── */}
      {tab === "stocks" && (
        <div style={{ display: "flex", gap: 6, padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
          {(["todos","mag7","tech","finance"] as Filter[]).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{
                background: filter === f ? "rgba(0,229,255,0.1)" : "none",
                border: `1px solid ${filter === f ? "var(--cyan)" : "var(--border)"}`,
                color: filter === f ? "var(--cyan)" : "var(--muted)",
                padding: "4px 12px", cursor: "pointer",
                fontFamily: "'Share Tech Mono',monospace", fontSize: 10,
                letterSpacing: 1, transition: "all 0.2s",
              }}>
              {f === "todos" ? "TODOS" : f === "mag7" ? "⚡ MAG7" : f === "tech" ? "TECH" : "FINANZAS"}
            </button>
          ))}
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div style={{
          background: "rgba(255,23,68,0.05)", border: "1px solid rgba(255,23,68,0.2)",
          color: "#ff1744", padding: "12px 16px", margin: "12px 0",
          fontFamily: "'Share Tech Mono',monospace", fontSize: 11,
        }}>{error}</div>
      )}

      {/* ── Table header ── */}
      <div style={{
        display: "grid", gridTemplateColumns: "2.5fr 1.2fr 1.2fr 1fr auto",
        gap: 8, padding: "8px 16px",
        borderBottom: "1px solid var(--border)", background: "var(--bg3)",
      }}>
        {["ACTIVO", "PRECIO", "VARIACIÓN 24H", "P/E", "ANÁLISIS IA"].map((h, i) => (
          <div key={i} style={{
            fontFamily: "'Share Tech Mono',monospace", fontSize: 9,
            color: "var(--muted)", letterSpacing: 2, textTransform: "uppercase",
          }}>{h}</div>
        ))}
      </div>

      {/* ── Rows ── */}
      <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderTop: "none" }}>
        {!data && !loading && (
          <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--muted)", fontFamily: "'Share Tech Mono',monospace", fontSize: 12 }}>
            Cargando datos de mercado...
          </div>
        )}
        {loading && !data && (
          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{
                padding: "14px 16px", borderBottom: "1px solid var(--border)",
                display: "grid", gridTemplateColumns: "2.5fr 1.2fr 1.2fr 1fr auto", gap: 8,
              }}>
                {[90, 70, 60, 30, 50].map((w, j) => (
                  <div key={j} style={{
                    height: 12, background: "var(--border)", borderRadius: 2,
                    width: `${w}%`, animation: `pulse 1.5s ${i * 0.05}s infinite`,
                  }} />
                ))}
              </div>
            ))}
          </div>
        )}
        {currentList.map(q => (
          <React.Fragment key={q.symbol}>
            <QuoteRow
              q={q}
              onAI={requestAI}
              isAnalyzing={ai.loading}
              isSelected={ai.symbol === q.symbol}
            />
            {ai.symbol === q.symbol && (ai.loading || ai.text) && (
              <div style={{ padding: "12px 16px 16px", borderBottom: "1px solid var(--border)" }}>
                <AIPanel ai={ai} onClose={() => setAi({ text: "", loading: false, symbol: null })} />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* ── Disclaimer ── */}
      <div style={{
        marginTop: 20, padding: "12px 16px",
        background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 4,
        fontFamily: "'Share Tech Mono',monospace", fontSize: 10, color: "var(--muted)", lineHeight: 1.6,
      }}>
        ⚠️ DATOS VÍA YAHOO FINANCE. ACTUALIZACIÓN CADA 60 SEGUNDOS. SOLO CON FINES EDUCATIVOS — NO CONSTITUYE ASESORÍA FINANCIERA.
        EL ANÁLISIS PSY IA ES AUTOMATIZADO Y NO REEMPLAZA EL ANÁLISIS PROPIO. OPERA CON RIESGO GESTIONADO.
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
