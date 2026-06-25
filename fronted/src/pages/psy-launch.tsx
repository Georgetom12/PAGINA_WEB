import React, { useState, useEffect, useCallback, useRef } from "react";
import { ethers } from "ethers";
import SiteNav from "@/components/site-nav";

// ── Contract constants ────────────────────────────────────────────────────────
const FACTORY_ADDRESS = "0xF5f2d405BC16084BB50fC02E355916Dc45058D23";
const BSC_CHAIN_ID    = 56n;
const CREATION_FEE    = ethers.parseEther("0.01");

const FACTORY_ABI = [
  "function createToken(string _name, string _symbol, address _creatorWallet, bool _isVerified) external payable returns (address tokenAddr, address curveAddr)",
  "event TokenCreated(uint256 indexed id, address indexed tokenAddr, address indexed curveAddr, address creator, bool isVerified, uint256 createdAt)",
];

const CURVE_ABI = [
  "function buy() external payable",
  "function sell(uint256 amount) external",
  "function currentPrice() external view returns (uint256)",
  "function getTokensForBNB(uint256 bnbAmount) external view returns (uint256 tokensOut, uint256 fee)",
  "function getBNBForTokens(uint256 tokenAmount) external view returns (uint256 bnbOut, uint256 fee)",
  "function availableForSale() external view returns (uint256)",
  "function graduated() external view returns (bool)",
];

const ERC20_ABI = [
  "function balanceOf(address) external view returns (uint256)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function approve(address spender, uint256 amount) external returns (bool)",
];

// ── Types ─────────────────────────────────────────────────────────────────────
interface PsyToken {
  id: number;
  mode: "verified" | "anon";
  token_name: string;
  ticker: string;
  description: string;
  image_url: string | null;
  company_name: string | null;
  company_website: string | null;
  company_twitter: string | null;
  contract_address: string | null;
  curve_address: string | null;
  price: number;
  market_cap: number;
  volume_24h: number;
  bnb_raised: number;
  holders_count: number;
  total_supply: number;
  creator_allocation: number;
  status: "active" | "graduated";
  graduated_at: string | null;
  pancakeswap_url: string | null;
  created_at: string;
}

interface Trade {
  id: number;
  wallet: string;
  type: "buy" | "sell";
  amount_tokens: number;
  amount_bnb: number;
  price: number;
  fee_bnb: number;
  tx_hash: string | null;
  created_at: string;
}

interface Holder {
  rank: number;
  wallet: string;
  balance: number;
  pct_supply: string;
  avg_entry: string;
  current_value: string;
  pnl: string;
  pnl_pct: string;
  trade_count: number;
}

interface ChartPoint {
  price: number;
  market_cap: number;
  volume: number;
  created_at: string;
}

interface WalletState {
  account: string | null;
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  chainId: bigint | null;
  connecting: boolean;
  error: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const GRADUATION_THRESHOLD = 30000;

// ── Helpers ───────────────────────────────────────────────────────────────────
const shortWallet = (w: string) => (w ? `${w.slice(0, 6)}...${w.slice(-4)}` : "—");

const fmtUSD = (n: number) => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(1)}k`;
  return `$${n.toFixed(2)}`;
};

const fmtDate = (s: string) => {
  const d = new Date(s);
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
};

const bondingPct = (token: PsyToken) =>
  Math.min(100, (token.market_cap / GRADUATION_THRESHOLD) * 100);

// ── useWallet hook ────────────────────────────────────────────────────────────
function useWallet() {
  const [state, setState] = useState<WalletState>({
    account: null, provider: null, signer: null,
    chainId: null, connecting: false, error: "",
  });

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      setState(s => ({ ...s, error: "MetaMask no detectado. Instala MetaMask." }));
      return;
    }
    setState(s => ({ ...s, connecting: true, error: "" }));
    try {
      const provider = new ethers.BrowserProvider(window.ethereum as unknown as ethers.Eip1193Provider);
      await provider.send("eth_requestAccounts", []);
      const signer  = await provider.getSigner();
      const account = await signer.getAddress();
      const network = await provider.getNetwork();
      if (network.chainId !== BSC_CHAIN_ID) {
        try {
          await provider.send("wallet_switchEthereumChain", [{ chainId: "0x38" }]);
        } catch {
          await provider.send("wallet_addEthereumChain", [{
            chainId: "0x38",
            chainName: "BNB Smart Chain",
            nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
            rpcUrls: ["https://bsc-dataseed.binance.org/"],
            blockExplorerUrls: ["https://bscscan.com/"],
          }]);
        }
      }
      const net2 = await provider.getNetwork();
      setState({ account, provider, signer, chainId: net2.chainId, connecting: false, error: "" });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error al conectar";
      setState(s => ({ ...s, connecting: false, error: msg.slice(0, 80) }));
    }
  }, []);

  useEffect(() => {
    if (!window.ethereum) return;
    const eth = window.ethereum as { on: (e: string, h: (...a: unknown[]) => void) => void; removeListener: (e: string, h: (...a: unknown[]) => void) => void };
    const onAccounts = (accounts: unknown[]) => {
      if (!accounts || (accounts as string[]).length === 0) {
        setState({ account: null, provider: null, signer: null, chainId: null, connecting: false, error: "" });
      }
    };
    eth.on("accountsChanged", onAccounts);
    return () => eth.removeListener("accountsChanged", onAccounts);
  }, []);

  return { ...state, connect };
}

// ── BondingCurveSVG ───────────────────────────────────────────────────────────
function BondingCurveSVG({ pct }: { pct: number }) {
  const W = 280; const H = 80;
  const pts: string[] = [];
  for (let i = 0; i <= 100; i++) {
    const x = (i / 100) * W;
    const y = H - (Math.pow(i / 100, 0.5) * H * 0.92 + 2);
    pts.push(`${x},${y}`);
  }
  const full = `M0,${H} ` + pts.map(p => `L${p}`).join(" ") + ` L${W},${H} Z`;
  const cutX = (pct / 100) * W;
  const clip = `M0,${H} ` + pts.slice(0, Math.round(pct) + 1).map(p => `L${p}`).join(" ") + ` L${cutX},${H} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="80" preserveAspectRatio="none">
      <defs>
        <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#00e5ff" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#e040fb" stopOpacity="0.08" />
        </linearGradient>
        <linearGradient id="fillGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#00e5ff" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#7c4dff" stopOpacity="0.6" />
        </linearGradient>
      </defs>
      <path d={full} fill="url(#bgGrad)" />
      <path d={clip} fill="url(#fillGrad)" />
      <polyline points={pts.join(" ")} fill="none" stroke="#ffffff18" strokeWidth="1" />
      {pct > 0 && (
        <line x1={cutX} y1="0" x2={cutX} y2={H} stroke="#00e5ff" strokeWidth="1.5" strokeDasharray="4,3" />
      )}
    </svg>
  );
}

