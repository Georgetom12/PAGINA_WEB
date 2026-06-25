import React, { useState, useEffect } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { wagmiAdapter } from "@/lib/appkit";

import Home from "@/pages/home";
import Dashboard from "@/pages/dashboard";
import Login from "@/pages/login";
import NotFound from "@/pages/not-found";
import Pricing from "@/pages/pricing";
import Indicators from "@/pages/indicators";
import Signals from "@/pages/signals";
import SignalsRealtime from "@/pages/signals-realtime";
import AltcoinsSignals from "@/pages/altcoins-signals";
import Blog from "@/pages/blog";
import BlogPost from "@/pages/blog-post";
import Calculadora from "@/pages/calculadora";
import Converter from "@/pages/converter";
import Leaderboard from "@/pages/leaderboard";
import EconomicCalendar from "@/pages/economic-calendar";
import Onboarding from "@/pages/onboarding";
import PsyScore from "@/pages/psy-score";
import Journal from "@/pages/journal";
import Replay from "@/pages/replay";
import WarRoom from "@/pages/war-room";
import PsyHeatmap from "@/pages/psy-heatmap";
import FundingDashboard from "@/pages/funding-dashboard";
import LiquidationClock from "@/pages/liquidation-clock";
import PsyScreener from "@/pages/psy-screener";
import MacroDashboard from "@/pages/macro-dashboard";
import TestsHome from "@/pages/tests-home";
import TestQuiz from "@/pages/test-quiz";
import Simulador from "@/pages/simulador";
import PsyAutopsy from "@/pages/psy-autopsy";
import PsyWallet from "@/pages/psy-wallet";
import SpotPerp from "@/pages/spot-perp";
import CiclosBTC from "@/pages/ciclos-btc";
import FedBtc from "@/pages/fed-btc";
import MarketHours from "@/pages/market-hours";
import WhaleAlert from "@/pages/whale-alert";

import Challenge from "@/pages/challenge";
import Affiliate from "@/pages/affiliate";
import ApiDocs from "@/pages/api-docs";
import Certificado from "@/pages/certificado";
import VerifyCert from "@/pages/verify-cert";
import PsyToken from "@/pages/psy-token";
import Descarga from "@/pages/descarga";
import Boveda from "@/pages/boveda";
import BotX from "@/pages/bot-x";
import BolsaValores from "@/pages/bolsa-valores";
import Equities from "@/pages/equities";
import PreEntry from "@/pages/pre-entry";
import AdnTrader from "@/pages/adn-trader";
import CostoErrores from "@/pages/costo-errores";
import Exchange from "@/pages/exchange";
import PsyIntelligenceFeed from "@/pages/psy-intelligence-feed";
import AntiRug from "@/pages/anti-rug";
import Strategies from "@/pages/strategies";
import PsyOracle from "@/pages/psy-oracle";
import CommandCenter from "@/pages/command-center";
import PsyBrain from "@/pages/psy-brain";
import OracleFeeds from "@/pages/oracle-feeds";
import AdminApis from "@/pages/admin-apis";
import ChatWidget from "@/components/chat-widget";
import MasterPanel from "@/components/master-panel";
import UpgradeWall from "@/components/upgrade-wall";
import AulaPage from "@/aula/AulaPage";
import SupportChatWidget from "@/components/support-chat-widget";
import VerifyEmail from "@/pages/verify-email";
import ResetPassword from "@/pages/reset-password";
import PsyLaunch from "@/pages/psy-launch";

import { getAuth, isAdmin, hasAccess, type PlanLevel } from "@/lib/auth";

const queryClient = new QueryClient();

// ── Plan Guard ─────────────────────────────────────────────────────────────────
// plan: required plan level | null = public | "admin" = superadmin/operator only
function Guard({
  plan,
  adminOnly = false,
  children,
}: {
  plan?: PlanLevel;
  adminOnly?: boolean;
  children: React.ReactNode;
}) {
  const auth = getAuth();

  // Not logged in at all → redirect to login
  if (!auth) {
    const raw = window.location.pathname.replace(
      import.meta.env.BASE_URL.replace(/\/$/, ""),
      ""
    ) || "/";
    window.location.replace(`/login?redirect=${encodeURIComponent(raw)}`);
    return null;
  }

  // Admin-only route (Master Panel pages, bot, realtime)
  if (adminOnly) {
    if (!isAdmin(auth)) return <UpgradeWall required="elite" isAdminRequired />;
    return <>{children}</>;
  }

  // Plan-gated route
  if (plan && !hasAccess(auth, plan)) {
    return <UpgradeWall required={plan} current={auth.plan} />;
  }

  return <>{children}</>;
}

