import React, { useState } from "react";
import SiteNav from "@/components/site-nav";

// ─── Chain config ─────────────────────────────────────────────────────────────
const CHAINS = [
  { id: "1",     label: "ETH",  name: "Ethereum",  color: "#627eea" },
  { id: "56",    label: "BSC",  name: "BNB Chain", color: "#f0b90b" },
  { id: "137",   label: "POLY", name: "Polygon",   color: "#8247e5" },
  { id: "42161", label: "ARB",  name: "Arbitrum",  color: "#28a0f0" },
  { id: "8453",  label: "BASE", name: "Base",      color: "#0052ff" },
  { id: "10",    label: "OP",   name: "Optimism",  color: "#ff0420" },
];

// ─── GoPlus response types ────────────────────────────────────────────────────
interface GoPlusResult {
  is_honeypot?: string;
  buy_tax?: string;
  sell_tax?: string;
  is_open_source?: string;
  is_mintable?: string;
  is_proxy?: string;
  is_blacklist?: string;
  hidden_owner?: string;
  selfdestruct?: string;
  owner_change_balance?: string;
  holder_count?: string;
  top10_holder_percent?: string;
  lp_percent?: string;
  lp_holder_count?: string;
  token_name?: string;
  token_symbol?: string;
  total_supply?: string;
  is_anti_whale?: string;
  trading_cooldown?: string;
}

interface HoneypotResult {
  isHoneypot?: boolean;
  simulationSuccess?: boolean;
  honeypotReason?: string;
  buyTax?: number;
  sellTax?: number;
  transferTax?: number;
}

interface RiskItem {
  label: string;
  value: string;
  risk: "ok" | "warn" | "danger" | "info";
  detail?: string;
}

// ─── Risk scoring ─────────────────────────────────────────────────────────────
function calcScore(gp: GoPlusResult, hp: HoneypotResult | null): { score: number; items: RiskItem[] } {
  const items: RiskItem[] = [];
  let score = 0;

  // Honeypot
  const isHoneypot = gp.is_honeypot === "1" || hp?.isHoneypot === true;
  items.push({
    label: "Honeypot",
    value: isHoneypot ? "SÍ — No vas a poder vender" : "NO detectado",
    risk: isHoneypot ? "danger" : "ok",
    detail: isHoneypot ? "El contrato bloquea las ventas. Trampa garantizada." : "Las ventas no están bloqueadas.",
  });
  if (isHoneypot) score += 40;

  // Contract verified
  const verified = gp.is_open_source === "1";
  items.push({
    label: "Contrato verificado",
    value: verified ? "SÍ — Código público" : "NO — Código oculto",
    risk: verified ? "ok" : "warn",
    detail: verified ? "El código es público y auditable." : "No se puede auditar el contrato. Riesgo elevado.",
  });
  if (!verified) score += 20;

  // Buy tax
  const buyTax = (parseFloat(gp.buy_tax ?? "0") || hp?.buyTax) ?? 0;
  items.push({
    label: "Tax de compra",
    value: `${(buyTax * (gp.buy_tax ? 100 : 1)).toFixed(1)}%`,
    risk: buyTax > 0.1 ? "danger" : buyTax > 0.05 ? "warn" : "ok",
    detail: buyTax > 0.1 ? "Tax mayor al 10% — trampa de liquidez o scam." : "",
  });
  if (buyTax > 0.1) score += 15;
  else if (buyTax > 0.05) score += 5;

  // Sell tax
  const sellTax = (parseFloat(gp.sell_tax ?? "0") || hp?.sellTax) ?? 0;
  items.push({
    label: "Tax de venta",
    value: `${(sellTax * (gp.sell_tax ? 100 : 1)).toFixed(1)}%`,
    risk: sellTax > 0.1 ? "danger" : sellTax > 0.05 ? "warn" : "ok",
    detail: sellTax > 0.1 ? "Tax mayor al 10% — prácticamente imposible salir con ganancia." : "",
  });
  if (sellTax > 0.1) score += 15;
  else if (sellTax > 0.05) score += 5;

  // Mintable
  const mintable = gp.is_mintable === "1";
  items.push({
    label: "Minteable (inflación)",
    value: mintable ? "SÍ — Puede crear tokens nuevos" : "NO",
    risk: mintable ? "danger" : "ok",
    detail: mintable ? "El equipo puede crear tokens infinitos y diluir tu posición." : "",
  });
  if (mintable) score += 15;

  // Upgradeable proxy
  const proxy = gp.is_proxy === "1";
  items.push({
    label: "Contrato upgradeable",
    value: proxy ? "SÍ — Las reglas pueden cambiar" : "NO",
    risk: proxy ? "warn" : "ok",
    detail: proxy ? "El contrato puede ser modificado sin aviso. Risk medio-alto." : "",
  });
  if (proxy) score += 10;

  // Hidden owner
  const hiddenOwner = gp.hidden_owner === "1";
  items.push({
    label: "Owner oculto",
    value: hiddenOwner ? "SÍ — Control encubierto" : "NO",
    risk: hiddenOwner ? "danger" : "ok",
    detail: hiddenOwner ? "El dueño real está oculto. Clásica señal de scam." : "",
  });
  if (hiddenOwner) score += 20;

  // Blacklist
  const blacklist = gp.is_blacklist === "1";
  items.push({
    label: "Función blacklist",
    value: blacklist ? "SÍ — Pueden bloquearte" : "NO",
    risk: blacklist ? "warn" : "ok",
    detail: blacklist ? "El equipo puede bloquear wallets específicas para que no puedan vender." : "",
  });
  if (blacklist) score += 10;

  // Selfdestruct
  const selfDestruct = gp.selfdestruct === "1";
  items.push({
    label: "Autodestrucción",
    value: selfDestruct ? "SÍ — Puede borrarse" : "NO",
    risk: selfDestruct ? "danger" : "ok",
    detail: selfDestruct ? "El contrato puede borrarse y quedarte sin liquidez." : "",
  });
  if (selfDestruct) score += 20;

  // Holder concentration
  const top10 = parseFloat(gp.top10_holder_percent ?? "0");
  items.push({
    label: "Concentración top 10 holders",
    value: `${(top10 * 100).toFixed(1)}%`,
    risk: top10 > 0.7 ? "danger" : top10 > 0.4 ? "warn" : "ok",
    detail: top10 > 0.7 ? "Más del 70% en 10 wallets. Dump inminente." : top10 > 0.4 ? "Concentración alta. Cuidado con el dump." : "",
  });
  if (top10 > 0.7) score += 15;
  else if (top10 > 0.4) score += 5;

  return { score: Math.min(score, 100), items };
}

