import React, { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import SiteNav from "@/components/site-nav";
import ContractScanner from "@/components/contract-scanner";
import { useAccount, useDisconnect, useSwitchChain } from "wagmi";
import { useAppKit } from "@reown/appkit/react";

// ─── Constants ────────────────────────────────────────────────────────────────
const PSY_FEE_PCT = 1.5; // 1.5% platform fee on every swap
const PSY_FEE_WALLET = "0xd255a2Ab2Cdd0ECbA857214EF2400697d402af00"; // GEORGETOM2 — fee recipient

// ─── Token / Project types ────────────────────────────────────────────────────
type ValidationKey = "website" | "whitepaper" | "contract" | "team" | "audit" | "liquidity";

interface TokenProject {
  id: string;
  name: string;
  symbol: string;
  icon: string;
  color: string;
  tagline: string;
  description: string;
  category: string;
  stage: "PRE-SALE" | "IDO" | "RECIEN LISTADO" | "PRÓXIMAMENTE";
  stageColor: string;
  price: number;           // in USD
  totalSupply: number;
  circulatingSupply: number;
  hardCap: number;         // USD
  raised: number;          // USD raised so far
  minBuy: number;          // USD
  maxBuy: number;          // USD
  startDate: string;
  endDate: string;
  website: string;
  whitepaper: string;
  twitter: string;
  telegram: string;
  contractAddress: string;
  chain: "ETH" | "BSC" | "SOL" | "POLY" | "AVAX" | "BASE";
  chainColor: string;
  validations: Record<ValidationKey, boolean>;
  psyScore: number;        // 0-100 platform trust score
  holders: number;
  volume24h: number;
  featured: boolean;
  submittedBy: string;
  listedAt: string;
  buyLinks?: {
    primary: { label: string; url: string };
    secondary?: { label: string; url: string };
    dexscreener?: { label: string; url: string };
    rugcheck?: { label: string; url: string };
  };
  commissionPct?: number;
  affiliateCode?: string;
}

// ─── Affiliate URL builder ────────────────────────────────────────────────────
// Appends ?ref=CODE (or &ref=CODE) to the project's buy URL so PSYCHOMETRIKS
// gets credited as affiliate. commissionPct is informational — the project
// tracks conversions and pays the commission based on that ref code.
function buildAffiliateUrl(baseUrl: string, affiliateCode?: string): string {
  if (!affiliateCode) return baseUrl;
  const sep = baseUrl.includes("?") ? "&" : "?";
  return `${baseUrl}${sep}ref=${encodeURIComponent(affiliateCode)}`;
}

// Projects are loaded at runtime from public/projects.json — edit that file to add/remove projects without recompiling.

const VALIDATION_LABELS: Record<ValidationKey, { label: string; icon: string; desc: string }> = {
  website:    { label: "Sitio Web",       icon: "🌐", desc: "Sitio web verificado y activo" },
  whitepaper: { label: "Whitepaper",      icon: "📄", desc: "Documentación técnica publicada" },
  contract:   { label: "Contrato",        icon: "⛓",  desc: "Smart contract verificado en blockchain" },
  team:       { label: "Equipo",          icon: "👥", desc: "Equipo KYC verificado" },
  audit:      { label: "Auditoría",       icon: "🔍", desc: "Auditoría de seguridad aprobada" },
  liquidity:  { label: "Liquidez",        icon: "💧", desc: "Liquidez bloqueada en contrato" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(n: number) {
  if (n >= 1e9) return "$" + (n / 1e9).toFixed(2) + "B";
  if (n >= 1e6) return "$" + (n / 1e6).toFixed(2) + "M";
  if (n >= 1e3) return "$" + (n / 1e3).toFixed(1) + "K";
  return "$" + n.toFixed(2);
}
function fmtNum(n: number) {
  if (n >= 1e9) return (n / 1e9).toFixed(1) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return n.toString();
}
function pct(a: number, b: number) { return b === 0 ? 0 : Math.min(100, (a / b) * 100); }
function truncAddr(a: string) { return a.slice(0, 6) + "..." + a.slice(-4); }

// ─── Wallet hook — AppKit (WalletConnect) ─────────────────────────────────────
function useWallet() {
  const { address, chainId, isConnecting } = useAccount();
  const { disconnect: wagmiDisconnect } = useDisconnect();
  const { open } = useAppKit();

  return {
    address: address ?? null,
    connecting: isConnecting,
    connectError: "",
    chainId: chainId ? `0x${chainId.toString(16)}` : null,
    hasMetaMask: typeof window !== "undefined" && !!(window as unknown as Record<string, unknown>).ethereum,
    connect: () => open(),
    disconnect: () => wagmiDisconnect(),
    // unused with AppKit — kept for interface compatibility
    showPicker: false,
    pickerOpts: [],
    closePicker: () => {},
    pickWallet: () => {},
  };
}

// ─── Score bar ────────────────────────────────────────────────────────────────
function ScoreBar({ score, color }: { score: number; color: string }) {
  const c = score >= 80 ? "#00e676" : score >= 60 ? "#ffd700" : "#ff1744";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-[#0d1520] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${score}%`, background: c }} />
      </div>
      <span className="font-space text-[10px] font-bold" style={{ color: c }}>{score}</span>
    </div>
  );
}

// ─── Raised progress bar ──────────────────────────────────────────────────────
function RaisedBar({ raised, hardCap, color }: { raised: number; hardCap: number; color: string }) {
  const p = pct(raised, hardCap);
  return (
    <div>
      <div className="flex justify-between font-space text-[9px] text-[#8ab8cc] mb-1">
        <span>Recaudado: <span style={{ color }}>{fmt(raised)}</span></span>
        <span>Meta: {fmt(hardCap)}</span>
      </div>
      <div className="h-2 bg-[#0d1520] border border-[#1a2535] rounded-sm overflow-hidden">
        <div className="h-full transition-all" style={{ width: `${p}%`, background: color }} />
      </div>
      <div className="font-space text-[9px] text-right mt-0.5" style={{ color }}>{p.toFixed(1)}%</div>
    </div>
  );
}

// ─── Validation badges ────────────────────────────────────────────────────────
function ValidationBadges({ validations, compact = false }: { validations: Record<ValidationKey, boolean>; compact?: boolean }) {
  const score = Object.values(validations).filter(Boolean).length;
  return (
    <div className="flex flex-wrap gap-1.5">
      {(Object.keys(validations) as ValidationKey[]).map(k => {
        const v = VALIDATION_LABELS[k];
        return (
          <div key={k} title={v.desc}
            className={`flex items-center gap-1 font-space text-[9px] px-1.5 py-0.5 border ${
              validations[k]
                ? "border-[#00e67633] bg-[#00e67610] text-[#00e676]"
                : "border-[#1a2535] bg-transparent text-[#6a98b0]"
            }`}>
            <span>{v.icon}</span>
            {!compact && <span>{v.label}</span>}
            {validations[k] && !compact && <span>✓</span>}
          </div>
        );
      })}
      {!compact && (
        <div className={`font-space text-[9px] px-1.5 py-0.5 border ${
          score >= 5 ? "border-[#00e67644] bg-[#00e67615] text-[#00e676]"
          : score >= 3 ? "border-[#ffd70044] bg-[#ffd70015] text-[#ffd700]"
          : "border-[#ff174444] bg-[#ff174415] text-[#ff1744]"
        }`}>
          {score}/6 verificado
        </div>
      )}
    </div>
  );
}

// ─── Buy Modal ────────────────────────────────────────────────────────────────
function BuyModal({ project, wallet, onClose }: {
  project: TokenProject;
  wallet: ReturnType<typeof useWallet>;
  onClose: () => void;
}) {
  const [usdAmount, setUsdAmount] = useState("");
  const [step, setStep] = useState<"form" | "confirm" | "success">("form");
  const [loading, setLoading] = useState(false);

  const usd = parseFloat(usdAmount) || 0;
  const fee = usd * (PSY_FEE_PCT / 100);
  const netUsd = usd - fee;
  const tokensOut = project.price > 0 ? netUsd / project.price : 0;

  const handleBuy = () => {
    if (!wallet.address) { wallet.connect(); return; }
    if (usd < project.minBuy) return;
    setStep("confirm");
  };

  const handleConfirm = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep("success");
    }, 2200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-[#060a0f] border border-[#1a2535] max-w-md w-full relative">
        <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: project.color }} />

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#0d1520]">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{project.icon}</span>
            <div>
              <div className="font-bebas text-xl text-white">{project.name}</div>
              <div className="font-space text-[10px] text-[#8ab8cc]">{project.symbol} · {project.chain}</div>
            </div>
          </div>
          <button onClick={onClose} className="text-[#8ab8cc] hover:text-white text-lg">✕</button>
        </div>

        <div className="p-5">
          {step === "form" && (
            <>
              {/* Wallet */}
              {wallet.address ? (
                <div className="flex items-center justify-between border border-[#00e67633] bg-[#00e67608] px-4 py-2.5 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#00e676] animate-pulse" />
                    <span className="font-space text-[10px] text-[#00e676]">Wallet conectada</span>
                  </div>
                  <span className="font-space text-[10px] text-white">{truncAddr(wallet.address)}</span>
                </div>
              ) : (
                <button onClick={wallet.connect} disabled={wallet.connecting}
                  className="w-full flex items-center justify-center gap-2 border border-[#ffd70033] bg-[#ffd70010] px-4 py-3 mb-4 hover:bg-[#ffd70018] transition-colors disabled:opacity-60 disabled:cursor-wait">
                  <span className="text-lg">🦊</span>
                  <span className="font-space text-[11px] text-[#ffd700]">
                    {wallet.connecting ? "Conectando..." : "Conectar MetaMask primero"}
                  </span>
                </button>
              )}

              {/* Amount input */}
              <div className="border border-[#1a2535] bg-[#020408] p-4 mb-3">
                <div className="flex justify-between font-space text-[10px] text-[#8ab8cc] mb-2">
                  <span>PAGÁS (USDT)</span>
                  <span>Mín: {fmt(project.minBuy)} · Máx: {fmt(project.maxBuy)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={usdAmount}
                    onChange={e => setUsdAmount(e.target.value)}
                    placeholder="0.00"
                    className="flex-1 bg-transparent text-white font-bebas text-3xl outline-none placeholder:text-[#1a2535] w-0"
                  />
                  <span className="font-space text-[12px] text-[#26a17b] font-bold shrink-0">$ USDT</span>
                </div>
                <div className="flex gap-2 mt-2">
                  {[100, 500, 1000, 5000].filter(v => v <= project.maxBuy).map(v => (
                    <button key={v} onClick={() => setUsdAmount(String(v))}
                      className="font-space text-[9px] border border-[#1a2535] text-[#8ab8cc] px-2 py-0.5 hover:text-white hover:border-[#5a8898] transition-colors">
                      ${v.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Receive */}
              <div className="border border-[#1a2535] bg-[#020408] p-4 mb-4">
                <div className="font-space text-[10px] text-[#8ab8cc] mb-2">RECIBÍS</div>
                <div className="font-bebas text-3xl" style={{ color: project.color }}>
                  {usd > 0 && project.price > 0 ? fmtNum(tokensOut) : "0"} {project.symbol}
                </div>
                <div className="font-space text-[9px] text-[#6a98b0] mt-1">
                  1 {project.symbol} = ${project.price > 0 ? project.price.toFixed(4) : "TBD"}
                </div>
              </div>

              {/* Fee breakdown */}
              {usd > 0 && (
                <div className="border border-[#0d1520] p-3 mb-4 space-y-1">
                  {[
                    { label: "Subtotal", val: fmt(usd) },
                    { label: `Fee PSY Exchange (${PSY_FEE_PCT}%)`, val: fmt(fee), highlight: true },
                    { label: "Tokens a recibir", val: `${fmtNum(tokensOut)} ${project.symbol}` },
                  ].map(d => (
                    <div key={d.label} className="flex justify-between font-space text-[10px]">
                      <span className="text-[#6a98b0]">{d.label}</span>
                      <span className={d.highlight ? "text-[#ffd700]" : "text-[#a8bece]"}>{d.val}</span>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={handleBuy}
                disabled={project.stage === "PRÓXIMAMENTE"}
                className="w-full py-4 font-space text-[12px] font-bold tracking-[0.2em] uppercase transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: project.stage === "PRÓXIMAMENTE" ? "#1a2535" : project.color,
                  color: project.stage === "PRÓXIMAMENTE" ? "#4a6070" : "#020408"
                }}>
                {project.stage === "PRÓXIMAMENTE" ? "AÚN NO DISPONIBLE" : wallet.address ? `COMPRAR ${project.symbol}` : "CONECTAR WALLET"}
              </button>

              <div className="mt-3 font-space text-[9px] text-[#6a98b0] text-center">
                Fee del {PSY_FEE_PCT}% va a <span className="text-[#8ab8cc]">{PSY_FEE_WALLET.slice(0,6)}...{PSY_FEE_WALLET.slice(-4)}</span> · Red {project.chain}
              </div>
            </>
          )}

          {step === "confirm" && (
            <div>
              <div className="font-bebas text-2xl text-white mb-4">CONFIRMAR TRANSACCIÓN</div>
              <div className="border border-[#1a2535] p-4 mb-4 space-y-2">
                {[
                  { label: "Token", val: `${project.name} (${project.symbol})` },
                  { label: "Red", val: project.chain },
                  { label: "Pagás", val: fmt(usd) + " USDT" },
                  { label: `Fee (${PSY_FEE_PCT}%)`, val: fmt(fee) + " USDT" },
                  { label: "Fee recipient", val: `${PSY_FEE_WALLET.slice(0,8)}...${PSY_FEE_WALLET.slice(-6)}` },
                  { label: "Recibís", val: `${fmtNum(tokensOut)} ${project.symbol}` },
                  { label: "Precio unitario", val: "$" + project.price.toFixed(4) },
                  { label: "Contrato", val: truncAddr(project.contractAddress) },
                ].map(d => (
                  <div key={d.label} className="flex justify-between font-space text-[11px]">
                    <span className="text-[#8ab8cc]">{d.label}</span>
                    <span className="text-white">{d.val}</span>
                  </div>
                ))}
              </div>
              <div className="border border-[#ffd70033] bg-[#ffd70008] p-3 mb-4">
                <div className="font-space text-[10px] text-[#ffd700]">⚠ Verificá los datos antes de confirmar. Las transacciones en blockchain son irreversibles.</div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep("form")} className="flex-1 py-3 border border-[#1a2535] text-[#8ab8cc] font-space text-[11px] hover:text-white transition-colors">
                  VOLVER
                </button>
                <button onClick={handleConfirm} disabled={loading}
                  className="flex-1 py-3 font-space text-[11px] font-bold tracking-[0.15em] uppercase"
                  style={{ background: project.color, color: "#020408" }}>
                  {loading ? "ENVIANDO..." : "CONFIRMAR Y COMPRAR"}
                </button>
              </div>
            </div>
          )}

          {step === "success" && (
            <div className="text-center py-6">
              <div className="text-5xl mb-4">✅</div>
              <div className="font-bebas text-3xl text-[#00e676] mb-2">ORDEN REGISTRADA</div>
              <div className="font-space text-[12px] text-[#8ab8cc] mb-1">
                {fmtNum(tokensOut)} {project.symbol} por {fmt(usd)} USDT
              </div>
              <div className="font-space text-[10px] text-[#6a98b0] mb-4">
                Fee PSY Exchange: {fmt(fee)} USDT → {PSY_FEE_WALLET.slice(0,8)}...{PSY_FEE_WALLET.slice(-6)}
              </div>
              <div className="border border-[#ffd70033] bg-[#ffd70008] px-4 py-3 mb-6 text-left">
                <div className="font-space text-[10px] text-[#ffd700] mb-1">⏳ TX HASH — PENDIENTE</div>
                <div className="font-space text-[9px] text-[#6a98b0] leading-relaxed">
                  El hash on-chain estará disponible una vez procesada la transacción en la red {project.chain}. Recibirás confirmación por correo.
                </div>
              </div>
              <button onClick={onClose}
                className="font-space text-[11px] border border-[#00e5ff44] text-[#00e5ff] px-8 py-2.5 hover:bg-[#00e5ff15] transition-colors">
                CERRAR
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Token detail modal ───────────────────────────────────────────────────────
function TokenDetailModal({ project, wallet, onClose }: {
  project: TokenProject;
  wallet: ReturnType<typeof useWallet>;
  onClose: () => void;
}) {
  const [showBuy, setShowBuy] = useState(false);

  if (showBuy) return <BuyModal project={project} wallet={wallet} onClose={() => { setShowBuy(false); onClose(); }} />;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#060a0f] border border-[#1a2535] max-w-2xl w-full my-8 relative">
        <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: project.color }} />

        {/* Header */}
        <div className="p-6 border-b border-[#0d1520]">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="text-4xl">{project.icon}</div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <div className="font-bebas text-3xl text-white">{project.name}</div>
                  <span className="font-space text-[9px] px-2 py-0.5 tracking-[0.1em]"
                    style={{ color: project.stageColor, background: `${project.stageColor}18`, border: `1px solid ${project.stageColor}44` }}>
                    {project.stage}
                  </span>
                </div>
                <div className="font-space text-[11px] text-[#8ab8cc]">{project.symbol} · {project.chain} · {project.category}</div>
              </div>
            </div>
            <button onClick={onClose} className="text-[#8ab8cc] hover:text-white text-xl">✕</button>
          </div>
          <p className="font-space text-[12px] text-[#7a9aaa] mt-4 leading-relaxed">{project.description}</p>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left */}
          <div className="space-y-5">
            {/* Key metrics */}
            <div>
              <div className="font-sharetech text-[8px] text-[#8ab8cc] tracking-[0.3em] mb-3">MÉTRICAS DEL TOKEN</div>
              <div className="space-y-2">
                {[
                  { label: "Precio",          val: project.price > 0 ? "$" + project.price.toFixed(4) : "TBD", color: project.color },
                  { label: "Supply total",    val: fmtNum(project.totalSupply) + " " + project.symbol },
                  { label: "Circulación",     val: fmtNum(project.circulatingSupply) + " " + project.symbol },
                  { label: "Hard cap",        val: fmt(project.hardCap) },
                  { label: "Vol 24h",         val: fmt(project.volume24h) },
                  { label: "Holders",         val: project.holders.toLocaleString() },
                ].map(m => (
                  <div key={m.label} className="flex justify-between border-b border-[#0d1520] pb-1.5">
                    <span className="font-space text-[10px] text-[#8ab8cc]">{m.label}</span>
                    <span className="font-space text-[10px]" style={{ color: m.color ?? "white" }}>{m.val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Raised */}
            {project.stage !== "PRÓXIMAMENTE" && (
              <div>
                <div className="font-sharetech text-[8px] text-[#8ab8cc] tracking-[0.3em] mb-3">RECAUDACIÓN</div>
                <RaisedBar raised={project.raised} hardCap={project.hardCap} color={project.color} />
              </div>
            )}

            {/* Dates */}
            <div>
              <div className="font-sharetech text-[8px] text-[#8ab8cc] tracking-[0.3em] mb-3">FECHAS</div>
              <div className="space-y-1.5">
                <div className="flex justify-between font-space text-[10px]">
                  <span className="text-[#8ab8cc]">Inicio</span>
                  <span className="text-white">{project.startDate}</span>
                </div>
                <div className="flex justify-between font-space text-[10px]">
                  <span className="text-[#8ab8cc]">Fin</span>
                  <span className="text-white">{project.endDate}</span>
                </div>
                <div className="flex justify-between font-space text-[10px]">
                  <span className="text-[#8ab8cc]">Compra mínima</span>
                  <span className="text-white">{fmt(project.minBuy)}</span>
                </div>
                <div className="flex justify-between font-space text-[10px]">
                  <span className="text-[#8ab8cc]">Compra máxima</span>
                  <span className="text-white">{fmt(project.maxBuy)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right */}
          <div className="space-y-5">
            {/* PSY Score */}
            <div>
              <div className="font-sharetech text-[8px] text-[#8ab8cc] tracking-[0.3em] mb-3">PSY TRUST SCORE</div>
              <div className="flex items-center gap-3 mb-2">
                <div className="font-bebas text-4xl" style={{ color: project.psyScore >= 80 ? "#00e676" : project.psyScore >= 60 ? "#ffd700" : "#ff1744" }}>
                  {project.psyScore}
                </div>
                <div>
                  <div className="font-space text-[10px] text-white">
                    {project.psyScore >= 80 ? "✅ ALTA CONFIANZA" : project.psyScore >= 60 ? "⚠ CONFIANZA MEDIA" : "❌ RIESGO ALTO"}
                  </div>
                  <div className="font-space text-[9px] text-[#8ab8cc]">Score de verificación PSY Exchange</div>
                </div>
              </div>
              <ScoreBar score={project.psyScore} color={project.color} />
            </div>

            {/* Validations */}
            <div>
              <div className="font-sharetech text-[8px] text-[#8ab8cc] tracking-[0.3em] mb-3">VERIFICACIONES</div>
              <div className="space-y-1.5">
                {(Object.keys(project.validations) as ValidationKey[]).map(k => {
                  const v = VALIDATION_LABELS[k];
                  const ok = project.validations[k];
                  return (
                    <div key={k} className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-space text-[10px] text-[#8ab8cc]">
                        <span>{v.icon}</span> {v.label}
                        <span className="text-[9px] text-[#6a98b0]">— {v.desc}</span>
                      </div>
                      <span className={ok ? "text-[#00e676] text-sm" : "text-[#ff174450] text-sm"}>
                        {ok ? "✓" : "✗"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Links */}
            <div>
              <div className="font-sharetech text-[8px] text-[#8ab8cc] tracking-[0.3em] mb-3">PROYECTO</div>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "🌐 Web", href: project.website },
                  { label: "📄 Whitepaper", href: project.whitepaper },
                  { label: "🐦 Twitter", href: "#" },
                  { label: "✈️ Telegram", href: "#" },
                ].map(l => (
                  <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer"
                    className="font-space text-[9px] border border-[#1a2535] text-[#8ab8cc] px-2.5 py-1 hover:text-white hover:border-[#5a8898] transition-colors no-underline">
                    {l.label}
                  </a>
                ))}
              </div>
            </div>

            {/* Contract */}
            <div className="border border-[#1a2535] p-3">
              <div className="font-sharetech text-[8px] text-[#8ab8cc] tracking-[0.2em] mb-1">SMART CONTRACT ({project.chain})</div>
              <div className="font-space text-[10px] text-white break-all">{project.contractAddress}</div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="p-6 border-t border-[#0d1520]">
          {project.stage === "PRÓXIMAMENTE" || !project.buyLinks ? (
            <button
              onClick={() => project.buyLinks ? undefined : setShowBuy(true)}
              disabled={project.stage === "PRÓXIMAMENTE"}
              className="w-full py-4 font-space text-[13px] font-bold tracking-[0.2em] uppercase transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: project.stage !== "PRÓXIMAMENTE" ? project.color : "#1a2535", color: project.stage !== "PRÓXIMAMENTE" ? "#020408" : "#4a6070" }}>
              {project.stage === "PRÓXIMAMENTE" ? "PRÓXIMAMENTE — ANOTATE EN WAITLIST" : `COMPRAR ${project.symbol} → ${project.price > 0 ? "$" + project.price.toFixed(4) : "TBD"}`}
            </button>
          ) : (
            <div className="flex flex-col gap-2">
              {/* Affiliate badge — visible cuando hay commissionPct */}
              {project.commissionPct && project.commissionPct > 0 ? (
                <div className="flex items-center justify-between bg-[#00e67608] border border-[#00e67622] px-3 py-2 mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[#00e676] text-xs">🤝</span>
                    <span className="font-sharetech text-[8px] tracking-[0.15em] text-[#00e676]">LINK CON AFILIADO PSY</span>
                  </div>
                  <span className="font-space text-[9px] font-bold text-[#00e676]">{project.commissionPct}% comisión</span>
                </div>
              ) : null}

              {/* Primary buy button — URL includes ?ref=AFFILIATE_CODE */}
              <a
                href={buildAffiliateUrl(project.buyLinks.primary.url, project.affiliateCode)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-4 font-space text-[13px] font-bold tracking-[0.2em] uppercase text-center no-underline transition-all hover:opacity-90"
                style={{ background: project.color, color: "#020408" }}>
                {project.buyLinks.primary.label} → {project.price > 0 ? "$" + project.price.toFixed(4) : "TBD"}
              </a>

              {/* Secondary (DEX/exchange link) — sin affiliate code, va a DEX directo */}
              {project.buyLinks.secondary && (
                <a
                  href={project.buyLinks.secondary.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 font-space text-[11px] tracking-[0.15em] uppercase text-center no-underline border transition-all hover:opacity-80"
                  style={{ borderColor: `${project.color}44`, color: project.color, background: `${project.color}08` }}>
                  {project.buyLinks.secondary.label} ↗
                </a>
              )}
            </div>
          )}
          <div className="mt-2 font-space text-[9px] text-[#6a98b0] text-center">
            {project.affiliateCode
              ? `Link de afiliado PSY activo · ref=${project.affiliateCode} · Red ${project.chain}`
              : `Red ${project.chain} · Precios en USD`}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Submit Token Form ────────────────────────────────────────────────────────
function SubmitTokenForm({ onClose }: { onClose: () => void }) {
  // Detect logged-in member
  const memberAuth = (() => {
    try { return JSON.parse(localStorage.getItem("psyko_auth") ?? "null") as { user?: string; plan?: string; role?: string } | null; }
    catch { return null; }
  })();
  const isMember = !!(memberAuth?.user);
  const memberPlan = memberAuth?.plan ?? "";
  const planBoost: Record<string, number> = { basico: 5, educacion: 10, pro: 20, elite: 30 };
  const scoreBoost = planBoost[memberPlan] ?? 0;

  type ListingTier = "free" | "listed" | "verified" | "partner";
  const [selectedTier, setSelectedTier] = useState<ListingTier>("free");

  const TIERS: { key: ListingTier; label: string; price: string; color: string; perks: string[] }[] = [
    {
      key: "free", label: "BÁSICO", price: "GRATIS", color: "#4a6070",
      perks: ["Revisión manual 48-72h", "PSY Trust Score público", "Listado estándar"],
    },
    {
      key: "listed", label: "LISTED", price: "$299 USDT", color: "#00e5ff",
      perks: ["Revisión prioritaria 24h", "Badge LISTED ✓", "Aparición destacada", "+10 pts PSY Score"],
    },
    {
      key: "verified", label: "VERIFIED", price: "$799 USDT", color: "#ffd700",
      perks: ["Todo LISTED", "Auditoría básica incluida", "+25 pts PSY Score", "Badge VERIFIED ⭐", "Fija en top listings"],
    },
    {
      key: "partner", label: "PARTNER", price: "$1,999 USDT", color: "#e040fb",
      perks: ["Todo VERIFIED", "Señal en canal Telegram", "Banner en Exchange", "+50 pts PSY Score", "Soporte dedicado 1:1"],
    },
  ];

  const [form, setForm] = useState({
    name: "", symbol: "", website: "", whitepaper: "", contract: "", chain: "ETH",
    description: "", twitter: "", telegram: "", hardCap: "",
    email: "",
  });
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const up = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.name || !form.symbol || !form.website || !form.email) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch("https://api.psychometriks.trade/api/exchange/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          memberUser: memberAuth?.user ?? null,
          memberPlan: memberPlan || null,
          scoreBoost,
        }),
      });
      if (!res.ok) {
        const d = await res.json() as { error?: string };
        setSubmitError(d.error ?? "Error al enviar la solicitud");
        return;
      }
      setSent(true);
    } catch {
      setSubmitError("Sin conexión al servidor. Intentá de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
        <div className="bg-[#060a0f] border border-[#00e5ff33] p-10 max-w-md w-full text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#00e5ff] to-transparent" />
          <div className="text-5xl mb-4">🚀</div>
          <div className="font-bebas text-3xl text-[#00e5ff] mb-2">¡SOLICITUD ENVIADA!</div>
          {isMember ? (
            <div className="font-space text-[12px] text-[#8ab8cc] mb-3 leading-relaxed">
              Tu solicitud como <span className="text-[#ffd700] font-bold">MIEMBRO PSY</span> tiene prioridad de revisión.
              El equipo te responde en <span className="text-white">24 horas</span> con el resultado y tu PSY Trust Score con el boost de +{scoreBoost} puntos incluido.
            </div>
          ) : (
            <div className="font-space text-[12px] text-[#8ab8cc] mb-3 leading-relaxed">
              El equipo PSY Exchange verificará tu proyecto en 48–72 horas. Recibirás el resultado en tu email con las validaciones y el PSY Trust Score asignado.
            </div>
          )}
          {isMember && (
            <div className="border border-[#ffd70033] bg-[#ffd70008] px-4 py-3 mb-5 text-left">
              <div className="font-space text-[9px] text-[#ffd700] tracking-[0.2em] mb-2">⭐ BENEFICIOS MIEMBRO APLICADOS</div>
              <div className="space-y-1">
                {[
                  `✓ Revisión prioritaria 24h (no 48-72h)`,
                  `✓ +${scoreBoost} pts automáticos al PSY Trust Score`,
                  `✓ Badge "MIEMBRO PSY ✓" en la ficha del token`,
                  `✓ Aparición destacada en el listado`,
                ].map(t => <div key={t} className="font-space text-[10px] text-[#a8bece]">{t}</div>)}
              </div>
            </div>
          )}
          <div className="flex gap-3 justify-center">
            <button onClick={onClose} className="font-space text-[11px] border border-[#00e5ff44] text-[#00e5ff] px-8 py-2.5 hover:bg-[#00e5ff15] transition-colors">
              CERRAR
            </button>
            {isMember && (
              <a href="/dashboard" className="font-space text-[11px] border border-[#ffd70044] text-[#ffd700] px-8 py-2.5 hover:bg-[#ffd70015] transition-colors no-underline">
                VER EN MI DASHBOARD
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  const planColor: Record<string, string> = { basico: "#00e676", educacion: "#00e5ff", pro: "#ffd700", elite: "#e040fb" };
  const memberColor = planColor[memberPlan] ?? "#00e5ff";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#060a0f] border border-[#1a2535] max-w-xl w-full my-8 relative">
        <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: isMember ? memberColor : "linear-gradient(90deg, transparent, #00e5ff, transparent)" }} />
        <div className="flex justify-between items-center p-5 border-b border-[#0d1520]">
          <div>
            <div className="flex items-center gap-3">
              <div className="font-bebas text-2xl text-white">LISTAR MI TOKEN</div>
              {isMember && (
                <span className="font-space text-[9px] px-2 py-0.5 tracking-[0.1em]"
                  style={{ color: memberColor, background: `${memberColor}18`, border: `1px solid ${memberColor}44` }}>
                  MIEMBRO PSY ✓
                </span>
              )}
            </div>
            <div className="font-space text-[10px] text-[#8ab8cc]">
              {isMember
                ? `Sesión activa como ${memberAuth?.user?.toUpperCase()} · Revisión prioritaria 24h · +${scoreBoost} pts de score`
                : "Nuestro equipo revisa cada proyecto manualmente antes de publicarlo"}
            </div>
          </div>
          <button onClick={onClose} className="text-[#8ab8cc] hover:text-white">✕</button>
        </div>

        {/* Member benefit banner */}
        {isMember && (
          <div className="mx-5 mt-5 border px-4 py-3" style={{ borderColor: `${memberColor}33`, background: `${memberColor}08` }}>
            <div className="font-space text-[9px] tracking-[0.2em] mb-2" style={{ color: memberColor }}>
              ⭐ BENEFICIOS EXCLUSIVOS — MIEMBRO {memberPlan.toUpperCase()}
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                `+${scoreBoost} pts PSY Trust Score automáticos`,
                "Revisión prioritaria 24h",
                "Badge MIEMBRO PSY ✓ en tu token",
                "Aparición destacada en el listado",
              ].map(b => (
                <span key={b} className="font-space text-[9px] px-1.5 py-0.5 border" style={{ color: memberColor, borderColor: `${memberColor}33` }}>✓ {b}</span>
              ))}
            </div>
          </div>
        )}

        {/* Listing tier selector */}
        <div className="px-5 pt-5">
          <div className="font-sharetech text-[9px] text-[#00e5ff] tracking-[0.3em] mb-3">PLAN DE LISTING</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
            {TIERS.map(t => (
              <button key={t.key} onClick={() => setSelectedTier(t.key)}
                className="p-3 border text-left transition-all"
                style={selectedTier === t.key
                  ? { borderColor: t.color, background: `${t.color}12` }
                  : { borderColor: "#1a2535", background: "transparent" }}>
                <div className="font-space text-[9px] font-bold tracking-[0.1em]" style={{ color: t.color }}>{t.label}</div>
                <div className="font-bebas text-base text-white mt-0.5">{t.price}</div>
                <div className="mt-2 space-y-0.5">
                  {t.perks.map(p => (
                    <div key={p} className="font-space text-[8px] text-[#8ab8cc]">· {p}</div>
                  ))}
                </div>
              </button>
            ))}
          </div>
          {selectedTier !== "free" && (
            <div className="border px-4 py-3 mb-4" style={{ borderColor: `${TIERS.find(t => t.key === selectedTier)!.color}44`, background: `${TIERS.find(t => t.key === selectedTier)!.color}08` }}>
              <div className="font-space text-[9px]" style={{ color: TIERS.find(t => t.key === selectedTier)!.color }}>
                💳 Pago: una vez que enviés tu solicitud te contactamos para coordinar el pago en USDT (Ethereum) antes de activar el plan.
              </div>
            </div>
          )}
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-space text-[9px] text-[#8ab8cc] tracking-[0.2em] block mb-1">NOMBRE DEL TOKEN *</label>
              <input value={form.name} onChange={e => up("name", e.target.value)} placeholder="ej: SolarPeak Finance"
                className="w-full bg-[#020408] border border-[#1a2535] text-white font-space text-[11px] px-3 py-2 outline-none focus:border-[#00e5ff44] placeholder:text-[#6a98b0]" />
            </div>
            <div>
              <label className="font-space text-[9px] text-[#8ab8cc] tracking-[0.2em] block mb-1">SÍMBOLO *</label>
              <input value={form.symbol} onChange={e => up("symbol", e.target.value.toUpperCase())} placeholder="ej: SOLAR" maxLength={8}
                className="w-full bg-[#020408] border border-[#1a2535] text-white font-space text-[11px] px-3 py-2 outline-none focus:border-[#00e5ff44] placeholder:text-[#6a98b0]" />
            </div>
          </div>

          <div>
            <label className="font-space text-[9px] text-[#8ab8cc] tracking-[0.2em] block mb-1">SITIO WEB *</label>
            <input value={form.website} onChange={e => up("website", e.target.value)} placeholder="https://mitoken.io"
              className="w-full bg-[#020408] border border-[#1a2535] text-white font-space text-[11px] px-3 py-2 outline-none focus:border-[#00e5ff44] placeholder:text-[#6a98b0]" />
          </div>

          <div>
            <label className="font-space text-[9px] text-[#8ab8cc] tracking-[0.2em] block mb-1">WHITEPAPER / DOCS</label>
            <input value={form.whitepaper} onChange={e => up("whitepaper", e.target.value)} placeholder="https://mitoken.io/whitepaper.pdf"
              className="w-full bg-[#020408] border border-[#1a2535] text-white font-space text-[11px] px-3 py-2 outline-none focus:border-[#00e5ff44] placeholder:text-[#6a98b0]" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-space text-[9px] text-[#8ab8cc] tracking-[0.2em] block mb-1">DIRECCIÓN DE CONTRATO</label>
              <input value={form.contract} onChange={e => up("contract", e.target.value)} placeholder="0x..."
                className="w-full bg-[#020408] border border-[#1a2535] text-white font-space text-[11px] px-3 py-2 outline-none focus:border-[#00e5ff44] placeholder:text-[#6a98b0]" />
            </div>
            <div>
              <label className="font-space text-[9px] text-[#8ab8cc] tracking-[0.2em] block mb-1">BLOCKCHAIN *</label>
              <select value={form.chain} onChange={e => up("chain", e.target.value)}
                className="w-full bg-[#020408] border border-[#1a2535] text-white font-space text-[11px] px-3 py-2 outline-none focus:border-[#00e5ff44]">
                {["ETH", "BSC", "SOL", "POLY", "AVAX", "BASE"].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="font-space text-[9px] text-[#8ab8cc] tracking-[0.2em] block mb-1">DESCRIPCIÓN DEL PROYECTO *</label>
            <textarea value={form.description} onChange={e => up("description", e.target.value)} rows={3}
              placeholder="Describí tu proyecto, su utilidad real y por qué merece estar en PSY Exchange..."
              className="w-full bg-[#020408] border border-[#1a2535] text-white font-space text-[11px] px-3 py-2 outline-none focus:border-[#00e5ff44] placeholder:text-[#6a98b0] resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-space text-[9px] text-[#8ab8cc] tracking-[0.2em] block mb-1">TWITTER / X</label>
              <input value={form.twitter} onChange={e => up("twitter", e.target.value)} placeholder="@mitoken"
                className="w-full bg-[#020408] border border-[#1a2535] text-white font-space text-[11px] px-3 py-2 outline-none focus:border-[#00e5ff44] placeholder:text-[#6a98b0]" />
            </div>
            <div>
              <label className="font-space text-[9px] text-[#8ab8cc] tracking-[0.2em] block mb-1">TELEGRAM</label>
              <input value={form.telegram} onChange={e => up("telegram", e.target.value)} placeholder="t.me/mitoken"
                className="w-full bg-[#020408] border border-[#1a2535] text-white font-space text-[11px] px-3 py-2 outline-none focus:border-[#00e5ff44] placeholder:text-[#6a98b0]" />
            </div>
          </div>

          <div>
            <label className="font-space text-[9px] text-[#8ab8cc] tracking-[0.2em] block mb-1">TU EMAIL DE CONTACTO *</label>
            <input type="email" value={form.email} onChange={e => up("email", e.target.value)} placeholder="equipo@mitoken.io"
              className="w-full bg-[#020408] border border-[#1a2535] text-white font-space text-[11px] px-3 py-2 outline-none focus:border-[#00e5ff44] placeholder:text-[#6a98b0]" />
          </div>

          <div className="border border-[#1a2535] bg-[#040810] p-3">
            <div className="font-sharetech text-[8px] text-[#ffd700] tracking-[0.2em] mb-2">⬡ PROCESO DE VALIDACIÓN PSY EXCHANGE</div>
            <div className="space-y-1">
              {[
                "✓ Verificamos tu sitio web y whitepaper manualmente",
                "✓ Revisamos el contrato en blockchain (si ya está desplegado)",
                "✓ Evaluamos el equipo y su historial público",
                "✓ Asignamos un PSY Trust Score de 0 a 100",
                "✓ Si aprueba (score ≥50), se publica en PSY Exchange",
              ].map(s => (
                <div key={s} className="font-space text-[10px] text-[#8ab8cc]">{s}</div>
              ))}
            </div>
          </div>

          {submitError && (
            <div className="border border-[#ff174433] bg-[#ff174408] px-4 py-3">
              <div className="font-space text-[10px] text-[#ff1744]">✗ {submitError}</div>
            </div>
          )}
          <button onClick={submit}
            disabled={!form.name || !form.symbol || !form.website || !form.email || submitting}
            className="w-full py-4 font-space text-[12px] font-bold tracking-[0.2em] uppercase bg-[#00e5ff] text-[#020408] hover:bg-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            {submitting ? "ENVIANDO..." : "ENVIAR SOLICITUD DE LISTADO →"}
          </button>
          <div className="font-space text-[9px] text-[#6a98b0] text-center">
            El proceso tarda 48-72hs · Respuesta garantizada · No hay costo de listado básico
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Token card ───────────────────────────────────────────────────────────────
function TokenCard({ project, onClick }: { project: TokenProject; onClick: () => void }) {
  const filled = pct(project.raised, project.hardCap);
  return (
    <div className="bg-[#040810] border border-[#1a2535] hover:border-opacity-60 transition-all cursor-pointer relative overflow-hidden group"
      style={{ borderColor: project.featured ? `${project.color}44` : undefined }}
      onClick={onClick}>
      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: project.color }} />
      {project.featured && (
        <div className="absolute top-3 right-3 font-space text-[8px] px-1.5 py-0.5 tracking-[0.1em]"
          style={{ color: project.color, background: `${project.color}18`, border: `1px solid ${project.color}33` }}>
          ⭐ DESTACADO
        </div>
      )}

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <span className="text-3xl">{project.icon}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="font-bebas text-xl text-white">{project.symbol}</span>
              <span className="font-space text-[9px] px-1.5 py-0.5"
                style={{ color: project.stageColor, background: `${project.stageColor}18`, border: `1px solid ${project.stageColor}44` }}>
                {project.stage}
              </span>
            </div>
            <div className="font-space text-[10px] text-[#8ab8cc] truncate">{project.name}</div>
          </div>
          <div className="text-right shrink-0">
            <div className="font-space text-[10px]" style={{ color: project.color }}>
              {project.chain}
            </div>
          </div>
        </div>

        {/* Tagline */}
        <p className="font-space text-[10px] text-[#8ab8cc] leading-relaxed mb-3 line-clamp-2">{project.tagline}</p>

        {/* Price + PSY Score */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="font-space text-[8px] text-[#6a98b0] mb-0.5">PRECIO</div>
            <div className="font-bebas text-xl" style={{ color: project.color }}>
              {project.price > 0 ? "$" + project.price.toFixed(4) : "TBD"}
            </div>
          </div>
          <div className="text-right">
            <div className="font-space text-[8px] text-[#6a98b0] mb-0.5">PSY SCORE</div>
            <div className={`font-bebas text-xl ${project.psyScore >= 80 ? "text-[#00e676]" : project.psyScore >= 60 ? "text-[#ffd700]" : "text-[#ff1744]"}`}>
              {project.psyScore}/100
            </div>
          </div>
        </div>

        {/* Validations compact */}
        <div className="mb-3">
          <ValidationBadges validations={project.validations} compact />
        </div>

        {/* Raised bar */}
        {project.stage !== "PRÓXIMAMENTE" && project.raised > 0 && (
          <div className="mb-3">
            <div className="h-1.5 bg-[#0d1520] border border-[#1a2535] overflow-hidden">
              <div className="h-full" style={{ width: `${filled}%`, background: project.color }} />
            </div>
            <div className="flex justify-between font-space text-[9px] mt-0.5">
              <span className="text-[#8ab8cc]">{fmt(project.raised)} recaudado</span>
              <span style={{ color: project.color }}>{filled.toFixed(0)}%</span>
            </div>
          </div>
        )}

        <button className="w-full py-2.5 font-space text-[10px] font-bold tracking-[0.15em] uppercase transition-all group-hover:opacity-90"
          style={{ background: project.stage === "PRÓXIMAMENTE" ? "#1a2535" : project.color, color: project.stage === "PRÓXIMAMENTE" ? "#4a6070" : "#020408" }}>
          {project.stage === "PRÓXIMAMENTE" ? "PRÓXIMAMENTE" : "VER Y COMPRAR →"}
        </button>
      </div>
    </div>
  );
}

// ─── 0x Swap Panel ────────────────────────────────────────────────────────────
// ─── ETH token list (0x Protocol — Ethereum mainnet) ─────────────────────────
const ZEROX_TOKENS: { symbol: string; addr: string; decimals: number }[] = [
  { symbol: "ETH",    addr: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", decimals: 18 },
  { symbol: "WETH",   addr: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", decimals: 18 },
  { symbol: "USDT",   addr: "0xdAC17F958D2ee523a2206206994597C13D831ec7", decimals: 6 },
  { symbol: "USDC",   addr: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", decimals: 6 },
  { symbol: "DAI",    addr: "0x6B175474E89094C44Da98b954EedeAC495271d0F", decimals: 18 },
  { symbol: "WBTC",   addr: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599", decimals: 8 },
  { symbol: "BNB",    addr: "0xB8c77482e45F1F44dE1745F52C74426C631bDD52", decimals: 18 },
  { symbol: "MATIC",  addr: "0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0", decimals: 18 },
  { symbol: "LINK",   addr: "0x514910771AF9Ca656af840dff83E8264EcF986CA", decimals: 18 },
  { symbol: "UNI",    addr: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984", decimals: 18 },
  { symbol: "ARB",    addr: "0xB50721BCf8d664c30412Cfbc6cf7a15145234ad1", decimals: 18 },
  { symbol: "OP",     addr: "0x4200000000000000000000000000000000000042", decimals: 18 },
  { symbol: "PEPE",   addr: "0x6982508145454Ce325dDbE47a25d4ec3d2311933", decimals: 18 },
  { symbol: "SHIB",   addr: "0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE", decimals: 18 },
  { symbol: "FLOKI",  addr: "0xcf0C122c6b73ff809C693DB761e7BaeBe62b6a2E", decimals: 9 },
  { symbol: "ELON",   addr: "0x761D38e5ddf6ccf6Cf7c55759d5210750B5D60F3", decimals: 18 },
  { symbol: "AAVE",   addr: "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9", decimals: 18 },
  { symbol: "CRV",    addr: "0xD533a949740bb3306d119CC777fa900bA034cd52", decimals: 18 },
  { symbol: "MKR",    addr: "0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2", decimals: 18 },
  { symbol: "SNX",    addr: "0xC011a73ee8576Fb46F5E1c5751cA3B9Fe0af2a6F", decimals: 18 },
  { symbol: "COMP",   addr: "0xc00e94Cb662C3520282E6f5717214004A7f26888", decimals: 18 },
  { symbol: "YFI",    addr: "0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e", decimals: 18 },
  { symbol: "SUSHI",  addr: "0x6B3595068778DD592e39A122f4f5a5cF09C90fE2", decimals: 18 },
  { symbol: "1INCH",  addr: "0x111111111117dC0aa78b770fA6A738034120C302", decimals: 18 },
  { symbol: "GRT",    addr: "0xc944E90C64B2c07662A292be6244BDf05Cda44a7", decimals: 18 },
  { symbol: "LDO",    addr: "0x5A98FcBEA516Cf06857215779Fd812CA3beF1B32", decimals: 18 },
  { symbol: "CVX",    addr: "0x4e3FBD56CD56c3e72c1403e103b45Db9da5B9D2B", decimals: 18 },
  { symbol: "stETH",  addr: "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84", decimals: 18 },
  { symbol: "wstETH", addr: "0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0", decimals: 18 },
  { symbol: "rETH",   addr: "0xae78736Cd615f374D3085123A210448E74Fc6393", decimals: 18 },
  { symbol: "ENS",    addr: "0xC18360217D8F7Ab5e7c516566761Ea12Ce7F9D72", decimals: 18 },
  { symbol: "RPL",    addr: "0xD33526068D116cE69F19A9ee46F0bd304F21A51f", decimals: 18 },
  { symbol: "FXS",    addr: "0x3432B6A60D23Ca0dFCa7761B7ab56459D9C964D0", decimals: 18 },
  { symbol: "PENDLE", addr: "0x808507121B80c02388fAd14726482e061B8da827", decimals: 18 },
  { symbol: "GMX",    addr: "0xfc5A1A6EB076a2C7aD06eD22C90d7E710E35ad0a", decimals: 18 },
  { symbol: "ENA",    addr: "0x57e114B691Db790C35207b2e685D4A43181e6061", decimals: 18 },
  { symbol: "ETHFI",  addr: "0xFe0c30065B384F05761f15d0CC899D4F9F9Cc0eB", decimals: 18 },
  { symbol: "WLD",    addr: "0x163f8C2467924be0ae7B5347228CABF260318753", decimals: 18 },
  { symbol: "ONDO",   addr: "0xfAbA6f8e4a5E8Ab82F62fe7C39859FA577269BE3", decimals: 18 },
  { symbol: "RENDER", addr: "0x6De037ef9aD2725EB40118Bb1702EBb27e4Aeb24", decimals: 18 },
  { symbol: "IMX",    addr: "0xF57e7e7C23978C3cAEC3C3548E3D615c346e79fF", decimals: 18 },
  { symbol: "BLUR",   addr: "0x5283D291DBCF85356A21bA090E6db59121208b44", decimals: 18 },
  { symbol: "DYDX",   addr: "0x92D6C1e31e14520e676a687F0a93788B716BEff5", decimals: 18 },
  { symbol: "INJ",    addr: "0xe28b3B32B6c345A34Ff64674606124Dd5Aceca30", decimals: 18 },
  { symbol: "STRK",   addr: "0xCa14007Eff0dB1f8135f4C25B34De49AB0d42766", decimals: 18 },
  { symbol: "cbETH",  addr: "0xBe9895146f7AF43049ca1c1AE358B0541Ea49704", decimals: 18 },
  { symbol: "APE",    addr: "0x4d224452801ACEd8B2F0aebE155379bb5D594381", decimals: 18 },
  { symbol: "SAND",   addr: "0x3845badAde8e6dFF049820680d1F14bD3903a5d0", decimals: 18 },
  { symbol: "MANA",   addr: "0x0F5D2fB29fb7d3CFeE444a200298f468908cC942", decimals: 18 },
  { symbol: "AXS",    addr: "0xBB0E17EF65F82Ab018d8EDd776e8DD940327B28b", decimals: 18 },
  { symbol: "FET",    addr: "0xaea46A60368A7bD060eec7DF8CBa43b7EF41Ad85", decimals: 18 },
  { symbol: "OCEAN",  addr: "0x967da4048cD07aB37855c090aAF366e4ce1b9F48", decimals: 18 },
  { symbol: "CHZ",    addr: "0x3506424F91fD33084466F402d5D97f05F8e3b4AF", decimals: 18 },
  { symbol: "GALA",   addr: "0xd1d2Eb1B1e90B638588728b4130137D262C87cae", decimals: 8 },
  { symbol: "BAL",    addr: "0xba100000625a3754423978a60c9317c58a424e3D", decimals: 18 },
  { symbol: "ZRX",    addr: "0xE41d2489571d322189246DaFA5ebDe1F4699F498", decimals: 18 },
  { symbol: "ANKR",   addr: "0x8290333ceF9e6D528dD5618Fb97a76f268f3EDD4", decimals: 18 },
  { symbol: "HOT",    addr: "0x6c6EE5e31d828De241282B9606C8e98Ea48526E2", decimals: 18 },
  { symbol: "REN",    addr: "0x408e41876cCCDC0F92210600ef50372656052a38", decimals: 18 },
  { symbol: "ILV",    addr: "0x767FE9EDC9E0dF98E07454847909b5E959D7ca0E", decimals: 18 },
  { symbol: "MASK",   addr: "0x69af81e73A73B40adF4f3d4223Cd9b1ECE623074", decimals: 18 },
  { symbol: "SKL",    addr: "0x00c83aeCC790e8a4453e5dD3B0B4b3680501a7A7", decimals: 18 },
  { symbol: "LOOKS",  addr: "0xf4d2888d29D722226FafA5d9B24F9164c092421E", decimals: 18 },
  { symbol: "BADGER", addr: "0x3472A5A71965499acd81997a54BBA8D852C6E53d", decimals: 18 },
];

// ─── BNB Chain token list (0x Protocol — BSC) ────────────────────────────────
const BSC_TOKENS: { symbol: string; addr: string; decimals: number }[] = [
  { symbol: "BNB",    addr: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", decimals: 18 },
  { symbol: "WBNB",   addr: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", decimals: 18 },
  { symbol: "USDT",   addr: "0x55d398326f99059fF775485246999027B3197955", decimals: 18 },
  { symbol: "USDC",   addr: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d", decimals: 18 },
  { symbol: "BUSD",   addr: "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56", decimals: 18 },
  { symbol: "CAKE",   addr: "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82", decimals: 18 },
  { symbol: "ETH",    addr: "0x2170Ed0880ac9A755fd29B2688956BD959F933F8", decimals: 18 },
  { symbol: "BTCB",   addr: "0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c", decimals: 18 },
  { symbol: "XRP",    addr: "0x1D2F0da169ceB9fC7B3144628dB156f3F6c60dBe", decimals: 18 },
  { symbol: "ADA",    addr: "0x3EE2200Efb3400fAbB9AacF31297cBdD1d435D47", decimals: 18 },
  { symbol: "DOGE",   addr: "0xbA2aE424d960c26247Dd6c32edC70B295c744C43", decimals: 8 },
  { symbol: "DOT",    addr: "0x7083609fCE4d1d8Dc0C979AAb8c869Ea2C873402", decimals: 18 },
  { symbol: "LINK",   addr: "0xF8A0BF9cF54Bb92F17374d9e9A321E6a111a51bD", decimals: 18 },
  { symbol: "UNI",    addr: "0xBf5140A22578168FD562DCcF235E5D43A02ce9B1", decimals: 18 },
  { symbol: "MATIC",  addr: "0xCC42724C6683B7E57334c4E856f4c9965ED682bD", decimals: 18 },
  { symbol: "ATOM",   addr: "0x0Eb3a705fc54725037CC9e008bDede697f62F335", decimals: 18 },
  { symbol: "AVAX",   addr: "0x1CE0c2827e2eF14D5C4f29a091d735A204794041", decimals: 18 },
  { symbol: "LTC",    addr: "0x4338665CBB7B2485A8855A139b75D5e34AB0DB94", decimals: 18 },
  { symbol: "AAVE",   addr: "0xfb6115445Bff7b52FeB98650C87f44907E58f802", decimals: 18 },
  { symbol: "DAI",    addr: "0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3", decimals: 18 },
  { symbol: "INJ",    addr: "0xa2B726B1145A4773F68593CF171187d8EBe4d495", decimals: 18 },
  { symbol: "1INCH",  addr: "0x111111111117dC0aa78b770fA6A738034120C302", decimals: 18 },
  { symbol: "SUSHI",  addr: "0x947950BcC74888a40Ffa2593C5798F11Fc9124C", decimals: 18 },
  { symbol: "XVS",    addr: "0xcF6BB5389c92Bdda8a3747Ddb454cB7a64626C63", decimals: 18 },
  { symbol: "ALPACA", addr: "0x8F0528cE5eF7B51152A59745bEfDD91D97091d2F", decimals: 18 },
  { symbol: "TWT",    addr: "0x4B0F1812e5Df2A09796481Ff14017e6005508003", decimals: 18 },
  { symbol: "BAKE",   addr: "0xE02dF9e3e622DeBdD69fb838bB799E3F168902c5", decimals: 18 },
  { symbol: "WRX",    addr: "0x8e17ed70334C87eCE574C9d537BC153d8609e2a3", decimals: 18 },
  { symbol: "REEF",   addr: "0xF21768cCBC73Ea5B6fd3C687208a7c2def2d966e", decimals: 18 },
  { symbol: "FIL",    addr: "0x0D8Ce2A99Bb6e3B7Db580eD848240e4a0F9aE153", decimals: 18 },
  { symbol: "NEAR",   addr: "0x1Fa4a73a3F0133f0025378af00236f3aBDEE5d63", decimals: 18 },
  { symbol: "XTZ",    addr: "0x16939ef78684453bfDFb47825F8a5F714f12623a", decimals: 18 },
  { symbol: "BIFI",   addr: "0xCa3F508B8e4Dd382eD43F02D15a13c28132b54CE", decimals: 18 },
  { symbol: "TRX",    addr: "0xCE7de646e7208a4Ef112cb6ed5038FA6cC6b12e3", decimals: 6 },
  { symbol: "IOTA",   addr: "0xd944f1D1e9d5f9Bb90b62f9D45e447D989580782", decimals: 6 },
];

// ─── Solana SPL token list (Jupiter Aggregator) ───────────────────────────────
const SOL_TOKENS: { symbol: string; mint: string; decimals: number }[] = [
  { symbol: "SOL",    mint: "So11111111111111111111111111111111111111112",     decimals: 9 },
  { symbol: "USDC",   mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",  decimals: 6 },
  { symbol: "USDT",   mint: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",   decimals: 6 },
  { symbol: "RAY",    mint: "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R",  decimals: 6 },
  { symbol: "ORCA",   mint: "orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE",   decimals: 6 },
  { symbol: "JUP",    mint: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",   decimals: 6 },
  { symbol: "WIF",    mint: "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm",  decimals: 6 },
  { symbol: "BONK",   mint: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",  decimals: 5 },
  { symbol: "PYTH",   mint: "HZ1JovNiVvGrGs3aF8r1s4MtMPzFHnmcCvNWZoGJnqBF", decimals: 6 },
  { symbol: "JITO",   mint: "J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn",  decimals: 9 },
  { symbol: "MNGO",   mint: "MangoCzJ36AjZyKwVj3VnYU4GTonjfVEnJmvvWaxLac",   decimals: 6 },
  { symbol: "MSOL",   mint: "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So",   decimals: 9 },
  { symbol: "stSOL",  mint: "7dHbWXmci3dT8UFYWYZweBLXgycu7Y3iL6trKn1Y7ARj",  decimals: 9 },
  { symbol: "RENDER", mint: "rndrizKT3MK1iimdxRdWabcF7Zg7AR5T4nud4EkHBof",   decimals: 8 },
  { symbol: "W",      mint: "85VBFQZC9TZkfaptBWjvUw7YbZjy52A6mjtPGjstQAmQ",  decimals: 6 },
  { symbol: "DRIFT",  mint: "DriFtupJYLTosbwoN8koMbEYSx54aFAVLddWsbksjwg7",  decimals: 6 },
  { symbol: "BSOL",   mint: "bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1",   decimals: 9 },
  { symbol: "SAMO",   mint: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",  decimals: 9 },
  { symbol: "POPCAT", mint: "7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr",  decimals: 9 },
  { symbol: "GMT",    mint: "7i5KKsX2weiTkry7jA4ZwSuXGhs5eJBEjY8vVxR4pfRx",  decimals: 9 },
  { symbol: "FIDA",   mint: "EchesyfXePKdLtoiZSL8pBe8Myagyy8ZRqsACNCFGnvp",  decimals: 6 },
  { symbol: "MNDE",   mint: "MNDEFzGvMt87ueuHvVU9VcTqsAP5b3fTGPsHuuPA5ey",   decimals: 9 },
  { symbol: "WEN",    mint: "WENWENvqqNya429ubCdR81ZmD69brwQaaBYY6p3LCpk",    decimals: 5 },
  { symbol: "MEW",    mint: "MEW1gQWJ3neBhFQHvTBBTmPb36a6L5fL8RL83YY8bZ",    decimals: 5 },
  { symbol: "TRUMP",  mint: "6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN",   decimals: 6 },
  { symbol: "ZEUS",   mint: "ZEUS1aR7aX8DFFkguLMFFYgYmkFYeGreLsuxPXkBZZzd",   decimals: 6 },
  { symbol: "JTO",    mint: "jtojtomepa8bdym8ej9irvj9zqfkfqfpgfakf9pjqnqq",   decimals: 9 },
];

interface ZeroxQuoteSource {
  name: string;
  proportion: string;
}

interface ZeroxQuote {
  buyAmount?: string;
  minBuyAmount?: string;
  sellAmount?: string;
  price?: string;
  gas?: string;
  gasPrice?: string;
  estimatedGas?: string;
  liquidityAvailable?: boolean;
  sources?: ZeroxQuoteSource[];
  fees?: {
    zeroExFee?: { amount?: string; token?: string; type?: string } | null;
    integratorFee?: { amount?: string; token?: string } | null;
  };
  route?: { fills?: { source: string; proportionBps: string }[] };
  issues?: {
    allowance?: { spender: string; token: string } | null;
    balance?: { token: string; actual: string; expected: string } | null;
    simulationIncomplete?: boolean;
  };
  keyMissing?: boolean;
  error?: string;
  permit2?: unknown;
  transaction?: {
    to?: string;
    data?: string;
    gas?: string;
    gasPrice?: string;
    value?: string;
  };
}

interface JupiterQuote {
  outAmount?: string;
  inAmount?: string;
  priceImpactPct?: string;
  routePlan?: { swapInfo: { label: string } }[];
  error?: string;
}

// ─── Solana wallet hook ───────────────────────────────────────────────────────
function useSolanaWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState("");

  type SolProvider = { publicKey?: { toString(): string }; connect(): Promise<{ publicKey: { toString(): string } }>; disconnect(): Promise<void>; isPhantom?: boolean };
  function getProvider(): SolProvider | null {
    const w = window as unknown as Record<string, unknown>;
    if (w.phantom && typeof w.phantom === "object" && (w.phantom as Record<string,unknown>).solana) return (w.phantom as Record<string, SolProvider>).solana;
    if (w.solana && typeof w.solana === "object") return w.solana as SolProvider;
    if (w.solflare && typeof w.solflare === "object") return w.solflare as SolProvider;
    return null;
  }

  async function connect() {
    setConnecting(true); setConnectError("");
    const provider = getProvider();
    if (!provider) {
      setConnectError("No se detectó Phantom ni Solflare. Instalá una wallet Solana.");
      setConnecting(false);
      return;
    }
    try {
      const res = await provider.connect();
      setAddress(res.publicKey.toString());
    } catch {
      setConnectError("Conexión cancelada.");
    }
    setConnecting(false);
  }

  async function disconnect() {
    const provider = getProvider();
    if (provider) await provider.disconnect().catch(() => {});
    setAddress(null);
  }

  return { address, connecting, connectError, connect, disconnect };
}

function ZeroxSwapPanel({ wallet, chain }: { wallet: ReturnType<typeof useWallet>; chain: "eth" | "bsc" }) {
  const tokens = chain === "bsc" ? BSC_TOKENS : ZEROX_TOKENS;
  const defaultFrom = chain === "bsc" ? "BNB" : "ETH";
  const [fromSym, setFromSym] = useState(defaultFrom);
  const [toSym, setToSym] = useState("USDT");
  const [fromAmt, setFromAmt] = useState("");
  const [quote, setQuote] = useState<ZeroxQuote | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [tokenSearch, setTokenSearch] = useState("");
  const [showPicker, setShowPicker] = useState<"from" | "to" | null>(null);

  useEffect(() => {
    setFromSym(chain === "bsc" ? "BNB" : "ETH");
    setToSym("USDT");
    setFromAmt(""); setQuote(null); setErr("");
  }, [chain]);

  const fromToken = tokens.find(t => t.symbol === fromSym) ?? tokens[0];
  const toToken = tokens.find(t => t.symbol === toSym) ?? tokens[2];
  const fromAmtN = parseFloat(fromAmt) || 0;

  const filtered = tokens.filter(t =>
    t.symbol.toLowerCase().includes(tokenSearch.toLowerCase())
  );

  const chainLabel = chain === "bsc" ? "BNB CHAIN · 0x PROTOCOL" : "ETHEREUM · 0x PROTOCOL";
  const chainSwitchNumId = chain === "bsc" ? 56 : 1;
  const chainName = chain === "bsc" ? "BNB Smart Chain" : "Ethereum Mainnet";
  const { switchChain } = useSwitchChain();

  const fetchQuote = useCallback(async () => {
    if (!fromAmtN || !fromToken || !toToken || fromSym === toSym) return;
    if (wallet.address) {
      try {
        switchChain({ chainId: chainSwitchNumId });
      } catch { /* ignore — wallet may not support or already on correct chain */ }
    }
    setLoading(true); setErr(""); setQuote(null);
    try {
      const sellAmount = Math.floor(fromAmtN * Math.pow(10, fromToken.decimals)).toString();
      const params = new URLSearchParams({
        sellToken: fromToken.addr,
        buyToken: toToken.addr,
        sellAmount,
        chain,
        ...(wallet.address ? { taker: wallet.address } : {}),
      });
      const res = await fetch(`/api/exchange/zerox/quote?${params}`);
      const data = await res.json() as ZeroxQuote;
      setQuote(data);
      if (data.error) setErr(data.error);
    } catch {
      setErr("Sin conexión al servidor");
    }
    setLoading(false);
  }, [fromAmtN, fromToken, toToken, fromSym, toSym, wallet.address, chain, chainSwitchNumId, switchChain]);

  useEffect(() => {
    const t = setTimeout(() => { if (fromAmtN > 0) fetchQuote(); }, 600);
    return () => clearTimeout(t);
  }, [fetchQuote, fromAmtN]);

  const toAmtRaw = quote?.buyAmount && toToken
    ? parseFloat(quote.buyAmount) / Math.pow(10, toToken.decimals)
    : 0;

  const topSources = (quote?.sources ?? [])
    .filter(s => parseFloat(s.proportion) > 0)
    .sort((a, b) => parseFloat(b.proportion) - parseFloat(a.proportion))
    .slice(0, 3);

  function flip() {
    setFromSym(toSym); setToSym(fromSym);
    setFromAmt(""); setQuote(null); setErr("");
  }

  function selectToken(sym: string) {
    if (showPicker === "from") setFromSym(sym);
    else setToSym(sym);
    setShowPicker(null); setTokenSearch(""); setQuote(null); setErr("");
  }

  return (
    <div className="max-w-md mx-auto">
      {/* Wallet bar */}
      <div className="mb-4 px-1">
        <div className="flex items-center justify-between">
          <span className="font-sharetech text-[9px] text-[#8ab8cc] tracking-[0.3em]">PSY EXCHANGE · {chainLabel}</span>
          {wallet.address ? (
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#00e676] animate-pulse" />
              <span className="font-space text-[10px] text-[#00e676]">{wallet.address.slice(0,6)}...{wallet.address.slice(-4)}</span>
              <button onClick={wallet.disconnect} className="font-space text-[8px] text-[#8ab8cc] hover:text-[#ff1744]">✕</button>
            </div>
          ) : (
            <button onClick={wallet.connect} disabled={wallet.connecting}
              className="flex items-center gap-1.5 font-space text-[9px] text-[#ffd700] border border-[#ffd70033] px-3 py-1 hover:bg-[#ffd70010] transition-colors disabled:opacity-60 disabled:cursor-wait">
              🦊 {wallet.connecting ? "Conectando..." : "Conectar Wallet"}
            </button>
          )}
        </div>
        {wallet.connectError && (
          <div className="mt-2 border border-[#ff174433] bg-[#ff174408] px-3 py-2 flex items-start gap-2">
            <span className="text-[#ff1744] text-[11px] shrink-0">⚠</span>
            <span className="font-space text-[9px] text-[#ff1744]">{wallet.connectError}</span>
          </div>
        )}
      </div>

      {/* From */}
      <div className="bg-[#060a0f] border border-[#1a2535] p-4 mb-1">
        <div className="flex justify-between mb-2">
          <span className="font-space text-[9px] text-[#8ab8cc]">Vendés</span>
        </div>
        <div className="flex items-center gap-3">
          <input value={fromAmt} onChange={e => { setFromAmt(e.target.value); setQuote(null); setErr(""); }}
            placeholder="0" type="number" min="0"
            className="flex-1 bg-transparent font-bebas text-4xl text-white focus:outline-none placeholder-[#2a3a4a] w-0 min-w-0"
            style={{ fontSize: "clamp(22px,4vw,38px)" }} />
          <button onClick={() => setShowPicker("from")}
            className="flex items-center gap-1.5 bg-[#0d1520] border border-[#1a2535] text-white font-sharetech text-[11px] px-3 py-2 hover:border-[#00e5ff44] transition-colors shrink-0">
            {fromSym} ▾
          </button>
        </div>
      </div>

      {/* Flip */}
      <div className="flex justify-center py-1">
        <button onClick={flip}
          className="w-8 h-8 border border-[#1a2535] bg-[#060a0f] flex items-center justify-center hover:border-[#00e5ff44] hover:text-[#00e5ff] transition-all text-[#8ab8cc]">
          ⇅
        </button>
      </div>

      {/* To */}
      <div className="bg-[#060a0f] border border-[#1a2535] p-4 mb-4">
        <div className="flex justify-between mb-2">
          <span className="font-space text-[9px] text-[#8ab8cc]">Recibís</span>
          <span className="font-space text-[9px]">
            {loading
              ? <span className="animate-pulse text-[#00e5ff]">consultando 0x...</span>
              : quote && !quote.error
                ? <span className="text-[#00e676]">via 0x ✓</span>
                : <span className="text-[#8ab8cc]">estimado</span>
            }
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 font-bebas" style={{
            fontSize: "clamp(22px,4vw,38px)",
            color: loading ? "#3a5060" : toAmtRaw > 0 ? "white" : "#8ab8cc",
          }}>
            {loading
              ? <span className="animate-pulse">—</span>
              : toAmtRaw > 0 ? toAmtRaw.toFixed(toToken.decimals <= 6 ? 4 : 6) : "0"
            }
          </div>
          <button onClick={() => setShowPicker("to")}
            className="flex items-center gap-1.5 bg-[#0d1520] border border-[#1a2535] text-white font-sharetech text-[11px] px-3 py-2 hover:border-[#00e5ff44] transition-colors shrink-0">
            {toSym} ▾
          </button>
        </div>
      </div>

      {/* Route breakdown */}
      {topSources.length > 0 && (
        <div className="border border-[#1a2535] p-3 mb-4">
          <div className="font-sharetech text-[8px] text-[#8ab8cc] tracking-[0.2em] mb-2">RUTA 0x</div>
          <div className="flex gap-2 flex-wrap">
            {topSources.map(s => (
              <div key={s.name} className="font-space text-[9px] border border-[#1a2535] px-2 py-0.5 text-[#a8bece]">
                {s.name} <span className="text-[#00e5ff]">{(parseFloat(s.proportion) * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
          <div className="font-space text-[9px] text-[#6a98b0] mt-2">
            Fee PSYCHOMETRIKS: 0.5% · Gas est: {quote?.estimatedGas ? parseInt(quote.estimatedGas).toLocaleString() : "—"}
          </div>
        </div>
      )}

      {err && (
        <div className="border border-[#ff174433] bg-[#ff174408] px-3 py-2 mb-4">
          <div className="font-space text-[9px] text-[#ff1744]">✗ {err}</div>
        </div>
      )}

      {/* CTA */}
      <button
        onClick={wallet.address ? fetchQuote : wallet.connect}
        disabled={loading || fromSym === toSym}
        className="w-full py-4 font-space text-[12px] font-bold tracking-[0.2em] uppercase transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ background: chain === "bsc" ? "#f0b90b" : "#00e5ff", color: "#020408" }}>
        {loading ? "COTIZANDO..." : wallet.address ? `OBTENER COTIZACIÓN →` : "🦊 CONECTAR WALLET"}
      </button>
      <div className="font-space text-[9px] text-[#6a98b0] text-center mt-2">
        Swaps ejecutados via 0x Protocol · Fee 0.5% a wallet PSY · {chainName}
      </div>

      {/* Token picker modal */}
      {showPicker && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#060a0f] border border-[#1a2535] w-full max-w-sm">
            <div className="flex items-center justify-between p-4 border-b border-[#0d1520]">
              <span className="font-bebas text-lg text-white">Seleccionar Token</span>
              <button onClick={() => { setShowPicker(null); setTokenSearch(""); }} className="text-[#8ab8cc] hover:text-white">✕</button>
            </div>
            <div className="p-3 border-b border-[#0d1520]">
              <input value={tokenSearch} onChange={e => setTokenSearch(e.target.value)}
                placeholder="Buscar símbolo..."
                className="w-full bg-[#020408] border border-[#1a2535] text-white font-space text-[11px] px-3 py-2 outline-none focus:border-[#00e5ff44] placeholder:text-[#6a98b0]"
                autoFocus />
            </div>
            <div className="overflow-y-auto max-h-72">
              {filtered.map(t => (
                <button key={t.symbol} onClick={() => selectToken(t.symbol)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#0d1520] transition-colors border-b border-[#0a0f18] text-left">
                  <span className="font-space text-[11px] text-white">{t.symbol}</span>
                  <span className="font-space text-[9px] text-[#8ab8cc]">{t.addr.slice(0,8)}...</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Solana Swap Panel (Jupiter Aggregator) ───────────────────────────────────
function SolanaSwapPanel() {
  const solWallet = useSolanaWallet();
  const [fromSym, setFromSym] = useState("SOL");
  const [toSym, setToSym] = useState("USDC");
  const [fromAmt, setFromAmt] = useState("");
  const [quote, setQuote] = useState<JupiterQuote | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [tokenSearch, setTokenSearch] = useState("");
  const [showPicker, setShowPicker] = useState<"from" | "to" | null>(null);

  const fromToken = SOL_TOKENS.find(t => t.symbol === fromSym) ?? SOL_TOKENS[0];
  const toToken   = SOL_TOKENS.find(t => t.symbol === toSym)   ?? SOL_TOKENS[1];
  const fromAmtN  = parseFloat(fromAmt) || 0;
  const filtered  = SOL_TOKENS.filter(t => t.symbol.toLowerCase().includes(tokenSearch.toLowerCase()));

  const fetchQuote = useCallback(async () => {
    if (!fromAmtN || !fromToken || !toToken || fromSym === toSym) return;
    setLoading(true); setErr(""); setQuote(null);
    try {
      const amount = Math.floor(fromAmtN * Math.pow(10, fromToken.decimals)).toString();
      const params = new URLSearchParams({
        inputMint: fromToken.mint,
        outputMint: toToken.mint,
        amount,
        slippageBps: "50",
      });
      const res = await fetch(`/api/exchange/jupiter/quote?${params}`);
      const data = await res.json() as JupiterQuote;
      setQuote(data);
      if (data.error) setErr(data.error);
    } catch {
      setErr("Sin conexión al servidor");
    }
    setLoading(false);
  }, [fromAmtN, fromToken, toToken, fromSym, toSym]);

  useEffect(() => {
    const t = setTimeout(() => { if (fromAmtN > 0) fetchQuote(); }, 600);
    return () => clearTimeout(t);
  }, [fetchQuote, fromAmtN]);

  const toAmtRaw = quote?.outAmount && toToken
    ? parseFloat(quote.outAmount) / Math.pow(10, toToken.decimals)
    : 0;

  const topRoutes = (quote?.routePlan ?? []).slice(0, 3).map(r => r.swapInfo.label);

  function flip() {
    setFromSym(toSym); setToSym(fromSym);
    setFromAmt(""); setQuote(null); setErr("");
  }
  function selectToken(sym: string) {
    if (showPicker === "from") setFromSym(sym);
    else setToSym(sym);
    setShowPicker(null); setTokenSearch(""); setQuote(null); setErr("");
  }

  return (
    <div className="max-w-md mx-auto">
      {/* Wallet bar */}
      <div className="mb-4 px-1">
        <div className="flex items-center justify-between">
          <span className="font-sharetech text-[9px] text-[#8ab8cc] tracking-[0.3em]">PSY EXCHANGE · SOLANA · JUPITER</span>
          {solWallet.address ? (
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#9945ff] animate-pulse" />
              <span className="font-space text-[10px] text-[#9945ff]">{solWallet.address.slice(0,6)}...{solWallet.address.slice(-4)}</span>
              <button onClick={solWallet.disconnect} className="font-space text-[8px] text-[#8ab8cc] hover:text-[#ff1744]">✕</button>
            </div>
          ) : (
            <button onClick={solWallet.connect} disabled={solWallet.connecting}
              className="flex items-center gap-1.5 font-space text-[9px] text-[#9945ff] border border-[#9945ff33] px-3 py-1 hover:bg-[#9945ff10] transition-colors disabled:opacity-60 disabled:cursor-wait">
              👻 {solWallet.connecting ? "Conectando..." : "Conectar Phantom"}
            </button>
          )}
        </div>
        {solWallet.connectError && (
          <div className="mt-2 border border-[#ff174433] bg-[#ff174408] px-3 py-2 flex items-start gap-2">
            <span className="text-[#ff1744] text-[11px] shrink-0">⚠</span>
            <span className="font-space text-[9px] text-[#ff1744]">{solWallet.connectError}</span>
          </div>
        )}
      </div>

      {/* From */}
      <div className="bg-[#060a0f] border border-[#1a2535] p-4 mb-1">
        <div className="flex justify-between mb-2">
          <span className="font-space text-[9px] text-[#8ab8cc]">Vendés</span>
        </div>
        <div className="flex items-center gap-3">
          <input value={fromAmt} onChange={e => { setFromAmt(e.target.value); setQuote(null); setErr(""); }}
            placeholder="0" type="number" min="0"
            className="flex-1 bg-transparent font-bebas text-4xl text-white focus:outline-none placeholder-[#2a3a4a] w-0 min-w-0"
            style={{ fontSize: "clamp(22px,4vw,38px)" }} />
          <button onClick={() => setShowPicker("from")}
            className="flex items-center gap-1.5 bg-[#0d1520] border border-[#1a2535] text-white font-sharetech text-[11px] px-3 py-2 hover:border-[#9945ff44] transition-colors shrink-0">
            {fromSym} ▾
          </button>
        </div>
      </div>

      {/* Flip */}
      <div className="flex justify-center py-1">
        <button onClick={flip}
          className="w-8 h-8 border border-[#1a2535] bg-[#060a0f] flex items-center justify-center hover:border-[#9945ff44] hover:text-[#9945ff] transition-all text-[#8ab8cc]">
          ⇅
        </button>
      </div>

      {/* To */}
      <div className="bg-[#060a0f] border border-[#1a2535] p-4 mb-4">
        <div className="flex justify-between mb-2">
          <span className="font-space text-[9px] text-[#8ab8cc]">Recibís</span>
          <span className="font-space text-[9px]">
            {loading
              ? <span className="animate-pulse text-[#9945ff]">consultando Jupiter...</span>
              : quote && !quote.error
                ? <span className="text-[#00e676]">via Jupiter ✓</span>
                : <span className="text-[#8ab8cc]">estimado</span>
            }
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 font-bebas" style={{
            fontSize: "clamp(22px,4vw,38px)",
            color: loading ? "#3a5060" : toAmtRaw > 0 ? "white" : "#8ab8cc",
          }}>
            {loading ? <span className="animate-pulse">—</span>
              : toAmtRaw > 0 ? toAmtRaw.toFixed(toToken.decimals <= 6 ? 4 : 6) : "0"
            }
          </div>
          <button onClick={() => setShowPicker("to")}
            className="flex items-center gap-1.5 bg-[#0d1520] border border-[#1a2535] text-white font-sharetech text-[11px] px-3 py-2 hover:border-[#9945ff44] transition-colors shrink-0">
            {toSym} ▾
          </button>
        </div>
      </div>

      {/* Route */}
      {topRoutes.length > 0 && (
        <div className="border border-[#1a2535] p-3 mb-4">
          <div className="font-sharetech text-[8px] text-[#8ab8cc] tracking-[0.2em] mb-2">RUTA JUPITER</div>
          <div className="flex gap-2 flex-wrap">
            {topRoutes.map((label, i) => (
              <div key={i} className="font-space text-[9px] border border-[#1a2535] px-2 py-0.5 text-[#a8bece]">
                {label}
              </div>
            ))}
          </div>
          {quote?.priceImpactPct && (
            <div className="font-space text-[9px] text-[#6a98b0] mt-2">
              Impacto de precio: <span className="text-[#ffd700]">{(parseFloat(quote.priceImpactPct) * 100).toFixed(3)}%</span> · Slippage: 0.5%
            </div>
          )}
        </div>
      )}

      {err && (
        <div className="border border-[#ff174433] bg-[#ff174408] px-3 py-2 mb-4">
          <div className="font-space text-[9px] text-[#ff1744]">✗ {err}</div>
        </div>
      )}

      {/* CTA */}
      <button
        onClick={solWallet.address ? fetchQuote : solWallet.connect}
        disabled={loading || fromSym === toSym}
        className="w-full py-4 font-space text-[12px] font-bold tracking-[0.2em] uppercase transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ background: "#9945ff", color: "white" }}>
        {loading ? "COTIZANDO..." : solWallet.address ? "OBTENER COTIZACIÓN JUPITER →" : "👻 CONECTAR PHANTOM"}
      </button>
      <div className="font-space text-[9px] text-[#6a98b0] text-center mt-2">
        Cotizaciones via Jupiter v6 · Mejor ruta en Solana · Slippage 0.5%
      </div>

      {/* Token picker modal */}
      {showPicker && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#060a0f] border border-[#1a2535] w-full max-w-sm">
            <div className="flex items-center justify-between p-4 border-b border-[#0d1520]">
              <span className="font-bebas text-lg text-white">Seleccionar Token SOL</span>
              <button onClick={() => { setShowPicker(null); setTokenSearch(""); }} className="text-[#8ab8cc] hover:text-white">✕</button>
            </div>
            <div className="p-3 border-b border-[#0d1520]">
              <input value={tokenSearch} onChange={e => setTokenSearch(e.target.value)}
                placeholder="Buscar símbolo..."
                className="w-full bg-[#020408] border border-[#1a2535] text-white font-space text-[11px] px-3 py-2 outline-none focus:border-[#9945ff44] placeholder:text-[#6a98b0]"
                autoFocus />
            </div>
            <div className="overflow-y-auto max-h-72">
              {filtered.map(t => (
                <button key={t.symbol} onClick={() => selectToken(t.symbol)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#0d1520] transition-colors border-b border-[#0a0f18] text-left">
                  <span className="font-space text-[11px] text-white">{t.symbol}</span>
                  <span className="font-space text-[9px] text-[#8ab8cc]">{t.mint.slice(0,8)}...</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
// ─── Kill Switch Modal ────────────────────────────────────────────────────────
function KillSwitchModal({ onClose, walletAddr }: { onClose: () => void; walletAddr: string | null }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm px-4"
      onClick={onClose}>
      <div className="bg-[#060a0f] border-2 border-[#ff174466] w-full max-w-md p-6"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-3 h-3 rounded-full bg-[#ff1744] animate-pulse" />
          <div className="font-bebas text-2xl text-[#ff1744] tracking-wide">MODO EMERGENCIA — KILL SWITCH</div>
          <button onClick={onClose} className="ml-auto text-[#7ab3c8] hover:text-white font-bold">✕</button>
        </div>

        <div className="font-space text-[11px] text-[#ff6060] mb-5 leading-relaxed border border-[#ff174422] bg-[#ff174408] px-4 py-3">
          Seguí estos pasos en orden para proteger tu capital de forma inmediata.
        </div>

        <div className="space-y-3 mb-5">
          {[
            { n: "1", title: "VENDÉ TODO A USDC",  body: "Usá el swap aquí mismo: seleccioná tu token → USDC y confirmá en tu wallet. Empezá por las posiciones más grandes." },
            { n: "2", title: "CANCELÁ ÓRDENES ABIERTAS", body: "Si tenés órdenes limit activas en otros exchanges, cancelalas inmediatamente." },
            { n: "3", title: "RETIRÁ A WALLET FRÍA", body: "Una vez en USDC, transferí a tu cold wallet o hardware wallet. No dejés fondos en exchange." },
            { n: "4", title: "NO VOLVÁS HASTA ANALIZAR", body: "Tomá 24h. Revisá qué pasó antes de re-entrar. El mercado siempre vuelve a dar oportunidades." },
          ].map(s => (
            <div key={s.n} className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-[#ff174422] border border-[#ff174433] flex items-center justify-center shrink-0 mt-0.5">
                <span className="font-space text-[10px] font-bold text-[#ff1744]">{s.n}</span>
              </div>
              <div>
                <div className="font-space text-[11px] font-bold text-white">{s.title}</div>
                <div className="font-sharetech text-[9px] text-[#7ab3c8] leading-relaxed">{s.body}</div>
              </div>
            </div>
          ))}
        </div>

        {walletAddr && (
          <div className="mb-4 border border-[#1a2535] bg-[#030609] px-4 py-3">
            <div className="font-sharetech text-[9px] text-[#5a8898] tracking-[0.15em] mb-1">WALLET CONECTADA</div>
            <div className="font-mono text-[11px] text-[#00e5ff]">{walletAddr}</div>
          </div>
        )}

        <button onClick={onClose}
          className="w-full py-3 font-space text-[12px] font-bold tracking-[0.1em] uppercase border border-[#1a2535] text-[#7ab3c8] hover:text-white hover:border-[#243040] transition-all">
          CERRAR — VOLVÉ AL EXCHANGE
        </button>
        <div className="font-sharetech text-[9px] text-[#5a8898] text-center mt-3">
          Psicología del trading: las mejores decisiones se toman con calma, no en pánico.
        </div>
      </div>
    </div>
  );
}

export default function Exchange() {
  const wallet = useWallet();
  const [showKillSwitch, setShowKillSwitch] = useState(false);
  const [tab, setTab] = useState<"swap" | "launchpad" | "scanner">("swap");
  const [chainTab, setChainTab] = useState<"eth" | "bsc" | "sol">("eth");
  const [projects, setProjects] = useState<TokenProject[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [selectedProject, setSelectedProject] = useState<TokenProject | null>(null);
  const [showSubmit, setShowSubmit] = useState(false);
  const [filter, setFilter] = useState<"TODOS" | "PRE-SALE" | "IDO" | "RECIEN LISTADO" | "PRÓXIMAMENTE">("TODOS");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "psyscore" | "raised" | "price">("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [chainFilter, setChainFilter] = useState<string>("TODOS");
  const ITEMS_PER_PAGE = 12;

  useEffect(() => {
    const base = import.meta.env.BASE_URL.replace(/\/$/, "");
    fetch(`${base}/projects.json`)
      .then(r => r.json())
      .then((data: TokenProject[]) => setProjects(data))
      .catch(() => setProjects([]))
      .finally(() => setLoadingProjects(false));
  }, []);

  useEffect(() => { setCurrentPage(1); }, [filter, search, sortBy, chainFilter]);

  const sortFn = (a: TokenProject, b: TokenProject) => {
    if (sortBy === "psyscore") return b.psyScore - a.psyScore;
    if (sortBy === "raised") return b.raised - a.raised;
    if (sortBy === "price") return b.price - a.price;
    return new Date(b.listedAt).getTime() - new Date(a.listedAt).getTime();
  };

  const filtered = projects.filter(p => {
    const matchStage = filter === "TODOS" || p.stage === filter;
    const matchChain = chainFilter === "TODOS" || p.chain === chainFilter;
    const matchSearch = search === "" ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.symbol.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase());
    return matchStage && matchChain && matchSearch;
  }).sort(sortFn);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const chains = ["TODOS", ...Array.from(new Set(projects.map(p => p.chain)))];

  const totalRaised = projects.reduce((a, p) => a + p.raised, 0);
  const totalProjects = projects.length;
  const totalVolume = projects.reduce((a, p) => a + p.volume24h, 0);

  return (
    <div className="min-h-screen bg-[#020408] text-white font-rajdhani">
      <SiteNav />

      {/* Kill switch modal */}
      {showKillSwitch && (
        <KillSwitchModal
          onClose={() => setShowKillSwitch(false)}
          walletAddr={wallet.address ?? null}
        />
      )}

      {/* Tab selector */}
      <div className="pt-24 px-6 md:px-12 border-b border-[#1a2535] bg-[#020408]">
        <div className="flex gap-0 items-end">
          {/* Kill switch button — right side */}
          <div className="ml-auto mb-1">
            <button onClick={() => setShowKillSwitch(true)}
              className="flex items-center gap-2 px-4 py-2 font-space text-[10px] font-bold tracking-[0.1em] uppercase border border-[#ff174433] text-[#ff1744] bg-[#ff174408] hover:bg-[#ff174018] transition-all">
              🛑 EMERGENCIA
            </button>
          </div>
        </div>
        <div className="flex gap-0">
          {([
            { key: "swap",      label: "⚡ SWAP ERC-20",  desc: "Intercambiá tokens via 0x Protocol" },
            { key: "launchpad", label: "🚀 LAUNCHPAD",    desc: "Tokens nuevos · Pre-sale · IDO" },
            { key: "scanner",   label: "🔍 CONTRACT SCANNER", desc: "Seguridad · Whale Intel · Risk Score · GRATIS" },
          ] as const).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="px-8 py-4 font-space text-[11px] font-bold tracking-[0.15em] uppercase transition-all border-b-2 relative"
              style={tab === t.key
                ? { color: "#00e5ff", borderBottomColor: "#00e5ff", background: "#00e5ff08" }
                : { color: "#7aacbe", borderBottomColor: "transparent" }}>
              {t.label}
              <div className="font-space text-[8px] font-normal tracking-normal normal-case text-[#6a98b0] mt-0.5">{t.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* SWAP tab */}
      {tab === "swap" && (
        <section className="px-6 md:px-12 py-12 border-b border-[#1a2535] bg-[#040810]">
          {/* Chain tabs */}
          <div className="max-w-5xl mx-auto mb-8">
            <div className="flex gap-0 border border-[#1a2535] w-fit">
              {([
                { key: "eth", label: "🔷 ETHEREUM", color: "#00e5ff", desc: "0x · ERC-20" },
                { key: "bsc", label: "🟡 BNB CHAIN", color: "#f0b90b", desc: "0x · BEP-20" },
                { key: "sol", label: "🟣 SOLANA",    color: "#9945ff", desc: "Jupiter · SPL" },
              ] as const).map(c => (
                <button key={c.key} onClick={() => setChainTab(c.key)}
                  className="px-6 py-3 font-space text-[10px] font-bold tracking-[0.15em] uppercase transition-all border-r border-[#1a2535] last:border-r-0"
                  style={chainTab === c.key
                    ? { color: c.color, background: `${c.color}12`, borderBottom: `2px solid ${c.color}` }
                    : { color: "#7aacbe", background: "transparent", borderBottom: "2px solid transparent" }}>
                  {c.label}
                  <div className="font-space text-[8px] font-normal tracking-normal normal-case mt-0.5" style={{ color: chainTab === c.key ? c.color : "#6a98b0" }}>{c.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div>
              <div className="font-sharetech text-[9px] tracking-[0.4em] mb-4"
                style={{ color: chainTab === "bsc" ? "#f0b90b" : chainTab === "sol" ? "#9945ff" : "#00e5ff" }}>
                ⚡ PSY EXCHANGE · DEX AGGREGATOR
              </div>
              <h2 className="font-bebas text-5xl md:text-6xl leading-none mb-3">
                SWAP TOKENS.<br />
                <span style={{ color: chainTab === "bsc" ? "#f0b90b" : chainTab === "sol" ? "#9945ff" : "#00e5ff" }}>MEJOR PRECIO.</span>
              </h2>
              <p className="font-space text-[12px] text-[#8ab8cc] leading-relaxed mb-6">
                {chainTab === "sol"
                  ? "Jupiter Aggregator encuentra la mejor ruta entre todos los DEXes de Solana. Conectá Phantom o Solflare y obtené cotizaciones al instante."
                  : chainTab === "bsc"
                    ? "0x Protocol en BNB Chain encuentra la mejor ruta entre PancakeSwap, DODO y más DEXes BSC. MetaMask cambia de red automáticamente."
                    : "0x Protocol encuentra la mejor ruta entre Uniswap, Curve, Balancer y más DEXes. PSYCHOMETRIKS cobra 0.5% de fee directo on-chain — transparente, sin custodia de fondos."
                }
              </p>
              <div className="grid grid-cols-2 gap-3">
                {(chainTab === "sol" ? [
                  { label: "Tokens Solana",  val: `${SOL_TOKENS.length}`,  color: "#9945ff" },
                  { label: "Slippage",       val: "0.5%",   color: "#ffd700" },
                  { label: "Protocolo",      val: "Jupiter", color: "#00e676" },
                  { label: "Red",            val: "SOL",    color: "#9945ff" },
                ] : chainTab === "bsc" ? [
                  { label: "Tokens BNB",  val: `${BSC_TOKENS.length}`,  color: "#f0b90b" },
                  { label: "Fee PSY",     val: "0.5%",  color: "#ffd700" },
                  { label: "Protocolo",   val: "0x v1", color: "#00e676" },
                  { label: "Red",         val: "BSC",   color: "#f0b90b" },
                ] : [
                  { label: "Tokens ETH",  val: `${ZEROX_TOKENS.length}`, color: "#00e5ff" },
                  { label: "Fee PSY",     val: "0.5%",  color: "#ffd700" },
                  { label: "Protocolo",   val: "0x v1", color: "#00e676" },
                  { label: "Red",         val: "ETH",   color: "#e040fb" },
                ]).map(s => (
                  <div key={s.label} className="border border-[#1e3a50] bg-[#091522] p-3">
                    <div className="font-space text-[8px] text-[#8ab8cc] tracking-[0.2em] mb-0.5">{s.label}</div>
                    <div className="font-bebas text-2xl" style={{ color: s.color }}>{s.val}</div>
                  </div>
                ))}
              </div>
            </div>

            {chainTab === "sol"
              ? <SolanaSwapPanel />
              : <ZeroxSwapPanel wallet={wallet} chain={chainTab} />
            }
          </div>
        </section>
      )}

      {/* LAUNCHPAD tab */}
      {tab === "launchpad" && (
      <>
      {/* Hero */}
      <section className="pt-12 pb-12 px-6 md:px-12 border-b border-[#1a2535] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#00e5ff05] to-transparent pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-32 bg-gradient-to-b from-[#00e5ff40] to-transparent" />

        <div className="relative z-10">
          <div className="font-sharetech text-[9px] text-[#00e5ff] tracking-[0.4em] mb-4 flex items-center gap-3">
            ⚡ PSY EXCHANGE · LAUNCHPAD
            <div className="h-px bg-[#1a2535] flex-1 max-w-[80px]" />
          </div>
          <h1 className="font-bebas text-6xl md:text-8xl leading-none mb-4">
            TOKENS NUEVOS.<br />
            <span className="text-[#00e5ff]">ANTES QUE TODOS.</span>
          </h1>
          <p className="font-space text-sm text-[#8ab8cc] max-w-2xl leading-relaxed mb-8">
            El marketplace de tokens pre-mercado de LATAM. Cada proyecto pasa por verificación manual: website, whitepaper, contrato, equipo y auditoría.
            Conectá tu wallet y participá desde el primer día.
            <span className="text-[#ffd700]"> PSY Exchange cobra {PSY_FEE_PCT}% de fee por transacción — transparente y justo.</span>
          </p>

          {/* Stats */}
          <div className="flex flex-wrap gap-6 mb-8">
            {[
              { label: "Total recaudado", val: fmt(totalRaised), color: "#00e5ff" },
              { label: "Proyectos listados", val: totalProjects.toString(), color: "#ffd700" },
              { label: "Volumen 24h", val: fmt(totalVolume), color: "#00e676" },
              { label: "Fee plataforma", val: PSY_FEE_PCT + "%", color: "#e040fb" },
            ].map(s => (
              <div key={s.label}>
                <div className="font-space text-[9px] text-[#6a98b0] tracking-[0.2em] mb-0.5">{s.label}</div>
                <div className="font-bebas text-3xl" style={{ color: s.color }}>{s.val}</div>
              </div>
            ))}
          </div>

          {/* Wallet + Submit CTA */}
          <div className="flex flex-wrap gap-3 items-center">
            {wallet.address ? (
              <div className="flex items-center gap-3 border border-[#00e67633] bg-[#00e67608] px-5 py-3">
                <div className="w-2 h-2 rounded-full bg-[#00e676] animate-pulse" />
                <div>
                  <div className="font-space text-[10px] text-[#00e676]">WALLET CONECTADA</div>
                  <div className="font-space text-[11px] text-white">{truncAddr(wallet.address)}</div>
                </div>
                <button onClick={wallet.disconnect} className="font-space text-[9px] text-[#8ab8cc] hover:text-[#ff1744] transition-colors ml-2">
                  Desconectar
                </button>
              </div>
            ) : (
              <button onClick={wallet.connect} disabled={wallet.connecting}
                className="flex items-center gap-2 px-6 py-3 border border-[#ffd70033] bg-[#ffd70010] hover:bg-[#ffd70020] transition-colors disabled:opacity-60 disabled:cursor-wait">
                <span className="text-xl">🦊</span>
                <div>
                  <div className="font-space text-[10px] text-[#ffd700] font-bold tracking-[0.1em]">
                    {wallet.connecting ? "CONECTANDO..." : "CONECTAR METAMASK"}
                  </div>
                  <div className="font-space text-[9px] text-[#8ab8cc]">
                    {wallet.hasMetaMask ? "Clic para conectar" : "Instalá MetaMask primero"}
                  </div>
                </div>
              </button>
            )}

            <button onClick={() => setShowSubmit(true)}
              className="px-6 py-3 border border-[#00e5ff33] bg-[#00e5ff08] hover:bg-[#00e5ff15] transition-colors">
              <div className="font-space text-[10px] text-[#00e5ff] font-bold tracking-[0.1em]">🚀 LISTAR MI TOKEN</div>
              <div className="font-space text-[9px] text-[#6a98b0]">Proceso gratuito · 48-72h</div>
            </button>
          </div>
        </div>
      </section>

      {/* How validation works */}
      <section className="px-6 md:px-12 py-8 border-b border-[#1a2535] bg-[#040810]">
        <div className="font-space text-[9px] text-[#8ab8cc] tracking-[0.3em] uppercase mb-4">⬡ SISTEMA DE VALIDACIÓN PSY EXCHANGE</div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {(Object.keys(VALIDATION_LABELS) as ValidationKey[]).map(k => {
            const v = VALIDATION_LABELS[k];
            return (
              <div key={k} className="border border-[#1a2535] p-3 text-center">
                <div className="text-2xl mb-1">{v.icon}</div>
                <div className="font-space text-[10px] text-white">{v.label}</div>
                <div className="font-space text-[9px] text-[#6a98b0] leading-relaxed mt-0.5">{v.desc}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Tokens list */}
      <section className="px-6 md:px-12 py-10">
        {/* Filters Row 1: Stage */}
        <div className="flex flex-wrap gap-2 items-center mb-3">
          <div className="flex flex-wrap gap-1">
            {(["TODOS", "PRE-SALE", "IDO", "RECIEN LISTADO", "PRÓXIMAMENTE"] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className="font-space text-[9px] tracking-[0.1em] uppercase px-3 py-1.5 transition-colors border"
                style={filter === f
                  ? { background: "#00e5ff", color: "#020408", borderColor: "#00e5ff" }
                  : { background: "transparent", color: "#7aacbe", borderColor: "#1e3040" }}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Filters Row 2: Chain + Search + Sort */}
        <div className="flex flex-wrap gap-2 items-center mb-6">
          <div className="flex gap-1 flex-wrap">
            {chains.map(c => (
              <button key={c} onClick={() => setChainFilter(c)}
                className="font-space text-[9px] tracking-[0.1em] uppercase px-2.5 py-1 transition-colors border"
                style={chainFilter === c
                  ? { background: "#ffd700", color: "#020408", borderColor: "#ffd700" }
                  : { background: "transparent", color: "#7aacbe", borderColor: "#1e3040" }}>
                {c}
              </button>
            ))}
          </div>
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar token, símbolo, categoría..."
            className="flex-1 min-w-[180px] max-w-xs bg-[#040810] border border-[#1a2535] text-white font-space text-[11px] px-3 py-1.5 outline-none focus:border-[#00e5ff44] placeholder:text-[#6a98b0]"
          />
          <div className="flex items-center gap-2 ml-auto">
            <span className="font-space text-[9px] text-[#8ab8cc]">ORDENAR:</span>
            <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)}
              className="bg-[#040810] border border-[#1a2535] text-white font-space text-[10px] px-2 py-1.5 outline-none cursor-pointer">
              <option value="newest">Más recientes</option>
              <option value="psyscore">PSY Score ↓</option>
              <option value="raised">Más recaudado</option>
              <option value="price">Precio ↓</option>
            </select>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 mb-6 font-space text-[10px] text-[#8ab8cc]">
          <span>{filtered.length} tokens encontrados</span>
          {totalPages > 1 && <span>· Página {currentPage} de {totalPages}</span>}
        </div>

        {/* Loading skeleton */}
        {loadingProjects && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-10">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-48 bg-[#060a0f] border border-[#1a2535] animate-pulse" />
            ))}
          </div>
        )}

        {/* Featured projects */}
        {!loadingProjects && filter === "TODOS" && chainFilter === "TODOS" && !search && currentPage === 1 && (
          <>
            <div className="font-sharetech text-[9px] text-[#00e5ff] tracking-[0.3em] mb-4">⭐ PROYECTOS DESTACADOS</div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-10">
              {projects.filter(p => p.featured).map(p => (
                <TokenCard key={p.id} project={p} onClick={() => setSelectedProject(p)} />
              ))}
            </div>
            <div className="font-sharetech text-[9px] text-[#8ab8cc] tracking-[0.3em] mb-4">TODOS LOS TOKENS</div>
          </>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {paginated.map(p => (
            <TokenCard key={p.id} project={p} onClick={() => setSelectedProject(p)} />
          ))}
        </div>

        {filtered.length === 0 && !loadingProjects && (
          <div className="text-center py-20">
            <div className="text-4xl mb-3">🔍</div>
            <div className="font-space text-[12px] text-[#8ab8cc]">No se encontraron tokens con ese filtro.</div>
            <button onClick={() => { setFilter("TODOS"); setSearch(""); setChainFilter("TODOS"); }}
              className="mt-4 font-space text-[10px] text-[#00e5ff] hover:underline">
              Limpiar filtros
            </button>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
              className="font-space text-[10px] px-4 py-2 border border-[#1a2535] text-[#8ab8cc] hover:border-[#00e5ff] hover:text-[#00e5ff] transition-all disabled:opacity-30 disabled:cursor-not-allowed">
              ← ANTERIOR
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              const page = totalPages <= 7 ? i + 1 : currentPage <= 4 ? i + 1 : currentPage >= totalPages - 3 ? totalPages - 6 + i : currentPage - 3 + i;
              return (
                <button key={page} onClick={() => setCurrentPage(page)}
                  className="font-space text-[10px] w-8 h-8 border transition-all"
                  style={currentPage === page
                    ? { background: "#00e5ff", color: "#020408", borderColor: "#00e5ff" }
                    : { background: "transparent", color: "#7aacbe", borderColor: "#1e3040" }}>
                  {page}
                </button>
              );
            })}
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
              className="font-space text-[10px] px-4 py-2 border border-[#1a2535] text-[#8ab8cc] hover:border-[#00e5ff] hover:text-[#00e5ff] transition-all disabled:opacity-30 disabled:cursor-not-allowed">
              SIGUIENTE →
            </button>
          </div>
        )}
      </section>

      {/* Affiliate / Commission Program */}
      <section className="px-6 md:px-12 py-16 bg-[#040810] border-t border-[#1a2535]">
        <div className="max-w-5xl mx-auto">
          <div className="font-space text-[9px] text-[#ffd700] tracking-[0.4em] uppercase mb-3 flex items-center gap-3">
            <div className="h-px bg-[#ffd70022] flex-1" /> PROGRAMA DE AFILIADOS Y COMISIONES <div className="h-px bg-[#ffd70022] flex-1" />
          </div>
          <h2 className="font-bebas text-4xl md:text-5xl text-white text-center mb-2">
            LISTÁ TU TOKEN.<br />
            <span className="text-[#ffd700]">GANÁ POR COMISIONES.</span>
          </h2>
          <p className="font-space text-[12px] text-[#8ab8cc] text-center max-w-2xl mx-auto mb-12 leading-relaxed">
            PSYCHOMETRIKS cobra {PSY_FEE_PCT}% de fee sobre cada transacción. Proyectos que cotizan en el Exchange pueden
            acordar un esquema de comisión referida — nosotros trackeamos, vos ganás.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[#1a2535]">
            {[
              {
                step: "01", icon: "📋", title: "Envía tu Token",
                desc: "Completa el formulario de listado con la info del proyecto. Sin costo de listado básico. Revisión manual en 48-72h.",
                color: "#00e5ff",
              },
              {
                step: "02", icon: "🔍", title: "Verificación PSY",
                desc: "Nuestro equipo verifica website, whitepaper, contrato, equipo, auditoría y liquidez. Asignamos tu PSY Trust Score público.",
                color: "#e040fb",
              },
              {
                step: "03", icon: "💰", title: "Acuerdo de Comisión",
                desc: `Una vez listado, podés acordar comisión referida de entre 0.5% y ${PSY_FEE_PCT}% por transacción trackeada. Pago mensual en crypto.`,
                color: "#ffd700",
              },
            ].map(s => (
              <div key={s.step} className="bg-[#040810] p-8 relative">
                <div className="absolute top-0 left-0 w-full h-0.5" style={{ background: s.color }} />
                <div className="font-space text-[9px] tracking-[0.3em] mb-4" style={{ color: s.color }}>PASO {s.step}</div>
                <div className="text-3xl mb-3">{s.icon}</div>
                <div className="font-bebas text-2xl text-white mb-2">{s.title}</div>
                <p className="font-space text-[11px] text-[#8ab8cc] leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>

          {/* Affiliate tiers */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-[#00e5ff22] p-6">
              <div className="font-space text-[9px] text-[#00e5ff] tracking-[0.2em] mb-3">PLAN DE COMISIÓN — PROYECTOS</div>
              <div className="space-y-3">
                {[
                  { tier: "Básico (sin acuerdo)", pct: "0%", desc: "Listing gratuito, PSY cobra 1.5% al usuario" },
                  { tier: "Afiliado Bronce", pct: "0.3%", desc: "Fee reducido al 1.2%, vos recibís 0.3%" },
                  { tier: "Afiliado Plata", pct: "0.5%", desc: "Fee reducido al 1.0%, vos recibís 0.5%" },
                  { tier: "Afiliado Gold ⭐", pct: "0.75%", desc: "Fee al 0.75%, vos recibís 0.75% — exclusivo volumen alto" },
                ].map(t => (
                  <div key={t.tier} className="flex items-center justify-between py-2 border-b border-[#0d1520] last:border-0">
                    <div>
                      <div className="font-space text-[10px] text-white">{t.tier}</div>
                      <div className="font-space text-[9px] text-[#8ab8cc]">{t.desc}</div>
                    </div>
                    <div className="font-bebas text-xl text-[#00e5ff] shrink-0 ml-4">{t.pct}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="border border-[#ffd70022] p-6">
              <div className="font-space text-[9px] text-[#ffd700] tracking-[0.2em] mb-3">AFILIADOS — COMUNIDAD PSYCHOMETRIKS</div>
              <p className="font-space text-[11px] text-[#8ab8cc] leading-relaxed mb-4">
                Si sos miembro PSY y referís un proyecto que se lista, ganás un bono único por referido exitoso.
                También podés crear tu link de afiliado para promocionar tokens y ganar comisión por cada compra referida.
              </p>
              <div className="space-y-2">
                {[
                  { plan: "Plan Básico", bonus: "$10 por referido" },
                  { plan: "Plan Educación", bonus: "$20 por referido" },
                  { plan: "Plan Pro", bonus: "$35 por referido" },
                  { plan: "Plan Elite", bonus: "$50 + 0.2% recurrente" },
                ].map(r => (
                  <div key={r.plan} className="flex items-center justify-between py-1.5">
                    <div className="font-space text-[10px] text-[#8ab8cc]">{r.plan}</div>
                    <div className="font-space text-[10px] text-[#ffd700] font-bold">{r.bonus}</div>
                  </div>
                ))}
              </div>
              <a href="https://t.me/psychometriks_pro" target="_blank" rel="noopener noreferrer"
                className="mt-5 flex items-center justify-center gap-2 font-space text-[10px] font-bold tracking-[0.15em] uppercase px-6 py-3 no-underline transition-all hover:opacity-90"
                style={{ background: "linear-gradient(135deg,#2CA5E0,#229ED9)", color: "white" }}>
                ✈️ CONTACTAR PARA AFILIARTE
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Submit your token CTA banner */}
      <section className="px-6 md:px-12 py-16 bg-[#020408] border-t border-[#1a2535]">
        <div className="border border-[#00e5ff22] p-8 md:p-12 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#00e5ff] to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#00e5ff05] to-transparent pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-8">
            <div className="flex-1">
              <div className="font-sharetech text-[9px] text-[#00e5ff] tracking-[0.4em] mb-3">PARA PROYECTOS</div>
              <h2 className="font-bebas text-4xl md:text-6xl text-white mb-3">
                ¿TENÉS UN TOKEN?<br /><span className="text-[#00e5ff]">LISTALO GRATIS.</span>
              </h2>
              <p className="font-space text-[12px] text-[#8ab8cc] leading-relaxed max-w-xl">
                PSY Exchange verifica tu proyecto, le asigna un PSY Trust Score y lo expone a toda la comunidad PSYCHOMETRIKS.
                Sin costo de listado básico. El exchange cobra {PSY_FEE_PCT}% sobre cada transacción — que va a la plataforma, no a vos.
                El listado escala automáticamente: cientos o miles de tokens, paginados automáticamente.
              </p>
            </div>
            <div className="shrink-0 flex flex-col gap-3">
              <button onClick={() => setShowSubmit(true)}
                className="font-space text-[12px] font-bold tracking-[0.2em] uppercase px-10 py-4 bg-[#00e5ff] text-[#020408] hover:bg-white transition-colors">
                🚀 ENVIAR MI TOKEN →
              </button>
              <div className="font-space text-[9px] text-[#6a98b0] text-center">
                Revisión manual 48-72h · Verificación de 6 puntos · Score público
              </div>
            </div>
          </div>
        </div>
      </section>
      </>
      )}

      {/* SCANNER tab */}
      {tab === "scanner" && (
        <section className="px-6 md:px-12 py-10 bg-[#020406] min-h-screen">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
              <div>
                <div className="font-sharetech text-[9px] text-[#00e5ff] tracking-[0.4em] mb-2 flex items-center gap-3">
                  🔍 PSY CONTRACT SCANNER v4.0
                  <span className="text-[8px] px-2 py-0.5 border border-[#00e5ff33] text-[#00e5ff80]">WHALE INTELLIGENCE MODULE</span>
                  <span className="text-[8px] px-2 py-0.5 border border-[#00ff8833] text-[#00ff88]">GRATIS</span>
                </div>
                <h1 className="font-bebas text-5xl md:text-6xl leading-none mb-2">
                  CONTRACT<br /><span className="text-[#00e5ff]">SCANNER.</span>
                </h1>
                <p className="font-space text-sm text-[#8ab8cc] max-w-xl">
                  Análisis profundo de contratos DeFi. Detección de honeypots, rug pulls, whale intelligence y risk scoring PSY en tiempo real. GoPlus + DexScreener + RugCheck.
                </p>
              </div>
              <div className="font-space text-[9px] text-[#4a6070] text-right leading-relaxed">
                <div className="text-[#00e5ff]">✓ GoPlus Security</div>
                <div className="text-[#00e5ff]">✓ DexScreener</div>
                <div className="text-[#00ff88]">✓ RugCheck (Solana)</div>
                <div className="text-[#ffd600]">✓ Whale Intel Engine</div>
              </div>
            </div>
            <ContractScanner />
          </div>
        </section>
      )}

      {/* Modals — always rendered regardless of tab */}
      {selectedProject && (
        <TokenDetailModal
          project={selectedProject}
          wallet={wallet}
          onClose={() => setSelectedProject(null)}
        />
      )}
      {showSubmit && <SubmitTokenForm onClose={() => setShowSubmit(false)} />}
    </div>
  );
}
