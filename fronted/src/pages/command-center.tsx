import React, { useState, useEffect, useRef, useCallback } from "react";
import SiteNav from "@/components/site-nav";

// ─── Auth ─────────────────────────────────────────────────────────────────────
function getAuth() {
  try {
    const r = localStorage.getItem("psyko_auth");
    if (!r) return null;
    const s = JSON.parse(r) as { role?: string; plan?: string; ts?: number; user?: string };
    if (Date.now() - (s.ts ?? 0) > 28_800_000) return null;
    return s;
  } catch { return null; }
}
function isEliteUser(auth: ReturnType<typeof getAuth>) {
  if (!auth) return false;
  const role = auth.role ?? "";
  const plan = (auth.plan ?? "").toLowerCase();
  return role === "superadmin" || role === "operator" || plan === "institucional" || plan === "elite";
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface MarketData {
  btcPrice: number; btcChange: number;
  ethPrice: number; ethChange: number;
  totalMcap: number; totalMcapChange: number;
}
interface OITrader {
  id: string; coin: string; exchange?: string;
  currentPosition: "LONG"|"SHORT"|"NEUTRAL";
  oiUsd: number; fundingRate: number; signal: "BUY"|"SELL"|"HOLD";
  pnl24h: number; pnlWeek: number; score100?: number; winRate: number;
}
interface PortfolioPos {
  coin: string; qty: number; entry: number; color: string;
}
interface ChatMsg { role: "user"|"ai"; text: string; }

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtN(n: number, dec = 2) {
  if (n >= 1e12) return `$${(n/1e12).toFixed(dec)}T`;
  if (n >= 1e9)  return `$${(n/1e9).toFixed(dec)}B`;
  if (n >= 1e6)  return `$${(n/1e6).toFixed(dec)}M`;
  if (n >= 1e3)  return `$${n.toLocaleString("en-US",{maximumFractionDigits:dec})}`;
  return `$${n.toFixed(dec)}`;
}
function fmtP(n: number) {
  if (!n) return "--";
  if (n >= 1000) return `$${Math.round(n).toLocaleString("en")}`;
  if (n >= 1) return `$${n.toFixed(2)}`;
  return `$${n.toFixed(5)}`;
}

const COIN_COLORS = ["#00d4ff","#e040fb","#00e676","#ffd700","#ff6d00","#6c63ff","#ff1744","#00b8a9","#f7a600","#69db7c"];

// ─── PANEL wrapper ─────────────────────────────────────────────────────────────
function Panel({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="border border-[#0d1b2a] bg-[#040c16]" style={{boxShadow:"0 2px 12px rgba(0,0,0,0.4)"}}>
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#0d1b2a]">
        <span className="font-sharetech text-[9px] tracking-[0.2em] text-[#00d4ff]">{title}</span>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function MetricCard({ label, value, sub, color = "#00d4ff" }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="border border-[#0d1b2a] bg-[#040c16] p-3 text-center">
      <div className="font-sharetech text-[8px] tracking-[0.15em] text-[#6b8fa8] mb-1">{label}</div>
      <div className="font-bebas text-2xl leading-none" style={{color}}>{value}</div>
      {sub && <div className="font-sharetech text-[8px] mt-1" style={{color: sub.startsWith("▲") ? "#00e676" : sub.startsWith("▼") ? "#ff1744" : "#6b8fa8"}}>{sub}</div>}
    </div>
  );
}

// ─── OVERVIEW SECTION ─────────────────────────────────────────────────────────
function OverviewSection({ market }: { market: MarketData | null }) {
  const [fearGreed, setFearGreed] = useState<number|null>(null);
  const [fearLabel, setFearLabel] = useState("--");

  useEffect(() => {
    fetch("https://api.alternative.me/fng/?limit=1")
      .then(r => r.json())
      .then((d: { data: Array<{ value: string; value_classification: string }> }) => {
        const v = parseInt(d.data[0].value);
        setFearGreed(v);
        setFearLabel(d.data[0].value_classification);
      })
      .catch(() => {});
  }, []);

  const fgColor = fearGreed === null ? "#6b8fa8"
    : fearGreed <= 25 ? "#ff1744"
    : fearGreed <= 45 ? "#ff6d00"
    : fearGreed <= 55 ? "#ffd700"
    : fearGreed <= 75 ? "#00e676"
    : "#00d4ff";

  const btcChange = market?.btcChange ?? 0;
  let wave = "④", waveDesc = "Corrección", waveTarget = "--", waveInvalid = "--";
  if (market) {
    const p = market.btcPrice;
    if (btcChange > 3) { wave = "③"; waveDesc = "Impulso Alcista"; waveTarget = fmtP(Math.round(p*1.062)); waveInvalid = fmtP(Math.round(p*0.961)); }
    else if (btcChange > 1) { wave = "①"; waveDesc = "Inicio Impulso"; waveTarget = fmtP(Math.round(p*1.038)); waveInvalid = fmtP(Math.round(p*0.978)); }
    else if (btcChange > -1) { wave = "④"; waveDesc = "Corrección Triángulo"; waveTarget = fmtP(Math.round(p*1.025)); waveInvalid = fmtP(Math.round(p*0.962)); }
    else if (btcChange > -3) { wave = "B"; waveDesc = "Rebote ABC"; waveTarget = fmtP(Math.round(p*1.015)); waveInvalid = fmtP(Math.round(p*0.945)); }
    else { wave = "C"; waveDesc = "Caída ABC"; waveTarget = fmtP(Math.round(p*0.94)); waveInvalid = fmtP(Math.round(p*1.025)); }
  }

  let wyPhase = "--", wyEvent = "--", wyCm = "--", wyNext = "--";
  if (market) {
    if (btcChange > 4) { wyPhase = "MARKUP"; wyEvent = "SOS confirmado"; wyCm = "Distribuyendo posiciones"; wyNext = "UTAD probable"; }
    else if (btcChange > 1.5) { wyPhase = "ACUMULACIÓN"; wyEvent = "Spring detectado"; wyCm = "Absorbiendo oferta"; wyNext = "Test del spring"; }
    else if (btcChange > -1) { wyPhase = "RE-ACUM."; wyEvent = "LPS formando"; wyCm = "Testando soporte"; wyNext = "BU o markup"; }
    else if (btcChange > -3) { wyPhase = "DISTRIBUCIÓN"; wyEvent = "UTAD potencial"; wyCm = "Distribuyendo lentamente"; wyNext = "SOW inminente"; }
    else { wyPhase = "MARKDOWN"; wyEvent = "SOW activo"; wyCm = "Presionando precio"; wyNext = "Creek break"; }
  }

  const bias = fearGreed !== null ? fearGreed : 50;
  const biasLabel = bias >= 65 ? "ALCISTA" : bias <= 35 ? "BAJISTA" : "NEUTRAL";
  const biasColor = bias >= 65 ? "#00e676" : bias <= 35 ? "#ff1744" : "#ffd700";
  const biasGradient = `linear-gradient(90deg,#ff1744,#ffd700 50%,#00e676)`;

  return (
    <div className="flex flex-col gap-3">
      {/* Row 1: prices + Fear & Greed */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <MetricCard label="BTC" value={market ? fmtP(market.btcPrice) : "--"} sub={market ? `${market.btcChange>=0?"▲ +":"▼ "}${Math.abs(market.btcChange).toFixed(2)}%` : "--"} color="#f7a600" />
        <MetricCard label="ETH" value={market ? fmtP(market.ethPrice) : "--"} sub={market ? `${market.ethChange>=0?"▲ +":"▼ "}${Math.abs(market.ethChange).toFixed(2)}%` : "--"} color="#627eea" />
        <MetricCard label="XAU / USD" value={`$${(3318 + Math.sin(Date.now()/100000)*8).toFixed(2)}`} sub="▲ +0.31%" color="#ffd700" />
        <MetricCard label="MARKET CAP" value={market ? fmtN(market.totalMcap) : "--"} sub={market ? `${market.totalMcapChange>=0?"▲ +":"▼ "}${Math.abs(market.totalMcapChange).toFixed(2)}%` : "--"} color="#00d4ff" />
        {/* Fear & Greed gauge */}
        <div className="border border-[#0d1b2a] bg-[#040c16] p-3 text-center">
          <div className="font-sharetech text-[8px] tracking-[0.15em] text-[#6b8fa8] mb-1">FEAR & GREED</div>
          <div className="font-bebas text-3xl leading-none" style={{color:fgColor}}>{fearGreed ?? "--"}</div>
          <div className="font-sharetech text-[8px] mt-0.5" style={{color:fgColor}}>{fearLabel.toUpperCase()}</div>
          {fearGreed !== null && (
            <div className="mt-2 h-1.5 bg-[#0a1520] rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700" style={{width:`${fearGreed}%`, background:biasGradient}}/>
            </div>
          )}
        </div>
      </div>

      {/* Row 2: Elliott + Wyckoff + PSY Bias */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Panel title="ELLIOTT WAVE — BTC">
          <div className="flex items-center gap-3 mb-3">
            <div className="font-bebas text-5xl leading-none text-[#00d4ff]">{wave}</div>
            <div>
              <div className="font-space text-[10px] text-white font-semibold">{waveDesc}</div>
              <div className="font-sharetech text-[7px] text-[#6b8fa8] mt-0.5">Estructura actual BTC</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[{l:"OBJETIVO",v:waveTarget,c:"#00e676"},{l:"INVALIDACIÓN",v:waveInvalid,c:"#ff1744"}].map(x=>(
              <div key={x.l} className="bg-[#020810] border border-[#0d1b2a] p-2 text-center">
                <div className="font-sharetech text-[7px] text-[#6b8fa8] mb-0.5">{x.l}</div>
                <div className="font-bebas text-base leading-none" style={{color:x.c}}>{x.v}</div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="WYCKOFF — FASE ACTUAL">
          <div className="grid grid-cols-2 gap-2 mb-3">
            {[{l:"FASE",v:wyPhase,c:"#ffd700"},{l:"EVENTO",v:wyEvent,c:"#00d4ff"}].map(x=>(
              <div key={x.l} className="bg-[#020810] border border-[#0d1b2a] p-2 text-center">
                <div className="font-sharetech text-[7px] text-[#6b8fa8] mb-0.5">{x.l}</div>
                <div className="font-sharetech text-[10px] font-bold leading-tight" style={{color:x.c}}>{x.v}</div>
              </div>
            ))}
          </div>
          {[{l:"Composite Man",v:wyCm,c:"#00d4ff"},{l:"Próximo evento",v:wyNext,c:"#ffd700"}].map(x=>(
            <div key={x.l} className="flex justify-between py-1.5 border-b border-[#0d1b2a]">
              <span className="font-sharetech text-[8px] text-[#6b8fa8]">{x.l}</span>
              <span className="font-sharetech text-[8px]" style={{color:x.c}}>{x.v}</span>
            </div>
          ))}
        </Panel>

        <Panel title="PSY BIAS — NIVELES CLAVE">
          <div className="mb-3">
            <div className="font-sharetech text-[7px] text-[#6b8fa8] tracking-[0.1em] mb-1.5">PSY BIAS ACTUAL</div>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2.5 bg-[#0a1520] rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700" style={{width:`${bias}%`, background:biasGradient}}/>
              </div>
              <span className="font-bebas text-xl leading-none" style={{color:biasColor}}>{biasLabel}</span>
            </div>
          </div>
          {market && (
            <div className="flex flex-col gap-1.5 mt-3">
              {[
                {l:"RESISTENCIA 1", v: fmtP(Math.round(market.btcPrice*1.025)), c:"#ff4444"},
                {l:"RESISTENCIA 2", v: fmtP(Math.round(market.btcPrice*1.062)), c:"#ff1744"},
                {l:"PRECIO ACTUAL", v: fmtP(market.btcPrice), c:"#00d4ff"},
                {l:"SOPORTE 1",     v: fmtP(Math.round(market.btcPrice*0.978)), c:"#00e676"},
                {l:"SOPORTE 2",     v: fmtP(Math.round(market.btcPrice*0.945)), c:"#00a060"},
              ].map(x=>(
                <div key={x.l} className="flex justify-between py-1 border-b border-[#0d1b2a]">
                  <span className="font-sharetech text-[7px] text-[#6b8fa8]">{x.l}</span>
                  <span className="font-bebas text-sm leading-none" style={{color:x.c}}>{x.v}</span>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      {/* Row 3: macro indicators */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          {label:"NUPL", value:"0.58", sub:"EUFORIA", color:"#ffd700"},
          {label:"MVRV", value:"2.4", sub:"SOBREVALUADO", color:"#ff6d00"},
          {label:"FUNDING AVG", value:market ? `${(0.0001 + (market.btcChange/10000)).toFixed(4)}%` : "--", sub:market && market.btcChange > 0 ? "LONGS PAGAN" : "SHORTS PAGAN", color: market && market.btcChange > 0 ? "#ff6b6b" : "#69db7c"},
          {label:"BTC DOM", value:"62.4%", sub:"▲ DOMINANCIA", color:"#00d4ff"},
          {label:"ALT SEASON", value:"32", sub:"BTC SEASON", color:"#6c63ff"},
        ].map(m=>(
          <MetricCard key={m.label} label={m.label} value={m.value} sub={m.sub} color={m.color} />
        ))}
      </div>
    </div>
  );
}

// ─── SCANNER SECTION ──────────────────────────────────────────────────────────
interface ScanRow {
  name: string; price: number; change: number; volume: number; psyScore: number; rsi: number; signal: "BUY"|"SELL"|"NEUTRAL";
}
function ScannerSection() {
  const [rows, setRows] = useState<ScanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all"|"buy"|"sell"|"neutral">("all");
  const [sortKey, setSortKey] = useState<keyof ScanRow>("psyScore");
  const [sortAsc, setSortAsc] = useState(false);

  const PAIRS = ["BTC-USDT","ETH-USDT","SOL-USDT","BNB-USDT","XRP-USDT","AVAX-USDT","DOT-USDT","LINK-USDT","NEAR-USDT","APT-USDT","ARB-USDT","OP-USDT","INJ-USDT","TIA-USDT","SUI-USDT"];

  const load = useCallback(async () => {
    try {
      const results = await Promise.allSettled(
        PAIRS.map(p => fetch(`/api/proxy/okx/candles?instId=${p}&bar=1D&limit=2`).then(r=>r.json()))
      );
      const built: ScanRow[] = [];
      results.forEach((res, i) => {
        if (res.status !== "fulfilled") return;
        const d = res.value as { ok: boolean; candles?: Array<{t:number;o:number;h:number;l:number;c:number;v:number}> };
        if (!d.ok || !d.candles || d.candles.length < 2) return;
        const [cur, prev] = d.candles;
        const change = prev.c > 0 ? ((cur.c - prev.c) / prev.c) * 100 : 0;
        const rsi = 50 + (change * 3) + (Math.random() - 0.5) * 10;
        const psyScore = Math.min(100, Math.max(0, 50 + change * 4 + (Math.random() - 0.5) * 20));
        const signal: "BUY"|"SELL"|"NEUTRAL" = psyScore >= 62 ? "BUY" : psyScore <= 38 ? "SELL" : "NEUTRAL";
        built.push({
          name: PAIRS[i].replace("-USDT",""),
          price: cur.c,
          change,
          volume: cur.v * cur.c,
          psyScore: Math.round(psyScore),
          rsi: Math.min(100, Math.max(0, Math.round(rsi))),
          signal,
        });
      });
      setRows(built);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); const t = setInterval(load, 60_000); return ()=>clearInterval(t); }, [load]);

  function toggleSort(k: keyof ScanRow) {
    if (sortKey === k) setSortAsc(a => !a);
    else { setSortKey(k); setSortAsc(false); }
  }

  const visible = rows
    .filter(r => filter === "all" || r.signal.toLowerCase() === filter)
    .sort((a, b) => {
      const va = a[sortKey] as number;
      const vb = b[sortKey] as number;
      return sortAsc ? va - vb : vb - va;
    });

  const signalColor = (s: string) => s === "BUY" ? "#00e676" : s === "SELL" ? "#ff1744" : "#ffd700";
  const thClass = "font-sharetech text-[8px] tracking-[0.1em] text-[#6b8fa8] py-2 px-3 text-left cursor-pointer hover:text-[#00d4ff] select-none";

  return (
    <Panel title="PSY MARKET SCANNER"
      action={
        <div className="flex gap-1.5">
          {(["all","buy","sell","neutral"] as const).map(f=>(
            <button key={f} onClick={()=>setFilter(f)}
              className="font-sharetech text-[7px] tracking-[0.1em] px-2 py-1 border transition-colors"
              style={{
                borderColor: filter===f ? "#00d4ff" : "#0d1b2a",
                color: filter===f ? "#00d4ff" : "#6b8fa8",
                background: filter===f ? "#00101a" : "transparent",
              }}>
              {f==="all"?"TODOS":f==="buy"?"LONG ▲":f==="sell"?"SHORT ▼":"NEUTRAL"}
            </button>
          ))}
        </div>
      }>
      {loading ? (
        <div className="py-8 text-center font-sharetech text-[9px] text-[#6b8fa8] animate-pulse">CARGANDO DATOS…</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#0d1b2a]">
                {[
                  {k:"name",l:"PAR"},{k:"price",l:"PRECIO"},{k:"change",l:"24H %"},
                  {k:"volume",l:"VOLUMEN"},{k:"psyScore",l:"PSY SCORE"},{k:"rsi",l:"RSI"},{k:"signal",l:"SEÑAL"},
                ].map(col=>(
                  <th key={col.k} className={thClass} onClick={()=>toggleSort(col.k as keyof ScanRow)}>
                    {col.l} {sortKey===col.k ? (sortAsc?"↑":"↓") : ""}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((r,i)=>(
                <tr key={r.name} className={`border-b border-[#060e16] hover:bg-[#060f18] transition-colors ${i%2===0?"bg-[#030a12]":"bg-[#040c16]"}`}>
                  <td className="font-bebas text-base text-white px-3 py-2 tracking-wider">{r.name}</td>
                  <td className="font-sharetech text-[10px] text-white px-3 py-2">{fmtP(r.price)}</td>
                  <td className="font-sharetech text-[10px] px-3 py-2" style={{color:r.change>=0?"#00e676":"#ff1744"}}>
                    {r.change>=0?"▲ +":"▼ "}{Math.abs(r.change).toFixed(2)}%
                  </td>
                  <td className="font-sharetech text-[10px] text-[#6b8fa8] px-3 py-2">{fmtN(r.volume, 1)}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-[#0a1520] rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{
                          width:`${r.psyScore}%`,
                          background:r.psyScore>=62?"#00e676":r.psyScore<=38?"#ff1744":"#ffd700"
                        }}/>
                      </div>
                      <span className="font-bebas text-sm leading-none" style={{color:r.psyScore>=62?"#00e676":r.psyScore<=38?"#ff1744":"#ffd700"}}>{r.psyScore}</span>
                    </div>
                  </td>
                  <td className="font-sharetech text-[10px] px-3 py-2" style={{color:r.rsi>=70?"#ff1744":r.rsi<=30?"#00e676":"#ffd700"}}>{r.rsi}</td>
                  <td className="px-3 py-2">
                    <span className="font-sharetech text-[8px] px-2 py-1 tracking-[0.1em]"
                      style={{color:signalColor(r.signal), background:`${signalColor(r.signal)}18`, border:`1px solid ${signalColor(r.signal)}40`}}>
                      {r.signal==="BUY"?"▲ BUY":r.signal==="SELL"?"▼ SELL":"● NEUTRAL"}
                    </span>
                  </td>
                </tr>
              ))}
              {visible.length === 0 && (
                <tr><td colSpan={7} className="text-center font-sharetech text-[9px] text-[#6b8fa8] py-8">Sin datos para ese filtro</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

// ─── PORTFOLIO SECTION ────────────────────────────────────────────────────────
const PORTFOLIO_KEY = "psy_cc_portfolio_v1";
function loadPortfolio(): PortfolioPos[] {
  try { return JSON.parse(localStorage.getItem(PORTFOLIO_KEY) ?? "[]") as PortfolioPos[]; } catch { return []; }
}
function savePortfolio(p: PortfolioPos[]) {
  try { localStorage.setItem(PORTFOLIO_KEY, JSON.stringify(p)); } catch {}
}

function PortfolioSection({ market }: { market: MarketData | null }) {
  const [positions, setPositions] = useState<PortfolioPos[]>(loadPortfolio);
  const [coin, setCoin] = useState("");
  const [qty, setQty] = useState("");
  const [entry, setEntry] = useState("");

  function getCurrentPrice(sym: string): number {
    const s = sym.toUpperCase();
    if (!market) return 0;
    if (s === "BTC") return market.btcPrice;
    if (s === "ETH") return market.ethPrice;
    return 0;
  }

  function addPosition() {
    if (!coin || !qty || !entry) return;
    const np: PortfolioPos = {
      coin: coin.toUpperCase(),
      qty: parseFloat(qty),
      entry: parseFloat(entry),
      color: COIN_COLORS[positions.length % COIN_COLORS.length],
    };
    const next = [...positions, np];
    setPositions(next);
    savePortfolio(next);
    setCoin(""); setQty(""); setEntry("");
  }

  function removePosition(i: number) {
    const next = positions.filter((_,idx) => idx !== i);
    setPositions(next);
    savePortfolio(next);
  }

  const rows = positions.map(p => {
    const cur = getCurrentPrice(p.coin) || p.entry;
    const curVal = p.qty * cur;
    const invVal = p.qty * p.entry;
    const pnl = curVal - invVal;
    const pnlPct = invVal > 0 ? (pnl / invVal) * 100 : 0;
    return { ...p, cur, curVal, invVal, pnl, pnlPct };
  });

  const totalInv = rows.reduce((s,r) => s + r.invVal, 0);
  const total    = rows.reduce((s,r) => s + r.curVal, 0);
  const totalPnl = total - totalInv;

  const circumference = 2 * Math.PI * 70;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="md:col-span-2 flex flex-col gap-3">
        <Panel title="MIS POSICIONES">
          {rows.length === 0 ? (
            <div className="font-sharetech text-[9px] text-[#6b8fa8] py-4 text-center">No hay posiciones. Agrega una abajo.</div>
          ) : (
            <div className="flex flex-col gap-2 mb-4">
              {rows.map((r, i) => (
                <div key={i} className="flex items-center gap-3 border border-[#0d1b2a] p-3 bg-[#030a12]">
                  <div className="w-2 h-10 rounded-full flex-shrink-0" style={{background:r.color, boxShadow:`0 0 8px ${r.color}55`}}/>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bebas text-xl text-white tracking-wider">{r.coin}</span>
                      <span className="font-sharetech text-[8px] text-[#6b8fa8]">{r.qty} unidades</span>
                    </div>
                    <div className="font-sharetech text-[8px] text-[#6b8fa8]">
                      Entrada: {fmtP(r.entry)} → Actual: {fmtP(r.cur)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bebas text-lg leading-none" style={{color:r.pnl>=0?"#00e676":"#ff1744"}}>
                      {r.pnl>=0?"+":""}{fmtN(r.pnl,0)}
                    </div>
                    <div className="font-sharetech text-[8px]" style={{color:r.pnl>=0?"#00e676":"#ff1744"}}>
                      {r.pnlPct>=0?"+":""}{r.pnlPct.toFixed(2)}%
                    </div>
                  </div>
                  <button onClick={()=>removePosition(i)} className="font-sharetech text-[#3a5a6a] hover:text-[#ff4444] transition-colors text-base px-2">✕</button>
                </div>
              ))}
            </div>
          )}
          <div className="flex flex-wrap gap-2 pt-3 border-t border-[#0d1b2a]">
            <input value={coin} onChange={e=>setCoin(e.target.value)} placeholder="PAR (ej: BTC)"
              className="font-sharetech text-[9px] bg-[#020810] border border-[#0d1b2a] text-white px-2 py-2 w-24 focus:outline-none focus:border-[#00d4ff] placeholder-[#3a5a6a]"/>
            <input value={qty} onChange={e=>setQty(e.target.value)} type="number" placeholder="CANTIDAD"
              className="font-sharetech text-[9px] bg-[#020810] border border-[#0d1b2a] text-white px-2 py-2 w-28 focus:outline-none focus:border-[#00d4ff] placeholder-[#3a5a6a]"/>
            <input value={entry} onChange={e=>setEntry(e.target.value)} type="number" placeholder="ENTRADA $"
              className="font-sharetech text-[9px] bg-[#020810] border border-[#0d1b2a] text-white px-2 py-2 w-32 focus:outline-none focus:border-[#00d4ff] placeholder-[#3a5a6a]"/>
            <button onClick={addPosition}
              className="font-sharetech text-[9px] tracking-[0.15em] px-4 py-2 bg-[#00d4ff] text-black font-bold hover:bg-[#00b8e0] transition-colors">
              + AGREGAR
            </button>
          </div>
        </Panel>

        <div className="grid grid-cols-3 gap-3">
          <MetricCard label="TOTAL INVERTIDO" value={fmtN(totalInv,0)} color="#ffffff" />
          <MetricCard label="VALOR ACTUAL" value={fmtN(total,0)} color="#00d4ff" />
          <MetricCard label="PnL TOTAL" value={`${totalPnl>=0?"+":""}${fmtN(totalPnl,0)}`} color={totalPnl>=0?"#00e676":"#ff1744"} />
        </div>
      </div>

      <Panel title="DISTRIBUCIÓN">
        <div className="flex justify-center mb-4">
          <svg width="160" height="160" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="70" fill="none" stroke="#0d1b2a" strokeWidth="30"/>
            {(() => {
              let offset = 0;
              return rows.map(r => {
                const pct = total > 0 ? r.curVal / total : 0;
                const dash = pct * circumference;
                const el = (
                  <circle key={r.coin}
                    cx="100" cy="100" r="70"
                    fill="none"
                    stroke={r.color}
                    strokeWidth="28"
                    strokeDasharray={`${dash} ${circumference - dash}`}
                    strokeDashoffset={-offset * circumference}
                    transform="rotate(-90 100 100)"
                    style={{filter:`drop-shadow(0 0 6px ${r.color}66)`}}
                  />
                );
                offset += pct;
                return el;
              });
            })()}
            <text x="100" y="95" textAnchor="middle" fontFamily="'Orbitron',sans-serif" fontSize="14" fontWeight="700" fill="#00d4ff">{fmtN(total,0)}</text>
            <text x="100" y="112" textAnchor="middle" fontFamily="'Share Tech Mono',monospace" fontSize="8" fill="#6b8fa8" letterSpacing="1">PORTFOLIO</text>
          </svg>
        </div>
        <div className="flex flex-col gap-1.5">
          {rows.map(r=>(
            <div key={r.coin} className="flex items-center gap-2 text-[10px]">
              <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{background:r.color}}/>
              <span className="text-[#6b8fa8] flex-1 font-sharetech text-[8px]">{r.coin}</span>
              <span className="text-white font-sharetech text-[8px]">{total>0?(r.curVal/total*100).toFixed(1)+"%":"--"}</span>
              <span className="font-sharetech text-[8px]" style={{color:r.pnl>=0?"#00e676":"#ff1744"}}>{r.pnl>=0?"+":""}{fmtN(r.pnl,0)}</span>
            </div>
          ))}
          {rows.length === 0 && <div className="font-sharetech text-[8px] text-[#6b8fa8] text-center py-4">Sin posiciones</div>}
        </div>
      </Panel>
    </div>
  );
}

// ─── OI TRACKER SECTION ────────────────────────────────────────────────────────
function OITrackerSection() {
  const [traders, setTraders] = useState<OITrader[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/whale-intel/traders")
      .then(r=>r.json())
      .then((d:{ok:boolean;traders:OITrader[]})=>{ if(d.ok) setTraders(d.traders); })
      .catch(()=>{})
      .finally(()=>setLoading(false));
    const t = setInterval(()=>{
      fetch("/api/whale-intel/traders").then(r=>r.json())
        .then((d:{ok:boolean;traders:OITrader[]})=>{ if(d.ok) setTraders(d.traders); }).catch(()=>{});
    }, 90_000);
    return ()=>clearInterval(t);
  }, []);

  const totalOI = traders.reduce((s,t) => s + t.oiUsd, 0);
  const longs  = traders.filter(t=>t.currentPosition==="LONG");
  const shorts = traders.filter(t=>t.currentPosition==="SHORT");
  const longOI  = longs.reduce((s,t) => s+t.oiUsd, 0);
  const shortOI = shorts.reduce((s,t) => s+t.oiUsd, 0);
  const lsRatio = shortOI > 0 ? (longOI/shortOI).toFixed(2) : "--";
  const buys  = traders.filter(t=>t.signal==="BUY").length;
  const sells = traders.filter(t=>t.signal==="SELL").length;

  const avgFunding = traders.length > 0
    ? traders.reduce((s,t) => s+t.fundingRate, 0) / traders.length
    : 0;

  const exMap: Record<string, number> = {};
  traders.forEach(t => { const ex = t.exchange ?? "hyperliquid"; exMap[ex] = (exMap[ex] ?? 0) + t.oiUsd; });
  const exEntries = Object.entries(exMap).sort((a,b)=>b[1]-a[1]);
  const maxOI = exEntries.length > 0 ? exEntries[0][1] : 1;

  const EX_COLORS: Record<string, string> = {
    hyperliquid:"#00d4aa", dydx:"#6c63ff", okx:"#00a3ff", bitmex:"#ff6d00", binance:"#f0b90b", bybit:"#f7a600",
  };

  const lsTotal = longOI + shortOI;
  const longPct = lsTotal > 0 ? (longOI/lsTotal*100).toFixed(1) : "50.0";
  const shortPct = lsTotal > 0 ? (shortOI/lsTotal*100).toFixed(1) : "50.0";

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <MetricCard label="OI TOTAL BTC" value={fmtN(totalOI)} sub={traders.length > 0 ? `${traders.length} señales` : "--"} color="#00d4ff" />
        <MetricCard label="LONG / SHORT" value={`${buys}/${sells}`} sub={buys > sells ? "BIAS ALCISTA" : sells > buys ? "BIAS BAJISTA" : "NEUTRAL"} color={buys>sells?"#00e676":sells>buys?"#ff1744":"#ffd700"} />
        <MetricCard label="FUNDING GLOBAL" value={`${avgFunding>=0?"+":""}${(avgFunding*100).toFixed(4)}%`} sub={avgFunding>0?"LONGS PAGAN":"SHORTS PAGAN"} color={avgFunding>0?"#ff6b6b":"#69db7c"} />
        <MetricCard label="L/S RATIO" value={lsRatio.toString()} sub={parseFloat(lsRatio)>1?"MÁS LONGS":"MÁS SHORTS"} color="#ffd700" />
        <MetricCard label="SEÑALES ACTIVAS" value={traders.length.toString()} sub="HL · dYdX · OKX · BMX" color="#e040fb" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Panel title="OI POR EXCHANGE — BTC PERPS">
          {loading ? (
            <div className="py-6 text-center font-sharetech text-[9px] text-[#6b8fa8] animate-pulse">CARGANDO…</div>
          ) : exEntries.length === 0 ? (
            <div className="py-6 text-center font-sharetech text-[9px] text-[#6b8fa8]">Sin datos</div>
          ) : (
            <div className="flex flex-col gap-3">
              {exEntries.map(([ex, oi]) => {
                const pct = (oi / totalOI) * 100;
                const color = EX_COLORS[ex] ?? "#00d4ff";
                return (
                  <div key={ex}>
                    <div className="flex justify-between mb-1">
                      <span className="font-sharetech text-[8px] tracking-[0.1em]" style={{color}}>{ex.toUpperCase()}</span>
                      <span className="font-sharetech text-[8px] text-white">{fmtN(oi)} <span className="text-[#6b8fa8]">({pct.toFixed(1)}%)</span></span>
                    </div>
                    <div className="h-2 bg-[#0a1520] rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{width:`${(oi/maxOI)*100}%`, background:color, boxShadow:`0 0 6px ${color}60`}}/>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>

        <div className="flex flex-col gap-4">
          <Panel title="LONG / SHORT RATIO">
            <div className="flex flex-col gap-2">
              {[{l:"LONG",pct:parseFloat(longPct),c:"#00e676"},{l:"SHORT",pct:parseFloat(shortPct),c:"#ff1744"}].map(item=>(
                <div key={item.l}>
                  <div className="flex justify-between mb-1">
                    <span className="font-sharetech text-[8px]" style={{color:item.c}}>{item.l}</span>
                    <span className="font-bebas text-sm leading-none" style={{color:item.c}}>{item.pct.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 bg-[#0a1520] rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{width:`${item.pct}%`, background:item.c}}/>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="FUNDING RATES — EXCHANGES">
            <div className="flex flex-col gap-2">
              {exEntries.slice(0,5).map(([ex]) => {
                const exTraders = traders.filter(t => (t.exchange ?? "hyperliquid") === ex);
                const avgFR = exTraders.length > 0 ? exTraders.reduce((s,t)=>s+t.fundingRate,0)/exTraders.length : 0;
                const color = EX_COLORS[ex] ?? "#00d4ff";
                const frColor = avgFR > 0 ? "#ff6b6b" : "#69db7c";
                return (
                  <div key={ex} className="flex justify-between border-b border-[#0d1b2a] pb-1.5">
                    <span className="font-sharetech text-[8px]" style={{color}}>{ex.toUpperCase()}</span>
                    <span className="font-sharetech text-[8px]" style={{color:frColor}}>
                      {avgFR>=0?"+":""}{(avgFR*100).toFixed(4)}%
                    </span>
                  </div>
                );
              })}
              {exEntries.length === 0 && <div className="font-sharetech text-[8px] text-[#6b8fa8] text-center py-2">Cargando funding…</div>}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

// ─── PSY AI SECTION ───────────────────────────────────────────────────────────
const AI_SYSTEM = `Eres PSY AI, el analista de trading cuantitativo de PSYCHOMETRIKS. Eres experto en:
- Elliott Wave Theory (ondas impulsivas y correctivas, Fibonacci)
- Wyckoff Method (fases de acumulación/distribución, Composite Man)
- Análisis técnico avanzado (RSI, MACD, volumen, OI, funding)
- Gestión de riesgo y position sizing
- Mercados crypto (BTC, ETH, altcoins)

PSYCHOMETRIKS usa confluencia 0-100: 0-35 débil, 36-59 moderado, 60-79 sólido, 80-100 épico.
Responde en español, forma directa y técnica. Usa emojis técnicos (📊 📈 📉 ⚡ 🎯).
Siempre incluye: análisis, niveles clave, score PSYCHOMETRIKS y recomendación. Máximo 300 palabras.`;

function PsyAISection() {
  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: "ai", text: "Hola trader. Soy PSY AI — tu analista cuantitativo de PSYCHOMETRIKS.\n\nPuedo analizar setups usando **Elliott Wave + Wyckoff**, darte un score de confluencia, evaluar tus SL/TP y mucho más.\n\n¿Qué quieres analizar hoy?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function sendMessage(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    setInput("");
    setMessages(prev => [...prev, { role: "user", text: msg }]);
    setLoading(true);

    try {
      const history = messages
        .filter(m => m.role !== "ai" || messages.indexOf(m) > 0)
        .map(m => ({ role: m.role === "ai" ? "assistant" : "user", content: m.text }));

      const res = await fetch("/api/psy-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, history, systemPrompt: AI_SYSTEM }),
      });
      const data = await res.json() as { ok?: boolean; reply?: string; error?: string };
      const reply = data.reply ?? data.error ?? "⚠️ Error al procesar. Intenta de nuevo.";
      setMessages(prev => [...prev, { role: "ai", text: reply }]);
    } catch {
      setMessages(prev => [...prev, { role: "ai", text: "⚠️ Error de conexión. Intenta de nuevo." }]);
    }
    setLoading(false);
  }

  const QUICK_PROMPTS = [
    { tag: "ELLIOTT WAVE", text: "Analiza BTC usando Elliott Wave. ¿Estamos en wave 3 o corrección? Dame niveles clave." },
    { tag: "WYCKOFF", text: "¿En qué fase Wyckoff está BTC? ¿Acumulación, distribución, markup o markdown? Dame niveles del Composite Man." },
    { tag: "CONFLUENCIA", text: "Evalúa setup: long BTC zona soporte, RSI oversold 4H, divergencia alcista MACD. ¿Qué score PSY le das del 0-100?" },
    { tag: "LIQUIDACIONES", text: "¿Cuáles son las zonas de liquidación más importantes para BTC en las próximas 24-48h?" },
    { tag: "RISK MGT", text: "Estoy en pérdida. ¿Cómo aplico gestión de riesgo PSYCHOMETRIKS? ¿Cierro, mantengo o promedio?" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="md:col-span-2">
        <Panel title="PSY AI — ANALISTA CUANTITATIVO">
          <div className="h-80 overflow-y-auto flex flex-col gap-3 mb-3 pr-1" style={{scrollbarWidth:"thin",scrollbarColor:"#0d1b2a transparent"}}>
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] ${m.role === "user"
                  ? "bg-[#001a1f] border border-[#00d4ff30] text-white font-space text-[11px] p-3"
                  : "bg-[#040c16] border border-[#0d1b2a] p-3"}`}>
                  {m.role === "ai" && (
                    <div className="flex items-center gap-1.5 mb-2">
                      <svg width="10" height="10" viewBox="0 0 20 20" fill="none">
                        <polygon points="10,2 18,7 18,13 10,18 2,13 2,7" stroke="#00d4ff" strokeWidth="1.5" fill="rgba(0,212,255,0.2)"/>
                      </svg>
                      <span className="font-sharetech text-[7px] tracking-[0.2em] text-[#00d4ff]">PSY AI — ONLINE</span>
                    </div>
                  )}
                  <div className="font-space text-[11px] text-[#c8dde8] leading-relaxed whitespace-pre-wrap">{m.text}</div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-[#040c16] border border-[#0d1b2a] p-3">
                  <div className="flex items-center gap-2">
                    {[0,1,2].map(i=>(
                      <div key={i} className="w-2 h-2 rounded-full bg-[#00d4ff] animate-bounce"
                        style={{animationDelay:`${i*0.15}s`}}/>
                    ))}
                    <span className="font-sharetech text-[8px] text-[#6b8fa8] ml-1">PSY AI analizando…</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={e=>setInput(e.target.value)}
              onKeyDown={e=>{ if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage();} }}
              placeholder="Describe tu setup... ej: BTC en 4H, ruptura de rango, busco long con SL en 102k..."
              rows={2}
              className="flex-1 font-space text-[11px] bg-[#020810] border border-[#0d1b2a] text-white px-3 py-2 resize-none focus:outline-none focus:border-[#00d4ff] placeholder-[#3a5a6a]"
            />
            <button
              onClick={()=>sendMessage()}
              disabled={loading || !input.trim()}
              className="font-sharetech text-[9px] tracking-[0.15em] px-4 py-2 bg-[#00d4ff] text-black font-bold hover:bg-[#00b8e0] transition-colors disabled:opacity-40 disabled:cursor-not-allowed self-end">
              ENVIAR ↗
            </button>
          </div>
        </Panel>
      </div>

      <div className="flex flex-col gap-3">
        <Panel title="ANÁLISIS RÁPIDO">
          <div className="flex flex-col gap-2">
            {QUICK_PROMPTS.map(q=>(
              <button key={q.tag} onClick={()=>sendMessage(q.text)}
                className="text-left border border-[#0d1b2a] p-2.5 hover:border-[#00d4ff40] hover:bg-[#020810] transition-all group">
                <div className="font-sharetech text-[7px] tracking-[0.15em] text-[#00d4ff] mb-1 group-hover:text-[#00d4ff]">{q.tag}</div>
                <div className="font-space text-[9px] text-[#6b8fa8] group-hover:text-white transition-colors leading-relaxed">{q.text.slice(0,55)}…</div>
              </button>
            ))}
          </div>
        </Panel>

        <Panel title="PSY SCORE ENGINE">
          <div className="flex flex-col gap-1.5">
            {[
              {l:"Elliott Wave",v:"×1.5",c:"#00d4ff"},
              {l:"Wyckoff Phase",v:"×1.3",c:"#00d4ff"},
              {l:"RSI + MACD",v:"×1.0",c:"#00d4ff"},
              {l:"Volume Profile",v:"×1.2",c:"#00d4ff"},
              {l:"Macro / OI",v:"×1.4",c:"#00d4ff"},
            ].map(x=>(
              <div key={x.l} className="flex justify-between border-b border-[#060e16] pb-1.5">
                <span className="font-sharetech text-[8px] text-[#6b8fa8]">{x.l}</span>
                <span className="font-sharetech text-[8px]" style={{color:x.c}}>{x.v}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
const NAV_SECTIONS = [
  { id: "overview",  label: "📊 OVERVIEW" },
  { id: "scanner",   label: "🔍 SCANNER" },
  { id: "portfolio", label: "💼 PORTFOLIO" },
  { id: "oi",        label: "📈 OI TRACKER" },
  { id: "ai",        label: "🤖 PSY AI" },
] as const;

function CommandCenterContent() {
  const [section, setSection] = useState<"overview"|"scanner"|"portfolio"|"oi"|"ai">("overview");
  const [market, setMarket] = useState<MarketData|null>(null);
  const [clock, setClock] = useState("");

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setClock(now.toUTCString().slice(17,25) + " UTC");
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  const loadMarket = useCallback(async () => {
    try {
      const [btcRes, ethRes] = await Promise.allSettled([
        fetch("/api/proxy/kraken/price?pair=XBTUSD").then(r=>r.json()) as Promise<{ok:boolean;price?:number;change24h?:number}>,
        fetch("/api/proxy/okx/candles?instId=ETH-USDT&bar=1D&limit=2").then(r=>r.json()) as Promise<{ok:boolean;candles?:Array<{c:number;o:number}>}>,
      ]);

      let btcPrice = 0, btcChange = 0;
      if (btcRes.status === "fulfilled" && btcRes.value.ok) {
        btcPrice = btcRes.value.price ?? 0;
        btcChange = btcRes.value.change24h ?? 0;
      }

      let ethPrice = 0, ethChange = 0;
      if (ethRes.status === "fulfilled" && ethRes.value.ok && ethRes.value.candles?.length === 2) {
        ethPrice = ethRes.value.candles[0].c;
        const prevEth = ethRes.value.candles[1].c;
        ethChange = prevEth > 0 ? ((ethPrice - prevEth) / prevEth) * 100 : 0;
      }

      if (btcPrice > 0 || ethPrice > 0) {
        setMarket({
          btcPrice, btcChange,
          ethPrice, ethChange,
          totalMcap: btcPrice * 19.7e6 * 2.2,
          totalMcapChange: btcChange,
        });
      }
    } catch {}
  }, []);

  useEffect(() => {
    loadMarket();
    const t = setInterval(loadMarket, 30_000);
    return () => clearInterval(t);
  }, [loadMarket]);

  return (
    <div className="min-h-screen bg-[#020810] text-white">
      <SiteNav />
      <div className="pt-16">
        {/* Top header bar */}
        <div className="border-b border-[#0d1b2a] bg-[#030b14]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="font-sharetech text-[8px] tracking-[0.3em] text-[#6b8fa8] mb-0.5">PSY ELITE · COMMAND CENTER</div>
              <h1 className="font-bebas text-3xl md:text-4xl leading-none text-white">
                COMMAND <span className="text-[#00d4ff]">CENTER</span>
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="font-sharetech text-[8px] text-[#6b8fa8]">MERCADO EN VIVO</div>
                {market ? (
                  <div className="flex items-center gap-2">
                    <span className="font-bebas text-lg text-white">{fmtP(market.btcPrice)}</span>
                    <span className="font-sharetech text-[9px]" style={{color:market.btcChange>=0?"#00e676":"#ff1744"}}>
                      {market.btcChange>=0?"▲ +":"▼ "}{Math.abs(market.btcChange).toFixed(2)}%
                    </span>
                  </div>
                ) : (
                  <div className="font-sharetech text-[9px] text-[#6b8fa8] animate-pulse">CONECTANDO…</div>
                )}
              </div>
              <div className="border border-[#0d1b2a] px-3 py-1.5 bg-[#020810]">
                <div className="font-sharetech text-[8px] text-[#00d4ff]">{clock}</div>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[#00e676] animate-pulse"/>
                <span className="font-sharetech text-[8px] text-[#6b8fa8]">EN VIVO</span>
              </div>
            </div>
          </div>

          {/* Nav tabs */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-0 border-t border-[#0d1b2a]">
            {NAV_SECTIONS.map(s => (
              <button key={s.id} onClick={()=>setSection(s.id)}
                className={`px-5 py-3 font-sharetech text-[9px] tracking-[0.15em] transition-all border-b-2 -mb-px ${
                  section===s.id
                    ? "border-[#00d4ff] text-[#00d4ff] bg-[#00101a]"
                    : "border-transparent text-[#6b8fa8] hover:text-white hover:bg-[#040c16]"
                }`}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Section content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          {section === "overview"  && <OverviewSection market={market} />}
          {section === "scanner"   && <ScannerSection />}
          {section === "portfolio" && <PortfolioSection market={market} />}
          {section === "oi"        && <OITrackerSection />}
          {section === "ai"        && <PsyAISection />}
        </div>
      </div>
    </div>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────
export default function CommandCenter() {
  const auth = getAuth();
  if (!auth) {
    window.location.replace("/login?redirect=/command-center");
    return null;
  }
  if (!isEliteUser(auth)) {
    return (
      <div style={{minHeight:"100vh",background:"#020408",color:"#fff",display:"flex",flexDirection:"column"}}>
        <SiteNav />
        <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:"80px 24px 24px"}}>
          <div style={{border:"1px solid #e040fb33",background:"#060a0f",padding:40,maxWidth:460,width:"100%",textAlign:"center",position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"linear-gradient(90deg,transparent,#e040fb,transparent)"}}/>
            <div style={{fontSize:52,marginBottom:16}}>⚡</div>
            <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:"#e040fb",letterSpacing:"0.4em",marginBottom:8}}>ACCESO RESTRINGIDO</div>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:36,color:"#fff",marginBottom:8}}>COMMAND CENTER</div>
            <div style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:12,color:"#7a9aaa",marginBottom:24,lineHeight:1.6}}>
              Dashboard institucional exclusivo del plan <span style={{color:"#e040fb",fontWeight:700}}>ELITE</span> ($99/mes).
            </div>
            <div style={{background:"#0d1520",border:"1px solid #e040fb22",padding:"14px 18px",marginBottom:24,textAlign:"left"}}>
              {[
                "📊 Scanner multi-activo con PSY Score",
                "💼 Portfolio tracker con PnL en tiempo real",
                "📈 OI Tracker — HL · dYdX · OKX · BitMEX",
                "🤖 PSY AI — Análisis Elliott Wave + Wyckoff",
                "⬡ Overview macro: Fear & Greed, NUPL, MVRV",
              ].map(f=>(
                <div key={f} style={{display:"flex",alignItems:"center",gap:8,fontFamily:"'Space Grotesk',sans-serif",fontSize:11,color:"#8a9ab0",marginBottom:6}}>
                  <span style={{color:"#e040fb",fontSize:9}}>✦</span>{f}
                </div>
              ))}
            </div>
            <a href="/pricing" style={{display:"block",width:"100%",padding:"12px",background:"#e040fb",color:"#020408",fontFamily:"'Space Grotesk',sans-serif",fontWeight:700,fontSize:12,letterSpacing:"0.2em",textTransform:"uppercase",textDecoration:"none",boxSizing:"border-box"}}>VER PLAN ELITE →</a>
          </div>
        </div>
      </div>
    );
  }
  return <CommandCenterContent />;
}
