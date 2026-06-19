import React, { useState, useEffect, useCallback } from "react";
import SiteNav from "@/components/site-nav";

// ─── Types ───────────────────────────────────────────────────────────────────
interface Token {
  id: number; mode: string; token_name: string; ticker: string;
  description: string; image_url?: string; company_name?: string;
  company_website?: string; company_twitter?: string;
  contract_address?: string; curve_address?: string;
  price: number; market_cap: number; volume_24h: number;
  bnb_raised: number; holders_count: number; total_supply: number;
  status: string; graduated_at?: string; pancakeswap_url?: string;
  created_at: string;
}
interface Trade {
  id: number; wallet: string; type: string;
  amount_tokens: number; amount_bnb: number;
  price: number; tx_hash?: string; created_at: string;
}
interface Holder {
  rank: number; wallet: string; balance: number; pct_supply: string;
  avg_entry: string; current_value: string; pnl: string; pnl_pct: string;
}
interface ChartPoint { price: number; market_cap: number; created_at: string; }

const API = "/api/psy-launch";

const fmtBNB = (n: number) => n ? n.toFixed(4) + " BNB" : "0 BNB";
const fmtCap = (n: number) => {
  if (!n) return "$0";
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
};
const fmtPrice = (n: number) => {
  if (!n) return "0";
  if (n < 0.0001) return n.toExponential(4);
  return n.toFixed(8);
};
const shortWallet = (w: string) => w ? `${w.slice(0, 6)}…${w.slice(-4)}` : "—";

// ─── Mini sparkline using SVG ─────────────────────────────────────────────
function Sparkline({ points }: { points: ChartPoint[] }) {
  if (!points.length) return <div className="w-full h-12 bg-[#0a0f1a]" />;
  const prices = points.map(p => Number(p.price));
  const min = Math.min(...prices), max = Math.max(...prices);
  const range = max - min || 1;
  const W = 200, H = 48;
  const pts = prices.map((p, i) => {
    const x = (i / Math.max(prices.length - 1, 1)) * W;
    const y = H - ((p - min) / range) * H;
    return `${x},${y}`;
  }).join(" ");
  const isUp = prices[prices.length - 1]! >= prices[0]!;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-12" preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke={isUp ? "#00e676" : "#ff3c5c"} strokeWidth="1.5" />
    </svg>
  );
}

// ─── Token Card ───────────────────────────────────────────────────────────
function TokenCard({ token, onClick }: { token: Token; onClick: () => void }) {
  const [chart, setChart] = useState<ChartPoint[]>([]);
  useEffect(() => {
    fetch(`${API}/tokens/${token.id}/chart`)
      .then(r => r.json()).then(d => setChart(d.points ?? [])).catch(() => {});
  }, [token.id]);

  return (
    <div
      onClick={onClick}
      className="border border-[#1a2535] bg-[#060a12] hover:border-[#00e5ff44] transition-colors cursor-pointer p-4"
    >
      <div className="flex items-center gap-3 mb-2">
        {token.image_url
          ? <img src={token.image_url} alt="" className="w-10 h-10 rounded-full object-cover" />
          : <div className="w-10 h-10 rounded-full bg-[#00e5ff22] flex items-center justify-center font-bebas text-[#00e5ff] text-lg">{token.ticker[0]}</div>
        }
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bebas text-lg">{token.ticker}</span>
            <span className="font-space text-[10px] text-[#7ab3c8]">{token.token_name}</span>
            {token.mode === "verified" && (
              <span className="text-[9px] font-space bg-[#00e67622] text-[#00e676] px-1.5 py-0.5">✓ VERIFICADO</span>
            )}
            {token.status === "graduated" && (
              <span className="text-[9px] font-space bg-[#ffd70022] text-[#ffd700] px-1.5 py-0.5">🎓 GRADUADO</span>
            )}
          </div>
          <div className="font-space text-[10px] text-[#5a6a80] truncate">{token.description}</div>
        </div>
      </div>

      <Sparkline points={chart} />

      <div className="grid grid-cols-3 gap-2 mt-3 text-[10px] font-space">
        <div>
          <div className="text-[#5a6a80]">Precio</div>
          <div className="text-white">{fmtPrice(Number(token.price))} BNB</div>
        </div>
        <div>
          <div className="text-[#5a6a80]">Mkt Cap</div>
          <div className="text-white">{fmtCap(Number(token.market_cap))}</div>
        </div>
        <div>
          <div className="text-[#5a6a80]">Holders</div>
          <div className="text-white">{token.holders_count}</div>
        </div>
      </div>
    </div>
  );
}