// ── TokenRow ──────────────────────────────────────────────────────────────────
function TokenRow({ token, onClick }: { token: PsyToken; onClick: () => void }) {
  const pct    = bondingPct(token);
  const isGrad = token.status === "graduated";

  return (
    <tr onClick={onClick} className="border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors">
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#00e5ff22] to-[#7c4dff22] border border-white/10 flex items-center justify-center text-base font-bold text-[#00e5ff] shrink-0 overflow-hidden">
            {token.image_url
              ? <img src={token.image_url} alt="" className="w-full h-full object-cover rounded-full" />
              : token.ticker.slice(0, 2)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm">{token.token_name}</span>
              <span className="text-xs text-[#00e5ff]/60 font-mono">${token.ticker}</span>
              {token.mode === "verified"
                ? <span className="text-[10px] bg-[#00e67615] border border-[#00e67633] text-[#00e676] px-1.5 py-0.5 rounded">✅ VERIFICADO</span>
                : <span className="text-[10px] bg-[#ff6d0015] border border-[#ff6d0033] text-[#ff9800] px-1.5 py-0.5 rounded">⚡ ANÓNIMO</span>
              }
            </div>
            <div className="text-[11px] text-white/40 truncate max-w-[160px]">
              {token.mode === "verified" && token.company_name
                ? token.company_name
                : token.description.slice(0, 50) + "…"}
            </div>
          </div>
        </div>
      </td>
      <td className="py-3 px-4 text-right font-mono text-sm text-white/90">{fmtUSD(token.market_cap)}</td>
      <td className="py-3 px-4 text-right font-mono text-sm text-white/60">{fmtUSD(token.volume_24h)}</td>
      <td className="py-3 px-4 text-right text-sm text-white/60">{token.holders_count}</td>
      <td className="py-3 px-4 min-w-[140px]">
        {isGrad ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#ffd700]">🎓 GRADUADO</span>
          </div>
        ) : (
          <div>
            <div className="flex justify-between text-[10px] text-white/40 mb-1">
              <span>{fmtUSD(token.market_cap)}</span>
              <span>{pct.toFixed(1)}%</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: "linear-gradient(90deg,#00e5ff,#7c4dff)" }} />
            </div>
          </div>
        )}
      </td>
      <td className="py-3 px-4 text-[11px] text-white/30 text-right">{fmtDate(token.created_at)}</td>
    </tr>
  );
}