// ── Custom Cursor ──────────────────────────────────────────────────────────────
function CustomCursor() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const update = (e: MouseEvent) => setPosition({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", update);
    return () => window.removeEventListener("mousemove", update);
  }, []);
  return (
    <>
      <div className="cursor-dot"  style={{ transform: `translate(${position.x - 4}px, ${position.y - 4}px)` }} />
      <div className="cursor-ring" style={{ transform: `translate(${position.x - 16}px, ${position.y - 16}px)` }} />
    </>
  );
}

// ── Router ─────────────────────────────────────────────────────────────────────
function Router() {
  return (
    <Switch>
      {/* ── PUBLIC ─────────────────────────────────────────────────────── */}
      <Route path="/"                component={Home} />
      <Route path="/pricing"         component={Pricing} />
      <Route path="/login"           component={Login} />
      <Route path="/blog"            component={Blog} />
      <Route path="/blog/:slug"      component={BlogPost} />
      <Route path="/tests"           component={TestsHome} />
      <Route path="/tests/:testId"   component={TestQuiz} />
      <Route path="/descarga"        component={Descarga} />
      <Route path="/onboarding"      component={Onboarding} />
      <Route path="/verify/:certCode"       component={VerifyCert} />
      <Route path="/verify-email/:token"    component={VerifyEmail} />
      <Route path="/reset-password/:token"  component={ResetPassword} />
      <Route path="/api-docs"        component={ApiDocs} />
      <Route path="/indicators"      component={Indicators} />

      {/* ── BÁSICO — cualquier miembro ──────────────────────────────────── */}
      <Route path="/dashboard"       component={() => <Guard plan="basico"><Dashboard /></Guard>} />
      <Route path="/calculadora"     component={() => <Guard plan="basico"><Calculadora /></Guard>} />
      <Route path="/converter"       component={() => <Guard plan="basico"><Converter /></Guard>} />
      <Route path="/simulador"       component={() => <Guard plan="basico"><Simulador /></Guard>} />
      <Route path="/pre-entry"       component={() => <Guard plan="basico"><PreEntry /></Guard>} />
      <Route path="/adn-trader"      component={() => <Guard plan="basico"><AdnTrader /></Guard>} />
      <Route path="/costo-errores"   component={() => <Guard plan="basico"><CostoErrores /></Guard>} />
      <Route path="/journal"         component={() => <Guard plan="basico"><Journal /></Guard>} />
      <Route path="/psy-autopsy"     component={() => <Guard plan="basico"><PsyAutopsy /></Guard>} />
      <Route path="/certificado"     component={() => <Guard plan="basico"><Certificado /></Guard>} />
      <Route path="/challenge"       component={() => <Guard plan="basico"><Challenge /></Guard>} />
      <Route path="/affiliate"       component={() => <Guard plan="basico"><Affiliate /></Guard>} />
      <Route path="/psy-token"       component={() => <Guard plan="basico"><PsyToken /></Guard>} />
      <Route path="/boveda"          component={() => <Guard plan="basico"><Boveda /></Guard>} />

      {/* ── CUALQUIER MIEMBRO (aprendiz/trader/institucional) ──────────── */}
      <Route path="/signals"          component={() => <Guard plan="basico"><Signals /></Guard>} />
      <Route path="/replay"          component={() => <Guard plan="basico"><Replay /></Guard>} />
      <Route path="/economic-calendar" component={() => <Guard plan="basico"><EconomicCalendar /></Guard>} />
      <Route path="/leaderboard"     component={() => <Guard plan="basico"><Leaderboard /></Guard>} />
      <Route path="/aula"            component={() => <Guard plan="basico"><AulaPage /></Guard>} />

      {/* ── LIQMAP PRO — requiere plan trader/pro o superior ────────────── */}
      <Route path="/psy-feed"        component={() => <Guard plan="pro"><PsyIntelligenceFeed /></Guard>} />
      <Route path="/heatmap"         component={() => <Guard plan="pro"><PsyHeatmap /></Guard>} />
      <Route path="/funding"         component={() => <Guard plan="pro"><FundingDashboard /></Guard>} />
      <Route path="/liquidations"    component={() => <Guard plan="pro"><LiquidationClock /></Guard>} />
      <Route path="/screener"        component={() => <Guard plan="pro"><PsyScreener /></Guard>} />
      <Route path="/macro"           component={() => <Guard plan="pro"><MacroDashboard /></Guard>} />
      <Route path="/spot-perp"       component={() => <Guard plan="pro"><SpotPerp /></Guard>} />
      <Route path="/ciclos-btc"      component={() => <Guard plan="pro"><CiclosBTC /></Guard>} />
      <Route path="/fed-btc"         component={() => <Guard plan="pro"><FedBtc /></Guard>} />
      <Route path="/market-hours"    component={() => <Guard plan="pro"><MarketHours /></Guard>} />
      <Route path="/psy-score"       component={() => <Guard plan="pro"><PsyScore /></Guard>} />
      <Route path="/war-room"        component={() => <Guard plan="pro"><WarRoom /></Guard>} />

      {/* ── LIQMAP ELITE — requiere plan institucional/elite o superior ──── */}
      <Route path="/whale-alert"     component={() => <Guard plan="elite"><WhaleAlert /></Guard>} />
      <Route path="/bolsa"           component={() => <Guard plan="elite"><BolsaValores /></Guard>} />
      <Route path="/altcoins-signals" component={() => <Guard plan="elite"><AltcoinsSignals /></Guard>} />
      <Route path="/equities"        component={() => <Guard plan="elite"><Equities /></Guard>} />
      <Route path="/anti-rug"        component={() => <Guard plan="elite"><AntiRug /></Guard>} />
      <Route path="/strategies"      component={() => <Guard plan="elite"><Strategies /></Guard>} />
      <Route path="/psy-oracle"      component={() => <Guard plan="elite"><PsyOracle /></Guard>} />
      <Route path="/command-center" component={() => <Guard plan="elite"><CommandCenter /></Guard>} />
      <Route path="/psy-brain"      component={() => <Guard plan="elite"><PsyBrain /></Guard>} />
      <Route path="/oracle-feeds"   component={() => <Guard plan="elite"><OracleFeeds /></Guard>} />

      {/* ── /liqmap hub → redirige a spot-perp ─────────────────────────── */}
      <Route path="/liqmap" component={() => { React.useEffect(() => { window.location.replace(import.meta.env.BASE_URL.replace(/\/$/, "") + "/spot-perp"); }, []); return null; }} />

      {/* ── EXCHANGE — acceso público, solo requiere wallet conectada ──── */}
      <Route path="/exchange"    component={Exchange} />
      <Route path="/psy-wallet"  component={PsyWallet} />
      <Route path="/psy-launch"  component={PsyLaunch} />

      {/* ── SOLO ADMINISTRADORES ────────────────────────────────────────── */}
      <Route path="/admin/apis"      component={() => <Guard adminOnly><AdminApis /></Guard>} />
      <Route path="/realtime"        component={() => <Guard adminOnly><SignalsRealtime /></Guard>} />
      <Route path="/bot-x"           component={() => <Guard adminOnly><BotX /></Guard>} />

      <Route component={NotFound} />
    </Switch>
  );
}

// ── MasterPanel wrapper — solo superadmin/operator ─────────────────────────────
function AdminPanel() {
  const auth = getAuth();
  if (!isAdmin(auth)) return null;
  return <MasterPanel />;
}

// ── App ────────────────────────────────────────────────────────────────────────
function App() {
  return (
    <div className="dark">
      <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <CustomCursor />
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <ChatWidget />
          <AdminPanel />
          <SupportChatWidget />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
      </WagmiProvider>
    </div>
  );
}

export default App;
