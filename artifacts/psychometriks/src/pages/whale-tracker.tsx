import React, { useState, useEffect, useCallback } from "react";
import SiteNav from "@/components/site-nav";

interface Wallet {
  id: number; name: string; address: string; chain: string;
  tags: string[]; note?: string; created_at: string;
}
interface RecentTx {
  whale_name: string; wallet: string; chain: string;
  direction: "in" | "out"; token: string; value: number;
  time: string; hash: string;
}
interface NormalTx {
  hash: string; from: string; to: string; value: string;
  isError: string; timeStamp: string; functionName?: string;
}
interface Erc20Tx {
  hash: string; from: string; to: string; value: string;
  tokenName: string; tokenSymbol: string; tokenDecimal: string;
  timeStamp: string; contractAddress: string;
}
interface Portfolio {
  native_balance: number;
  tokens: { name: string; symbol: string; address: string; balance: number }[];
}

const API = "/api/psy-whales";
const CHAIN_LABEL: Record<string, string> = { eth: "ETH", bsc: "BNB", arb: "ARB", poly: "MATIC", base: "BASE", op: "OP" };
const CHAIN_COLOR: Record<string, string> = { eth: "#627eea", bsc: "#f0b90b", arb: "#28a0f0", poly: "#8247e5", base: "#0052ff", op: "#ff0420" };
const EXPLORER: Record<string, string> = { eth: "https://etherscan.io", bsc: "https://bscscan.com", arb: "https://arbiscan.io", poly: "https://polygonscan.com", base: "https://basescan.org", op: "https://optimistic.etherscan.io" };

const shortAddr = (a: string) => a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "—";
const fmtVal = (v: number) => v >= 1e9 ? `${(v / 1e9).toFixed(2)}B` : v >= 1e6 ? `${(v / 1e6).toFixed(2)}M` : v >= 1e3 ? `${(v / 1e3).toFixed(1)}K` : v.toFixed(4);
const timeAgo = (iso: string) => {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return `${Math.round(s)}s`;
  if (s < 3600) return `${Math.round(s / 60)}m`;
  if (s < 86400) return `${Math.round(s / 3600)}h`;
  return `${Math.round(s / 86400)}d`;
};