function RiskBadge({ score }: { score: number }) {
  if (score < 30) return (
    <div className="flex items-center gap-3">
      <div className="w-4 h-4 rounded-full bg-[#00e676] shadow-[0_0_12px_#00e676]" />
      <div>
        <div className="font-bebas text-3xl text-[#00e676]">RELATIVAMENTE SEGURO</div>
        <div className="font-sharetech text-[9px] text-[#00e676] tracking-[0.15em]">Score de riesgo: {score}/100 — Proceder con análisis propio</div>
      </div>
    </div>
  );
  if (score < 60) return (
    <div className="flex items-center gap-3">
      <div className="w-4 h-4 rounded-full bg-[#ffd700] shadow-[0_0_12px_#ffd700]" />
      <div>
        <div className="font-bebas text-3xl text-[#ffd700]">ESPECULATIVO — ALTO RIESGO</div>
        <div className="font-sharetech text-[9px] text-[#ffd700] tracking-[0.15em]">Score de riesgo: {score}/100 — Entrá solo con lo que podés perder</div>
      </div>
    </div>
  );
  return (
    <div className="flex items-center gap-3">
      <div className="w-4 h-4 rounded-full bg-[#ff1744] shadow-[0_0_12px_#ff1744]" />
      <div>
        <div className="font-bebas text-3xl text-[#ff1744]">PROBABLEMENTE SCAM</div>
        <div className="font-sharetech text-[9px] text-[#ff1744] tracking-[0.15em]">Score de riesgo: {score}/100 — Evitar completamente</div>
      </div>
    </div>
  );
}

const RISK_COLORS = {
  ok:     { color: "#00e676", bg: "#00e67610", border: "#00e67630", label: "✓ OK" },
  warn:   { color: "#ffd700", bg: "#ffd70010", border: "#ffd70030", label: "⚠ ALERTA" },
  danger: { color: "#ff1744", bg: "#ff174410", border: "#ff174430", label: "✕ PELIGRO" },
  info:   { color: "#00e5ff", bg: "#00e5ff10", border: "#00e5ff30", label: "i INFO" },
};

