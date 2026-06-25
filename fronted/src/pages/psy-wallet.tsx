import React, { useState, useEffect, useCallback, useRef, Component, ReactNode } from "react";
import { Link } from "wouter";

// ─── Error Boundary ───────────────────────────────────────────────────────────
class TabErrorBoundary extends Component<{ children: ReactNode; label: string }, { hasError: boolean; msg: string }> {
  constructor(props: { children: ReactNode; label: string }) {
    super(props);
    this.state = { hasError: false, msg: "" };
  }
  static getDerivedStateFromError(err: Error) { return { hasError: true, msg: err.message }; }
  componentDidCatch() {}
  render() {
    if (this.state.hasError) {
      return (
        <div className="border border-[#ff174433] bg-[#ff17440a] p-6 text-center max-w-md mx-auto mt-8">
          <div className="text-2xl mb-2">⚠️</div>
          <div className="font-space text-[11px] text-[#ff1744] font-bold mb-1">Error en {this.props.label}</div>
          <div className="font-space text-[10px] text-[#7ab3c8]">{this.state.msg}</div>
          <button onClick={() => this.setState({ hasError: false, msg: "" })}
            className="mt-4 px-4 py-2 font-space text-[10px] border border-[#ff174444] text-[#ff1744] hover:bg-[#ff174415] transition-all">
            ↻ REINTENTAR
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── EIP-1193 provider type (multi-wallet) ────────────────────────────────────
interface EIP1193Provider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
  isMetaMask?: boolean;
  isCoinbaseWallet?: boolean;
  isBraveWallet?: boolean;
  isFrame?: boolean;
  isTrust?: boolean;
  isRabby?: boolean;
  isPhantom?: boolean;
  isRainbow?: boolean;
  isOkxWallet?: boolean;
  _isCoinbaseWallet?: boolean;
  providers?: EIP1193Provider[];
}

// Accessor tipado para window.ethereum — evita conflicto con declaraciones globales externas
const winEth = (): EIP1193Provider | undefined =>
  typeof window !== "undefined"
    ? (window as typeof window & { ethereum?: EIP1193Provider }).ethereum
    : undefined;

// ─── Wallet detector ─────────────────────────────────────────────────────────
interface WalletOption {
  id: string; name: string; icon: string;
  provider: EIP1193Provider | null;
  deepLink?: string; // for mobile / WalletConnect
  isInstalled: boolean;
}

// En Chrome móvil window.ethereum no existe — las wallets inyectan su
// provider solo dentro de su propio browser interno.
const _DAPP_PSY = encodeURIComponent("https://psychometriks.trade/psy-wallet");
const _isMobile = () =>
  typeof navigator !== "undefined" && /Android|iPhone|iPad/i.test(navigator.userAgent);

const MOBILE_WALLET_LINKS: Record<string, string> = {
  metamask: `https://metamask.app.link/dapp/psychometriks.trade/psy-wallet`,
  coinbase:  `https://go.cb-w.com/dapp?cb_url=${_DAPP_PSY}`,
  trust:     `https://link.trustwallet.com/open_url?coin_id=60&url=${_DAPP_PSY}`,
  okx:       `okx://wallet/dapp/url?dappUrl=${_DAPP_PSY}`,
  rainbow:   `https://rnbwapp.com/dapp?url=${_DAPP_PSY}`,
  phantom:   `https://phantom.app/ul/browse/${_DAPP_PSY}`,
  rabby:     `https://rabby.io/`,
  brave:     `https://brave.com/download/`,
};

function detectWallets(): WalletOption[] {
  const eth = winEth();
  const installed: EIP1193Provider[] = eth
    ? (eth.providers?.length ? eth.providers : [eth])
    : [];

  const mobile = _isMobile();
  const find = (pred: (p: EIP1193Provider) => boolean) => installed.find(pred) ?? null;
  const link = (id: string, desktopUrl: string) =>
    mobile ? (MOBILE_WALLET_LINKS[id] ?? desktopUrl) : desktopUrl;

  const metamaskP  = find(p => !!(p.isMetaMask && !p.isBraveWallet && !p.isRabby && !p.isPhantom && !p.isOkxWallet));
  const coinbaseP  = find(p => !!(p.isCoinbaseWallet || p._isCoinbaseWallet));
  const rabbyP     = find(p => !!p.isRabby);
  const braveP     = find(p => !!p.isBraveWallet);
  const trustP     = find(p => !!p.isTrust);
  const phantomP   = find(p => !!p.isPhantom);
  const rainbowP   = find(p => !!p.isRainbow);
  const okxP       = find(p => !!p.isOkxWallet);

  const opts: WalletOption[] = [
    { id: "metamask", name: "MetaMask",      icon: "🦊", provider: metamaskP, isInstalled: !!metamaskP, deepLink: metamaskP ? undefined : link("metamask", "https://metamask.io/download/") },
    { id: "coinbase", name: "Coinbase Wallet",icon: "🔵", provider: coinbaseP, isInstalled: !!coinbaseP, deepLink: coinbaseP ? undefined : link("coinbase", "https://www.coinbase.com/wallet/downloads") },
    { id: "rabby",    name: "Rabby Wallet",  icon: "🐰", provider: rabbyP,    isInstalled: !!rabbyP,    deepLink: rabbyP    ? undefined : link("rabby",   "https://rabby.io/") },
    { id: "brave",    name: "Brave Wallet",  icon: "🦁", provider: braveP,    isInstalled: !!braveP,    deepLink: braveP    ? undefined : link("brave",   "https://brave.com/wallet/") },
    { id: "trust",    name: "Trust Wallet",  icon: "🛡", provider: trustP,    isInstalled: !!trustP,    deepLink: trustP    ? undefined : link("trust",   "https://trustwallet.com/browser-extension") },
    { id: "phantom",  name: "Phantom",       icon: "👻", provider: phantomP,  isInstalled: !!phantomP,  deepLink: phantomP  ? undefined : link("phantom", "https://phantom.app/download") },
    { id: "rainbow",  name: "Rainbow",       icon: "🌈", provider: rainbowP,  isInstalled: !!rainbowP,  deepLink: rainbowP  ? undefined : link("rainbow", "https://rainbow.me/download") },
    { id: "okx",      name: "OKX Wallet",    icon: "⭕", provider: okxP,      isInstalled: !!okxP,      deepLink: okxP      ? undefined : link("okx",     "https://www.okx.com/web3") },
    { id: "walletconnect", name: "WalletConnect", icon: "🔗", provider: null, isInstalled: false, deepLink: "https://walletconnect.com/" },
  ];

  return opts;
}

// ─── Wallet picker modal ─────────────────────────────────────────────────────
function WalletPickerModal({
  opts, onPick, onClose, error,
}: {
  opts: WalletOption[];
  onPick: (opt: WalletOption) => void;
  onClose: () => void;
  error: string;
}) {
  const mobile = _isMobile();
  const walletName = (opt: WalletOption) => {
    if (opt.id === "walletconnect") return "WalletConnect";
    return mobile && !opt.isInstalled ? `Abrir en ${opt.name}` : opt.name;
  };
  const walletSub = (opt: WalletOption) => {
    if (opt.id === "walletconnect") return mobile ? "Abre tu wallet y escanea el QR" : "Mobile · Hardware · QR";
    if (opt.isInstalled) return "DETECTADA ✓";
    return mobile ? "Abre el DApp browser de esta wallet →" : "No instalada · click para instalar";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
      onClick={onClose}>
      <div className="bg-[#060a0f] border border-[#1a2535] w-full max-w-sm p-6"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="font-sharetech text-[9px] tracking-[0.3em] text-[#5a8898] mb-1">PSY WALLET</div>
            <div className="font-bebas text-2xl text-white">CONECTAR WALLET</div>
          </div>
          <button onClick={onClose} className="text-[#7ab3c8] hover:text-white font-bold text-lg">✕</button>
        </div>

        {/* Banner móvil */}
        {mobile && (
          <div className="mb-4 px-3 py-2 border border-[#ffd70033] bg-[#ffd70008] font-sharetech text-[9px] text-[#ffd700] tracking-[0.1em] leading-relaxed">
            📱 MODO MÓVIL — Tocá una wallet para abrirla en su DApp browser
          </div>
        )}

        <div className="space-y-2 mb-4">
          {opts.map(opt => (
            <button key={opt.id} onClick={() => onPick(opt)}
              className="w-full flex items-center gap-4 p-4 border transition-all text-left group"
              style={{ borderColor: opt.isInstalled ? "#1a3545" : "#1a2535", background: opt.isInstalled ? "#0a1520" : "#060a0f" }}>
              <span className="text-2xl">{opt.icon}</span>
              <div className="flex-1">
                <div className="font-space text-[12px] font-bold text-white group-hover:text-[#00e5ff] transition-colors">
                  {walletName(opt)}
                </div>
                <div className="font-sharetech text-[9px] tracking-[0.1em]"
                  style={{ color: opt.isInstalled ? "#00e676" : mobile ? "#a0b4c0" : "#4a6070" }}>
                  {walletSub(opt)}
                </div>
              </div>
              <span className="text-[#5a8898] group-hover:text-[#00e5ff] transition-colors text-sm">→</span>
            </button>
          ))}
        </div>

        {error && (
          <div className="font-space text-[11px] text-[#ff1744] border border-[#ff174422] bg-[#0d0508] p-3 mb-4">
            {error}
          </div>
        )}

        <div className="font-space text-[10px] text-[#5a8898] leading-relaxed">
          Al conectar aceptás que esta app lee tus balances on-chain. Los swaps requieren tu firma en la wallet.
          Nunca pedimos tu seed phrase ni private key.
        </div>
      </div>
    </div>
  );
}

// ─── Chain ID → network label ─────────────────────────────────────────────────
const CHAIN_NAMES: Record<string, string> = {
  "0x1":    "ETH",
  "0x38":   "BSC",
  "0xa4b1": "ARB",
  "0x89":   "POLY",
  "0xa":    "OP",
  "0x2105": "BASE",
};

function truncateAddr(addr: string) {
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface Token {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
  total_volume: number;
  circulating_supply: number;
}

interface WalletToken {
  symbol: string;
  name: string;
  balance: number;
  price: number;
  change24h: number;
  image: string;
  psyScore: number;
  liqLevel?: number;
}

interface DexToken {
  baseToken: { address: string; name: string; symbol: string };
  quoteToken: { symbol: string };
  priceUsd: string;
  volume: { h24: number };
  liquidity: { usd: number };
  fdv: number;
  pairCreatedAt: number;
  url: string;
  info?: { websites?: { url: string }[] };
}

interface SafetyResult {
  pair?: DexToken;
  score: number;
  issues: string[];
  positives: string[];
  verdict: "SEGURO" | "PRECAUCIÓN" | "PELIGROSO" | "DESCONOCIDO";
}

type WalletSection = "portfolio" | "swap" | "withdraw" | "market" | "safety" | "history";

// ─── 1inch token addresses (Ethereum mainnet) ─────────────────────────────────
const TOKEN_ADDRS: Record<string, string> = {
  // ── Nativos / Stables ───────────────────────────────────────────────────────
  ETH:    "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
  WETH:   "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  USDT:   "0xdAC17F958D2ee523a2206206994597C13D831ec7",
  USDC:   "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  DAI:    "0x6B175474E89094C44Da98b954EedeAC495271d0F",
  WBTC:   "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
  // ── Top alts ────────────────────────────────────────────────────────────────
  BNB:    "0xB8c77482e45F1F44dE1745F52C74426C631bDD52",
  MATIC:  "0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0",
  LINK:   "0x514910771AF9Ca656af840dff83E8264EcF986CA",
  UNI:    "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
  ARB:    "0xB50721BCf8d664c30412Cfbc6cf7a15145234ad1",
  // ── Memes ───────────────────────────────────────────────────────────────────
  PEPE:   "0x6982508145454Ce325dDbE47a25d4ec3d2311933",
  SHIB:   "0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE",
  FLOKI:  "0xcf0C122c6b73ff809C693DB761e7BaeBe62b6a2E",
  ELON:   "0x761D38e5ddf6ccf6Cf7c55759d5210750B5D60F3",
  // ── DeFi Blue Chips ─────────────────────────────────────────────────────────
  AAVE:   "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9",
  CRV:    "0xD533a949740bb3306d119CC777fa900bA034cd52",
  MKR:    "0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2",
  SNX:    "0xC011a73ee8576Fb46F5E1c5751cA3B9Fe0af2a6F",
  COMP:   "0xc00e94Cb662C3520282E6f5717214004A7f26888",
  YFI:    "0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e",
  SUSHI:  "0x6B3595068778DD592e39A122f4f5a5cF09C90fE2",
  BAL:    "0xba100000625a3754423978a60c9317c58a424e3D",
  "1INCH":"0x111111111117dC0aa78b770fA6A738034120C302",
  GRT:    "0xc944E90C64B2c07662A292be6244BDf05Cda44a7",
  LDO:    "0x5A98FcBEA516Cf06857215779Fd812CA3beF1B32",
  CVX:    "0x4e3FBD56CD56c3e72c1403e103b45Db9da5B9D2B",
  // ── Liquid Staking ──────────────────────────────────────────────────────────
  stETH:  "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84",
  wstETH: "0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0",
  rETH:   "0xae78736Cd615f374D3085123A210448E74Fc6393",
  // ── Ecosystem ───────────────────────────────────────────────────────────────
  ENS:    "0xC18360217D8F7Ab5e7c516566761Ea12Ce7F9D72",
  RPL:    "0xD33526068D116cE69F19A9ee46F0bd304F21A51f",
  FXS:    "0x3432B6A60D23Ca0dFCa7761B7ab56459D9C964D0",
};

// PSY fee wallet — replace with real address before production
// Fee wallet is enforced server-side — set PSY_FEE_WALLET in /admin/apis → PSY WALLET

// ─── Demo holdings (shown when wallet is NOT connected) ────────────────────────
const MOCK_HOLDINGS: Omit<WalletToken, "price" | "change24h">[] = [
  { symbol: "BTC",  name: "Bitcoin",  balance: 0, image: "https://assets.coingecko.com/coins/images/1/small/bitcoin.png",   psyScore: 72, liqLevel: 78200 },
  { symbol: "ETH",  name: "Ethereum", balance: 0, image: "https://assets.coingecko.com/coins/images/279/small/ethereum.png", psyScore: 58, liqLevel: 2950 },
  { symbol: "SOL",  name: "Solana",   balance: 0, image: "https://assets.coingecko.com/coins/images/4128/small/solana.png",  psyScore: 81 },
  { symbol: "USDT", name: "Tether",   balance: 0, image: "https://assets.coingecko.com/coins/images/325/small/Tether.png",  psyScore: 50 },
];

// ─── ERC-20 token definitions per chain ────────────────────────────────────────
interface Erc20Def { symbol: string; name: string; address: string; decimals: number; image: string; cgId: string; }

const ERC20_BY_CHAIN: Record<string, Erc20Def[]> = {
  "0x1": [ // Ethereum mainnet
    { symbol: "USDT", name: "Tether",        address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", decimals: 6,  image: "https://assets.coingecko.com/coins/images/325/small/Tether.png",          cgId: "tether" },
    { symbol: "USDC", name: "USD Coin",      address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", decimals: 6,  image: "https://assets.coingecko.com/coins/images/6319/small/usdc.png",            cgId: "usd-coin" },
    { symbol: "WBTC", name: "Wrapped BTC",   address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599", decimals: 8,  image: "https://assets.coingecko.com/coins/images/7598/small/wrapped_bitcoin_wbtc.png", cgId: "wrapped-bitcoin" },
    { symbol: "LINK", name: "Chainlink",     address: "0x514910771AF9Ca656af840dff83E8264EcF986CA", decimals: 18, image: "https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png",  cgId: "chainlink" },
    { symbol: "UNI",  name: "Uniswap",       address: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984", decimals: 18, image: "https://assets.coingecko.com/coins/images/12504/small/uniswap-uni.png",      cgId: "uniswap" },
    { symbol: "DAI",  name: "Dai",           address: "0x6B175474E89094C44Da98b954EedeAC495271d0F", decimals: 18, image: "https://assets.coingecko.com/coins/images/9956/small/Badge_Dai.png",          cgId: "dai" },
    { symbol: "WETH", name: "Wrapped ETH",   address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", decimals: 18, image: "https://assets.coingecko.com/coins/images/2518/small/weth.png",              cgId: "weth" },
    { symbol: "MATIC",name: "Polygon",       address: "0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0", decimals: 18, image: "https://assets.coingecko.com/coins/images/4713/small/matic-token-icon.png",  cgId: "matic-network" },
    { symbol: "SHIB", name: "Shiba Inu",     address: "0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE", decimals: 18, image: "https://assets.coingecko.com/coins/images/11939/small/shiba.png",           cgId: "shiba-inu" },
    { symbol: "ARB",  name: "Arbitrum",      address: "0xB50721BCf8d664c30412Cfbc6cf7a15145234ad1", decimals: 18, image: "https://assets.coingecko.com/coins/images/16547/small/photo_2023-03-29_21.47.00.jpeg", cgId: "arbitrum" },
  ],
  "0x38": [ // BSC
    { symbol: "USDT", name: "Tether BEP20",  address: "0x55d398326f99059fF775485246999027B3197955", decimals: 18, image: "https://assets.coingecko.com/coins/images/325/small/Tether.png",   cgId: "tether" },
    { symbol: "USDC", name: "USD Coin BEP20",address: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d", decimals: 18, image: "https://assets.coingecko.com/coins/images/6319/small/usdc.png",   cgId: "usd-coin" },
    { symbol: "BUSD", name: "Binance USD",   address: "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56", decimals: 18, image: "https://assets.coingecko.com/coins/images/9576/small/BUSD.png",   cgId: "binance-usd" },
    { symbol: "WBNB", name: "Wrapped BNB",   address: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", decimals: 18, image: "https://assets.coingecko.com/coins/images/825/small/binance-coin-logo.png", cgId: "binancecoin" },
    { symbol: "LINK", name: "Chainlink BEP20",address: "0xF8A0BF9cF54Bb92F17374d9e9A321E6a111a51bD", decimals: 18, image: "https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png", cgId: "chainlink" },
  ],
  "0x89": [ // Polygon
    { symbol: "USDT", name: "Tether Polygon", address: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F", decimals: 6,  image: "https://assets.coingecko.com/coins/images/325/small/Tether.png",  cgId: "tether" },
    { symbol: "USDC", name: "USD Coin Polygon",address:"0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174", decimals: 6,  image: "https://assets.coingecko.com/coins/images/6319/small/usdc.png",  cgId: "usd-coin" },
    { symbol: "DAI",  name: "Dai Polygon",    address: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063", decimals: 18, image: "https://assets.coingecko.com/coins/images/9956/small/Badge_Dai.png", cgId: "dai" },
    { symbol: "WETH", name: "WETH Polygon",   address: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619", decimals: 18, image: "https://assets.coingecko.com/coins/images/2518/small/weth.png",   cgId: "weth" },
    { symbol: "LINK", name: "Chainlink Polygon",address:"0x53E0bca35eC356BD5ddDFebbD1Fc0fD03FaBad39", decimals: 18, image: "https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png", cgId: "chainlink" },
  ],
  "0xa4b1": [ // Arbitrum
    { symbol: "USDT", name: "Tether Arbitrum", address: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9", decimals: 6,  image: "https://assets.coingecko.com/coins/images/325/small/Tether.png",  cgId: "tether" },
    { symbol: "USDC", name: "USD Coin Arbitrum",address:"0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8", decimals: 6,  image: "https://assets.coingecko.com/coins/images/6319/small/usdc.png",  cgId: "usd-coin" },
    { symbol: "ARB",  name: "Arbitrum",        address: "0x912CE59144191C1204E64559FE8253a0e49E6548", decimals: 18, image: "https://assets.coingecko.com/coins/images/16547/small/photo_2023-03-29_21.47.00.jpeg", cgId: "arbitrum" },
    { symbol: "WETH", name: "WETH Arbitrum",   address: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1", decimals: 18, image: "https://assets.coingecko.com/coins/images/2518/small/weth.png",   cgId: "weth" },
  ],
  "0xa": [ // Optimism
    { symbol: "USDT", name: "Tether Optimism", address: "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58", decimals: 6,  image: "https://assets.coingecko.com/coins/images/325/small/Tether.png",  cgId: "tether" },
    { symbol: "USDC", name: "USD Coin Optimism",address:"0x7F5c764cBc14f9669B88837ca1490cCa17c31607", decimals: 6,  image: "https://assets.coingecko.com/coins/images/6319/small/usdc.png",  cgId: "usd-coin" },
    { symbol: "OP",   name: "Optimism",        address: "0x4200000000000000000000000000000000000042", decimals: 18, image: "https://assets.coingecko.com/coins/images/25244/small/Optimism.png",            cgId: "optimism" },
    { symbol: "WETH", name: "WETH Optimism",   address: "0x4200000000000000000000000000000000000006", decimals: 18, image: "https://assets.coingecko.com/coins/images/2518/small/weth.png",   cgId: "weth" },
  ],
  "0x2105": [ // Base
    { symbol: "USDC", name: "USDC Base",       address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", decimals: 6,  image: "https://assets.coingecko.com/coins/images/6319/small/usdc.png",  cgId: "usd-coin" },
    { symbol: "WETH", name: "WETH Base",       address: "0x4200000000000000000000000000000000000006", decimals: 18, image: "https://assets.coingecko.com/coins/images/2518/small/weth.png",   cgId: "weth" },
  ],
};

const NATIVE_BY_CHAIN: Record<string, { symbol: string; name: string; image: string; cgId: string }> = {
  "0x1":    { symbol: "ETH",  name: "Ethereum",    image: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",               cgId: "ethereum" },
  "0x38":   { symbol: "BNB",  name: "BNB",         image: "https://assets.coingecko.com/coins/images/825/small/binance-coin-logo.png",      cgId: "binancecoin" },
  "0x89":   { symbol: "MATIC",name: "Polygon",     image: "https://assets.coingecko.com/coins/images/4713/small/matic-token-icon.png",      cgId: "matic-network" },
  "0xa4b1": { symbol: "ETH",  name: "Ethereum",    image: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",               cgId: "ethereum" },
  "0xa":    { symbol: "ETH",  name: "Ethereum",    image: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",               cgId: "ethereum" },
  "0x2105": { symbol: "ETH",  name: "Ethereum",    image: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",               cgId: "ethereum" },
};

// ─── Read on-chain balances via MetaMask eth_call ─────────────────────────────
// No external API needed — uses the user's own provider (MetaMask)
const BALANCE_OF_SELECTOR = "0x70a08231";

async function fetchRealBalances(
  walletAddress: string,
  chainId: string,
  marketPrices: Token[],
): Promise<WalletToken[]> {
  if (!window.ethereum) return [];

  const tokens: WalletToken[] = [];
  const native = NATIVE_BY_CHAIN[chainId];

  // 1) Native token (ETH / BNB / MATIC)
  try {
    const hexBal = await winEth()!.request({
      method: "eth_getBalance",
      params: [walletAddress, "latest"],
    }) as string;
    const nativeBal = parseInt(hexBal, 16) / 1e18;
    if (nativeBal > 0.0001 && native) {
      const coin = marketPrices.find(t => t.id === native.cgId);
      const price = coin?.current_price ?? 0;
      const change24h = coin?.price_change_percentage_24h ?? 0;
      tokens.push({
        symbol: native.symbol, name: native.name, balance: nativeBal,
        price, change24h, image: native.image,
        psyScore: psyScoreForCoin(native.cgId, change24h),
      });
    }
  } catch { /* silent */ }

  // 2) ERC-20 tokens — eth_call balanceOf(address)
  const defs = ERC20_BY_CHAIN[chainId] ?? [];
  const paddedAddr = "000000000000000000000000" + walletAddress.slice(2).toLowerCase();

  await Promise.allSettled(defs.map(async def => {
    try {
      const result = await winEth()!.request({
        method: "eth_call",
        params: [{ to: def.address, data: BALANCE_OF_SELECTOR + paddedAddr }, "latest"],
      }) as string;
      if (!result || result === "0x" || result === "0x0") return;
      const raw = BigInt(result);
      const balance = Number(raw) / 10 ** def.decimals;
      if (balance < 0.0001) return;
      const coin = marketPrices.find(t => t.id === def.cgId);
      const price = coin?.current_price ?? 0;
      const change24h = coin?.price_change_percentage_24h ?? 0;
      if (balance * price < 0.01 && price > 0) return; // skip dust < $0.01
      tokens.push({
        symbol: def.symbol, name: def.name, balance,
        price, change24h, image: def.image,
        psyScore: psyScoreForCoin(def.cgId, change24h),
      });
    } catch { /* skip unresponsive contracts */ }
  }));

  return tokens.sort((a, b) => (b.balance * b.price) - (a.balance * a.price));
}

const COINGECKO_IDS: Record<string, string> = {
  BTC: "bitcoin", ETH: "ethereum", SOL: "solana", USDT: "tether",
  BNB: "binancecoin", AVAX: "avalanche-2", MATIC: "matic-network",
  LINK: "chainlink", ARB: "arbitrum", OP: "optimism",
};

const TOP_TOKENS = ["bitcoin","ethereum","solana","tether","binancecoin","ripple","dogecoin","cardano","avalanche-2","polkadot","chainlink","matic-network","uniswap","litecoin","arbitrum"];

function psyScoreForCoin(id: string, change: number): number {
  const base: Record<string, number> = { bitcoin: 72, ethereum: 58, solana: 81, tether: 50, binancecoin: 64, ripple: 55, dogecoin: 35, cardano: 48, "avalanche-2": 61, polkadot: 44, chainlink: 67, "matic-network": 52, uniswap: 59, litecoin: 41, arbitrum: 63 };
  const b = base[id] ?? 50;
  return Math.max(0, Math.min(100, Math.round(b + (change > 0 ? Math.min(change, 10) : Math.max(change, -10)))));
}

function scoreColor(s: number) { return s >= 70 ? "#00e676" : s >= 50 ? "#ffd700" : s >= 30 ? "#ff6d00" : "#ff1744"; }
function scoreLabel(s: number) { return s >= 70 ? "ALCISTA" : s >= 50 ? "NEUTRO" : s >= 30 ? "BAJISTA" : "EVITAR"; }

function fmt(n: number, decimals = 2) {
  if (n == null || !isFinite(n)) return "$0.00";
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(decimals)}`;
}

function fmtPrice(p: number) {
  if (p == null || !isFinite(p)) return "$0.00";
  if (p >= 1000) return `$${p.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  if (p >= 1) return `$${p.toFixed(2)}`;
  return `$${p.toFixed(4)}`;
}

// ─── Fetch helpers ────────────────────────────────────────────────────────────
async function fetchTopTokens(): Promise<Token[]> {
  const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${TOP_TOKENS.join(",")}&order=market_cap_desc&per_page=15&sparkline=false`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("CoinGecko error");
  return res.json() as Promise<Token[]>;
}

async function searchDexToken(query: string): Promise<DexToken[]> {
  const res = await fetch(`https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) return [];
  const data = await res.json() as { pairs?: DexToken[] };
  return (data.pairs ?? []).slice(0, 5);
}

function analyzeSafety(pairs: DexToken[]): SafetyResult {
  if (pairs.length === 0) return { score: 0, issues: ["Token no encontrado en DEXs"], positives: [], verdict: "DESCONOCIDO" };
  const pair = pairs[0];
  const issues: string[] = [];
  const positives: string[] = [];
  let score = 100;

  const ageDays = pair.pairCreatedAt ? (Date.now() - pair.pairCreatedAt) / 86400000 : 0;
  const liq = pair.liquidity?.usd ?? 0;
  const vol = pair.volume?.h24 ?? 0;

  if (ageDays < 7) { issues.push(`Token muy nuevo — ${Math.round(ageDays)} días de edad ⚠️`); score -= 30; }
  else if (ageDays < 30) { issues.push(`Token relativamente nuevo — ${Math.round(ageDays)} días`); score -= 10; }
  else positives.push(`Token con historial de ${Math.round(ageDays)} días`);

  if (liq < 10000) { issues.push("Liquidez extremadamente baja (<$10k) — alto riesgo de rug"); score -= 40; }
  else if (liq < 100000) { issues.push(`Liquidez baja — ${fmt(liq)}`); score -= 20; }
  else if (liq > 1000000) positives.push(`Liquidez saludable — ${fmt(liq)}`);
  else positives.push(`Liquidez moderada — ${fmt(liq)}`);

  if (vol < 1000) { issues.push("Volumen 24h muy bajo — posible token inactivo"); score -= 15; }
  else if (vol > 100000) positives.push(`Buen volumen 24h — ${fmt(vol)}`);

  const volLiqRatio = liq > 0 ? vol / liq : 0;
  if (volLiqRatio > 5) { issues.push("Ratio Vol/Liq sospechosamente alto — posible manipulación"); score -= 20; }

  if (!pair.info?.websites?.length) { issues.push("Sin sitio web verificado"); score -= 10; }
  else positives.push("Sitio web registrado en DexScreener");

  score = Math.max(0, Math.min(100, score));
  const verdict: SafetyResult["verdict"] = score >= 70 ? "SEGURO" : score >= 40 ? "PRECAUCIÓN" : score > 0 ? "PELIGROSO" : "DESCONOCIDO";
  return { pair, score, issues, positives, verdict };
}

// ─── Components ───────────────────────────────────────────────────────────────

function PsyBadge({ score }: { score: number }) {
  const color = scoreColor(score);
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 border text-[10px] font-sharetech tracking-[0.05em] shrink-0"
      style={{ borderColor: `${color}44`, background: `${color}0f`, color }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
      {score} {scoreLabel(score)}
    </div>
  );
}

function NetworkBadge({ net }: { net: string }) {
  const colors: Record<string, string> = { ETH: "#627EEA", BSC: "#F3BA2F", ARB: "#28A0F0", POLY: "#8247E5" };
  return (
    <span className="font-sharetech text-[9px] px-2 py-0.5 border tracking-[0.1em]"
      style={{ color: colors[net] ?? "#8a9ab0", borderColor: `${colors[net] ?? "#8a9ab0"}44`, background: `${colors[net] ?? "#8a9ab0"}0f` }}>
      {net}
    </span>
  );
}

// ─── 1inch Quote result type ───────────────────────────────────────────────────
interface OneInchQuote {
  dstAmount: string;
  srcToken?: { decimals: number; symbol: string };
  dstToken?: { decimals: number; symbol: string };
  gas?: number;
  protocols?: unknown[];
  estimatedAmount?: string;
}

interface OneInchSwapTx {
  tx: {
    from: string; to: string; data: string;
    value: string; gas: number; gasPrice: string;
  };
  dstAmount: string;
}

// ─── Gas data type ─────────────────────────────────────────────────────────────
interface GasData {
  baseFee?: string;
  low?: { maxFeePerGas: string };
  medium?: { maxFeePerGas: string };
  high?: { maxFeePerGas: string };
  instant?: { maxFeePerGas: string };
}

// ─── Swap Panel ───────────────────────────────────────────────────────────────
function SwapPanel({ tokens, walletAddress, chainId: walletChainId, onConnect, activeWalletId }: {
  tokens: Token[];
  walletAddress: string | null;
  chainId: string | null;
  onConnect: () => void;
  activeWalletId: string;
}) {
  const [fromToken, setFromToken] = useState("ETH");
  const [toToken,   setToToken]   = useState("USDT");
  const [fromAmt,   setFromAmt]   = useState("");
  const [slippage,  setSlippage]  = useState("0.5");
  const [showConfirm,  setShowConfirm]  = useState(false);
  const [swapStatus,   setSwapStatus]   = useState<"idle" | "quoting" | "signing" | "success" | "error">("idle");
  const [txHash,    setTxHash]    = useState("");
  const [swapError, setSwapError] = useState("");

  // Bóveda address routing
  const [bovedaAddr,     setBovedaAddr]     = useState("");
  const [showBovedaInput, setShowBovedaInput] = useState(false);
  const [bovedaInput,    setBovedaInput]    = useState("");

  // Load Bóveda address from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem("psyko_auth");
      const u = raw ? (JSON.parse(raw) as { user?: string }).user ?? "guest" : "guest";
      const slug = u.toLowerCase().replace(/[^a-z0-9_-]/g, "_");
      setBovedaAddr(localStorage.getItem(`psyw_${slug}_recv`) ?? "");
    } catch { /* silent */ }
  }, []);

  // 1inch live quote state
  const [quote,        setQuote]        = useState<OneInchQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError,   setQuoteError]   = useState("");
  const [gasData,      setGasData]      = useState<GasData | null>(null);
  const [keyMissing,   setKeyMissing]   = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chainHex = walletChainId ?? "0x1";

  // Routing: MetaMask → own address; others → Bóveda address (if set)
  const isMetaMaskConnected = activeWalletId === "metamask";
  const bovedaValid = /^0x[0-9a-fA-F]{40}$/.test(bovedaAddr);
  const swapRecipient: string | null =
    isMetaMaskConnected || !bovedaValid ? walletAddress : bovedaAddr;

  const fromData  = tokens.find(t => t.symbol.toUpperCase() === fromToken);
  const toData    = tokens.find(t => t.symbol.toUpperCase() === toToken);
  const fromPrice = fromData?.current_price ?? 0;
  const toPrice   = toData?.current_price   ?? 1;
  const fromAmtN  = parseFloat(fromAmt) || 0;
  const isConnected = !!walletAddress;

  // Derive output amount: prefer 1inch quote, fallback to CoinGecko ratio
  const toAmtRaw = quote?.dstAmount
    ? parseFloat(quote.dstAmount) / Math.pow(10, quote.dstToken?.decimals ?? 6)
    : fromAmtN * fromPrice / toPrice;
  const feeAmt = fromAmtN * fromPrice * 0.005;

  const SWAP_TOKENS = [
    // Nativos / Stables
    "ETH","WETH","USDT","USDC","DAI","WBTC",
    // Top alts
    "BNB","MATIC","LINK","UNI","ARB",
    // Memes
    "PEPE","SHIB","FLOKI","ELON",
    // DeFi Blue Chips
    "AAVE","CRV","MKR","SNX","COMP","YFI","SUSHI","BAL","1INCH","GRT","LDO","CVX",
    // Liquid Staking
    "stETH","wstETH","rETH",
    // Ecosystem
    "ENS","RPL","FXS",
  ];

  function flip() { setFromToken(toToken); setToToken(fromToken); setFromAmt(""); setQuote(null); }

  // ── Live quote fetch with debounce ─────────────────────────────────────────
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (fromAmtN <= 0 || fromToken === toToken) { setQuote(null); setQuoteError(""); return; }

    debounceRef.current = setTimeout(async () => {
      setQuoteLoading(true);
      setQuoteError("");
      try {
        const r = await fetch(
          `/api/1inch/quote?chainHex=${chainHex}&src=${fromToken}&dst=${toToken}&amount=${fromAmtN}`
        );
        const data = await r.json() as OneInchQuote & { error?: string; hint?: string };
        if (!r.ok) {
          if (r.status === 503) setKeyMissing(true);
          setQuoteError(data.error ?? "Error al cotizar");
          setQuote(null);
        } else {
          setKeyMissing(false);
          setQuote(data);
          setQuoteError("");
        }
      } catch {
        setQuoteError("Sin conexión al servidor");
      } finally {
        setQuoteLoading(false);
      }
    }, 600);
  }, [fromAmtN, fromToken, toToken, chainHex]);

  // ── Gas price fetch ────────────────────────────────────────────────────────
  useEffect(() => {
    fetch(`/api/1inch/gas?chainHex=${chainHex}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => d && setGasData(d as GasData))
      .catch(() => {});
  }, [chainHex]);

  // ── Estimate gas cost in USD ───────────────────────────────────────────────
  const gasGweiStr = gasData?.medium?.maxFeePerGas ?? gasData?.baseFee ?? null;
  const gasGwei = gasGweiStr ? parseInt(gasGweiStr) / 1e9 : null;
  const gasUnits = quote?.gas ?? 150000;
  const gasCostEth = gasGwei ? gasGwei * gasUnits * 1e-9 : null;
  const gasCostUsd = gasCostEth && fromPrice ? gasCostEth * (fromPrice > 0 ? fromPrice : 3000) : null;

  // ── Execute real swap via 1inch ────────────────────────────────────────────
  async function executeSwap() {
    if (!winEth() || !walletAddress) return;
    setSwapStatus("signing");
    setSwapError("");
    try {
      // 1) Fetch swap calldata from 1inch
      const recipient = swapRecipient ?? walletAddress;
      const receiverParam = recipient && recipient !== walletAddress ? `&receiver=${encodeURIComponent(recipient)}` : "";
      const swapUrl = `/api/1inch/swap?chainHex=${chainHex}&src=${fromToken}&dst=${toToken}&amount=${fromAmtN}&from=${walletAddress}&slippage=${slippage}${receiverParam}`;
      const swapRes = await fetch(swapUrl);
      const swapData = await swapRes.json() as OneInchSwapTx & { error?: string; detail?: unknown };

      if (!swapRes.ok) {
        // No 1inch key or API error — inform user but allow demo fallthrough
        const errMsg = typeof swapData.error === "string" ? swapData.error : "Error de 1inch API";
        setSwapError(`${errMsg} — configurá tu ONEINCH_API_KEY en el panel de Admin`);
        setSwapStatus("error");
        return;
      }

      const { tx } = swapData;

      // 2) Send the transaction via MetaMask with real 1inch calldata
      const hash = await winEth()!.request({
        method: "eth_sendTransaction",
        params: [{
          from:     tx.from,
          to:       tx.to,
          data:     tx.data,
          value:    "0x" + BigInt(tx.value).toString(16),
          gas:      "0x" + tx.gas.toString(16),
          gasPrice: "0x" + BigInt(tx.gasPrice).toString(16),
        }],
      }) as string;

      setTxHash(hash);
      setSwapStatus("success");
      setShowConfirm(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      if (msg.includes("rejected") || msg.includes("denied") || msg.includes("User denied")) {
        setSwapError("Firma rechazada por el usuario.");
      } else {
        setSwapError(msg.slice(0, 120));
      }
      setSwapStatus("error");
    }
  }

  const chainName = walletChainId ? ({ "0x1":"Ethereum","0x38":"BSC","0xa4b1":"Arbitrum","0x89":"Polygon","0xa":"Optimism","0x2105":"Base" }[walletChainId] ?? "Ethereum") : "Ethereum";

  return (
    <div className="max-w-md mx-auto">
      <div className="font-sharetech text-[9px] tracking-[0.3em] text-[#5a8898] mb-4">
        SWAP VIA 1INCH · {chainName.toUpperCase()}
      </div>

      {/* No API key banner */}
      {keyMissing && (
        <div className="border border-[#ffd70033] bg-[#ffd70008] p-3 mb-4 flex items-start gap-2">
          <span className="text-[#ffd700] shrink-0">⚠</span>
          <div>
            <div className="font-space text-[10px] text-[#ffd700] font-bold mb-0.5">1inch API key no configurada</div>
            <div className="font-space text-[9px] text-[#6a7040]">
              Configurá <code className="text-[#ffd700]">ONEINCH_API_KEY</code> en{" "}
              <a href="/admin/apis" className="underline text-[#ffd700]">Admin → APIs</a> para activar cotizaciones y swaps reales.
            </div>
          </div>
        </div>
      )}

      {/* Success banner */}
      {swapStatus === "success" && txHash && (
        <div className="border border-[#00e67633] bg-[#00e67608] p-4 mb-4">
          <div className="font-sharetech text-[9px] text-[#00e676] mb-1">✅ SWAP EJECUTADO EN BLOCKCHAIN</div>
          <div className="font-space text-[9px] text-[#7ab3c8] break-all">
            TX: <a href={`https://etherscan.io/tx/${txHash}`} target="_blank" rel="noreferrer" className="text-[#00e5ff] underline">{txHash.slice(0, 22)}...{txHash.slice(-8)}</a>
          </div>
        </div>
      )}

      {swapStatus === "error" && swapError && (
        <div className="border border-[#ff174433] bg-[#ff17440a] p-3 mb-4">
          <div className="font-space text-[10px] text-[#ff1744]">✗ {swapError}</div>
        </div>
      )}

      <div className="border border-[#1a2535] bg-[#060a0f] p-1 mb-2">
        {/* From */}
        <div className="bg-[#0a0f18] p-4">
          <div className="flex justify-between mb-2">
            <span className="font-space text-[10px] text-[#7ab3c8]">Vendés</span>
            <span className="font-space text-[10px] text-[#7ab3c8]">
              {isConnected ? truncateAddr(walletAddress!) : "—"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <input value={fromAmt} onChange={e => setFromAmt(e.target.value)} placeholder="0"
              className="flex-1 bg-transparent font-bebas text-4xl text-white focus:outline-none placeholder-[#2a3a4a] w-0 min-w-0"
              style={{ fontSize: "clamp(24px,4vw,40px)" }} />
            <select value={fromToken} onChange={e => { setFromToken(e.target.value); setQuote(null); }}
              className="bg-[#0d1520] border border-[#1a2535] text-white font-sharetech text-[11px] px-3 py-2 focus:outline-none cursor-pointer shrink-0">
              {SWAP_TOKENS.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          {fromAmtN > 0 && fromPrice > 0 && (
            <div className="font-space text-[10px] text-[#7ab3c8] mt-1">≈ {fmt(fromAmtN * fromPrice)}</div>
          )}
        </div>

        {/* Flip */}
        <div className="flex justify-center py-1">
          <button onClick={flip} className="w-8 h-8 border border-[#1a2535] bg-[#060a0f] flex items-center justify-center hover:border-[#00e5ff44] hover:text-[#00e5ff] transition-all text-[#7ab3c8]">⇅</button>
        </div>

        {/* To */}
        <div className="bg-[#0a0f18] p-4">
          <div className="flex justify-between mb-2">
            <span className="font-space text-[10px] text-[#7ab3c8]">Recibís</span>
            <span className="font-space text-[10px]">
              {quoteLoading
                ? <span className="animate-pulse text-[#00e5ff]">consultando 1inch API...</span>
                : quote
                  ? <span className="text-[#00e676]">via 1inch ✓</span>
                  : keyMissing
                    ? <span className="text-[#ff6d00]">estimado — sin API key</span>
                    : <span className="text-[#7ab3c8]">estimado</span>
              }
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 font-bebas" style={{
              fontSize: "clamp(24px,4vw,40px)",
              color: quoteLoading ? "#2a3a4a" : quote ? "white" : "#8a7060",
            }}>
              {quoteLoading
                ? <span className="animate-pulse">—</span>
                : (keyMissing && !quote)
                  ? <span>{toAmtRaw > 0 ? "~" + toAmtRaw.toFixed(toPrice > 100 ? 4 : 2) : "—"}</span>
                  : toAmtRaw > 0 ? toAmtRaw.toFixed(toPrice > 100 ? 4 : 2) : "0"
              }
            </div>
            <select value={toToken} onChange={e => { setToToken(e.target.value); setQuote(null); }}
              className="bg-[#0d1520] border border-[#1a2535] text-white font-sharetech text-[11px] px-3 py-2 focus:outline-none cursor-pointer shrink-0">
              {SWAP_TOKENS.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          {quote && !quoteError && (
            <div className="font-sharetech text-[9px] text-[#00e676] mt-1 flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-[#00e676] animate-pulse" />
              Cotización real via 1inch · rutas optimizadas
              {Array.isArray((quote as OneInchQuote).protocols) && (
                <span className="text-[#7ab3c8] ml-1">({((quote as OneInchQuote).protocols as unknown[]).length} protocolo{((quote as OneInchQuote).protocols as unknown[]).length !== 1 ? "s" : ""})</span>
              )}
            </div>
          )}
          {quoteError && !keyMissing && (
            <div className="font-space text-[9px] text-[#ff6d00] mt-1">{quoteError}</div>
          )}
          {keyMissing && fromAmtN > 0 && !quoteLoading && (
            <div className="font-space text-[9px] text-[#ff6d00] mt-1">
              ⚠ Precio indicativo (ratio CoinGecko) — no es cotización real. Activá ONEINCH_API_KEY para swaps reales.
            </div>
          )}
          {!quote && !quoteError && !keyMissing && fromAmtN > 0 && !quoteLoading && (
            <div className="font-space text-[10px] text-[#7ab3c8] mt-1">≈ {fmt(toAmtRaw * toPrice)} (estimado CoinGecko)</div>
          )}
        </div>
      </div>

      {/* Slippage */}
      <div className="flex items-center gap-2 mb-4">
        <span className="font-space text-[10px] text-[#7ab3c8]">Slippage:</span>
        {["0.1","0.5","1.0","3.0"].map(s => (
          <button key={s} onClick={() => setSlippage(s)}
            className="font-sharetech text-[10px] px-2.5 py-1 border transition-all"
            style={{ borderColor: slippage === s ? "#00e5ff" : "#1a2535", color: slippage === s ? "#00e5ff" : "#4a6070", background: slippage === s ? "#00e5ff12" : "transparent" }}>
            {s}%
          </button>
        ))}
      </div>

      {/* Fee + gas breakdown */}
      {fromAmtN > 0 && (
        <div className="border border-[#1a2535] bg-[#060a0f] p-4 mb-4 font-space text-[11px] space-y-2">
          <div className="flex justify-between text-[#7ab3c8]">
            <span>Ruta</span>
            <span className="text-[#8a9ab0]">
              {quote?.protocols ? `${(quote.protocols as unknown[]).length} ruta(s) 1inch` : "1inch Aggregator"}
            </span>
          </div>
          <div className="flex justify-between text-[#7ab3c8]">
            <span>Fee 1inch</span>
            <span>{fmt(fromAmtN * fromPrice * 0.003)}</span>
          </div>
          <div className="flex justify-between" style={{ color: "#00e5ff" }}>
            <span className="font-bold">Fee PSY <span className="text-[#7ab3c8] font-normal">(0.5%)</span></span>
            <span className="font-bold">{fmt(feeAmt)}</span>
          </div>
          {gasCostUsd !== null && (
            <div className="flex justify-between text-[#7ab3c8]">
              <span>Gas estimado</span>
              <span className="text-[#8a9ab0]">{fmt(gasCostUsd)} · {gasGwei?.toFixed(1)} Gwei</span>
            </div>
          )}
          <div className="flex justify-between text-[#7ab3c8] border-t border-[#1a2535] pt-2">
            <span>Mínimo recibido ({slippage}% slip)</span>
            <span>{(toAmtRaw * (1 - parseFloat(slippage) / 100)).toFixed(4)} {toToken}</span>
          </div>
        </div>
      )}

      {/* Gas widget */}
      {gasData && (
        <div className="border border-[#1a2535] bg-[#060a0f] p-3 mb-4 grid grid-cols-3 gap-2">
          {(["low","medium","high"] as const).map(tier => {
            const val = gasData[tier]?.maxFeePerGas;
            const gwei = val ? (parseInt(val) / 1e9).toFixed(1) : "—";
            const colors = { low: "#00e676", medium: "#ffd700", high: "#ff6d00" };
            const labels = { low: "🟢 BAJO", medium: "🟡 MEDIO", high: "🔴 ALTO" };
            return (
              <div key={tier} className="text-center">
                <div className="font-sharetech text-[8px] tracking-[0.15em]" style={{ color: colors[tier] }}>{labels[tier]}</div>
                <div className="font-bebas text-lg text-white">{gwei}</div>
                <div className="font-sharetech text-[8px] text-[#7ab3c8]">GWEI</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bóveda routing indicator — only shown when non-MetaMask wallet connected */}
      {isConnected && !isMetaMaskConnected && (
        <div className="border mb-4 p-4" style={{ borderColor: bovedaValid ? "#00e5ff33" : "#ff6d0033", background: bovedaValid ? "#00e5ff06" : "#0d080508" }}>
          <div className="font-sharetech text-[9px] tracking-[0.2em] mb-3" style={{ color: bovedaValid ? "#00e5ff" : "#ff6d00" }}>
            {bovedaValid ? "🔐 SWAP → BÓVEDA PSY" : "⚠ CONFIGURA DIRECCIÓN DE BÓVEDA"}
          </div>
          {bovedaValid ? (
            <>
              <div className="font-space text-[10px] text-[#7ab3c8] mb-1">
                El output del swap se enviará directo a tu Bóveda:
              </div>
              <div className="font-sharetech text-[11px] text-[#e0f4ff] break-all mb-2">{bovedaAddr}</div>
              <button onClick={() => { setBovedaAddr(""); setShowBovedaInput(true); }}
                className="font-space text-[9px] text-[#7ab3c8] hover:text-[#00e5ff] transition-colors">
                Cambiar dirección →
              </button>
            </>
          ) : (
            <>
              <div className="font-space text-[10px] text-[#ff6d00] mb-3">
                Con {activeWalletId || "esta wallet"}, el output irá a tu Bóveda PSY. Configurá la dirección:
              </div>
              {showBovedaInput ? (
                <div className="space-y-2">
                  <input
                    value={bovedaInput}
                    onChange={e => setBovedaInput(e.target.value)}
                    placeholder="0x... dirección de tu Bóveda"
                    className="w-full bg-[#0a0f18] border border-[#1a2535] px-3 py-2 font-sharetech text-[11px] text-white placeholder-[#2a3a4a] focus:border-[#00e5ff44] focus:outline-none"
                  />
                  <button
                    onClick={() => {
                      if (/^0x[0-9a-fA-F]{40}$/.test(bovedaInput)) {
                        try {
                          const raw = localStorage.getItem("psyko_auth");
                          const u = raw ? (JSON.parse(raw) as { user?: string }).user ?? "guest" : "guest";
                          const slug = u.toLowerCase().replace(/[^a-z0-9_-]/g, "_");
                          localStorage.setItem(`psyw_${slug}_recv`, bovedaInput);
                          setBovedaAddr(bovedaInput);
                          setShowBovedaInput(false);
                          setBovedaInput("");
                        } catch { /* silent */ }
                      }
                    }}
                    disabled={!/^0x[0-9a-fA-F]{40}$/.test(bovedaInput)}
                    className="w-full py-2 font-space text-[10px] font-bold border border-[#00e5ff44] text-[#00e5ff] hover:bg-[#00e5ff12] disabled:opacity-40 transition-all">
                    GUARDAR DIRECCIÓN BÓVEDA
                  </button>
                  <div className="font-space text-[9px] text-[#7ab3c8]">
                    Sin Bóveda configurada, el swap se enviará a tu dirección conectada.
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowBovedaInput(true)}
                  className="font-space text-[10px] text-[#00e5ff] hover:underline">
                  + Configurar dirección de Bóveda →
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* CTA */}
      {isConnected ? (
        <button
          onClick={() => fromAmtN > 0 && !quoteLoading && setShowConfirm(true)}
          disabled={fromAmtN <= 0 || quoteLoading}
          className="w-full py-5 font-space text-[13px] font-bold tracking-[0.2em] uppercase transition-all"
          style={{ background: fromAmtN > 0 && !quoteLoading ? "#00e5ff" : "#0d1520", color: fromAmtN > 0 && !quoteLoading ? "#020408" : "#2a3a4a", cursor: fromAmtN > 0 ? "pointer" : "not-allowed" }}>
          {quoteLoading ? "COTIZANDO..." : `FIRMAR SWAP · ${activeWalletId ? activeWalletId.toUpperCase() : "WALLET"} →`}
        </button>
      ) : (
        <button onClick={onConnect} className="w-full py-5 font-space text-[13px] font-bold tracking-[0.2em] uppercase" style={{ background: "#00e5ff", color: "#020408" }}>
          ⊕ CONECTAR WALLET PARA SWAPEAR →
        </button>
      )}

      <div className="font-space text-[9px] text-[#5a8898] text-center mt-2">
        Powered by 1inch Aggregator · Non-custodial · Tus fondos nunca los tocamos
        {isConnected && walletAddress && <span className="ml-2 text-[#00e676]">· {truncateAddr(walletAddress)}</span>}
      </div>

      {/* Confirm modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="border border-[#00e5ff33] bg-[#060a0f] p-6 max-w-sm w-full">
            <div className="font-sharetech text-[9px] tracking-[0.3em] text-[#5a8898] mb-4">CONFIRMACIÓN DE SWAP — 1INCH</div>
            <div className="font-bebas text-2xl text-white mb-1">{fromAmt} {fromToken} → {toAmtRaw.toFixed(4)} {toToken}</div>
            <div className="font-space text-[11px] text-[#7ab3c8] mb-1">
              Fee PSY: {fmt(feeAmt)} · Slippage: {slippage}%
              {gasCostUsd !== null && ` · Gas: ~${fmt(gasCostUsd)}`}
            </div>
            <div className="font-space text-[10px] text-[#5a8898] mb-1 break-all">Desde: {walletAddress}</div>
            <div className="font-space text-[10px] mb-3 break-all" style={{ color: swapRecipient !== walletAddress ? "#00e5ff" : "#2a4a5a" }}>
              Destino: {swapRecipient ?? walletAddress}
              {swapRecipient !== walletAddress && <span className="ml-2 text-[11px] font-bold">→ Bóveda PSY 🔐</span>}
            </div>
            <div className="border border-[#00e5ff22] bg-[#00e5ff06] p-3 mb-4">
              <div className="font-space text-[9px] text-[#00e5ff] mb-1">{activeWalletId ? `${activeWalletId.toUpperCase()} + 1INCH` : "WALLET + 1INCH"}</div>
              <div className="font-space text-[10px] text-[#7ab3c8]">
                El calldata fue generado por 1inch Aggregator. MetaMask te pedirá confirmar. Sin tu firma, no pasa nada.
              </div>
            </div>
            {swapStatus === "signing" && (
              <div className="font-space text-[10px] text-[#ffd700] mb-3 animate-pulse">⏳ Obteniendo calldata de 1inch y esperando firma...</div>
            )}
            <div className="flex gap-2">
              <button onClick={() => { setShowConfirm(false); setSwapStatus("idle"); }}
                disabled={swapStatus === "signing"}
                className="flex-1 py-3 border border-[#1a2535] font-space text-[11px] text-[#7ab3c8] hover:text-[#ff6d00] transition-colors disabled:opacity-40">
                CANCELAR
              </button>
              <button onClick={executeSwap} disabled={swapStatus === "signing"}
                className="flex-1 py-3 font-space text-[11px] font-bold bg-[#00e5ff] text-[#020408] disabled:opacity-60 transition-all">
                {swapStatus === "signing" ? "FIRMANDO..." : "🔐 FIRMAR Y EJECUTAR"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── History Panel — Blockscout (free, no API key) ────────────────────────────
const BLOCKSCOUT: Record<string, string> = {
  "0x1":    "https://eth.blockscout.com",
  "0x38":   "https://bsc.blockscout.com",
  "0xa4b1": "https://arbitrum.blockscout.com",
  "0x89":   "https://polygon.blockscout.com",
  "0xa":    "https://optimism.blockscout.com",
  "0x2105": "https://base.blockscout.com",
};

interface BlockscoutTx {
  hash: string;
  timestamp: string;
  from: { hash: string };
  to: { hash: string } | null;
  value: string;
  tx_types: string[];
  status: string;
  token_transfers?: { token: { symbol: string }; total: { value: string; decimals: string } }[];
}

interface HistoryEvent {
  type: string;
  timeMs: number;
  details?: {
    txHash?: string;
    fromToken?: { symbol: string; amount: string };
    toToken?: { symbol: string; amount: string };
  };
  id?: string;
}

function HistoryPanel({ walletAddress, chainId }: { walletAddress: string | null; chainId: string | null }) {
  const [txs,     setTxs]     = useState<BlockscoutTx[]>([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const chainHex = chainId ?? "0x1";
  const chainLabel = { "0x1":"ETH","0x38":"BSC","0xa4b1":"ARB","0x89":"POLY","0xa":"OP","0x2105":"BASE" }[chainHex] ?? "ETH";
  const explorerBase = { "0x1":"https://etherscan.io","0x38":"https://bscscan.com","0xa4b1":"https://arbiscan.io","0x89":"https://polygonscan.com","0xa":"https://optimistic.etherscan.io","0x2105":"https://basescan.org" }[chainHex] ?? "https://etherscan.io";
  const blockscoutBase = BLOCKSCOUT[chainHex] ?? BLOCKSCOUT["0x1"];

  useEffect(() => {
    if (!walletAddress) return;
    setLoading(true);
    setError("");
    setTxs([]);
    fetch(`${blockscoutBase}/api/v2/addresses/${walletAddress}/transactions?limit=20`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<{ items: BlockscoutTx[] }>;
      })
      .then(d => setTxs(d.items ?? []))
      .catch(e => setError((e as Error).message ?? "Error al cargar historial"))
      .finally(() => setLoading(false));
  }, [walletAddress, chainHex, blockscoutBase]);

  if (!walletAddress) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="text-4xl">🔒</div>
        <div className="font-space text-[12px] text-[#7ab3c8]">Conectá tu wallet para ver el historial de transacciones</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-4">
        <div className="font-sharetech text-[9px] tracking-[0.3em] text-[#5a8898]">
          HISTORIAL DE TRANSACCIONES · {chainLabel} · {truncateAddr(walletAddress)}
        </div>
        <a href={`${explorerBase}/address/${walletAddress}`} target="_blank" rel="noreferrer"
          className="font-sharetech text-[9px] text-[#00e5ff] hover:underline">
          VER EN EXPLORER →
        </a>
      </div>

      {loading && (
        <div className="space-y-2">
          {[1,2,3,4,5].map(i => <div key={i} className="h-16 border border-[#1a2535] bg-[#060a0f] animate-pulse" />)}
        </div>
      )}

      {error && !loading && (
        <div className="border border-[#ff174433] bg-[#ff17440a] p-4">
          <div className="font-space text-[11px] text-[#ff1744]">✗ Error al cargar historial: {error}</div>
          <a href={`${explorerBase}/address/${walletAddress}`} target="_blank" rel="noreferrer"
            className="font-sharetech text-[9px] text-[#00e5ff] hover:underline mt-2 block">
            Ver transacciones en {explorerBase.replace("https://","")} →
          </a>
        </div>
      )}

      {!loading && !error && txs.length === 0 && (
        <div className="border border-[#1a2535] bg-[#060a0f] p-8 text-center">
          <div className="text-3xl mb-2">📭</div>
          <div className="font-space text-[11px] text-[#7ab3c8]">No se encontraron transacciones en esta red</div>
        </div>
      )}

      {!loading && txs.length > 0 && (
        <div className="space-y-1">
          {txs.map((tx, i) => {
            const isIn = tx.to?.hash.toLowerCase() === walletAddress.toLowerCase();
            const hasTokenTransfer = (tx.token_transfers?.length ?? 0) > 0;
            const type = hasTokenTransfer ? "TOKEN" : tx.tx_types.includes("contract_call") ? "CONTRACT" : isIn ? "ENTRADA" : "SALIDA";
            const valueEth = (parseInt(tx.value || "0") / 1e18).toFixed(4);
            const date = new Date(tx.timestamp).toLocaleString("es-EC", { day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" });
            const icon = hasTokenTransfer ? "⇄" : isIn ? "↙" : "↗";
            const color = isIn ? "#00e676" : type === "CONTRACT" ? "#ffd700" : "#ff6d00";
            const statusColor = tx.status === "ok" ? "#00e676" : "#ff1744";
            return (
              <div key={i} className="border border-[#1a2535] bg-[#060a0f] p-4 hover:border-[#1a3545] transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full border flex items-center justify-center text-sm shrink-0"
                    style={{ borderColor: `${color}44`, color }}>
                    {icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="font-space text-[11px] font-bold" style={{ color }}>{type}</span>
                      <span className="font-sharetech text-[9px] text-[#7ab3c8]">{date}</span>
                      <span className="font-sharetech text-[8px] px-1.5 py-0.5 border" style={{ borderColor: `${statusColor}44`, color: statusColor }}>
                        {tx.status === "ok" ? "✓ OK" : "✗ FAIL"}
                      </span>
                    </div>
                    {hasTokenTransfer && tx.token_transfers?.[0] && (
                      <div className="font-space text-[10px] text-[#8a9ab0]">
                        {(parseInt(tx.token_transfers[0].total.value) / Math.pow(10, parseInt(tx.token_transfers[0].total.decimals || "18"))).toFixed(4)}{" "}
                        {tx.token_transfers[0].token.symbol}
                      </div>
                    )}
                    {!hasTokenTransfer && parseFloat(valueEth) > 0 && (
                      <div className="font-space text-[10px] text-[#8a9ab0]">{valueEth} {chainLabel === "BSC" ? "BNB" : chainLabel === "POLY" ? "MATIC" : "ETH"}</div>
                    )}
                  </div>
                  <a href={`${explorerBase}/tx/${tx.hash}`} target="_blank" rel="noreferrer"
                    className="font-sharetech text-[9px] text-[#00e5ff] hover:underline shrink-0">
                    VER TX →
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && txs.length > 0 && (
        <div className="font-space text-[9px] text-[#5a8898] mt-3 text-center">
          Historial via Blockscout · {blockscoutBase.replace("https://","")} · últimas {txs.length} transacciones
        </div>
      )}
    </div>
  );
}

// ─── Token Safety ─────────────────────────────────────────────────────────────
function SafetyPanel() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SafetyResult | null>(null);

  async function check() {
    if (!query.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const pairs = await searchDexToken(query);
      setResult(analyzeSafety(pairs));
    } catch {
      setResult({ score: 0, issues: ["Error al consultar DexScreener"], positives: [], verdict: "DESCONOCIDO" });
    } finally { setLoading(false); }
  }

  const verdictColor: Record<string, string> = { SEGURO: "#00e676", PRECAUCIÓN: "#ffd700", PELIGROSO: "#ff1744", DESCONOCIDO: "#4a6070" };
  const verdictIcon: Record<string, string> = { SEGURO: "✅", PRECAUCIÓN: "⚠️", PELIGROSO: "💀", DESCONOCIDO: "❓" };

  return (
    <div className="max-w-2xl">
      <div className="font-sharetech text-[9px] tracking-[0.3em] text-[#5a8898] mb-4">AUDITORÍA DE TOKEN — DEXSCREENER</div>
      <div className="flex gap-2 mb-6">
        <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && check()}
          placeholder="Nombre, símbolo o dirección del contrato — ej: PEPE, SHIB, 0x..."
          className="flex-1 bg-[#0a0f18] border border-[#1a2535] px-4 py-3 font-space text-[12px] text-white placeholder-[#2a3a4a] focus:border-[#00e5ff44] focus:outline-none transition-colors" />
        <button onClick={check} disabled={loading || !query.trim()}
          className="px-6 py-3 font-space text-[11px] font-bold tracking-[0.15em] uppercase transition-all"
          style={{ background: loading ? "#0d1520" : "#00e5ff", color: loading ? "#2a3a4a" : "#020408" }}>
          {loading ? "⏳" : "🔍 AUDITAR"}
        </button>
      </div>

      {/* Examples */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {["PEPE", "SHIB", "DOGE", "WIF", "FLOKI"].map(ex => (
          <button key={ex} onClick={() => { setQuery(ex); }}
            className="font-sharetech text-[10px] px-3 py-1.5 border border-[#1a2535] text-[#7ab3c8] hover:border-[#00e5ff44] hover:text-[#00e5ff] transition-all">
            {ex}
          </button>
        ))}
      </div>

      {result && (
        <div className="space-y-4">
          {/* Verdict */}
          <div className="border p-6 text-center"
            style={{ borderColor: `${verdictColor[result.verdict]}44`, background: `${verdictColor[result.verdict]}08` }}>
            <div className="text-4xl mb-2">{verdictIcon[result.verdict]}</div>
            <div className="font-bebas text-3xl mb-1" style={{ color: verdictColor[result.verdict] }}>{result.verdict}</div>
            <div className="font-space text-[12px] text-[#8a9ab0] mb-4">PSY Safety Score: <strong style={{ color: verdictColor[result.verdict] }}>{result.score}/100</strong></div>
            <div className="h-2 bg-[#0a0f18] rounded-full overflow-hidden max-w-xs mx-auto">
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${result.score}%`, background: verdictColor[result.verdict] }} />
            </div>
          </div>

          {/* Token data */}
          {result.pair && (
            <div className="border border-[#1a2535] bg-[#060a0f] p-5">
              <div className="font-sharetech text-[9px] tracking-[0.3em] text-[#5a8898] mb-3">DATOS DEL TOKEN — DEXSCREENER</div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Token", value: `${result.pair.baseToken.name} (${result.pair.baseToken.symbol})` },
                  { label: "Par", value: `${result.pair.baseToken.symbol}/${result.pair.quoteToken.symbol}` },
                  { label: "Precio USD", value: result.pair.priceUsd ? `$${parseFloat(result.pair.priceUsd).toFixed(8)}` : "N/A" },
                  { label: "Volumen 24h", value: fmt(result.pair.volume?.h24 ?? 0) },
                  { label: "Liquidez", value: fmt(result.pair.liquidity?.usd ?? 0) },
                  { label: "FDV", value: result.pair.fdv ? fmt(result.pair.fdv) : "N/A" },
                  { label: "Edad del par", value: result.pair.pairCreatedAt ? `${Math.round((Date.now() - result.pair.pairCreatedAt) / 86400000)} días` : "N/A" },
                  { label: "Sitio web", value: result.pair.info?.websites?.[0]?.url ?? "No registrado" },
                ].map(row => (
                  <div key={row.label} className="border-b border-[#1a2535] pb-2">
                    <div className="font-space text-[9px] text-[#7ab3c8] mb-0.5">{row.label}</div>
                    <div className="font-space text-[11px] text-[#e0f4ff] break-all">{row.value}</div>
                  </div>
                ))}
              </div>
              {result.pair.url && (
                <a href={result.pair.url} target="_blank" rel="noopener noreferrer"
                  className="inline-block mt-4 font-space text-[10px] text-[#00e5ff] hover:underline">
                  Ver en DexScreener →
                </a>
              )}
            </div>
          )}

          {/* Issues & positives */}
          <div className="grid sm:grid-cols-2 gap-4">
            {result.issues.length > 0 && (
              <div className="border border-[#ff174433] bg-[#0a0609] p-4">
                <div className="font-sharetech text-[9px] tracking-[0.3em] text-[#ff1744] mb-3">⚠️ RIESGOS DETECTADOS</div>
                {result.issues.map((issue, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <span className="text-[#ff1744] shrink-0 text-xs mt-0.5">✗</span>
                    <span className="font-space text-[11px] text-[#8a6060]">{issue}</span>
                  </div>
                ))}
              </div>
            )}
            {result.positives.length > 0 && (
              <div className="border border-[#00e67633] bg-[#030a06] p-4">
                <div className="font-sharetech text-[9px] tracking-[0.3em] text-[#00e676] mb-3">✅ SEÑALES POSITIVAS</div>
                {result.positives.map((pos, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <span className="text-[#00e676] shrink-0 text-xs mt-0.5">✓</span>
                    <span className="font-space text-[11px] text-[#60806a]">{pos}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border border-[#ffd70022] bg-[#0a0900] p-4">
            <div className="font-space text-[10px] text-[#ffd700] mb-1">⚠️ DISCLAIMER</div>
            <div className="font-space text-[10px] text-[#6a7040] leading-relaxed">
              Esta auditoría se basa en datos de DexScreener. No es asesoría financiera. Siempre investigá por tu cuenta antes de invertir en tokens desconocidos. DYOR.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── WalletConnect Mobile Modal ───────────────────────────────────────────────
function WCMobileModal({ onClose }: { onClose: () => void }) {
  const MOBILE_WALLETS = [
    { name: "MetaMask Mobile", icon: "🦊", ios: "https://apps.apple.com/app/metamask-blockchain-wallet/id1438144202", android: "https://play.google.com/store/apps/details?id=io.metamask" },
    { name: "Trust Wallet",    icon: "🛡", ios: "https://apps.apple.com/app/trust-crypto-bitcoin-wallet/id1288339409", android: "https://play.google.com/store/apps/details?id=com.wallet.crypto.trustapp" },
    { name: "Rainbow",         icon: "🌈", ios: "https://apps.apple.com/app/rainbow-ethereum-wallet/id1457119021", android: "https://play.google.com/store/apps/details?id=me.rainbow" },
    { name: "Coinbase Wallet", icon: "🔵", ios: "https://apps.apple.com/app/coinbase-wallet-store-crypto/id1278383455", android: "https://play.google.com/store/apps/details?id=org.toshi" },
    { name: "Ledger Live",     icon: "🔷", ios: "https://apps.apple.com/app/ledger-live-web3-wallet/id1361671700", android: "https://play.google.com/store/apps/details?id=com.ledger.live" },
    { name: "Argent",          icon: "🔐", ios: "https://apps.apple.com/app/argent-defi-in-a-tap/id1358741926", android: "https://play.google.com/store/apps/details?id=im.argent.contractwallet" },
  ];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4" onClick={onClose}>
      <div className="bg-[#060a0f] border border-[#1a2535] w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="font-sharetech text-[9px] tracking-[0.3em] text-[#5a8898] mb-1">PSY WALLET</div>
            <div className="font-bebas text-2xl text-white">WALLETS MÓVILES</div>
          </div>
          <button onClick={onClose} className="text-[#7ab3c8] hover:text-white font-bold text-lg">✕</button>
        </div>
        <div className="font-space text-[10px] text-[#7ab3c8] mb-4 leading-relaxed">
          Abrí este sitio desde el browser interno de tu wallet, o descargá la app:
        </div>
        <div className="space-y-2 mb-5">
          {MOBILE_WALLETS.map(w => (
            <div key={w.name} className="flex items-center gap-3 p-3 border border-[#1a2535] bg-[#0a0f18]">
              <span className="text-xl shrink-0">{w.icon}</span>
              <div className="flex-1">
                <div className="font-space text-[11px] font-bold text-white mb-1">{w.name}</div>
                <div className="flex gap-3">
                  <a href={w.ios} target="_blank" rel="noopener noreferrer"
                    className="font-sharetech text-[8px] tracking-[0.1em] text-[#00e5ff] hover:underline"> iOS →</a>
                  <a href={w.android} target="_blank" rel="noopener noreferrer"
                    className="font-sharetech text-[8px] tracking-[0.1em] text-[#00e676] hover:underline"> Android →</a>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="font-space text-[9px] text-[#5a8898] leading-relaxed">
          Para Ledger / Trezor (hardware), conectá via extensión de MetaMask → Conectar hardware wallet.
        </div>
      </div>
    </div>
  );
}

// ─── Withdraw Panel ───────────────────────────────────────────────────────────
function WithdrawPanel({
  walletAddress, chainId: walletChainId, tokens, ethBalance,
}: {
  walletAddress: string | null;
  chainId: string | null;
  tokens: Token[];
  ethBalance: string;
}) {
  const chainHex = walletChainId ?? "0x1";
  const native = NATIVE_BY_CHAIN[chainHex];
  const erc20s = ERC20_BY_CHAIN[chainHex] ?? [];
  const SEND_TOKENS = [native?.symbol ?? "ETH", ...erc20s.map(t => t.symbol)];

  const [sendToken, setSendToken] = useState(native?.symbol ?? "ETH");
  const [sendAmt,   setSendAmt]   = useState("");
  const [destType,  setDestType]  = useState<"boveda" | "custom">("boveda");
  const [customAddr, setCustomAddr] = useState("");
  const [sendStatus, setSendStatus] = useState<"idle" | "signing" | "success" | "error">("idle");
  const [sendTxHash, setSendTxHash] = useState("");
  const [sendError,  setSendError]  = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [bovedaAddr, setBovedaAddrW] = useState("");

  // Load Bóveda address
  useEffect(() => {
    try {
      const raw = localStorage.getItem("psyko_auth");
      const u = raw ? (JSON.parse(raw) as { user?: string }).user ?? "guest" : "guest";
      const slug = u.toLowerCase().replace(/[^a-z0-9_-]/g, "_");
      setBovedaAddrW(localStorage.getItem(`psyw_${slug}_recv`) ?? "");
    } catch { /* silent */ }
  }, []);

  const destAddr = destType === "boveda" ? bovedaAddr : customAddr;
  const isValidDest = /^0x[0-9a-fA-F]{40}$/.test(destAddr);
  const sendAmtN = parseFloat(sendAmt) || 0;
  const isNative = sendToken === (native?.symbol ?? "ETH");
  const tokenDef = erc20s.find(t => t.symbol === sendToken);
  const tokenPrice = tokens.find(t => t.symbol.toUpperCase() === sendToken.toUpperCase())?.current_price ?? 0;
  const ethPrice = tokens.find(t => t.id === "ethereum")?.current_price ?? 3000;
  const gasUnits = isNative ? 21000 : 65000;
  const gasCostEth = (20 * gasUnits) / 1e9; // 20 Gwei conservative
  const gasCostUsd = gasCostEth * ethPrice;
  const chainLabel = { "0x1":"Ethereum","0x38":"BSC","0xa4b1":"Arbitrum","0x89":"Polygon","0xa":"Optimism","0x2105":"Base" }[chainHex] ?? "Ethereum";

  async function executeSend() {
    if (!walletAddress || !isValidDest || sendAmtN <= 0 || !winEth()) return;
    setSendStatus("signing");
    setSendError("");
    try {
      let hash: string;
      if (isNative) {
        const value = "0x" + BigInt(Math.round(sendAmtN * 1e18)).toString(16);
        hash = await winEth()!.request({
          method: "eth_sendTransaction",
          params: [{ from: walletAddress, to: destAddr, value, gas: "0x5208" }],
        }) as string;
      } else {
        if (!tokenDef) throw new Error("Token no encontrado en esta red");
        const amount = BigInt(Math.round(sendAmtN * Math.pow(10, tokenDef.decimals)));
        const fnSel = "0xa9059cbb";
        const paddedTo = destAddr.slice(2).toLowerCase().padStart(64, "0");
        const paddedAmt = amount.toString(16).padStart(64, "0");
        hash = await winEth()!.request({
          method: "eth_sendTransaction",
          params: [{ from: walletAddress, to: tokenDef.address, data: fnSel + paddedTo + paddedAmt, gas: "0x" + gasUnits.toString(16) }],
        }) as string;
      }
      setSendTxHash(hash);
      setSendStatus("success");
      setShowConfirm(false);
      setSendAmt("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error";
      setSendError(msg.includes("rejected") || msg.includes("denied") ? "Firma rechazada." : msg.slice(0, 120));
      setSendStatus("error");
    }
  }

  if (!walletAddress) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="text-4xl">📤</div>
        <div className="font-space text-[12px] text-[#7ab3c8]">Conectá tu wallet para retirar fondos</div>
        <div className="font-sharetech text-[9px] text-[#5a8898]">Gas se descuenta automáticamente de tu wallet conectada</div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="font-sharetech text-[9px] tracking-[0.3em] text-[#5a8898] mb-4">RETIRAR FONDOS · {chainLabel.toUpperCase()}</div>

      {sendStatus === "success" && (
        <div className="border border-[#00e67633] bg-[#00e67608] p-4 mb-4">
          <div className="font-space text-[10px] text-[#00e676] font-bold mb-1">✓ TRANSACCIÓN ENVIADA</div>
          <div className="font-sharetech text-[9px] text-[#7ab3c8] break-all">TX: {sendTxHash}</div>
          <button onClick={() => { setSendStatus("idle"); setSendTxHash(""); }}
            className="mt-2 font-space text-[9px] text-[#00e5ff] hover:underline">Nuevo retiro →</button>
        </div>
      )}
      {sendStatus === "error" && sendError && (
        <div className="border border-[#ff174433] bg-[#ff17440a] p-3 mb-4">
          <div className="font-space text-[10px] text-[#ff1744]">✗ {sendError}</div>
        </div>
      )}

      {/* Token + amount */}
      <div className="border border-[#1a2535] bg-[#060a0f] p-1 mb-4">
        <div className="bg-[#0a0f18] p-4">
          <div className="flex justify-between mb-2">
            <span className="font-space text-[10px] text-[#7ab3c8]">Enviás</span>
            <span className="font-space text-[10px] text-[#7ab3c8]">{truncateAddr(walletAddress)} · {ethBalance} {native?.symbol ?? "ETH"}</span>
          </div>
          <div className="flex items-center gap-3">
            <input value={sendAmt} onChange={e => setSendAmt(e.target.value)} placeholder="0"
              className="flex-1 bg-transparent font-bebas text-4xl text-white focus:outline-none placeholder-[#2a3a4a] w-0 min-w-0"
              style={{ fontSize: "clamp(24px,4vw,40px)" }} />
            <select value={sendToken} onChange={e => setSendToken(e.target.value)}
              className="bg-[#0d1520] border border-[#1a2535] text-white font-sharetech text-[11px] px-3 py-2 focus:outline-none cursor-pointer shrink-0">
              {SEND_TOKENS.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          {sendAmtN > 0 && tokenPrice > 0 && (
            <div className="font-space text-[10px] text-[#7ab3c8] mt-1">≈ {fmt(sendAmtN * tokenPrice)}</div>
          )}
        </div>
      </div>

      {/* Destination */}
      <div className="border border-[#1a2535] bg-[#060a0f] p-4 mb-4">
        <div className="font-sharetech text-[9px] tracking-[0.2em] text-[#5a8898] mb-3">DESTINO</div>
        <div className="flex gap-2 mb-3">
          <button onClick={() => setDestType("boveda")}
            className="flex-1 py-2.5 font-space text-[10px] font-bold tracking-[0.1em] border transition-all"
            style={{ borderColor: destType === "boveda" ? "#00e5ff" : "#1a2535", color: destType === "boveda" ? "#00e5ff" : "#4a6070", background: destType === "boveda" ? "#00e5ff12" : "transparent" }}>
            🔐 BÓVEDA PSY
          </button>
          <button onClick={() => setDestType("custom")}
            className="flex-1 py-2.5 font-space text-[10px] font-bold tracking-[0.1em] border transition-all"
            style={{ borderColor: destType === "custom" ? "#ffd700" : "#1a2535", color: destType === "custom" ? "#ffd700" : "#4a6070", background: destType === "custom" ? "#ffd70012" : "transparent" }}>
            📋 DIRECCIÓN EXTERNA
          </button>
        </div>

        {destType === "boveda" && (
          bovedaAddr ? (
            <div className="border border-[#00e5ff22] bg-[#00e5ff06] p-3">
              <div className="font-sharetech text-[8px] tracking-[0.2em] text-[#00e5ff] mb-1">DIRECCIÓN BÓVEDA CONFIGURADA</div>
              <div className="font-sharetech text-[11px] text-[#e0f4ff] break-all">{bovedaAddr}</div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="font-space text-[10px] text-[#ff6d00]">⚠ Sin dirección de Bóveda — ingresá una dirección 0x:</div>
              <input value={customAddr} onChange={e => setCustomAddr(e.target.value)}
                placeholder="0x... dirección de tu Bóveda"
                className="w-full bg-[#0a0f18] border border-[#1a2535] px-3 py-2.5 font-sharetech text-[11px] text-white placeholder-[#2a3a4a] focus:border-[#00e5ff44] focus:outline-none" />
              <button
                onClick={() => {
                  if (/^0x[0-9a-fA-F]{40}$/.test(customAddr)) {
                    try {
                      const raw = localStorage.getItem("psyko_auth");
                      const u = raw ? (JSON.parse(raw) as { user?: string }).user ?? "guest" : "guest";
                      const slug = u.toLowerCase().replace(/[^a-z0-9_-]/g, "_");
                      localStorage.setItem(`psyw_${slug}_recv`, customAddr);
                      setBovedaAddrW(customAddr);
                    } catch { /* silent */ }
                  }
                }}
                disabled={!/^0x[0-9a-fA-F]{40}$/.test(customAddr)}
                className="w-full py-2 font-space text-[10px] font-bold border border-[#00e5ff44] text-[#00e5ff] hover:bg-[#00e5ff12] disabled:opacity-40 transition-all">
                GUARDAR COMO BÓVEDA
              </button>
            </div>
          )
        )}
        {destType === "custom" && (
          <input value={customAddr} onChange={e => setCustomAddr(e.target.value)}
            placeholder="0x... dirección destino"
            className="w-full bg-[#0a0f18] border border-[#1a2535] px-3 py-2.5 font-sharetech text-[11px] text-white placeholder-[#2a3a4a] focus:border-[#ffd70044] focus:outline-none" />
        )}
        {destAddr && !isValidDest && (
          <div className="mt-2 font-space text-[9px] text-[#ff1744]">Dirección inválida — debe ser 0x + 40 caracteres hex</div>
        )}
      </div>

      {/* Gas breakdown */}
      {sendAmtN > 0 && isValidDest && (
        <div className="border border-[#1a2535] bg-[#060a0f] p-4 mb-4 font-space text-[11px] space-y-2">
          <div className="flex justify-between text-[#7ab3c8]">
            <span>Red</span><span className="text-[#8a9ab0]">{chainLabel}</span>
          </div>
          <div className="flex justify-between text-[#7ab3c8]">
            <span>Tipo</span><span>{isNative ? "Transferencia nativa" : "ERC-20 transfer"}</span>
          </div>
          <div className="flex justify-between text-[#7ab3c8]">
            <span>Gas estimado</span>
            <span className="text-[#8a9ab0]">{gasUnits.toLocaleString()} gas · ~{fmt(gasCostUsd)}</span>
          </div>
          <div className="flex justify-between text-[#7ab3c8]">
            <span>Gas se paga desde</span>
            <span className="text-[#00e676]">Wallet conectada ({native?.symbol ?? "ETH"})</span>
          </div>
          <div className="flex justify-between border-t border-[#1a2535] pt-2">
            <span className="text-[#00e5ff] font-bold">Total enviado</span>
            <span className="text-white font-bold">{sendAmt} {sendToken}</span>
          </div>
          <div className="flex justify-between text-[#7ab3c8]">
            <span>Destino</span>
            <span className="text-[#8a9ab0] break-all text-right">{truncateAddr(destAddr)}</span>
          </div>
        </div>
      )}

      <button
        onClick={() => sendAmtN > 0 && isValidDest && setShowConfirm(true)}
        disabled={sendAmtN <= 0 || !isValidDest || sendStatus === "signing"}
        className="w-full py-5 font-space text-[13px] font-bold tracking-[0.2em] uppercase transition-all mb-2"
        style={{
          background: sendAmtN > 0 && isValidDest && sendStatus !== "signing" ? "#00e5ff" : "#0d1520",
          color: sendAmtN > 0 && isValidDest && sendStatus !== "signing" ? "#020408" : "#2a3a4a",
          cursor: sendAmtN > 0 && isValidDest ? "pointer" : "not-allowed",
        }}>
        {sendStatus === "signing" ? "FIRMANDO..." : "📤 FIRMAR RETIRO CON WALLET →"}
      </button>
      <div className="font-space text-[9px] text-[#5a8898] text-center">
        Gas desde wallet conectada · Sin custodia · Tus fondos, tu control
      </div>

      {/* Confirm modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="border border-[#00e5ff33] bg-[#060a0f] p-6 max-w-sm w-full">
            <div className="font-sharetech text-[9px] tracking-[0.3em] text-[#5a8898] mb-4">CONFIRMAR RETIRO</div>
            <div className="font-bebas text-2xl text-white mb-3">{sendAmt} {sendToken}</div>
            <div className="space-y-2 mb-4 font-space text-[11px]">
              <div className="flex justify-between">
                <span className="text-[#7ab3c8]">Desde</span>
                <span className="text-[#8a9ab0]">{truncateAddr(walletAddress)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7ab3c8]">Hacia</span>
                <span style={{ color: destType === "boveda" ? "#00e5ff" : "#ffd700" }}>
                  {truncateAddr(destAddr)} {destType === "boveda" ? "🔐 Bóveda" : "📋 Externa"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7ab3c8]">Gas estimado</span>
                <span className="text-[#8a9ab0]">~{fmt(gasCostUsd)}</span>
              </div>
            </div>
            <div className="border border-[#ff6d0033] bg-[#0d0805] p-3 mb-4">
              <div className="font-space text-[9px] text-[#ff6d00]">⚠ Esta transacción es irreversible. Verificá la dirección destino antes de confirmar.</div>
            </div>
            {sendStatus === "signing" && (
              <div className="font-space text-[10px] text-[#ffd700] mb-3 animate-pulse">⏳ Esperando firma en tu wallet...</div>
            )}
            <div className="flex gap-2">
              <button onClick={() => { setShowConfirm(false); setSendStatus("idle"); }}
                disabled={sendStatus === "signing"}
                className="flex-1 py-3 border border-[#1a2535] font-space text-[11px] text-[#7ab3c8] hover:text-[#ff6d00] transition-colors disabled:opacity-40">
                CANCELAR
              </button>
              <button onClick={executeSend} disabled={sendStatus === "signing"}
                className="flex-1 py-3 font-space text-[11px] font-bold bg-[#00e5ff] text-[#020408] disabled:opacity-60 transition-all">
                {sendStatus === "signing" ? "FIRMANDO..." : "🔐 CONFIRMAR RETIRO"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export default function PsyWallet() {
  const [section, setSection] = useState<WalletSection>("portfolio");

  // ── Wallet connection state ────────────────────────────────────────────────
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [ethBalance, setEthBalance] = useState<string>("0");
  const [walletError, setWalletError] = useState<string>("");
  const [connecting, setConnecting] = useState(false);
  const [portfolioLoading, setPortfolioLoading] = useState(false);
  const [isRealPortfolio, setIsRealPortfolio] = useState(false);
  const [portfolioError, setPortfolioError] = useState("");
  const [connectedWalletName, setConnectedWalletName] = useState("");
  const [connectedWalletId,   setConnectedWalletId]   = useState("");

  // ── Wallet picker state ────────────────────────────────────────────────────
  const [showPicker,      setShowPicker]      = useState(false);
  const [showWCModal,     setShowWCModal]     = useState(false);
  const [showKillSwitch,  setShowKillSwitch]  = useState(false);
  const [pickerOpts,  setPickerOpts]  = useState<WalletOption[]>([]);
  const [pickerError, setPickerError] = useState("");

  // Track the active provider so event listeners follow the right wallet
  const activeProviderRef = useRef<EIP1193Provider | null>(null);

  const connected = !!walletAddress;
  const network = chainId ? (CHAIN_NAMES[chainId] ?? `Chain ${parseInt(chainId, 16)}`) : "ETH";

  // ── Market data ────────────────────────────────────────────────────────────
  const [tokens, setTokens] = useState<Token[]>([]);
  const [wallet, setWallet] = useState<WalletToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [priceError, setPriceError] = useState(false);

  // ── Provider helpers ───────────────────────────────────────────────────────
  function getProvider(): EIP1193Provider | null {
    return activeProviderRef.current ?? winEth() ?? null;
  }

  async function readEthBalance(address: string, chain: string | null) {
    const p = getProvider();
    if (!p) return;
    try {
      const hex = await p.request({ method: "eth_getBalance", params: [address, "latest"] }) as string;
      setEthBalance((parseInt(hex, 16) / 1e18).toFixed(4));
    } catch { /* silent */ }
    if (chain) setChainId(chain);
  }

  async function loadRealPortfolio(address: string, chain: string, market: Token[]) {
    setPortfolioLoading(true);
    setPortfolioError("");
    try {
      const real = await fetchRealBalances(address, chain, market);
      if (real.length > 0) {
        setWallet(real);
        setIsRealPortfolio(true);
      } else {
        setPortfolioError("Sin activos detectados en esta red. Cambiá de red en tu wallet o comprá tokens.");
        setIsRealPortfolio(false);
      }
    } catch {
      setPortfolioError("Error al leer balances on-chain.");
      setIsRealPortfolio(false);
    } finally {
      setPortfolioLoading(false);
    }
  }

  // ── Timeout helper ─────────────────────────────────────────────────────────
  function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error("TIMEOUT")), ms)
      ),
    ]);
  }

  // ── Core connect (accepts any EIP-1193 provider) ──────────────────────────
  async function connectProvider(provider: EIP1193Provider, walletName: string, walletId?: string) {
    setConnecting(true);
    setPickerError("");
    setWalletError("");
    try {
      const accounts = await withTimeout(
        provider.request({ method: "eth_requestAccounts" }) as Promise<string[]>,
        30_000
      );
      const address = accounts[0];
      const chain = await provider.request({ method: "eth_chainId" }) as string;
      activeProviderRef.current = provider;
      setWalletAddress(address);
      setChainId(chain);
      setConnectedWalletName(walletName);
      setConnectedWalletId(walletId ?? "");
      setShowPicker(false);
      const hex = await provider.request({ method: "eth_getBalance", params: [address, "latest"] }) as string;
      setEthBalance((parseInt(hex as string, 16) / 1e18).toFixed(4));
      setTokens(prev => { void loadRealPortfolio(address, chain, prev); return prev; });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error";
      const friendly = msg === "TIMEOUT"
        ? "Tiempo de espera agotado. Abrí tu wallet manualmente y aceptá la conexión."
        : msg.includes("rejected") || msg.includes("denied")
          ? "Conexión rechazada — aceptá en tu wallet."
          : `Error: ${msg.slice(0, 70)}`;
      setPickerError(friendly);
      setWalletError(friendly);
    } finally {
      setConnecting(false);
    }
  }

  // ── Open wallet picker ────────────────────────────────────────────────────
  function openPicker() {
    setPickerError("");
    const opts = detectWallets();
    setPickerOpts(opts);
    const installed = opts.filter(o => o.isInstalled);
    if (installed.length === 1 && installed[0].provider) {
      // Exactamente una wallet instalada — conectar directo sin mostrar picker
      void connectProvider(installed[0].provider, installed[0].name, installed[0].id);
    } else {
      setShowPicker(true);
    }
  }

  // ── Handle picker selection ───────────────────────────────────────────────
  async function handlePickWallet(opt: WalletOption) {
    if (opt.id === "walletconnect") {
      setShowPicker(false);
      setShowWCModal(true);
      return;
    }
    // En móvil (sin window.ethereum) abrir deep link de la wallet
    if (!opt.provider && opt.deepLink) {
      window.open(opt.deepLink, "_blank", "noopener");
      return;
    }
    if (!opt.provider) return;
    await connectProvider(opt.provider, opt.name, opt.id);
  }

  function disconnectWallet() {
    activeProviderRef.current = null;
    setWalletAddress(null);
    setChainId(null);
    setEthBalance("0");
    setWalletError("");
    setConnectedWalletName("");
    setConnectedWalletId("");
    setIsRealPortfolio(false);
    setPortfolioError("");
    setTokens(prev => {
      setWallet(MOCK_HOLDINGS.map(h => {
        const coin = prev.find(t => t.symbol.toUpperCase() === h.symbol.toUpperCase());
        return { ...h, price: coin?.current_price ?? 0, change24h: coin?.price_change_percentage_24h ?? 0 };
      }));
      return prev;
    });
  }

  // ── Provider event listeners (follow active provider) ──────────────────────
  useEffect(() => {
    const p = getProvider();
    if (!p) return;

    const onAccountsChanged = (accounts: unknown) => {
      const arr = accounts as string[];
      if (arr.length === 0) disconnectWallet();
      else {
        setWalletAddress(arr[0]);
        readEthBalance(arr[0], chainId);
        if (chainId) setTokens(prev => { void loadRealPortfolio(arr[0], chainId, prev); return prev; });
      }
    };

    const onChainChanged = (chain: unknown) => {
      const c = chain as string;
      setChainId(c);
      if (walletAddress) {
        readEthBalance(walletAddress, c);
        setTokens(prev => { void loadRealPortfolio(walletAddress, c, prev); return prev; });
      }
    };

    p.on("accountsChanged", onAccountsChanged);
    p.on("chainChanged", onChainChanged);
    return () => {
      p.removeListener("accountsChanged", onAccountsChanged);
      p.removeListener("chainChanged", onChainChanged);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletAddress, chainId]);

  // ── Auto-reconnect on page load ────────────────────────────────────────────
  useEffect(() => {
    const p = winEth();
    if (!p) return;
    p.request({ method: "eth_accounts" }).then(accounts => {
      const arr = accounts as string[];
      if (arr.length > 0) {
        activeProviderRef.current = p;
        setWalletAddress(arr[0]);
        p.request({ method: "eth_chainId" }).then(chain => {
          setChainId(chain as string);
          readEthBalance(arr[0], chain as string);
        });
      }
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Market data load ───────────────────────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    fetchTopTokens()
      .then(data => {
        setTokens(data);
        setPriceError(false);
        // Check if wallet is already connected — if so, load real balances
        const raw = localStorage.getItem("_psy_wallet_connected");
        if (raw) {
          // wallet was connected before page load — auto-reconnect will handle it
        }
        // Always build demo first; real portfolio overrides when connected
        const built: WalletToken[] = MOCK_HOLDINGS.map(h => {
          const coin = data.find(t => t.symbol.toUpperCase() === h.symbol.toUpperCase());
          return { ...h, price: coin?.current_price ?? 0, change24h: coin?.price_change_percentage_24h ?? 0 };
        });
        setWallet(built);
        // If already connected (auto-reconnect ran), load real portfolio
        setWalletAddress(addr => {
          setChainId(chain => {
            if (addr && chain) void loadRealPortfolio(addr, chain, data);
            return chain;
          });
          return addr;
        });
      })
      .catch(() => {
        setPriceError(true);
        setWallet(MOCK_HOLDINGS.map(h => ({ ...h, price: 0, change24h: 0 })));
      })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalBalance = wallet.reduce((sum, t) => sum + t.balance * t.price, 0);

  const NAV = [
    { id: "portfolio" as const, icon: "📊", label: "Portfolio" },
    { id: "swap"      as const, icon: "⇄",  label: "Swap" },
    { id: "withdraw"  as const, icon: "📤", label: "Retirar" },
    { id: "market"    as const, icon: "📈", label: "Mercado" },
    { id: "safety"    as const, icon: "🔍", label: "Seguridad" },
    { id: "history"   as const, icon: "🕐", label: "Historial" },
  ];

  return (
    <div className="min-h-screen bg-[#020408] text-white font-rajdhani flex">

      {/* ── Left Sidebar ──────────────────────────────────────────────────── */}
      <aside className="w-16 md:w-56 shrink-0 border-r border-[#1a2535] bg-[#030609] flex flex-col fixed top-0 bottom-0 left-0 z-40">
        {/* Logo */}
        <div className="p-4 border-b border-[#1a2535]">
          <Link href="/psychometriks" className="no-underline">
            <div className="hidden md:block font-bebas text-xl text-white leading-none">
              PSY<span className="text-[#00e5ff]">WALLET</span>
            </div>
            <div className="hidden md:block font-sharetech text-[8px] text-[#5a8898] tracking-[0.2em] mt-0.5">
              POWERED BY PSYCHOMETRIKS
            </div>
            <div className="md:hidden font-bebas text-base text-[#00e5ff]">PSY</div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-2">
          {NAV.map(item => (
            <button key={item.id} onClick={() => setSection(item.id)}
              className="w-full flex items-center gap-3 px-3 py-3 mb-1 transition-all rounded-none text-left"
              style={{
                background: section === item.id ? "#00e5ff12" : "transparent",
                borderLeft: section === item.id ? "2px solid #00e5ff" : "2px solid transparent",
                color: section === item.id ? "#00e5ff" : "#4a6070",
              }}>
              <span className="text-lg shrink-0">{item.icon}</span>
              <span className="hidden md:block font-space text-[11px] tracking-[0.1em] uppercase">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Network switcher */}
        <div className="p-3 border-t border-[#1a2535]">
          <div className="hidden md:block font-sharetech text-[8px] text-[#5a8898] tracking-[0.2em] mb-2">RED</div>
          <div className="flex flex-wrap gap-1">
            {([ ["ETH","0x1"], ["BSC","0x38"], ["ARB","0xa4b1"], ["POLY","0x89"] ] as [string,string][]).map(([label, hex]) => (
              <button key={label}
                onClick={async () => {
                  if (!winEth()) return;
                  try {
                    await winEth()!.request({ method: "wallet_switchEthereumChain", params: [{ chainId: hex }] });
                  } catch { /* user rejected or chain not added */ }
                }}
                className="font-sharetech text-[9px] px-2 py-1 border transition-all"
                style={{ borderColor: network === label ? "#00e5ff" : "#1a2535", color: network === label ? "#00e5ff" : "#4a6070", background: network === label ? "#00e5ff12" : "transparent" }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Vault link */}
        <div className="p-3 border-t border-[#1a2535]">
          <Link href="/boveda" className="no-underline block">
            <div className="w-full py-2.5 font-space text-[10px] tracking-[0.1em] uppercase text-center transition-all border border-[#00e5ff22] bg-[#00e5ff08] text-[#00e5ff] hover:bg-[#00e5ff15] rounded-none">
              <span className="hidden md:inline">🔐 PSY VAULT</span>
              <span className="md:hidden">🔐</span>
            </div>
          </Link>
        </div>

        {/* Connect / disconnect wallet */}
        <div className="p-3 border-t border-[#1a2535] space-y-2">
          {connected ? (
            <>
              <div className="hidden md:block">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00e676]" />
                  <span className="font-sharetech text-[8px] text-[#00e676] tracking-[0.15em]">CONECTADO · {network}</span>
                </div>
                {connectedWalletName && (
                  <div className="font-sharetech text-[8px] text-[#5a8898] mb-0.5 tracking-[0.1em]">{connectedWalletName}</div>
                )}
                <div className="font-sharetech text-[10px] text-[#8a9ab0] mb-1 break-all">{truncateAddr(walletAddress!)}</div>
                <div className="font-space text-[9px] text-[#7ab3c8]">{ethBalance} {NATIVE_BY_CHAIN[chainId ?? ""]?.symbol ?? "ETH"}</div>
              </div>
              <div className="md:hidden flex items-center justify-center">
                <span className="w-2 h-2 rounded-full bg-[#00e676]" />
              </div>
              <button onClick={disconnectWallet}
                className="w-full py-2 font-space text-[9px] font-bold tracking-[0.1em] uppercase border border-[#1a2535] text-[#7ab3c8] hover:border-[#ff174433] hover:text-[#ff1744] transition-all">
                <span className="hidden md:inline">DESCONECTAR</span>
                <span className="md:hidden">✕</span>
              </button>
            </>
          ) : (
            <>
              {walletError && (
                <div className="hidden md:block font-space text-[9px] text-[#ff1744] mb-1 leading-tight">{walletError}</div>
              )}
              <button onClick={openPicker} disabled={connecting}
                className="w-full py-2.5 font-space text-[10px] font-bold tracking-[0.1em] uppercase transition-all disabled:opacity-60"
                style={{ background: "#00e5ff", color: "#020408" }}>
                <span className="hidden md:inline">{connecting ? "CONECTANDO..." : "⊕ CONECTAR WALLET"}</span>
                <span className="md:hidden">{connecting ? "…" : "⊕"}</span>
              </button>
            </>
          )}
        </div>
      </aside>

      {/* ── Main Content ──────────────────────────────────────────────────── */}
      <TabErrorBoundary label="CONTENIDO PRINCIPAL">
      <main className="flex-1 ml-16 md:ml-56 min-h-screen">
        {/* Top bar */}
        <div className="h-14 border-b border-[#1a2535] bg-[#030609] flex items-center px-6 gap-4 sticky top-0 z-30">
          <div className="flex-1 font-bebas text-lg text-white tracking-wide">
            {NAV.find(n => n.id === section)?.label.toUpperCase()}
          </div>
          {!loading && !priceError && (
            <div className="font-sharetech text-[9px] text-[#00e676] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00e676] animate-pulse" />
              PRECIOS LIVE · COINGECKO
            </div>
          )}
          {priceError && (
            <div className="font-sharetech text-[9px] text-[#ff6d00]">⚠ Sin conexión a precios</div>
          )}
          {/* Kill switch */}
          <button onClick={() => setShowKillSwitch(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 font-space text-[9px] font-bold tracking-[0.1em] uppercase border border-[#ff174433] text-[#ff1744] bg-[#ff174408] hover:bg-[#ff174018] transition-all">
            🛑 <span className="hidden md:inline">EMERGENCIA</span>
          </button>
          <Link href="/psychometriks" className="font-space text-[10px] text-[#5a8898] hover:text-[#7ab3c8] transition-colors no-underline hidden md:block">
            ← Volver a PSYCHOMETRIKS
          </Link>
        </div>

        <div className="p-6 max-w-5xl">

          {/* ── PORTFOLIO ─────────────────────────────────────────────────── */}
          {section === "portfolio" && (
            <TabErrorBoundary label="PORTFOLIO">
            <div>
              {/* PSY VAULT shortcut — visible en móvil donde el sidebar está colapsado */}
              <div className="md:hidden mb-4">
                <a href="/boveda" className="no-underline flex items-center gap-3 p-4 border border-[#00e5ff22] bg-[#00e5ff06] hover:bg-[#00e5ff12] transition-all">
                  <span className="text-2xl">🔐</span>
                  <div className="flex-1">
                    <div className="font-bebas text-lg text-white tracking-wide">PSY VAULT — BÓVEDA</div>
                    <div className="font-sharetech text-[9px] text-[#00e5ff] tracking-[0.15em]">AES-256-GCM · Semilla BIP39 · PIN · 2FA</div>
                  </div>
                  <span className="text-[#00e5ff] text-sm">→</span>
                </a>
              </div>

              {/* Total balance */}
              <div className="border bg-[#060a0f] p-6 mb-6" style={{ borderColor: connected && isRealPortfolio ? "#00e67633" : "#1a2535" }}>
                {/* Status row */}
                <div className="flex items-center gap-3 mb-3 flex-wrap">
                  {connected && isRealPortfolio ? (
                    <>
                      <div className="flex items-center gap-1.5 bg-[#00e67615] border border-[#00e67633] px-2.5 py-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#00e676] animate-pulse" />
                        <span className="font-sharetech text-[9px] tracking-[0.2em] text-[#00e676]">BALANCES REALES · ON-CHAIN</span>
                      </div>
                      <span className="font-sharetech text-[9px] text-[#5a8898]">
                        {truncateAddr(walletAddress!)} · {network}
                      </span>
                    </>
                  ) : connected && portfolioLoading ? (
                    <div className="flex items-center gap-1.5 bg-[#ffd70015] border border-[#ffd70033] px-2.5 py-1">
                      <span className="font-sharetech text-[9px] tracking-[0.2em] text-[#ffd700]">⏳ LEYENDO BLOCKCHAIN...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 bg-[#1a253515] border border-[#1a2535] px-2.5 py-1">
                      <span className="font-sharetech text-[9px] tracking-[0.2em] text-[#7ab3c8]">CUENTA PSY · CONECTÁ TU WALLET PARA VER BALANCES REALES</span>
                    </div>
                  )}
                </div>

                <div className="flex items-end gap-4 flex-wrap">
                  <div>
                    <div className="font-sharetech text-[10px] text-[#7ab3c8] mb-1">
                      {connected && isRealPortfolio ? "Balance real en USD" : "Balance Cuenta PSY"}
                    </div>
                    <div className="font-bebas text-5xl text-white">
                      {loading || portfolioLoading ? "—" : `$${totalBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    </div>
                    {connected && isRealPortfolio && (
                      <div className="font-space text-[10px] text-[#7ab3c8] mt-1">
                        {network} · ETH nativo: {ethBalance}
                      </div>
                    )}
                  </div>
                  {!connected && (
                    <div className="flex flex-col gap-2 mb-1">
                      <button onClick={openPicker} disabled={connecting}
                        className="px-6 py-3 font-space text-[11px] font-bold tracking-[0.15em] uppercase disabled:opacity-60 transition-all"
                        style={{ background: "#00e5ff", color: "#020408" }}>
                        {connecting ? "CONECTANDO..." : "⊕ ELEGIR WALLET →"}
                      </button>
                      {walletError && <div className="font-space text-[9px] text-[#ff1744]">{walletError}</div>}
                    </div>
                  )}
                  {connected && !isRealPortfolio && !portfolioLoading && (
                    <button onClick={() => setTokens(prev => { void loadRealPortfolio(walletAddress!, chainId!, prev); return prev; })}
                      className="px-4 py-2.5 font-space text-[10px] font-bold tracking-[0.15em] uppercase border border-[#00e5ff44] text-[#00e5ff] hover:bg-[#00e5ff15] transition-all">
                      ↻ LEER BALANCES ON-CHAIN
                    </button>
                  )}
                </div>

                {/* Network info when connected */}
                {connected && (
                  <div className="mt-4 pt-4 border-t border-[#1a2535] grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <div className="font-sharetech text-[8px] text-[#5a8898] mb-1">DIRECCIÓN</div>
                      <div className="font-sharetech text-[10px] text-[#00e5ff]">{truncateAddr(walletAddress!)}</div>
                    </div>
                    <div>
                      <div className="font-sharetech text-[8px] text-[#5a8898] mb-1">RED</div>
                      <div className="font-sharetech text-[10px] text-white">{network}</div>
                    </div>
                    <div>
                      <div className="font-sharetech text-[8px] text-[#5a8898] mb-1">BALANCE NATIVO</div>
                      <div className="font-sharetech text-[10px] text-[#00e676]">{ethBalance} {NATIVE_BY_CHAIN[chainId ?? ""]?.symbol ?? "ETH"}</div>
                    </div>
                    <div>
                      <div className="font-sharetech text-[8px] text-[#5a8898] mb-1">ESTADO</div>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${isRealPortfolio ? "bg-[#00e676] animate-pulse" : "bg-[#ffd700]"}`} />
                        <span className="font-sharetech text-[10px]" style={{ color: isRealPortfolio ? "#00e676" : "#ffd700" }}>
                          {isRealPortfolio ? "ON-CHAIN" : portfolioLoading ? "CARGANDO..." : "CUENTA PSY"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Portfolio error */}
                {portfolioError && (
                  <div className="mt-4 p-3 border border-[#ff6d0033] bg-[#0d0805] font-space text-[11px] text-[#ff6d00]">
                    ⚠ {portfolioError}
                    <div className="mt-1 text-[#7ab3c8] text-[10px]">
                      Redes soportadas: Ethereum, BSC, Polygon, Arbitrum, Optimism, Base. Cambiá de red en MetaMask.
                    </div>
                  </div>
                )}
              </div>

              {/* Holdings */}
              <div className="flex items-center justify-between mb-3">
                <div className="font-sharetech text-[9px] tracking-[0.3em] text-[#5a8898]">
                  {isRealPortfolio ? "MIS HOLDINGS REALES" : "MIS HOLDINGS CUENTA PSY"}
                </div>
                {connected && isRealPortfolio && (
                  <div className="font-sharetech text-[9px] text-[#00e676]">
                    {wallet.length} token{wallet.length !== 1 ? "s" : ""} · leído de blockchain
                  </div>
                )}
              </div>
              <div className="space-y-1 mb-6">
                {loading || portfolioLoading ? (
                  [1,2,3,4].map(i => <div key={i} className="h-16 bg-[#060a0f] border border-[#1a2535] animate-pulse" />)
                ) : wallet.map(token => {
                  const value = token.balance * token.price;
                  const pct = totalBalance > 0 ? (value / totalBalance) * 100 : 0;
                  const isLiqRisk = token.liqLevel && token.price ? Math.abs(token.price - token.liqLevel) / token.price < 0.05 : false;
                  return (
                    <div key={token.symbol} className="border border-[#1a2535] bg-[#060a0f] p-4 hover:border-[#1a3545] transition-colors">
                      <div className="flex items-center gap-4">
                        <img src={token.image} alt={token.symbol} className="w-8 h-8 rounded-full shrink-0" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-bebas text-xl text-white">{token.symbol}</span>
                            <span className="font-space text-[10px] text-[#7ab3c8] hidden sm:inline">{token.name}</span>
                            {isLiqRisk && <span className="font-sharetech text-[9px] text-[#ff1744] border border-[#ff174433] px-1.5 py-0.5">🚨 NEAR LIQ</span>}
                          </div>
                          <div className="h-1 bg-[#0a0f18] max-w-[120px]">
                            <div className="h-full bg-[#00e5ff22]" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-sharetech text-[12px] text-white">{fmtPrice(token.price || 0)}</div>
                          <div className="font-space text-[10px]" style={{ color: (token.change24h ?? 0) >= 0 ? "#00e676" : "#ff1744" }}>
                            {(token.change24h ?? 0) >= 0 ? "+" : ""}{(token.change24h ?? 0).toFixed(2)}%
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-bebas text-lg text-white">{fmt(value)}</div>
                          <div className="font-space text-[10px] text-[#7ab3c8]">{token.balance.toFixed(4)}</div>
                        </div>
                        <div className="shrink-0 hidden sm:block">
                          <PsyBadge score={token.psyScore} />
                        </div>
                      </div>
                      {token.liqLevel && (
                        <div className="mt-2 pt-2 border-t border-[#1a2535] flex items-center gap-2">
                          <span className="font-space text-[9px] text-[#7ab3c8]">Nivel liquidación estimado:</span>
                          <span className="font-sharetech text-[10px]" style={{ color: isLiqRisk ? "#ff1744" : "#4a6070" }}>${token.liqLevel.toLocaleString()}</span>
                          <span className="font-space text-[9px] text-[#5a8898]">(±{Math.abs(((token.price || 0) - token.liqLevel) / (token.price || 1) * 100).toFixed(1)}% del precio actual)</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Allocation donut (simple bars) */}
              <div className="border border-[#1a2535] bg-[#060a0f] p-5">
                <div className="font-sharetech text-[9px] tracking-[0.3em] text-[#5a8898] mb-4">DISTRIBUCIÓN DEL PORTFOLIO</div>
                {wallet.filter(t => t.price > 0).map(token => {
                  const value = token.balance * token.price;
                  const pct = totalBalance > 0 ? (value / totalBalance) * 100 : 0;
                  return (
                    <div key={token.symbol} className="flex items-center gap-3 mb-2">
                      <div className="font-sharetech text-[10px] text-[#8a9ab0] w-10 shrink-0">{token.symbol}</div>
                      <div className="flex-1 h-2 bg-[#0a0f18]">
                        <div className="h-full bg-[#00e5ff] transition-all duration-500" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="font-sharetech text-[10px] text-[#7ab3c8] w-12 text-right shrink-0">{pct.toFixed(1)}%</div>
                    </div>
                  );
                })}
              </div>
            </div>
            </TabErrorBoundary>
          )}

          {/* ── SWAP ──────────────────────────────────────────────────────── */}
          {section === "swap" && (
            <TabErrorBoundary label="SWAP">
              <SwapPanel tokens={tokens} walletAddress={walletAddress} chainId={chainId} onConnect={openPicker} activeWalletId={connectedWalletId} />
            </TabErrorBoundary>
          )}

          {/* ── WITHDRAW ──────────────────────────────────────────────────── */}
          {section === "withdraw" && (
            <TabErrorBoundary label="RETIRAR">
              <WithdrawPanel walletAddress={walletAddress} chainId={chainId} tokens={tokens} ethBalance={ethBalance} />
            </TabErrorBoundary>
          )}

          {/* ── MARKET ────────────────────────────────────────────────────── */}
          {section === "market" && (
            <TabErrorBoundary label="MERCADO">
              <div>
                <div className="font-sharetech text-[9px] tracking-[0.3em] text-[#5a8898] mb-4">TOP TOKENS CON SCORE PSY</div>
                <div className="border border-[#1a2535] overflow-hidden">
                  <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-0 bg-[#030609] border-b border-[#1a2535]">
                    {["TOKEN", "PRECIO", "24H", "VOL 24H", "MKT CAP", "PSY SCORE"].map(h => (
                      <div key={h} className="px-4 py-2.5 font-sharetech text-[8px] tracking-[0.2em] text-[#5a8898]">{h}</div>
                    ))}
                  </div>
                  {loading ? (
                    [1,2,3,4,5].map(i => <div key={i} className="h-14 border-b border-[#1a2535] bg-[#060a0f] animate-pulse" />)
                  ) : tokens.map((token, idx) => {
                    const chg = token.price_change_percentage_24h ?? 0;
                    const score = psyScoreForCoin(token.id, chg);
                    return (
                      <div key={token.id}
                        className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-0 border-b border-[#1a2535] bg-[#060a0f] hover:bg-[#0a0f18] transition-colors">
                        <div className="px-4 py-3 flex items-center gap-2">
                          <span className="font-space text-[10px] text-[#5a8898] w-4">{idx + 1}</span>
                          <img src={token.image} alt={token.symbol} className="w-5 h-5 rounded-full" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                          <div>
                            <div className="font-space text-[11px] text-white font-bold">{token.symbol.toUpperCase()}</div>
                            <div className="font-space text-[9px] text-[#7ab3c8] hidden sm:block">{token.name}</div>
                          </div>
                        </div>
                        <div className="px-4 py-3 flex items-center font-sharetech text-[11px] text-white">
                          {fmtPrice(token.current_price)}
                        </div>
                        <div className="px-4 py-3 flex items-center font-sharetech text-[11px]"
                          style={{ color: chg >= 0 ? "#00e676" : "#ff1744" }}>
                          {chg >= 0 ? "+" : ""}{chg.toFixed(2)}%
                        </div>
                        <div className="px-4 py-3 flex items-center font-sharetech text-[10px] text-[#8a9ab0]">
                          {fmt(token.total_volume)}
                        </div>
                        <div className="px-4 py-3 flex items-center font-sharetech text-[10px] text-[#8a9ab0]">
                          {fmt(token.market_cap)}
                        </div>
                        <div className="px-4 py-3 flex items-center">
                          <PsyBadge score={score} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                {!loading && (
                  <div className="font-space text-[9px] text-[#5a8898] mt-2 text-center">
                    Precios en tiempo real via CoinGecko · PSY Score calculado con algoritmo PSYCHOMETRIKS
                  </div>
                )}
              </div>
            </TabErrorBoundary>
          )}

          {/* ── SAFETY ────────────────────────────────────────────────────── */}
          {section === "safety" && (
            <TabErrorBoundary label="SEGURIDAD">
              <SafetyPanel />
            </TabErrorBoundary>
          )}

          {section === "history" && (
            <TabErrorBoundary label="HISTORIAL">
              <HistoryPanel walletAddress={walletAddress} chainId={chainId} />
            </TabErrorBoundary>
          )}

        </div>
      </main>
      </TabErrorBoundary>

      {/* ── Wallet Picker Modal ──────────────────────────────────────────────── */}
      {showPicker && (
        <WalletPickerModal
          opts={pickerOpts}
          onPick={opt => void handlePickWallet(opt)}
          onClose={() => { setShowPicker(false); setPickerError(""); }}
          error={pickerError}
        />
      )}

      {/* ── WalletConnect Mobile Modal ────────────────────────────────────────── */}
      {showWCModal && <WCMobileModal onClose={() => setShowWCModal(false)} />}

      {/* ── Kill Switch Modal ──────────────────────────────────────────────────── */}
      {showKillSwitch && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm px-4"
          onClick={() => setShowKillSwitch(false)}>
          <div className="bg-[#060a0f] border-2 border-[#ff174466] w-full max-w-md p-6"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-3 h-3 rounded-full bg-[#ff1744] animate-pulse" />
              <div className="font-bebas text-2xl text-[#ff1744] tracking-wide">MODO EMERGENCIA — KILL SWITCH</div>
              <button onClick={() => setShowKillSwitch(false)} className="ml-auto text-[#7ab3c8] hover:text-white font-bold">✕</button>
            </div>

            <div className="font-space text-[11px] text-[#ff6060] mb-5 leading-relaxed border border-[#ff174422] bg-[#ff174408] px-4 py-3">
              Seguí estos pasos en orden para proteger tu capital de forma inmediata.
            </div>

            <div className="space-y-3 mb-5">
              {[
                { n: "1", title: "CONVERTÍ TODO A STABLE",   body: "Usá PSY Exchange: intercambiá tus tokens a USDC o USDT. Empezá por las posiciones más grandes." },
                { n: "2", title: "CANCELÁ ÓRDENES ABIERTAS", body: "Si tenés órdenes limit en otros exchanges (Binance, OKX, Kraken), cancelalas manualmente." },
                { n: "3", title: "RETIRÁ A COLD WALLET",     body: "Una vez en stable, transferí a tu hardware wallet o dirección fría. No dejés fondos en plataformas." },
                { n: "4", title: "ANALIZÁ ANTES DE VOLVER",  body: "Tomá 24 horas. El mercado siempre da oportunidades. La mente tranquila toma mejores decisiones." },
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

            {walletAddress && (
              <div className="mb-4 border border-[#1a2535] bg-[#030609] px-4 py-3">
                <div className="font-sharetech text-[9px] text-[#5a8898] tracking-[0.15em] mb-1">WALLET CONECTADA</div>
                <div className="font-mono text-[11px] text-[#00e5ff]">{walletAddress}</div>
              </div>
            )}

            <a href="/exchange" className="no-underline block w-full py-3 text-center font-space text-[12px] font-bold tracking-[0.1em] uppercase border border-[#ff174433] text-[#ff1744] bg-[#ff174408] hover:bg-[#ff174018] transition-all mb-2">
              → IR A PSY EXCHANGE — CONVERTIR A USDC
            </a>
            <button onClick={() => setShowKillSwitch(false)}
              className="w-full py-2 font-space text-[10px] font-bold tracking-[0.1em] uppercase border border-[#1a2535] text-[#7ab3c8] hover:text-white hover:border-[#243040] transition-all">
              CERRAR
            </button>
            <div className="font-sharetech text-[9px] text-[#5a8898] text-center mt-3">
              Psicología del trading: el verdadero trader sabe cuándo no operar.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