export default function WhaleTracker() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [summary, setSummary] = useState<RecentTx[]>([]);
  const [tab, setTab] = useState<"feed" | "wallets" | "agregar">("feed");
  const [selected, setSelected] = useState<Wallet | null>(null);
  const [walletTxs, setWalletTxs] = useState<{ normal: NormalTx[]; erc20: Erc20Tx[] } | null>(null);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [detailTab, setDetailTab] = useState<"erc20" | "normal" | "portfolio">("erc20");
  const [loading, setLoading] = useState(true);
  const [addForm, setAddForm] = useState({ name: "", address: "", chain: "eth", note: "" });
  const [addMsg, setAddMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [wR, sR] = await Promise.all([
        fetch(`${API}/wallets`).then(r => r.json()),
        fetch(`${API}/summary`).then(r => r.json()),
      ]);
      setWallets(wR.wallets ?? []);
      setSummary(sR.recent_txs ?? []);
    } catch { /* silent */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { const id = setInterval(load, 60000); return () => clearInterval(id); }, [load]);

  const openWallet = async (w: Wallet) => {
    setSelected(w);
    setWalletTxs(null);
    setPortfolio(null);
    setDetailTab("erc20");
    try {
      const [txR, portR] = await Promise.all([
        fetch(`${API}/txs/${w.address}?chain=${w.chain}&limit=50`).then(r => r.json()),
        fetch(`${API}/portfolio/${w.address}?chain=${w.chain}`).then(r => r.json()),
      ]);
      setWalletTxs({ normal: txR.normal ?? [], erc20: txR.erc20 ?? [] });
      setPortfolio(portR);
    } catch { /* silent */ }
  };

  async function removeWallet(id: number) {
    await fetch(`${API}/wallets/${id}`, { method: "DELETE" });
    load();
  }

  async function addWallet() {
    setAdding(true); setAddMsg(null);
    const r = await fetch(`${API}/wallets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(addForm),
    });
    const d = await r.json();
    if (d.ok) {
      setAddMsg({ ok: true, text: "✅ Wallet agregada correctamente" });
      setAddForm({ name: "", address: "", chain: "eth", note: "" });
      load();
    } else {
      setAddMsg({ ok: false, text: d.error ?? "Error" });
    }
    setAdding(false);
  }

  return (
    <div className="min-h-screen bg-[#020408] text-white font-rajdhani">
      <SiteNav />

      <section className="pt-32 pb-8 px-6 md:px-12">
        <div className="font-space text-[10px] text-[#00e5ff] tracking-[0.4em] uppercase mb-4">On-Chain Intelligence</div>
        <h1 className="font-bebas text-6xl md:text-8xl leading-none mb-3">
          PSY <span className="text-[#00e5ff]">WHALE</span> TRACKER
        </h1>
        <p className="text-[#7ab3c8] font-space text-sm max-w-2xl leading-relaxed">
          Seguimiento personalizado de wallets de ballenas conocidas. Monitorea sus movimientos en ETH, BNB, ARB, MATIC, BASE y OP en tiempo real vía Etherscan/BscScan.
        </p>
        <div className="flex gap-4 mt-3 text-[11px] font-space text-[#7ab3c8]">
          <span>● {wallets.length} wallets monitoreadas</span>
          <span>● Actualización: cada 60s</span>
          <span>● {summary.length} movimientos recientes</span>
        </div>
      </section>

      {/* Tabs */}
      <div className="px-6 md:px-12 border-b border-[#1a2535] flex">
        {([
          { key: "feed", label: `🔴 Feed Live (${summary.length})` },
          { key: "wallets", label: `🐋 Mis Ballenas (${wallets.length})` },
          { key: "agregar", label: "＋ Agregar Wallet" },
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

      <div className="px-6 md:px-12 py-8 pb-24">
        {/* FEED */}
        {tab === "feed" && (
          loading ? <p className="text-[#7ab3c8] font-space text-sm text-center py-12">Cargando actividad...</p>
          : wallets.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-[#5a6a80] font-space text-sm mb-4">No tienes wallets monitoreadas todavía.</p>
              <button onClick={() => setTab("agregar")} className="font-space text-[11px] text-[#00e5ff] border border-[#00e5ff44] px-4 py-2">
                ＋ Agregar primera wallet →
              </button>
            </div>
          ) : summary.length === 0 ? (
            <p className="text-[#5a6a80] font-space text-sm text-center py-12">Sin actividad reciente detectada</p>
          ) : (
            <div className="space-y-2">
              {summary.map((tx, i) => (
                <div key={i} className="flex items-center gap-4 border border-[#1a2535] bg-[#060a12] p-4 hover:border-[#00e5ff22] transition-colors">
                  <div className="flex-shrink-0">
                    <span style={{ color: CHAIN_COLOR[tx.chain] ?? "#7ab3c8" }} className="font-space text-[10px] font-bold">
                      {CHAIN_LABEL[tx.chain] ?? tx.chain.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-shrink-0 w-6">
                    <span style={{ color: tx.direction === "in" ? "#00e676" : "#ff3c5c" }}>
                      {tx.direction === "in" ? "▲" : "▼"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-space text-[12px] text-[#00e5ff]">{tx.whale_name}</span>
                    <span className="font-space text-[12px] text-[#7ab3c8]"> {tx.direction === "in" ? "recibió" : "envió"} </span>
                    <span className="font-space text-[12px] font-bold">{fmtVal(tx.value)} {tx.token}</span>
                  </div>
                  <div className="flex-shrink-0 font-space text-[10px] text-[#5a6a80]">{timeAgo(tx.time)}</div>
                  {tx.hash && (
                    <a
                      href={`${EXPLORER[tx.chain] ?? "https://etherscan.io"}/tx/${tx.hash}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex-shrink-0 font-space text-[10px] text-[#5a6a80] hover:text-[#00e5ff]"
                      onClick={e => e.stopPropagation()}
                    >
                      TX →
                    </a>
                  )}
                </div>
              ))}
            </div>
          )
        )}

        {/* WALLETS */}
        {tab === "wallets" && (
          wallets.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-[#5a6a80] font-space text-sm mb-4">Sin wallets guardadas</p>
              <button onClick={() => setTab("agregar")} className="font-space text-[11px] text-[#00e5ff] border border-[#00e5ff44] px-4 py-2">
                ＋ Agregar primera wallet →
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {wallets.map(w => (
                <div
                  key={w.id}
                  className="border border-[#1a2535] bg-[#060a12] hover:border-[#00e5ff44] transition-colors cursor-pointer p-5"
                  onClick={() => openWallet(w)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-bebas text-xl">{w.name}</div>
                      <div className="font-space text-[11px] text-[#7ab3c8] mt-0.5">{shortAddr(w.address)}</div>
                    </div>
                    <span
                      className="font-space text-[10px] font-bold px-2 py-0.5"
                      style={{ background: `${CHAIN_COLOR[w.chain] ?? "#627eea"}22`, color: CHAIN_COLOR[w.chain] ?? "#627eea" }}
                    >
                      {CHAIN_LABEL[w.chain] ?? w.chain.toUpperCase()}
                    </span>
                  </div>
                  {w.note && <p className="font-space text-[11px] text-[#5a6a80] mb-3">{w.note}</p>}
                  {w.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {w.tags.map(tag => (
                        <span key={tag} className="text-[9px] font-space bg-[#00e5ff11] text-[#00e5ff] px-1.5 py-0.5">{tag}</span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <a
                      href={`${EXPLORER[w.chain] ?? "https://etherscan.io"}/address/${w.address}`}
                      target="_blank" rel="noopener noreferrer"
                      className="font-space text-[10px] text-[#5a6a80] hover:text-[#00e5ff]"
                      onClick={e => e.stopPropagation()}
                    >
                      Ver en Explorer →
                    </a>
                    <button
                      onClick={e => { e.stopPropagation(); removeWallet(w.id); }}
                      className="font-space text-[10px] text-[#5a6a80] hover:text-[#ff3c5c]"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* AGREGAR */}
        {tab === "agregar" && (
          <div className="max-w-md mx-auto space-y-4">
            <div className="font-space text-[10px] text-[#00e5ff] tracking-[0.3em] uppercase mb-4">Agregar wallet de ballena</div>
            {[
              { key: "name", label: "Nombre / Alias *", placeholder: "Ej: Justin Sun, Whale 0x1234" },
              { key: "address", label: "Dirección Wallet *", placeholder: "0x..." },
              { key: "note", label: "Nota (opcional)", placeholder: "Ej: Acumula BTC en dips, historial de rug pulls..." },
            ].map(f => (
              <div key={f.key}>
                <label className="font-space text-[11px] text-[#7ab3c8] uppercase tracking-wider block mb-1.5">{f.label}</label>
                <input
                  value={(addForm as Record<string, string>)[f.key] ?? ""}
                  onChange={e => setAddForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="w-full bg-[#0a0f1a] border border-[#1a2535] focus:border-[#00e5ff44] outline-none px-3 py-2.5 font-space text-[12px] text-white placeholder:text-[#3a4a5a]"
                />
              </div>
            ))}
            <div>
              <label className="font-space text-[11px] text-[#7ab3c8] uppercase tracking-wider block mb-1.5">Chain *</label>
              <select
                value={addForm.chain}
                onChange={e => setAddForm(p => ({ ...p, chain: e.target.value }))}
                className="w-full bg-[#0a0f1a] border border-[#1a2535] px-3 py-2.5 font-space text-[12px]"
              >
                {Object.entries(CHAIN_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <button
              onClick={addWallet}
              disabled={adding}
              className="w-full py-3 font-space text-[12px] font-bold tracking-[0.2em] uppercase disabled:opacity-40"
              style={{ background: "#00e5ff", color: "#020408" }}
            >
              {adding ? "Agregando..." : "＋ Agregar Wallet"}
            </button>
            {addMsg && (
              <div className={`border p-3 font-space text-[12px] ${addMsg.ok ? "border-[#00e67644] text-[#00e676]" : "border-[#ff3c5c44] text-[#ff6b6b]"}`}>
                {addMsg.text}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Wallet detail modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-[#060a12] border border-[#1a2535] w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between p-5 border-b border-[#1a2535]">
              <div>
                <h2 className="font-bebas text-2xl">{selected.name}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-space text-[11px] text-[#7ab3c8]">{selected.address}</span>
                  <span className="font-space text-[10px] font-bold" style={{ color: CHAIN_COLOR[selected.chain] }}>
                    {CHAIN_LABEL[selected.chain]}
                  </span>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="text-[#7ab3c8] text-xl">✕</button>
            </div>

            {portfolio && (
              <div className="border-b border-[#1a2535] p-4 bg-[#0a0f1a]">
                <span className="font-space text-[10px] text-[#5a6a80] mr-3">Balance nativo:</span>
                <span className="font-space text-[12px] font-bold">{portfolio.native_balance.toFixed(4)} {CHAIN_LABEL[selected.chain]}</span>
              </div>
            )}

            <div className="flex border-b border-[#1a2535]">
              {(["erc20", "normal", "portfolio"] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setDetailTab(t)}
                  className={`flex-1 py-3 text-[11px] font-space uppercase tracking-wider ${detailTab === t ? "text-[#00e5ff] border-b-2 border-[#00e5ff] bg-[#00e5ff0a]" : "text-[#7ab3c8]"}`}
                >
                  {t === "erc20" ? "Tokens Transfers" : t === "normal" ? "TXs Normales" : "Portfolio"}
                </button>
              ))}
            </div>

            <div className="p-4">
              {!walletTxs ? (
                <p className="text-[#7ab3c8] font-space text-sm text-center py-8">Cargando...</p>
              ) : (
                <>
                  {detailTab === "erc20" && (
                    walletTxs.erc20.length === 0
                      ? <p className="text-[#5a6a80] font-space text-sm text-center py-6">Sin transferencias de tokens</p>
                      : <div className="space-y-2">
                        {walletTxs.erc20.map((tx, i) => {
                          const decimals = parseInt(tx.tokenDecimal) || 18;
                          const value = parseInt(tx.value) / Math.pow(10, decimals);
                          const isIn = tx.to.toLowerCase() === selected.address.toLowerCase();
                          return (
                            <div key={i} className="flex items-center gap-3 text-[11px] font-space border-b border-[#1a2535] py-2.5">
                              <span style={{ color: isIn ? "#00e676" : "#ff3c5c" }}>{isIn ? "▲" : "▼"}</span>
                              <span className="flex-1">{fmtVal(value)} <span className="text-[#00e5ff]">{tx.tokenSymbol}</span></span>
                              <span className="text-[#5a6a80]">{timeAgo(new Date(parseInt(tx.timeStamp) * 1000).toISOString())}</span>
                              <a href={`${EXPLORER[selected.chain] ?? "https://etherscan.io"}/tx/${tx.hash}`} target="_blank" rel="noopener noreferrer" className="text-[#5a6a80] hover:text-[#00e5ff]">TX→</a>
                            </div>
                          );
                        })}
                      </div>
                  )}
                  {detailTab === "normal" && (
                    walletTxs.normal.length === 0
                      ? <p className="text-[#5a6a80] font-space text-sm text-center py-6">Sin transacciones normales</p>
                      : <div className="space-y-2">
                        {walletTxs.normal.map((tx, i) => {
                          const ethVal = parseInt(tx.value) / 1e18;
                          const isIn = tx.to?.toLowerCase() === selected.address.toLowerCase();
                          return (
                            <div key={i} className="flex items-center gap-3 text-[11px] font-space border-b border-[#1a2535] py-2.5">
                              <span style={{ color: tx.isError === "1" ? "#ff3c5c" : isIn ? "#00e676" : "#ff9d00" }}>
                                {tx.isError === "1" ? "✕" : isIn ? "▲" : "▼"}
                              </span>
                              <span className="flex-1 truncate">{ethVal > 0 ? `${fmtVal(ethVal)} ${CHAIN_LABEL[selected.chain]}` : tx.functionName || "Contract call"}</span>
                              <span className="text-[#5a6a80]">{timeAgo(new Date(parseInt(tx.timeStamp) * 1000).toISOString())}</span>
                              <a href={`${EXPLORER[selected.chain] ?? "https://etherscan.io"}/tx/${tx.hash}`} target="_blank" rel="noopener noreferrer" className="text-[#5a6a80] hover:text-[#00e5ff]">TX→</a>
                            </div>
                          );
                        })}
                      </div>
                  )}
                  {detailTab === "portfolio" && portfolio && (
                    portfolio.tokens.length === 0
                      ? <p className="text-[#5a6a80] font-space text-sm text-center py-6">Sin tokens ERC-20 detectados en actividad reciente</p>
                      : <div className="space-y-2">
                        {portfolio.tokens.map((t, i) => (
                          <div key={i} className="flex items-center justify-between text-[12px] font-space border-b border-[#1a2535] py-2.5">
                            <span className="text-[#00e5ff]">{t.symbol}</span>
                            <span className="text-[#7ab3c8] text-[10px] flex-1 mx-3 truncate">{t.name}</span>
                            <span>{fmtVal(t.balance)}</span>
                          </div>
                        ))}
                      </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