// ── TradingPanel ──────────────────────────────────────────────────────────────
function TradingPanel({
  token,
  wallet,
  onTradeSuccess,
}: {
  token: PsyToken;
  wallet: ReturnType<typeof useWallet>;
  onTradeSuccess: () => void;
}) {
  const [side, setSide]         = useState<"buy" | "sell">("buy");
  const [bnbInput, setBnbInput] = useState("0.01");
  const [tokInput, setTokInput] = useState("");
  const [preview, setPreview]   = useState<{ tokens?: string; bnb?: string } | null>(null);
  const [loading, setLoading]   = useState(false);
  const [txMsg, setTxMsg]       = useState("");
  const [err, setErr]           = useState("");
  const previewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const curveAddress = token.curve_address;

  const fetchPreview = useCallback(async (inputSide: "buy" | "sell", val: string) => {
    if (!curveAddress || !val || isNaN(+val) || +val <= 0) { setPreview(null); return; }
    try {
      const provider = new ethers.JsonRpcProvider("https://bsc-dataseed.binance.org/");
      const curve    = new ethers.Contract(curveAddress, CURVE_ABI, provider);
      if (inputSide === "buy") {
        const wei = ethers.parseEther(val);
        const [tokOut] = await curve.getTokensForBNB(wei) as [bigint, bigint];
        setPreview({ tokens: Number(ethers.formatUnits(tokOut, 18)).toLocaleString(undefined, { maximumFractionDigits: 0 }) });
      } else {
        const amt = ethers.parseUnits(val, 18);
        const [bnbOut] = await curve.getBNBForTokens(amt) as [bigint, bigint];
        setPreview({ bnb: parseFloat(ethers.formatEther(bnbOut)).toFixed(6) });
      }
    } catch { setPreview(null); }
  }, [curveAddress]);

  useEffect(() => {
    if (previewTimer.current) clearTimeout(previewTimer.current);
    previewTimer.current = setTimeout(() => {
      void fetchPreview(side, side === "buy" ? bnbInput : tokInput);
    }, 500);
  }, [side, bnbInput, tokInput, fetchPreview]);

  const handleTrade = async () => {
    if (!wallet.signer || !curveAddress) return;
    setErr(""); setTxMsg(""); setLoading(true);
    try {
      const curve = new ethers.Contract(curveAddress, CURVE_ABI, wallet.signer);

      if (side === "buy") {
        const val = parseFloat(bnbInput);
        if (!val || val <= 0) { setErr("Ingresá un monto BNB válido"); setLoading(false); return; }
        setTxMsg("Esperando confirmación en MetaMask...");
        const tx = await curve.buy({ value: ethers.parseEther(bnbInput) });
        setTxMsg("Transacción enviada, esperando confirmación...");
        const receipt = await tx.wait() as ethers.TransactionReceipt;
        const tokensOut = preview?.tokens?.replace(/,/g, "") ?? "0";
        await fetch("/api/psy-launch/trades", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token_id:     token.id,
            wallet:       wallet.account,
            type:         "buy",
            amount_tokens: parseFloat(tokensOut),
            amount_bnb:   val,
            price:        val / (parseFloat(tokensOut) || 1),
            fee_bnb:      val * 0.01,
            tx_hash:      receipt.hash,
          }),
        });
        setTxMsg(`✅ Compra exitosa · TX: ${receipt.hash.slice(0, 10)}...`);
        onTradeSuccess();
      } else {
        const val = parseFloat(tokInput);
        if (!val || val <= 0) { setErr("Ingresá un monto de tokens válido"); setLoading(false); return; }
        const tokenContract = new ethers.Contract(token.contract_address!, ERC20_ABI, wallet.signer);
        const curveAddr     = curveAddress;
        const allowance     = await tokenContract.allowance(wallet.account!, curveAddr) as bigint;
        const amountWei     = ethers.parseUnits(tokInput, 18);
        if (allowance < amountWei) {
          setTxMsg("Aprobando tokens... (1/2)");
          const approveTx = await tokenContract.approve(curveAddr, amountWei);
          await approveTx.wait();
        }
        setTxMsg("Esperando confirmación en MetaMask...");
        const tx = await curve.sell(amountWei);
        setTxMsg("Transacción enviada, esperando confirmación...");
        const receipt = await tx.wait() as ethers.TransactionReceipt;
        const bnbOut  = preview?.bnb ?? "0";
        await fetch("/api/psy-launch/trades", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token_id:     token.id,
            wallet:       wallet.account,
            type:         "sell",
            amount_tokens: val,
            amount_bnb:   parseFloat(bnbOut),
            price:        parseFloat(bnbOut) / (val || 1),
            fee_bnb:      parseFloat(bnbOut) * 0.01,
            tx_hash:      receipt.hash,
          }),
        });
        setTxMsg(`✅ Venta exitosa · TX: ${receipt.hash.slice(0, 10)}...`);
        onTradeSuccess();
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error en la transacción";
      setErr(msg.includes("user rejected") ? "Transacción cancelada" : msg.slice(0, 120));
      setTxMsg("");
    }
    setLoading(false);
  };

  if (!curveAddress) {
    return (
      <div className="p-4 bg-white/3 border border-white/8 rounded-xl text-center text-sm text-white/30">
        Sin dirección de curva — token creado offline
      </div>
    );
  }

  return (
    <div className="bg-white/3 border border-white/8 rounded-xl p-4">
      <div className="flex gap-1 mb-4">
        {(["buy", "sell"] as const).map(s => (
          <button
            key={s}
            onClick={() => { setSide(s); setPreview(null); setErr(""); setTxMsg(""); }}
            className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${
              side === s
                ? s === "buy" ? "bg-[#00e676] text-black" : "bg-red-500 text-white"
                : "bg-white/5 text-white/40 hover:text-white/70"
            }`}
          >
            {s === "buy" ? "▲ COMPRAR" : "▼ VENDER"}
          </button>
        ))}
      </div>

      {side === "buy" ? (
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-white/40 mb-1">Monto BNB</label>
            <div className="relative">
              <input
                type="number"
                step="0.001"
                min="0.001"
                value={bnbInput}
                onChange={e => setBnbInput(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-[#00e676]/50"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/30">BNB</span>
            </div>
            <div className="flex gap-2 mt-2">
              {["0.01", "0.05", "0.1", "0.5"].map(v => (
                <button key={v} onClick={() => setBnbInput(v)} className="flex-1 py-1 text-xs bg-white/5 hover:bg-white/10 border border-white/10 rounded text-white/50 transition-all">{v}</button>
              ))}
            </div>
          </div>
          {preview?.tokens && (
            <div className="p-2.5 bg-[#00e67608] border border-[#00e67620] rounded-lg text-xs text-center">
              <span className="text-white/40">Recibirás ≈ </span>
              <span className="text-[#00e676] font-bold">{preview.tokens} {token.ticker}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-white/40 mb-1">Cantidad de tokens</label>
            <div className="relative">
              <input
                type="number"
                step="1000"
                min="1"
                value={tokInput}
                onChange={e => setTokInput(e.target.value)}
                placeholder="0"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-red-500/50"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/30">{token.ticker}</span>
            </div>
          </div>
          {preview?.bnb && (
            <div className="p-2.5 bg-red-500/5 border border-red-500/20 rounded-lg text-xs text-center">
              <span className="text-white/40">Recibirás ≈ </span>
              <span className="text-red-400 font-bold">{preview.bnb} BNB</span>
            </div>
          )}
        </div>
      )}

      {txMsg && (
        <div className="mt-3 p-2.5 bg-[#00e5ff08] border border-[#00e5ff20] rounded-lg text-xs text-[#00e5ff] text-center">{txMsg}</div>
      )}
      {err && (
        <div className="mt-3 p-2.5 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400">{err}</div>
      )}

      <button
        onClick={() => { void handleTrade(); }}
        disabled={loading}
        className={`w-full mt-4 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50 ${
          side === "buy"
            ? "bg-[#00e676] hover:bg-[#00e676]/90 text-black"
            : "bg-red-500 hover:bg-red-500/90 text-white"
        }`}
      >
        {loading ? "Procesando..." : side === "buy" ? `▲ COMPRAR ${token.ticker}` : `▼ VENDER ${token.ticker}`}
      </button>

      <div className="mt-2 text-center text-[10px] text-white/20">
        Fee: 1% · Red: BSC Mainnet · Slippage incluido
      </div>
    </div>
  );
}

// ── PriceChart ────────────────────────────────────────────────────────────────
function PriceChart({ points, ticker }: { points: ChartPoint[]; ticker: string }) {
  if (points.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center h-36 text-white/20 text-sm gap-2">
        <span className="text-3xl">📈</span>
        <span>Sin trades aún — el gráfico se activa con el primer trade</span>
      </div>
    );
  }

  const W = 600; const H = 140; const PAD = { t: 12, r: 8, b: 28, l: 52 };
  const cW = W - PAD.l - PAD.r;
  const cH = H - PAD.t - PAD.b;

  const prices = points.map(p => Number(p.price));
  const minP   = Math.min(...prices);
  const maxP   = Math.max(...prices);
  const rangeP = maxP - minP || 1;

  const times  = points.map(p => new Date(p.created_at).getTime());
  const minT   = Math.min(...times);
  const maxT   = Math.max(...times);
  const rangeT = maxT - minT || 1;

  const toX = (i: number) => PAD.l + ((times[i] - minT) / rangeT) * cW;
  const toY = (p: number) => PAD.t + cH - ((p - minP) / rangeP) * cH;

  const linePts  = points.map((p, i) => `${toX(i)},${toY(Number(p.price))}`).join(" ");
  const areaPath = `M${PAD.l},${PAD.t + cH} ` +
    points.map((p, i) => `L${toX(i)},${toY(Number(p.price))}`).join(" ") +
    ` L${toX(points.length - 1)},${PAD.t + cH} Z`;

  const lastPrice  = prices[prices.length - 1];
  const firstPrice = prices[0];
  const isUp       = lastPrice >= firstPrice;
  const pctChange  = ((lastPrice - firstPrice) / (firstPrice || 1)) * 100;
  const lineColor  = isUp ? "#00e676" : "#f44336";

  const yTicks = [minP, minP + rangeP * 0.5, maxP];
  const fmtPrice = (v: number) => v < 0.0001 ? v.toExponential(2) : v.toFixed(6);

  const fmtTime = (s: string) => {
    const d = new Date(s);
    return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
  };
  const xTicks = [0, Math.floor(points.length / 2), points.length - 1].filter(i => i < points.length);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-2">
        <span className="text-xs text-white/40">Precio ${ticker}</span>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-white/70">{fmtPrice(lastPrice)} BNB</span>
          <span className={`text-xs font-bold ${isUp ? "text-[#00e676]" : "text-red-400"}`}>
            {isUp ? "▲" : "▼"} {Math.abs(pctChange).toFixed(1)}%
          </span>
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="160" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={lineColor} stopOpacity="0.3" />
            <stop offset="100%" stopColor={lineColor} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {/* Grid lines */}
        {yTicks.map((v, i) => (
          <g key={i}>
            <line x1={PAD.l} y1={toY(v)} x2={W - PAD.r} y2={toY(v)} stroke="#ffffff08" strokeWidth="1" />
            <text x={PAD.l - 4} y={toY(v) + 4} textAnchor="end" fill="#ffffff40" fontSize="9">{fmtPrice(v)}</text>
          </g>
        ))}
        {/* X axis labels */}
        {xTicks.map(i => (
          <text key={i} x={toX(i)} y={H - 4} textAnchor="middle" fill="#ffffff30" fontSize="9">{fmtTime(points[i].created_at)}</text>
        ))}
        {/* Area fill */}
        <path d={areaPath} fill="url(#chartFill)" />
        {/* Price line */}
        <polyline points={linePts} fill="none" stroke={lineColor} strokeWidth="1.5" strokeLinejoin="round" />
        {/* Last point dot */}
        <circle cx={toX(points.length - 1)} cy={toY(lastPrice)} r="3" fill={lineColor} />
      </svg>
    </div>
  );
}

// ── KingOfHill ────────────────────────────────────────────────────────────────
function KingOfHill({ tokens, onSelect }: { tokens: PsyToken[]; onSelect: (t: PsyToken) => void }) {
  if (tokens.length === 0) return null;

  const crowns = ["👑", "🥈", "🥉"];
  const colors = [
    { border: "border-[#ffd700]/30", bg: "bg-[#ffd70008]", label: "text-[#ffd700]" },
    { border: "border-[#c0c0c0]/20", bg: "bg-[#c0c0c008]", label: "text-[#c0c0c0]" },
    { border: "border-[#cd7f32]/20", bg: "bg-[#cd7f3208]", label: "text-[#cd7f32]" },
  ];

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base">🔥</span>
        <span className="text-sm font-bold text-white/70 uppercase tracking-wider">King of the Hill</span>
        <span className="text-xs text-white/30">· tokens con más volumen ahora</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {tokens.map((token, i) => {
          const c   = colors[i] ?? colors[2];
          const pct = Math.min(100, (token.market_cap / GRADUATION_THRESHOLD) * 100);
          return (
            <button
              key={token.id}
              onClick={() => onSelect(token)}
              className={`${c.bg} border ${c.border} rounded-xl p-4 text-left hover:brightness-125 transition-all`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{crowns[i]}</span>
                <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs font-bold text-[#00e5ff] overflow-hidden shrink-0">
                  {token.image_url ? <img src={token.image_url} alt="" className="w-full h-full object-cover rounded-full" /> : token.ticker.slice(0, 2)}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-white text-sm truncate">{token.token_name}</div>
                  <div className="text-[10px] text-[#00e5ff]/60 font-mono">${token.ticker}</div>
                </div>
                {token.mode === "verified"
                  ? <span className="ml-auto text-[9px] bg-[#00e67615] border border-[#00e67633] text-[#00e676] px-1.5 py-0.5 rounded shrink-0">✅</span>
                  : <span className="ml-auto text-[9px] bg-[#ff6d0015] border border-[#ff6d0033] text-[#ff9800] px-1.5 py-0.5 rounded shrink-0">⚡</span>
                }
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px] mb-2">
                <div>
                  <div className="text-white/30">Market Cap</div>
                  <div className="font-bold text-white/80">{fmtUSD(token.market_cap)}</div>
                </div>
                <div>
                  <div className="text-white/30">Vol 24h</div>
                  <div className={`font-bold ${c.label}`}>{fmtUSD(token.volume_24h)}</div>
                </div>
              </div>
              <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: "linear-gradient(90deg,#00e5ff,#7c4dff)" }} />
              </div>
              <div className="text-[9px] text-white/25 mt-1 text-right">{pct.toFixed(1)}% hacia graduación</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── CreateModal ───────────────────────────────────────────────────────────────
function CreateModal({
  onClose,
  onCreated,
  wallet,
}: {
  onClose: () => void;
  onCreated: () => void;
  wallet: ReturnType<typeof useWallet>;
}) {
  const [mode, setMode] = useState<"verified" | "anon">("verified");
  const [form, setForm] = useState({
    token_name: "", ticker: "", description: "", image_url: "",
    company_name: "", company_website: "", company_twitter: "",
  });
  const [loading, setLoading] = useState(false);
  const [step, setStep]       = useState("");
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState(false);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!wallet.account || !wallet.signer) {
      setError("Conectá tu wallet primero");
      return;
    }
    setError(""); setLoading(true);

    const tname = form.token_name.trim();
    const tk    = form.ticker.trim().toUpperCase();
    const desc  = form.description.trim();

    if (!tname || tname.length < 3 || tname.length > 20) { setError("Nombre: 3–20 caracteres"); setLoading(false); return; }
    if (!tk || !/^[A-Z]{2,5}$/.test(tk)) { setError("Ticker: 2–5 letras mayúsculas"); setLoading(false); return; }
    if (!desc || desc.length < (mode === "verified" ? 100 : 50)) { setError(`Descripción mínima: ${mode === "verified" ? 100 : 50} caracteres`); setLoading(false); return; }
    if (mode === "verified") {
      if (!form.company_name.trim()) { setError("Nombre empresa requerido"); setLoading(false); return; }
      if (!/^https?:\/\/.+\..+/.test(form.company_website.trim())) { setError("Website válido requerido"); setLoading(false); return; }
      if (!form.company_twitter.trim()) { setError("Twitter/X requerido"); setLoading(false); return; }
    }

    try {
      setStep("Esperando confirmación en MetaMask...");
      const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, wallet.signer);
      const tx      = await factory.createToken(tname, tk, wallet.account, mode === "verified", { value: CREATION_FEE });

      setStep("Transacción enviada — esperando confirmación en BSC...");
      const receipt = await tx.wait() as ethers.TransactionReceipt;

      let tokenAddr  = "";
      let curveAddr  = "";
      const iface    = new ethers.Interface(FACTORY_ABI);
      for (const log of receipt.logs) {
        try {
          const parsed = iface.parseLog(log);
          if (parsed && parsed.name === "TokenCreated") {
            tokenAddr = parsed.args[1] as string;
            curveAddr = parsed.args[2] as string;
            break;
          }
        } catch { /* skip */ }
      }

      setStep("Token desplegado — guardando en la plataforma...");
      await fetch("/api/psy-launch/tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          token_name:      tname,
          ticker:          tk,
          description:     desc,
          image_url:       form.image_url || null,
          company_name:    form.company_name || null,
          company_website: form.company_website || null,
          company_twitter: form.company_twitter || null,
          creator_wallet:  wallet.account,
          contract_address: tokenAddr || null,
          curve_address:   curveAddr || null,
          tx_hash:         receipt.hash,
        }),
      });

      setSuccess(true);
      setTimeout(() => { onCreated(); onClose(); }, 2500);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error";
      setError(msg.includes("user rejected") ? "Transacción cancelada" : msg.slice(0, 150));
    }
    setStep(""); setLoading(false);
  };

  const inputCls  = "w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#00e5ff]/50";
  const labelCls  = "block text-xs text-white/50 mb-1 uppercase tracking-wider";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-[#080d14] border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-lg font-bold text-white">🚀 LANZAR TOKEN</h2>
            <p className="text-xs text-white/40 mt-0.5">Fee: 0.01 BNB · 1% por trade → tu wallet · BSC Mainnet</p>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white text-xl">✕</button>
        </div>

        <div className="p-6 space-y-5">
          {/* Wallet check */}
          {!wallet.account && (
            <div className="p-3 bg-[#7c4dff10] border border-[#7c4dff30] rounded-xl flex items-center justify-between">
              <span className="text-sm text-white/60">Wallet no conectada</span>
              <button
                onClick={() => { void wallet.connect(); }}
                disabled={wallet.connecting}
                className="px-4 py-1.5 rounded-lg font-bold text-xs text-white"
                style={{ background: "linear-gradient(90deg,#7c4dff,#00e5ff)" }}
              >
                {wallet.connecting ? "Conectando..." : "Conectar MetaMask"}
              </button>
            </div>
          )}

          {wallet.account && (
            <div className="p-2 bg-[#00e67608] border border-[#00e67620] rounded-lg text-xs text-center text-[#00e676]">
              ✅ {shortWallet(wallet.account)} conectado · BSC Mainnet
            </div>
          )}

          {/* Mode toggle */}
          <div>
            <p className={labelCls}>Modo de lanzamiento</p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setMode("verified")} className={`p-3 rounded-xl border text-left transition-all ${mode === "verified" ? "border-[#00e676] bg-[#00e67608]" : "border-white/10 bg-white/3"}`}>
                <div className="text-sm font-bold text-white mb-0.5">✅ VERIFICADO</div>
                <div className="text-[11px] text-white/40">Datos empresa + LP lock 1 año · Máx 5% creador</div>
              </button>
              <button onClick={() => setMode("anon")} className={`p-3 rounded-xl border text-left transition-all ${mode === "anon" ? "border-[#ff9800] bg-[#ff980008]" : "border-white/10 bg-white/3"}`}>
                <div className="text-sm font-bold text-white mb-0.5">⚡ ANÓNIMO</div>
                <div className="text-[11px] text-white/40">Sin datos empresa · LP burn permanente · Máx 15%</div>
              </button>
            </div>
          </div>

          {/* Verified fields */}
          {mode === "verified" && (
            <div className="space-y-3 p-4 bg-[#00e67605] border border-[#00e67620] rounded-xl">
              <p className="text-xs font-bold text-[#00e676] uppercase tracking-wider">Datos de empresa (obligatorios)</p>
              <div>
                <label className={labelCls}>Nombre legal de la empresa *</label>
                <input className={inputCls} placeholder="Ej: PSY Technologies SAS" value={form.company_name} onChange={e => set("company_name", e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Website oficial * (debe tener https://)</label>
                <input className={inputCls} placeholder="https://tuempresa.com" value={form.company_website} onChange={e => set("company_website", e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Twitter / X *</label>
                <input className={inputCls} placeholder="@empresa" value={form.company_twitter} onChange={e => set("company_twitter", e.target.value)} />
              </div>
            </div>
          )}

          {/* Token fields */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-white/50 uppercase tracking-wider">Datos del token</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Nombre del token * (3–20 chars)</label>
                <input className={inputCls} placeholder="PsyCoin" maxLength={20} value={form.token_name} onChange={e => set("token_name", e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Ticker * (2–5 letras)</label>
                <input className={inputCls} placeholder="PSY" maxLength={5} value={form.ticker} onChange={e => set("ticker", e.target.value.toUpperCase().replace(/[^A-Z]/g, ""))} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Descripción * (mín {mode === "verified" ? 100 : 50} chars · actual: {form.description.length})</label>
              <textarea className={`${inputCls} resize-none`} rows={4} placeholder="Describí el proyecto y propósito del token..." value={form.description} onChange={e => set("description", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>URL de imagen o logo</label>
              <input className={inputCls} placeholder="https://..." value={form.image_url} onChange={e => set("image_url", e.target.value)} />
            </div>
          </div>

          {/* Conditions box */}
          <div className={`p-3 rounded-xl border text-xs space-y-1 ${mode === "verified" ? "border-[#00e67620] bg-[#00e67605]" : "border-[#ff980020] bg-[#ff980005]"}`}>
            {mode === "verified" ? (
              <>
                <div className="text-[#00e676] font-bold">✅ Condiciones VERIFICADO</div>
                <div className="text-white/50">· LP lockeado 1 año post-graduación (anti-rug)</div>
                <div className="text-white/50">· Creador recibe máx 5% del supply</div>
                <div className="text-white/50">· Graduación automática en $30k market cap → PancakeSwap</div>
              </>
            ) : (
              <>
                <div className="text-[#ff9800] font-bold">⚡ Condiciones ANÓNIMO</div>
                <div className="text-white/50">· LP burned permanentemente post-graduación</div>
                <div className="text-white/50">· Creador puede tener hasta 15% del supply</div>
                <div className="text-white/50">· Graduación automática en $30k market cap → PancakeSwap</div>
              </>
            )}
          </div>

          {step && (
            <div className="p-3 bg-[#00e5ff08] border border-[#00e5ff20] rounded-lg text-xs text-[#00e5ff] text-center">{step}</div>
          )}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">{error}</div>
          )}

          {success ? (
            <div className="p-4 bg-[#00e67610] border border-[#00e67640] rounded-xl text-center">
              <div className="text-2xl mb-1">🚀</div>
              <div className="text-[#00e676] font-bold">¡Token desplegado en BSC Mainnet!</div>
              <div className="text-xs text-white/40 mt-1">El contrato está vivo en la blockchain</div>
            </div>
          ) : (
            <button
              onClick={() => { void handleSubmit(); }}
              disabled={loading || !wallet.account}
              className="w-full py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50"
              style={{ background: mode === "verified" ? "linear-gradient(90deg,#00e676,#00bcd4)" : "linear-gradient(90deg,#ff9800,#ff6d00)", color: "#000" }}
            >
              {loading ? "Deployando en BSC..." : `LANZAR TOKEN EN BSC (0.01 BNB)`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── TokenDetail ───────────────────────────────────────────────────────────────
function TokenDetail({
  token, holders, trades, chartPoints, loading, tab, onTabChange, onBack, wallet, onTradeSuccess,
}: {
  token: PsyToken; holders: Holder[]; trades: Trade[]; chartPoints: ChartPoint[];
  loading: boolean; tab: "chart" | "holders" | "trades";
  onTabChange: (t: "chart" | "holders" | "trades") => void;
  onBack: () => void;
  wallet: ReturnType<typeof useWallet>;
  onTradeSuccess: () => void;
}) {
  const pct    = bondingPct(token);
  const isGrad = token.status === "graduated";

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <button onClick={onBack} className="flex items-center gap-2 text-white/40 hover:text-white text-sm mb-5 transition-colors">
        ← Volver a PSY LAUNCH
      </button>

      {/* Token header */}
      <div className="bg-white/3 border border-white/8 rounded-2xl p-5 mb-5">
        <div className="flex flex-col md:flex-row gap-5">
          <div className="flex items-start gap-4 flex-1">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#00e5ff22] to-[#7c4dff22] border border-white/10 flex items-center justify-center text-2xl font-bold text-[#00e5ff] shrink-0 overflow-hidden">
              {token.image_url ? <img src={token.image_url} alt="" className="w-full h-full object-cover" /> : token.ticker.slice(0, 2)}
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-xl font-bold text-white">{token.token_name}</h1>
                <span className="text-sm text-[#00e5ff]/70 font-mono">${token.ticker}</span>
                {token.mode === "verified"
                  ? <span className="text-xs bg-[#00e67615] border border-[#00e67633] text-[#00e676] px-2 py-0.5 rounded">✅ VERIFICADO</span>
                  : <span className="text-xs bg-[#ff6d0015] border border-[#ff6d0033] text-[#ff9800] px-2 py-0.5 rounded">⚡ ANÓNIMO</span>
                }
                {isGrad && <span className="text-xs bg-[#ffd70015] border border-[#ffd70033] text-[#ffd700] px-2 py-0.5 rounded">🎓 GRADUADO</span>}
              </div>
              <p className="text-sm text-white/50 mb-3">{token.description}</p>
              <div className="flex flex-wrap gap-3 text-xs">
                {token.company_name && <span className="text-white/40">🏢 {token.company_name}</span>}
                {token.company_website && (
                  <a href={token.company_website} target="_blank" rel="noreferrer" className="text-[#00e5ff]/60 hover:text-[#00e5ff]">🌐 Web</a>
                )}
                {token.company_twitter && (
                  <a href={token.company_twitter.startsWith("http") ? token.company_twitter : `https://twitter.com/${token.company_twitter.replace("@", "")}`} target="_blank" rel="noreferrer" className="text-[#1da1f2]/60 hover:text-[#1da1f2]">𝕏 Twitter</a>
                )}
                {token.contract_address && (
                  <a href={`https://bscscan.com/token/${token.contract_address}`} target="_blank" rel="noreferrer" className="text-white/30 font-mono hover:text-white/60">
                    {shortWallet(token.contract_address)} ↗
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 md:w-56">
            {[
              { label: "Market Cap",    value: fmtUSD(token.market_cap),                                              color: "#fff" },
              { label: "Volumen 24h",   value: fmtUSD(token.volume_24h),                                              color: "#00e5ff" },
              { label: "Holders",       value: token.holders_count.toString(),                                        color: "#7c4dff" },
              { label: "BNB Recaudado", value: `${parseFloat(String(token.bnb_raised)).toFixed(3)} BNB`,              color: "#ffd700" },
            ].map(s => (
              <div key={s.label} className="bg-white/3 border border-white/8 rounded-lg p-2.5">
                <div className="text-[10px] text-white/30 uppercase tracking-wider mb-0.5">{s.label}</div>
                <div className="text-sm font-bold" style={{ color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>

        {!isGrad && (
          <div className="mt-5">
            <div className="flex justify-between text-xs text-white/40 mb-2">
              <span>Bonding Curve hacia PancakeSwap</span>
              <span className="font-bold text-white/70">{pct.toFixed(1)}% de ${(GRADUATION_THRESHOLD / 1000).toFixed(0)}k</span>
            </div>
            <BondingCurveSVG pct={pct} />
            <div className="flex justify-between text-[10px] text-white/30 mt-1">
              <span>$0</span>
              <span className="text-[#00e5ff]/60">Al llegar a ${(GRADUATION_THRESHOLD / 1000).toFixed(0)}k → liquidez automática a PancakeSwap 🥞</span>
              <span>${(GRADUATION_THRESHOLD / 1000).toFixed(0)}k</span>
            </div>
          </div>
        )}

        {isGrad && token.pancakeswap_url && (
          <div className="mt-4 p-3 bg-[#ffd70008] border border-[#ffd70030] rounded-xl flex items-center justify-between">
            <div>
              <div className="text-[#ffd700] font-bold text-sm">🎓 Token graduado · Liquidez en PancakeSwap</div>
              <div className="text-xs text-white/40">Graduado el {token.graduated_at ? fmtDate(token.graduated_at) : "—"}</div>
            </div>
            <a href={token.pancakeswap_url} target="_blank" rel="noreferrer" className="px-4 py-2 rounded-lg text-xs font-bold text-black" style={{ background: "#ffd700" }}>
              Ver en PancakeSwap →
            </a>
          </div>
        )}
      </div>

      {/* Trading panel + Wallet */}
      {!isGrad && (
        <div className="mb-5">
          {wallet.account ? (
            <TradingPanel token={token} wallet={wallet} onTradeSuccess={onTradeSuccess} />
          ) : (
            <div className="bg-[#7c4dff08] border border-[#7c4dff25] rounded-xl p-4 flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-white">💳 Conectar Wallet para operar</div>
                <div className="text-xs text-white/40 mt-0.5">MetaMask · BSC Mainnet · Compra y venta en tiempo real</div>
              </div>
              <button
                onClick={() => { void wallet.connect(); }}
                disabled={wallet.connecting}
                className="px-4 py-2 rounded-lg font-bold text-xs text-white transition-all"
                style={{ background: "linear-gradient(90deg,#7c4dff,#00e5ff)" }}
              >
                {wallet.connecting ? "Conectando..." : "Conectar MetaMask"}
              </button>
            </div>
          )}
          {wallet.error && <div className="mt-2 text-xs text-red-400 text-center">{wallet.error}</div>}
        </div>
      )}

      {/* Tabs: Holders / Trades */}
      <div className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden">
        <div className="flex border-b border-white/8">
          {(["chart", "trades", "holders"] as const).map(t => (
            <button
              key={t}
              onClick={() => onTabChange(t)}
              className={`px-6 py-3 text-sm font-bold transition-colors ${tab === t ? "text-[#00e5ff] border-b-2 border-[#00e5ff] bg-[#00e5ff08]" : "text-white/40 hover:text-white/70"}`}
            >
              {t === "chart" ? "📈 Gráfico" : t === "trades" ? "📋 Trades" : "👥 Holders"}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-12 text-center text-white/30 text-sm">Cargando...</div>
        ) : tab === "chart" ? (
          <div className="p-4">
            <PriceChart points={chartPoints} ticker={token.ticker} />
          </div>
        ) : tab === "trades" ? (
          trades.length === 0 ? (
            <div className="py-12 text-center text-white/30 text-sm">Sin trades aún — sé el primero en comprar</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-white/30 text-xs uppercase tracking-wider">
                    <th className="py-2 px-4 text-left">Tipo</th>
                    <th className="py-2 px-4 text-left">Wallet</th>
                    <th className="py-2 px-4 text-right">Tokens</th>
                    <th className="py-2 px-4 text-right">BNB</th>
                    <th className="py-2 px-4 text-right">Precio</th>
                    <th className="py-2 px-4 text-right">Fee</th>
                    <th className="py-2 px-4 text-right">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {trades.map(tr => (
                    <tr key={tr.id} className="border-b border-white/5 hover:bg-white/3">
                      <td className="py-2 px-4">
                        <span className={`text-xs font-bold ${tr.type === "buy" ? "text-[#00e676]" : "text-red-400"}`}>
                          {tr.type === "buy" ? "▲ COMPRA" : "▼ VENTA"}
                        </span>
                      </td>
                      <td className="py-2 px-4 font-mono text-xs text-white/50">{shortWallet(tr.wallet)}</td>
                      <td className="py-2 px-4 text-right font-mono text-xs">{Number(tr.amount_tokens).toLocaleString()}</td>
                      <td className="py-2 px-4 text-right font-mono text-xs">{parseFloat(String(tr.amount_bnb)).toFixed(4)}</td>
                      <td className="py-2 px-4 text-right font-mono text-xs text-white/60">{parseFloat(String(tr.price)).toExponential(3)}</td>
                      <td className="py-2 px-4 text-right font-mono text-xs text-white/30">{parseFloat(String(tr.fee_bnb)).toFixed(5)}</td>
                      <td className="py-2 px-4 text-right text-xs text-white/30">{fmtDate(tr.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          holders.length === 0 ? (
            <div className="py-12 text-center text-white/30 text-sm">Sin holders aún</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-white/30 text-xs uppercase tracking-wider">
                    <th className="py-2 px-4 text-left">#</th>
                    <th className="py-2 px-4 text-left">Wallet</th>
                    <th className="py-2 px-4 text-right">Balance</th>
                    <th className="py-2 px-4 text-right">% Supply</th>
                    <th className="py-2 px-4 text-right">Avg Entry</th>
                    <th className="py-2 px-4 text-right">PnL</th>
                    <th className="py-2 px-4 text-right">PnL %</th>
                  </tr>
                </thead>
                <tbody>
                  {holders.map(h => {
                    const pnlNum    = parseFloat(h.pnl);
                    const pnlPctNum = parseFloat(h.pnl_pct);
                    return (
                      <tr key={h.wallet} className="border-b border-white/5 hover:bg-white/3">
                        <td className="py-2 px-4 text-white/30 text-xs">{h.rank}</td>
                        <td className="py-2 px-4 font-mono text-xs text-white/70">{shortWallet(h.wallet)}</td>
                        <td className="py-2 px-4 text-right font-mono text-xs">{Number(h.balance).toLocaleString()}</td>
                        <td className="py-2 px-4 text-right text-xs text-[#00e5ff]">{h.pct_supply}%</td>
                        <td className="py-2 px-4 text-right font-mono text-xs text-white/50">{parseFloat(h.avg_entry).toExponential(3)}</td>
                        <td className={`py-2 px-4 text-right font-mono text-xs font-bold ${pnlNum >= 0 ? "text-[#00e676]" : "text-red-400"}`}>
                          {pnlNum >= 0 ? "+" : ""}{parseFloat(h.pnl).toFixed(4)} BNB
                        </td>
                        <td className={`py-2 px-4 text-right text-xs font-bold ${pnlPctNum >= 0 ? "text-[#00e676]" : "text-red-400"}`}>
                          {pnlPctNum >= 0 ? "+" : ""}{h.pnl_pct}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function PsyLaunch() {
  const wallet = useWallet();

  const [view, setView]                   = useState<"list" | "detail">("list");
  const [selectedToken, setSelectedToken] = useState<PsyToken | null>(null);
  const [tokens, setTokens]               = useState<PsyToken[]>([]);
  const [trending, setTrending]           = useState<PsyToken[]>([]);
  const [loading, setLoading]             = useState(true);
  const [filter, setFilter]               = useState<"all" | "active" | "graduated">("all");
  const [showCreate, setShowCreate]       = useState(false);
  const [detailTab, setDetailTab]         = useState<"chart" | "trades" | "holders">("chart");
  const [holders, setHolders]             = useState<Holder[]>([]);
  const [trades, setTrades]               = useState<Trade[]>([]);
  const [chartPoints, setChartPoints]     = useState<ChartPoint[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchTokens = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const q    = filter !== "all" ? `?status=${filter}` : "";
      const [rTokens, rTrending] = await Promise.all([
        fetch(`/api/psy-launch/tokens${q}`),
        fetch("/api/psy-launch/trending"),
      ]);
      const dTokens   = await rTokens.json()   as { items: PsyToken[] };
      const dTrending = await rTrending.json() as { items: PsyToken[] };
      setTokens(dTokens.items ?? []);
      setTrending(dTrending.items ?? []);
    } catch {}
    if (!silent) setLoading(false);
  }, [filter]);

  useEffect(() => { void fetchTokens(); }, [fetchTokens]);

  /* Auto-refresh list every 15s */
  useEffect(() => {
    const id = setInterval(() => { void fetchTokens(true); }, 15_000);
    return () => clearInterval(id);
  }, [fetchTokens]);

  const fetchDetailData = useCallback(async (token: PsyToken) => {
    try {
      const [hRes, tRes, cRes] = await Promise.all([
        fetch(`/api/psy-launch/tokens/${token.id}/holders`),
        fetch(`/api/psy-launch/tokens/${token.id}/trades`),
        fetch(`/api/psy-launch/tokens/${token.id}/chart`),
      ]);
      const hData = await hRes.json() as { items: Holder[] };
      const tData = await tRes.json() as { items: Trade[] };
      const cData = await cRes.json() as { points: ChartPoint[] };
      setHolders(hData.items ?? []);
      setTrades(tData.items ?? []);
      setChartPoints(cData.points ?? []);
    } catch {}
  }, []);

  const openToken = async (token: PsyToken) => {
    setSelectedToken(token);
    setView("detail");
    setDetailTab("chart");
    setDetailLoading(true);
    await fetchDetailData(token);
    setDetailLoading(false);
  };

  /* Auto-refresh detail every 10s */
  useEffect(() => {
    if (view !== "detail" || !selectedToken) return;
    const id = setInterval(() => { void fetchDetailData(selectedToken); }, 10_000);
    return () => clearInterval(id);
  }, [view, selectedToken, fetchDetailData]);

  const handleTradeSuccess = () => {
    void fetchTokens(true);
    if (selectedToken) void fetchDetailData(selectedToken);
  };

  const totalMcap = tokens.reduce((a, t) => a + t.market_cap, 0);
  const totalVol  = tokens.reduce((a, t) => a + t.volume_24h, 0);
  const graduated = tokens.filter(t => t.status === "graduated").length;

  const filtered = tokens.filter(t => {
    if (filter === "active")    return t.status === "active";
    if (filter === "graduated") return t.status === "graduated";
    return true;
  });

  return (
    <div className="min-h-screen bg-[#020408] text-white font-rajdhani">
      <SiteNav />

      {view === "detail" && selectedToken ? (
        <TokenDetail
          token={selectedToken}
          holders={holders}
          trades={trades}
          chartPoints={chartPoints}
          loading={detailLoading}
          tab={detailTab}
          onTabChange={setDetailTab}
          onBack={() => { setView("list"); setSelectedToken(null); }}
          wallet={wallet}
          onTradeSuccess={handleTradeSuccess}
        />
      ) : (
        <div className="max-w-6xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">
                🚀 PSY LAUNCH
                <span className="ml-2 text-sm font-normal text-[#ffd700]/70 border border-[#ffd700]/30 px-2 py-0.5 rounded">BSC Mainnet</span>
              </h1>
              <p className="text-sm text-white/40 mt-0.5">Lanza tu token en BSC · Bonding curve · Graduación automática a PancakeSwap</p>
            </div>
            <div className="flex items-center gap-3">
              {wallet.account ? (
                <div className="flex items-center gap-2 px-3 py-2 bg-[#00e67610] border border-[#00e67630] rounded-xl">
                  <div className="w-2 h-2 rounded-full bg-[#00e676]" />
                  <span className="text-xs text-[#00e676] font-mono">{shortWallet(wallet.account)}</span>
                </div>
              ) : (
                <button
                  onClick={() => { void wallet.connect(); }}
                  disabled={wallet.connecting}
                  className="px-4 py-2 rounded-xl font-bold text-xs text-white border border-white/20 hover:border-white/40 transition-all"
                >
                  {wallet.connecting ? "Conectando..." : "💳 Conectar Wallet"}
                </button>
              )}
              <button
                onClick={() => setShowCreate(true)}
                className="px-5 py-2.5 rounded-xl font-bold text-sm text-black transition-all hover:opacity-90 active:scale-95"
                style={{ background: "linear-gradient(90deg,#00e5ff,#7c4dff)" }}
              >
                + LANZAR TOKEN
              </button>
            </div>
          </div>

          {/* Stats bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[
              { label: "Tokens Activos",   value: tokens.filter(t => t.status === "active").length.toString(), color: "#00e5ff" },
              { label: "Graduados",        value: graduated.toString(),                                         color: "#ffd700" },
              { label: "Market Cap Total", value: fmtUSD(totalMcap),                                            color: "#7c4dff" },
              { label: "Volumen 24h",      value: fmtUSD(totalVol),                                             color: "#00e676" },
            ].map(s => (
              <div key={s.label} className="bg-white/3 border border-white/8 rounded-xl p-3">
                <div className="text-[10px] text-white/30 uppercase tracking-wider">{s.label}</div>
                <div className="text-lg font-black mt-0.5" style={{ color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* King of the Hill */}
          <KingOfHill tokens={trending} onSelect={t => { void openToken(t); }} />

          {/* Filter tabs */}
          <div className="flex gap-1 mb-4">
            {(["all", "active", "graduated"] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${filter === f ? "bg-[#00e5ff15] border border-[#00e5ff40] text-[#00e5ff]" : "text-white/40 hover:text-white/70"}`}
              >
                {f === "all" ? "Todos" : f === "active" ? "En Curva" : "Graduados"}
              </button>
            ))}
          </div>

          {/* Token table */}
          <div className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden">
            {loading ? (
              <div className="py-16 text-center text-white/30 text-sm">Cargando tokens...</div>
            ) : filtered.length === 0 ? (
              <div className="py-16 text-center">
                <div className="text-4xl mb-3">🚀</div>
                <div className="text-white/50 font-bold mb-1">Sé el primero en lanzar</div>
                <div className="text-xs text-white/30 mb-4">No hay tokens lanzados aún. El ecosistema empieza contigo.</div>
                <button onClick={() => setShowCreate(true)} className="px-6 py-2.5 rounded-xl font-bold text-sm text-black" style={{ background: "linear-gradient(90deg,#00e5ff,#7c4dff)" }}>
                  + LANZAR TOKEN
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/5 text-white/30 text-xs uppercase tracking-wider">
                      <th className="py-3 px-4 text-left">Token</th>
                      <th className="py-3 px-4 text-right">Market Cap</th>
                      <th className="py-3 px-4 text-right">Volumen 24h</th>
                      <th className="py-3 px-4 text-right">Holders</th>
                      <th className="py-3 px-4 text-left">Progreso</th>
                      <th className="py-3 px-4 text-right">Lanzado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(t => (
                      <TokenRow key={t.id} token={t} onClick={() => { void openToken(t); }} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Info footer */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { icon: "🔐", title: "Anti-Rug VERIFICADO", desc: "LP lockeado 1 año · Creador máx 5% supply · Datos empresa obligatorios" },
              { icon: "🔥", title: "Modelo ANÓNIMO",      desc: "LP burned permanente · Sin datos empresa · Máx 15% creador (como PumpFun)" },
              { icon: "🥞", title: "Graduación automática", desc: "Al llegar a $30k market cap, la liquidez va automáticamente a PancakeSwap" },
            ].map(c => (
              <div key={c.title} className="bg-white/2 border border-white/6 rounded-xl p-4">
                <div className="text-2xl mb-2">{c.icon}</div>
                <div className="text-sm font-bold text-white mb-1">{c.title}</div>
                <div className="text-xs text-white/40">{c.desc}</div>
              </div>
            ))}
          </div>

          <div className="mt-4 text-center text-xs text-white/20">
            Fee creación: 0.01 BNB · Fee trading: 1% compra + 1% venta · Supply total: 1,000,000,000 tokens · Contrato: {shortWallet(FACTORY_ADDRESS)}
          </div>
        </div>
      )}

      {showCreate && (
        <CreateModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { void fetchTokens(); }}
          wallet={wallet}
        />
      )}
    </div>
  );
}