const SCORE_BAR_COLOR = (s: number) =>
  s < 30 ? "#00e676" : s < 60 ? "#ffd700" : "#ff1744";

export default function AntiRug() {
  const [chain, setChain] = useState("1");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{
    token: { name: string; symbol: string; supply: string; holders: string };
    score: number;
    items: RiskItem[];
  } | null>(null);

  const analyze = async () => {
    const addr = address.trim();
    if (!addr || !/^0x[0-9a-fA-F]{40}$/.test(addr)) {
      setError("Dirección inválida. Debe ser 0x seguido de 40 caracteres hexadecimales.");
      return;
    }
    setError("");
    setResult(null);
    setLoading(true);

    try {
      // GoPlus Security API
      const gpRes = await fetch(
        `https://api.gopluslabs.io/api/v1/token_security/${chain}?contract_addresses=${addr}`
      );
      const gpData = await gpRes.json() as { result?: Record<string, GoPlusResult>; code?: number };

      if (gpData.code !== 1 || !gpData.result) {
        throw new Error("GoPlus no encontró información para este token en esta red.");
      }
      const gp: GoPlusResult = gpData.result[addr.toLowerCase()] ?? {};

      // Honeypot.is (best-effort, may fail on some chains)
      let hp: HoneypotResult | null = null;
      if (chain === "1" || chain === "56" || chain === "137") {
        try {
          const chainMap: Record<string, string> = { "1": "1", "56": "56", "137": "137" };
          const hpRes = await fetch(
            `https://api.honeypot.is/v2/IsHoneypot?address=${addr}&chainID=${chainMap[chain]}`
          );
          if (hpRes.ok) hp = await hpRes.json() as HoneypotResult;
        } catch { /* ignore — honeypot.is is optional */ }
      }

      const { score, items } = calcScore(gp, hp);

      setResult({
        token: {
          name:    gp.token_name    ?? "Desconocido",
          symbol:  gp.token_symbol  ?? addr.slice(0, 8) + "…",
          supply:  gp.total_supply  ? Number(gp.total_supply).toLocaleString() : "—",
          holders: gp.holder_count  ? Number(gp.holder_count).toLocaleString() : "—",
        },
        score,
        items,
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error de red. Verificá la dirección y la red seleccionada.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020408] text-white font-rajdhani">
      <SiteNav />
      <div className="pt-28 pb-24 px-4 md:px-8 max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-10">
          <div className="font-space text-[10px] text-[#e040fb] tracking-[0.4em] uppercase mb-2">Análisis On-Chain · Elite</div>
          <h1 className="font-bebas text-5xl md:text-7xl leading-none mb-3">
            MODO<br /><span style={{ color: "#e040fb" }}>ANTI-RUG</span>
          </h1>
          <p className="font-space text-[12px] text-[#7ab3c8] max-w-lg leading-relaxed">
            Pegá la dirección del token que querés analizar. El sistema verifica honeypot, taxes, 
            concentración de holders, contratos upgradeables, owner oculto y más — en segundos.
          </p>
        </div>

        {/* Input panel */}
        <div className="border border-[#1a2535] bg-[#060a0f] p-6 mb-8">
          <div className="font-sharetech text-[9px] tracking-[0.3em] text-[#5a8898] mb-4">
            SELECCIONAR RED
          </div>
          <div className="flex flex-wrap gap-2 mb-6">
            {CHAINS.map(c => (
              <button key={c.id} onClick={() => setChain(c.id)}
                className="px-4 py-2 font-space text-[11px] font-bold tracking-[0.1em] border transition-all"
                style={{
                  borderColor: chain === c.id ? c.color : "#1a2535",
                  color: chain === c.id ? c.color : "#4a6070",
                  background: chain === c.id ? c.color + "15" : "#060a0f",
                }}>
                {c.label}
                <span className="ml-1 font-sharetech text-[9px] opacity-60">{c.name}</span>
              </button>
            ))}
          </div>

          <div className="font-sharetech text-[9px] tracking-[0.3em] text-[#5a8898] mb-2">
            DIRECCIÓN DEL TOKEN
          </div>
          <div className="flex gap-3">
            <input
              value={address}
              onChange={e => { setAddress(e.target.value); setError(""); }}
              onKeyDown={e => e.key === "Enter" && analyze()}
              placeholder="0x…"
              className="flex-1 bg-[#030609] border border-[#1a2535] px-4 py-3 font-mono text-[13px] text-white placeholder-[#5a8898] outline-none focus:border-[#e040fb] transition-colors"
            />
            <button
              onClick={analyze}
              disabled={loading || !address.trim()}
              className="px-8 py-3 font-space text-[12px] font-bold tracking-[0.15em] uppercase transition-all disabled:opacity-40"
              style={{ background: "#e040fb", color: "#020408" }}>
              {loading ? "ANALIZANDO…" : "ANALIZAR"}
            </button>
          </div>
          {error && (
            <div className="mt-3 font-space text-[11px] text-[#ff1744] border border-[#ff174422] bg-[#0d0508] px-4 py-3">
              {error}
            </div>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="border border-[#e040fb22] bg-[#e040fb05] p-12 text-center">
            <div className="font-sharetech text-[9px] tracking-[0.3em] text-[#e040fb] mb-4">CONSULTANDO GOPLUS · HONEYPOT.IS · ON-CHAIN DATA</div>
            <div className="flex justify-center gap-2">
              {[0, 150, 300].map(d => (
                <div key={d} className="w-2 h-2 rounded-full bg-[#e040fb]"
                  style={{ animation: `pulse 0.8s ${d}ms infinite` }} />
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-6">
            {/* Token identity */}
            <div className="border border-[#1a2535] bg-[#060a0f] p-6">
              <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
                <div>
                  <div className="font-bebas text-4xl text-white">{result.token.name}</div>
                  <div className="font-sharetech text-[10px] text-[#7ab3c8] tracking-[0.2em]">
                    ${result.token.symbol} · {CHAINS.find(c => c.id === chain)?.name} · {address.slice(0, 10)}…{address.slice(-8)}
                  </div>
                </div>
                <div className="flex gap-6">
                  <div className="text-center">
                    <div className="font-sharetech text-[9px] text-[#5a8898] tracking-[0.2em] mb-1">SUPPLY</div>
                    <div className="font-space text-[13px] text-white">{result.token.supply}</div>
                  </div>
                  <div className="text-center">
                    <div className="font-sharetech text-[9px] text-[#5a8898] tracking-[0.2em] mb-1">HOLDERS</div>
                    <div className="font-space text-[13px] text-white">{result.token.holders}</div>
                  </div>
                </div>
              </div>

              {/* Score */}
              <div className="border-t border-[#1a2535] pt-4">
                <RiskBadge score={result.score} />
                <div className="mt-4 h-2 bg-[#1a2535] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{ width: `${result.score}%`, background: SCORE_BAR_COLOR(result.score) }}
                  />
                </div>
              </div>
            </div>

            {/* Risk items grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {result.items.map(item => {
                const c = RISK_COLORS[item.risk];
                return (
                  <div key={item.label}
                    className="border p-4"
                    style={{ borderColor: c.border, background: c.bg }}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-space text-[11px] text-[#8090a0] tracking-[0.05em]">{item.label}</div>
                      <span className="font-sharetech text-[9px] tracking-[0.1em] px-2 py-0.5 border"
                        style={{ color: c.color, borderColor: c.border }}>
                        {c.label}
                      </span>
                    </div>
                    <div className="font-space text-[13px] font-bold" style={{ color: c.color }}>
                      {item.value}
                    </div>
                    {item.detail && (
                      <div className="font-sharetech text-[9px] text-[#7ab3c8] mt-1 leading-relaxed">
                        {item.detail}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Disclaimer */}
            <div className="border border-[#1a2535] bg-[#060a0f] px-6 py-4">
              <div className="font-sharetech text-[9px] text-[#5a8898] leading-relaxed">
                ⚠ ESTO NO ES ASESORÍA FINANCIERA — El análisis es automático y puede tener falsos positivos/negativos.
                Siempre hacé tu propio research (DYOR). Un score bajo no garantiza que el proyecto sea legítimo a largo plazo.
                Powered by GoPlus Security + Honeypot.is.
              </div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && !result && !error && (
          <div className="border border-[#1a2535] bg-[#060a0f] p-16 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <div className="font-bebas text-3xl text-white mb-2">INGRESÁ UNA DIRECCIÓN</div>
            <p className="font-space text-[12px] text-[#7ab3c8] max-w-sm mx-auto leading-relaxed">
              Seleccioná la red y pegá el contract address del token que querés analizar antes de invertir.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