// ─── Token Detail Modal ────────────────────────────────────────────────────
function TokenModal({ token, onClose }: { token: Token; onClose: () => void }) {
  const [tab, setTab] = useState<"info" | "trades" | "holders">("info");
  const [trades, setTrades] = useState<Trade[]>([]);
  const [holders, setHolders] = useState<Holder[]>([]);
  const [chart, setChart] = useState<ChartPoint[]>([]);

  useEffect(() => {
    fetch(`${API}/tokens/${token.id}/chart`).then(r => r.json()).then(d => setChart(d.points ?? [])).catch(() => {});
    fetch(`${API}/tokens/${token.id}/trades`).then(r => r.json()).then(d => setTrades(d.items ?? [])).catch(() => {});
    fetch(`${API}/tokens/${token.id}/holders`).then(r => r.json()).then(d => setHolders(d.items ?? [])).catch(() => {});
  }, [token.id]);

  // Bonding curve progress (graduate at 69 BNB raised — similar a Pump.fun)
  const GRAD_TARGET = 69;
  const progress = Math.min((Number(token.bnb_raised) / GRAD_TARGET) * 100, 100);

  return (
    <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#060a12] border border-[#1a2535] w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center gap-3 p-5 border-b border-[#1a2535]">
          {token.image_url
            ? <img src={token.image_url} alt="" className="w-12 h-12 rounded-full object-cover" />
            : <div className="w-12 h-12 rounded-full bg-[#00e5ff22] flex items-center justify-center font-bebas text-[#00e5ff] text-xl">{token.ticker[0]}</div>
          }
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bebas text-2xl">{token.ticker}</span>
              <span className="font-space text-[12px] text-[#7ab3c8]">{token.token_name}</span>
              {token.mode === "verified" && <span className="text-[9px] font-space bg-[#00e67622] text-[#00e676] px-1.5 py-0.5">✓ VERIFICADO</span>}
              {token.status === "graduated" && <span className="text-[9px] font-space bg-[#ffd70022] text-[#ffd700] px-1.5 py-0.5">🎓 GRADUADO</span>}
            </div>
            <p className="text-[#7ab3c8] font-space text-[11px] mt-0.5">{token.description}</p>
          </div>
          <button onClick={onClose} className="text-[#7ab3c8] text-xl ml-2">✕</button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-0 border-b border-[#1a2535]">
          {[
            { label: "Precio", value: fmtPrice(Number(token.price)) + " BNB" },
            { label: "Mkt Cap", value: fmtCap(Number(token.market_cap)) },
            { label: "Vol 24h", value: fmtBNB(Number(token.volume_24h)) },
            { label: "Holders", value: String(token.holders_count) },
          ].map(s => (
            <div key={s.label} className="p-4 border-r border-[#1a2535] last:border-r-0">
              <div className="text-[9px] font-space text-[#5a6a80] uppercase">{s.label}</div>
              <div className="font-bebas text-lg mt-0.5">{s.value}</div>
            </div>
          ))}
        </div>

        {/* Bonding curve progress */}
        <div className="p-5 border-b border-[#1a2535]">
          <div className="flex justify-between text-[10px] font-space text-[#7ab3c8] mb-2">
            <span>Bonding Curve Progress</span>
            <span>{fmtBNB(Number(token.bnb_raised))} / {GRAD_TARGET} BNB</span>
          </div>
          <div className="h-3 bg-[#0a0f1a] relative overflow-hidden">
            <div
              className="h-full transition-all duration-500"
              style={{ width: `${progress}%`, background: progress >= 100 ? "#ffd700" : "linear-gradient(90deg, #00e5ff, #00e676)" }}
            />
          </div>
          <div className="text-[10px] font-space text-[#5a6a80] mt-1.5">
            {progress >= 100
              ? "🎓 Listo para graduarse a PancakeSwap"
              : `Al llegar a ${GRAD_TARGET} BNB el token se gradúa automáticamente a PancakeSwap`}
          </div>
          {token.graduated_at && token.pancakeswap_url && (
            <a
              href={token.pancakeswap_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-2 text-[11px] font-space text-[#ffd700] hover:underline"
            >
              🥞 Ver en PancakeSwap →
            </a>
          )}
        </div>

        {/* Sparkline chart */}
        {chart.length > 1 && (
          <div className="px-5 pt-4 border-b border-[#1a2535] pb-2">
            <div className="text-[10px] font-space text-[#7ab3c8] mb-2">Histórico de precio</div>
            <Sparkline points={chart} />
          </div>
        )}

        {/* Contract / Links */}
        {(token.contract_address || token.company_website || token.company_twitter) && (
          <div className="p-5 border-b border-[#1a2535] flex flex-wrap gap-3 text-[11px] font-space">
            {token.contract_address && (
              <a
                href={`https://bscscan.com/token/${token.contract_address}`}
                target="_blank" rel="noopener noreferrer"
                className="text-[#00e5ff] hover:underline"
              >
                📋 {shortWallet(token.contract_address)} (BscScan)
              </a>
            )}
            {token.company_website && (
              <a href={token.company_website} target="_blank" rel="noopener noreferrer" className="text-[#7ab3c8] hover:underline">
                🌐 Website
              </a>
            )}
            {token.company_twitter && (
              <a
                href={`https://x.com/${token.company_twitter.replace("@", "")}`}
                target="_blank" rel="noopener noreferrer"
                className="text-[#7ab3c8] hover:underline"
              >
                🐦 {token.company_twitter}
              </a>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-[#1a2535]">
          {(["info", "trades", "holders"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-3 text-[11px] font-space uppercase tracking-wider transition-colors ${tab === t ? "text-[#00e5ff] border-b-2 border-[#00e5ff] bg-[#00e5ff0a]" : "text-[#7ab3c8] hover:text-white"}`}
            >
              {t === "info" ? "Info" : t === "trades" ? `Trades (${trades.length})` : `Holders (${holders.length})`}
            </button>
          ))}
        </div>

        <div className="p-5">
          {tab === "info" && (
            <div className="space-y-3 text-[12px] font-space text-[#c8d8e8]">
              <Row label="Supply total" value={Number(token.total_supply).toLocaleString()} />
              <Row label="Modo" value={token.mode === "verified" ? "✓ Empresa Verificada" : "Anónimo"} />
              {token.company_name && <Row label="Empresa" value={token.company_name} />}
              <Row label="Creado" value={new Date(token.created_at).toLocaleString("es-ES")} />
              {token.graduated_at && <Row label="Graduado" value={new Date(token.graduated_at).toLocaleString("es-ES")} />}
              <div className="border border-[#ffd70022] bg-[#0a0900] p-4 mt-4">
                <div className="text-[10px] text-[#ffd700] mb-1">⚠️ AVISO DE RIESGO</div>
                <p className="text-[11px] text-[#6a7040] leading-relaxed">
                  Los tokens listados en PSY LAUNCH son proyectos creados por terceros. PSYCHOMETRIKS no verifica su
                  utilidad, valor o legitimidad. Invierte únicamente lo que puedas permitirte perder. Los tokens en modo
                  Anónimo no tienen ninguna verificación de identidad del creador.
                </p>
              </div>
            </div>
          )}

          {tab === "trades" && (
            <div className="overflow-x-auto">
              {trades.length === 0 ? (
                <p className="text-[#5a6a80] font-space text-sm text-center py-6">Sin trades registrados</p>
              ) : (
                <table className="w-full text-[11px] font-space">
                  <thead>
                    <tr className="text-[#5a6a80]">
                      <th className="pb-2 text-left">Wallet</th>
                      <th className="pb-2 text-left">Tipo</th>
                      <th className="pb-2 text-right">Tokens</th>
                      <th className="pb-2 text-right">BNB</th>
                      <th className="pb-2 text-right">Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trades.map(t => (
                      <tr key={t.id} className="border-t border-[#1a2535]">
                        <td className="py-2 text-[#7ab3c8]">{shortWallet(t.wallet)}</td>
                        <td className="py-2">
                          <span style={{ color: t.type === "buy" ? "#00e676" : "#ff3c5c" }}>
                            {t.type === "buy" ? "▲ COMPRA" : "▼ VENTA"}
                          </span>
                        </td>
                        <td className="py-2 text-right">{Number(t.amount_tokens).toLocaleString()}</td>
                        <td className="py-2 text-right">{Number(t.amount_bnb).toFixed(4)}</td>
                        <td className="py-2 text-right text-[#5a6a80]">{new Date(t.created_at).toLocaleDateString("es-ES")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {tab === "holders" && (
            <div className="overflow-x-auto">
              {holders.length === 0 ? (
                <p className="text-[#5a6a80] font-space text-sm text-center py-6">Sin holders registrados</p>
              ) : (
                <table className="w-full text-[11px] font-space">
                  <thead>
                    <tr className="text-[#5a6a80]">
                      <th className="pb-2 text-left">#</th>
                      <th className="pb-2 text-left">Wallet</th>
                      <th className="pb-2 text-right">Balance</th>
                      <th className="pb-2 text-right">% Supply</th>
                      <th className="pb-2 text-right">PnL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {holders.map(h => (
                      <tr key={h.wallet} className="border-t border-[#1a2535]">
                        <td className="py-2 text-[#5a6a80]">{h.rank}</td>
                        <td className="py-2 text-[#7ab3c8]">{shortWallet(h.wallet)}</td>
                        <td className="py-2 text-right">{Number(h.balance).toLocaleString()}</td>
                        <td className="py-2 text-right">{h.pct_supply}%</td>
                        <td className="py-2 text-right" style={{ color: Number(h.pnl) >= 0 ? "#00e676" : "#ff3c5c" }}>
                          {Number(h.pnl) >= 0 ? "+" : ""}{Number(h.pnl_pct).toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-[#1a2535] py-2">
      <span className="text-[#5a6a80]">{label}</span>
      <span>{value}</span>
    </div>
  );
}

// ─── Create Token Form ─────────────────────────────────────────────────────
function CreateForm({ onCreated }: { onCreated: () => void }) {
  const [mode, setMode] = useState<"anon" | "verified">("anon");
  const [form, setForm] = useState({
    token_name: "", ticker: "", description: "",
    image_url: "", creator_wallet: "",
    company_name: "", company_website: "", company_twitter: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  async function submit() {
    setSubmitting(true);
    setMsg(null);
    try {
      const r = await fetch(`${API}/tokens`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, ticker: form.ticker.toUpperCase(), mode }),
      });
      const d = await r.json();
      if (d.ok) {
        setMsg({ ok: true, text: `✅ Token #${d.id} creado exitosamente. Estará visible en el Explorer en breve.` });
        setForm({ token_name: "", ticker: "", description: "", image_url: "", creator_wallet: "", company_name: "", company_website: "", company_twitter: "" });
        onCreated();
      } else {
        setMsg({ ok: false, text: d.error ?? "Error desconocido" });
      }
    } catch {
      setMsg({ ok: false, text: "Error de red al crear token" });
    }
    setSubmitting(false);
  }

  const minDesc = mode === "verified" ? 100 : 50;

  return (
    <div className="max-w-xl mx-auto">
      <div className="font-space text-[10px] text-[#00e5ff] tracking-[0.3em] uppercase mb-6">
        Nueva Fábrica de Token · PSY LAUNCH
      </div>

      {/* Mode selector */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {(["anon", "verified"] as const).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`border p-4 text-left transition-colors ${mode === m ? "border-[#00e5ff] bg-[#00e5ff0a]" : "border-[#1a2535] hover:border-[#00e5ff44]"}`}
          >
            <div className="font-bebas text-lg mb-1">{m === "anon" ? "🎭 ANÓNIMO" : "✓ VERIFICADO"}</div>
            <div className="font-space text-[10px] text-[#7ab3c8]">
              {m === "anon"
                ? "Sin datos de empresa. Rápido y privado. Creador recibe 15% del supply."
                : "Con datos de empresa verificados. Mayor confianza. Creador recibe 5% del supply."}
            </div>
          </button>
        ))}
      </div>

      <div className="space-y-4">
        <Field label="Nombre del Token *" note="3–20 caracteres">
          <input value={form.token_name} onChange={set("token_name")} maxLength={20} placeholder="Ej: PSY Coin" className={inputCls} />
        </Field>
        <Field label="Ticker *" note="2–5 letras mayúsculas">
          <input value={form.ticker} onChange={set("ticker")} maxLength={5} placeholder="Ej: PSY" className={`${inputCls} uppercase`} />
        </Field>
        <Field label={`Descripción * (mín ${minDesc} caracteres)`} note={`${form.description.length}/${minDesc} mín`}>
          <textarea value={form.description} onChange={set("description")} rows={4} placeholder="¿De qué trata tu token? Cuéntanos..." className={inputCls} />
        </Field>
        <Field label="URL de imagen (logo)" note="URL pública (.png/.jpg)">
          <input value={form.image_url} onChange={set("image_url")} placeholder="https://..." className={inputCls} />
        </Field>
        <Field label="Tu wallet (creador)" note="Recibirás la allocación inicial">
          <input value={form.creator_wallet} onChange={set("creator_wallet")} placeholder="0x..." className={inputCls} />
        </Field>

        {mode === "verified" && (
          <>
            <div className="border-t border-[#1a2535] pt-4">
              <div className="text-[10px] font-space text-[#00e5ff] tracking-wider uppercase mb-4">Datos de Empresa</div>
            </div>
            <Field label="Nombre de empresa *">
              <input value={form.company_name} onChange={set("company_name")} placeholder="Ej: PSYCHOMETRIKS Corp." className={inputCls} />
            </Field>
            <Field label="Website *" note="https://...">
              <input value={form.company_website} onChange={set("company_website")} placeholder="https://tuempresa.com" className={inputCls} />
            </Field>
            <Field label="Twitter/X *" note="@handle">
              <input value={form.company_twitter} onChange={set("company_twitter")} placeholder="@tuempresa" className={inputCls} />
            </Field>
          </>
        )}

        <div className="border border-[#ffd70022] bg-[#0a0900] p-4 text-[11px] font-space text-[#6a7040] leading-relaxed">
          ⚠️ Al crear un token confirmas que no estás realizando una oferta de valores ni actividad financiera regulada.
          PSYCHOMETRIKS no tiene custodia de fondos. Los trades son registrados on-chain en BNB Chain.
        </div>

        <button
          onClick={submit}
          disabled={submitting}
          className="w-full py-3 font-space text-[12px] font-bold tracking-[0.2em] uppercase disabled:opacity-40 transition-colors"
          style={{ background: "#00e5ff", color: "#020408" }}
        >
          {submitting ? "Creando..." : "🚀 Crear Token"}
        </button>

        {msg && (
          <div className={`border p-3 font-space text-[12px] ${msg.ok ? "border-[#00e67644] text-[#00e676]" : "border-[#ff3c5c44] text-[#ff6b6b]"}`}>
            {msg.text}
          </div>
        )}
      </div>
    </div>
  );
}

const inputCls = "w-full bg-[#0a0f1a] border border-[#1a2535] focus:border-[#00e5ff44] outline-none px-3 py-2.5 font-space text-[12px] text-white placeholder:text-[#3a4a5a]";

function Field({ label, note, children }: { label: string; note?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="font-space text-[11px] text-[#7ab3c8] uppercase tracking-wider">{label}</label>
        {note && <span className="font-space text-[10px] text-[#3a4a5a]">{note}</span>}
      </div>
      {children}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────
export default function PsyLaunch() {
  const [tab, setTab] = useState<"explorer" | "trending" | "crear">("explorer");
  const [tokens, setTokens] = useState<Token[]>([]);
  const [trending, setTrending] = useState<Token[]>([]);
  const [selected, setSelected] = useState<Token | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modeFilter, setModeFilter] = useState("");

  const loadTokens = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status: "all" });
      if (modeFilter) params.set("mode", modeFilter);
      const [tokR, trendR] = await Promise.all([
        fetch(`${API}/tokens?${params}`).then(r => r.json()),
        fetch(`${API}/trending`).then(r => r.json()),
      ]);
      setTokens(tokR.items ?? []);
      setTrending(trendR.items ?? []);
    } catch { /* silent */ }
    setLoading(false);
  }, [modeFilter]);

  useEffect(() => { loadTokens(); }, [loadTokens]);

  const filtered = tokens.filter(t =>
    !search ||
    t.token_name.toLowerCase().includes(search.toLowerCase()) ||
    t.ticker.toLowerCase().includes(search.toLowerCase()) ||
    t.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#020408] text-white font-rajdhani">
      <SiteNav />

      {/* Hero */}
      <section className="pt-32 pb-8 px-6 md:px-12">
        <div className="font-space text-[10px] text-[#00e5ff] tracking-[0.4em] uppercase mb-4">Token Factory · BNB Chain</div>
        <h1 className="font-bebas text-6xl md:text-8xl leading-none mb-3">
          PSY <span className="text-[#00e5ff]">LAUNCH</span>
        </h1>
        <p className="text-[#7ab3c8] font-space text-sm max-w-2xl leading-relaxed mb-6">
          Crea y lanza tu token en BNB Chain al instante con bonding curve automática, distribución justa y graduación a PancakeSwap al llegar a 69 BNB.
          Sin presale. Sin rugpull por diseño.
        </p>
        <div className="flex gap-4 text-[11px] font-space text-[#7ab3c8]">
          <span>✓ {tokens.filter(t => t.status === "active").length} tokens activos</span>
          <span>✓ {tokens.filter(t => t.status === "graduated").length} graduados</span>
          <span>✓ Bonding curve automática</span>
        </div>
      </section>

      {/* Tabs */}
      <div className="px-6 md:px-12 border-b border-[#1a2535] flex gap-0">
        {([
          { key: "explorer", label: `Explorer (${tokens.length})` },
          { key: "trending", label: "🔥 Trending" },
          { key: "crear", label: "🚀 Crear Token" },
        ] as const).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-6 py-4 font-space text-[11px] uppercase tracking-wider transition-colors ${tab === t.key ? "text-[#00e5ff] border-b-2 border-[#00e5ff]" : "text-[#7ab3c8] hover:text-white"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="px-6 md:px-12 py-8">
        {/* Explorer */}
        {tab === "explorer" && (
          <>
            <div className="flex flex-wrap gap-3 mb-6">
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por nombre, ticker o descripción..."
                className="flex-1 min-w-[200px] bg-[#0a0f1a] border border-[#1a2535] px-3 py-2 font-space text-[12px] outline-none focus:border-[#00e5ff44]"
              />
              <select
                value={modeFilter}
                onChange={e => setModeFilter(e.target.value)}
                className="bg-[#0a0f1a] border border-[#1a2535] px-3 py-2 font-space text-[12px]"
              >
                <option value="">Todos los modos</option>
                <option value="anon">Anónimo</option>
                <option value="verified">Verificado</option>
              </select>
            </div>
            {loading ? (
              <p className="text-[#7ab3c8] font-space text-sm text-center py-12">Cargando tokens...</p>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-[#5a6a80] font-space text-sm mb-4">Aún no hay tokens. ¡Sé el primero en lanzar el tuyo!</p>
                <button onClick={() => setTab("crear")} className="font-space text-[11px] text-[#00e5ff] border border-[#00e5ff44] px-4 py-2 hover:bg-[#00e5ff0a]">
                  🚀 Crear primer token →
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map(t => (
                  <TokenCard key={t.id} token={t} onClick={() => setSelected(t)} />
                ))}
              </div>
            )}
          </>
        )}

        {/* Trending */}
        {tab === "trending" && (
          <div>
            <div className="font-space text-[10px] text-[#7ab3c8] uppercase tracking-wider mb-4">Top tokens por volumen 24h</div>
            {trending.length === 0 ? (
              <p className="text-[#5a6a80] font-space text-sm py-8">Sin datos de trending todavía</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {trending.map((t, i) => (
                  <div key={t.id} className="relative">
                    <div className="absolute -top-2 -left-2 w-6 h-6 bg-[#00e5ff] text-[#020408] font-bebas text-sm flex items-center justify-center z-10">
                      {i + 1}
                    </div>
                    <TokenCard token={t} onClick={() => setSelected(t)} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Crear */}
        {tab === "crear" && <CreateForm onCreated={() => { loadTokens(); setTab("explorer"); }} />}
      </div>

      {/* Detail modal */}
      {selected && <TokenModal token={selected} onClose={() => setSelected(null)} />}

      {/* Footer note */}
      <div className="px-6 md:px-12 pb-12 text-center">
        <p className="font-space text-[10px] text-[#3a4a5a]">
          PSY LAUNCH corre sobre BNB Chain. Contrato de bonding curve: auditoría pendiente.
          Fee de la plataforma: 1% por trade. Gradúa a PancakeSwap a los 69 BNB.
        </p>
      </div>
    </div>
  );
}
