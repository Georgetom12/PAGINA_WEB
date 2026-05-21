import React, { useState, useEffect } from "react";
import SiteNav from "@/components/site-nav";

type OS = "ios" | "android" | "desktop" | "unknown";

function detectOS(): OS {
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return "ios";
  if (/android/i.test(ua)) return "android";
  if (/Windows|Mac|Linux/.test(ua)) return "desktop";
  return "unknown";
}

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

const ANDROID_STEPS = [
  { icon: "1️⃣", title: "Abre Chrome", desc: "Abre esta página en Chrome para Android. Si estás en otro navegador, cópiala y pégala en Chrome." },
  { icon: "2️⃣", title: "Toca el menú ⋮", desc: "Toca los tres puntos verticales en la esquina superior derecha de Chrome." },
  { icon: "3️⃣", title: `Toca "Añadir a pantalla de inicio"`, desc: `Aparecerá la opción "Añadir a pantalla de inicio" o "Instalar app". Tócala.` },
  { icon: "4️⃣", title: "Confirma la instalación", desc: `Toca "AÑADIR" en el popup de confirmación. El icono de PSYCHOMETRIKS aparecerá en tu pantalla de inicio.` },
  { icon: "5️⃣", title: "¡Listo!", desc: "Abre la app desde tu pantalla de inicio. Funciona como app nativa: pantalla completa, sin barra del navegador, con acceso offline." },
];

const IOS_STEPS = [
  { icon: "1️⃣", title: "Abre Safari", desc: "Abre esta página en Safari (el navegador nativo de Apple). Chrome y Firefox en iOS NO soportan instalación de apps." },
  { icon: "2️⃣", title: "Toca el botón Compartir", desc: "Toca el ícono de Compartir (□↑) en la barra inferior de Safari. Está entre el botón de atrás y el de favoritos." },
  { icon: "3️⃣", title: `Toca "En la pantalla de inicio"`, desc: `Desliza hacia abajo en el menú de compartir y toca "En la pantalla de inicio" (Add to Home Screen).` },
  { icon: "4️⃣", title: "Confirma el nombre", desc: `Verás "PSYCHOMETRIKS" como nombre. Toca "Añadir" en la esquina superior derecha.` },
  { icon: "5️⃣", title: "¡Listo!", desc: "El ícono de PSY aparecerá en tu pantalla de inicio. Ábrelo como cualquier app nativa." },
];

const FEATURES = [
  { icon: "⚡", text: "LiqMap PRO en tiempo real" },
  { icon: "🧠", text: "PSY Score + Análisis IA" },
  { icon: "📊", text: "Spot vs Perpetuos · Ciclos BTC" },
  { icon: "🐋", text: "Whale Alert on-chain" },
  { icon: "🕐", text: "Market Hours globales" },
  { icon: "📓", text: "Journal de Trading con IA" },
  { icon: "💀", text: "Simulador de Liquidación" },
  { icon: "🏆", text: "Challenge 30 Días" },
  { icon: "📡", text: "Screener 50 cryptos" },
  { icon: "📅", text: "Calendario Económico" },
];

export default function Descarga() {
  const [os, setOs] = useState<OS>("unknown");
  const [installed, setInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const [installing, setInstalling] = useState(false);
  const [activeTab, setActiveTab] = useState<"android" | "ios">("android");

  useEffect(() => {
    setOs(detectOS());
    setInstalled(isStandalone());
    if (detectOS() === "ios") setActiveTab("ios");

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setInstalled(true));
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function installAndroid() {
    if (!deferredPrompt) return;
    setInstalling(true);
    const prompt = deferredPrompt as BeforeInstallPromptEvent;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setDeferredPrompt(null);
    setInstalling(false);
  }

  const siteUrl = typeof window !== "undefined"
    ? `${window.location.origin}/`
    : "https://psychometriks.trade/";

  const steps = activeTab === "android" ? ANDROID_STEPS : IOS_STEPS;

  return (
    <div className="min-h-screen bg-[#020b12] text-white">
      <SiteNav />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16">

        {/* Header */}
        <div className="mb-8 text-center">
          <div className="font-sharetech text-[9px] tracking-[0.3em] text-[#7ab3c8] mb-3">PSYCHOMETRIKS · MOBILE</div>
          <h1 className="font-bebas text-5xl md:text-6xl leading-none text-white mb-3">
            DESCARGA LA <span className="text-[#00e5ff]">APP</span>
          </h1>
          <p className="font-space text-[11px] text-[#7ab3c8] max-w-md mx-auto">
            Instala PSYCHOMETRIKS en tu teléfono en menos de 30 segundos. Funciona en iOS y Android. Sin App Store. Sin Play Store.
          </p>
        </div>

        {/* Already installed banner */}
        {installed && (
          <div className="mb-6 border border-[#00e67640] bg-[#001a0a] p-4 flex items-center gap-3">
            <div className="text-2xl">✅</div>
            <div>
              <div className="font-sharetech text-[9px] tracking-[0.2em] text-[#00e676] mb-0.5">APP INSTALADA</div>
              <div className="font-space text-[10px] text-[#6a8090]">Ya tienes PSYCHOMETRIKS instalada. Ábrela desde tu pantalla de inicio.</div>
            </div>
          </div>
        )}

        {/* One-click install for Android with Chrome prompt */}
        {deferredPrompt && !installed && (
          <div className="mb-8 border border-[#00e5ff40] bg-[#001a20] p-6 text-center">
            <div className="font-bebas text-2xl text-[#00e5ff] mb-2">INSTALACIÓN DIRECTA DISPONIBLE</div>
            <div className="font-space text-[10px] text-[#6a8090] mb-4">Tu navegador soporta instalación directa. Un toque y listo.</div>
            <button onClick={installAndroid} disabled={installing}
              className="px-10 py-4 bg-[#00e5ff] text-black font-bebas text-2xl tracking-widest hover:bg-white transition-colors disabled:opacity-50">
              {installing ? "INSTALANDO..." : "📲 INSTALAR AHORA"}
            </button>
          </div>
        )}

        {/* OS detection banner */}
        {os !== "unknown" && !deferredPrompt && (
          <div className="mb-6 border border-[#ffd70030] bg-[#0a0900] p-3 flex items-center gap-3">
            <div className="text-lg">{os === "ios" ? "🍎" : os === "android" ? "🤖" : "💻"}</div>
            <div className="font-space text-[10px] text-[#8a9090]">
              {os === "ios" && "Detectamos que usas iOS. Sigue los pasos para Safari de abajo."}
              {os === "android" && "Detectamos que usas Android. Sigue los pasos para Chrome de abajo."}
              {os === "desktop" && "En desktop puedes instalar desde Chrome: menú ⋮ → Instalar PSYCHOMETRIKS."}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {/* Install steps */}
          <div>
            {/* OS tabs */}
            <div className="flex gap-2 mb-5">
              <button onClick={() => setActiveTab("android")}
                className={`flex-1 py-2.5 font-sharetech text-[9px] tracking-[0.2em] border transition-colors ${activeTab === "android" ? "border-[#00e676] text-[#00e676] bg-[#001a0a]" : "border-[#0d2030] text-[#7ab3c8]"}`}>
                🤖 ANDROID
              </button>
              <button onClick={() => setActiveTab("ios")}
                className={`flex-1 py-2.5 font-sharetech text-[9px] tracking-[0.2em] border transition-colors ${activeTab === "ios" ? "border-[#aaaaff] text-[#aaaaff] bg-[#0a0a1a]" : "border-[#0d2030] text-[#7ab3c8]"}`}>
                🍎 iOS (iPhone/iPad)
              </button>
            </div>

            <div className="space-y-3">
              {steps.map((step, i) => (
                <div key={i} className="flex gap-3 border border-[#0d2030] bg-[#040f18] p-4">
                  <div className="text-lg shrink-0">{step.icon}</div>
                  <div>
                    <div className="font-sharetech text-[9px] tracking-[0.1em] text-white mb-1">{step.title}</div>
                    <div className="font-space text-[9px] text-[#6a8090] leading-relaxed">{step.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {activeTab === "android" && (
              <div className="mt-4 border border-[#00e5ff20] bg-[#00121a] p-3">
                <div className="font-space text-[9px] text-[#7ab3c8]">
                  💡 <strong className="text-[#00e5ff]">Tip:</strong> Si Chrome no muestra la opción, actualízalo a la versión más reciente desde Play Store.
                </div>
              </div>
            )}
            {activeTab === "ios" && (
              <div className="mt-4 border border-[#aaaaff20] bg-[#0a0a18] p-3">
                <div className="font-space text-[9px] text-[#7ab3c8]">
                  💡 <strong className="text-[#aaaaff]">Importante:</strong> Solo funciona en Safari. Chrome y Firefox en iOS no soportan esta función por restricciones de Apple.
                </div>
              </div>
            )}
          </div>

          {/* App preview / visual */}
          <div className="flex flex-col gap-4">
            {/* Mock phone */}
            <div className="border border-[#0d2030] bg-[#040f18] p-6 flex items-center justify-center">
              <div className="relative" style={{ width: 200 }}>
                {/* Phone frame */}
                <div className="border-2 border-[#5a8898] rounded-[24px] overflow-hidden bg-[#020b12] p-2" style={{ aspectRatio: "9/19" }}>
                  {/* Status bar */}
                  <div className="flex justify-between items-center px-2 py-1 mb-1">
                    <span className="font-space text-[6px] text-[#7ab3c8]">9:41</span>
                    <div className="font-sharetech text-[7px] text-[#00e5ff] tracking-widest">PSY</div>
                    <span className="font-space text-[6px] text-[#7ab3c8]">●●●</span>
                  </div>
                  {/* Notch */}
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-3 bg-[#0d2030] rounded-full" />
                  {/* App content preview */}
                  <div className="px-1 space-y-1.5">
                    <div className="bg-[#040f18] border border-[#0d2030] p-2 rounded">
                      <div className="font-sharetech text-[6px] text-[#00e5ff] tracking-widest mb-1">PSY SCORE</div>
                      <div className="font-bebas text-2xl text-[#00e676]">72</div>
                      <div className="h-1 bg-[#0d2030] rounded mt-1">
                        <div className="h-full w-[72%] bg-[#00e676] rounded" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      <div className="bg-[#040f18] border border-[#0d2030] p-1.5 rounded">
                        <div className="font-sharetech text-[5px] text-[#7ab3c8]">BTC</div>
                        <div className="font-bebas text-sm text-[#ffd700]">$78.5K</div>
                      </div>
                      <div className="bg-[#040f18] border border-[#0d2030] p-1.5 rounded">
                        <div className="font-sharetech text-[5px] text-[#7ab3c8]">ETH</div>
                        <div className="font-bebas text-sm text-[#627eea]">$3.1K</div>
                      </div>
                    </div>
                    <div className="bg-[#040f18] border border-[#ff174430] p-2 rounded">
                      <div className="font-sharetech text-[5px] text-[#ff6d00]">⚡ WHALE ALERT</div>
                      <div className="font-space text-[5px] text-[#6a8090] mt-0.5">ENTRADA CEX · $47.2M BTC</div>
                    </div>
                    <div className="bg-[#040f18] border border-[#0d2030] p-2 rounded">
                      <div className="font-sharetech text-[5px] text-[#7ab3c8]">LIQMAP · SPOT vs PERP</div>
                      <div className="flex gap-0.5 mt-1 h-6 items-end">
                        {[60,75,55,80,70,90,65,85,75,95,70,80].map((h, i) => (
                          <div key={i} className="flex-1 rounded-sm" style={{ height: `${h}%`, backgroundColor: h > 70 ? "#00e676" : "#ff6d00" }} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                {/* Home button */}
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-8 h-1 bg-[#5a8898] rounded-full" />
              </div>
            </div>

            {/* URL to share */}
            <div className="border border-[#0d2030] bg-[#040f18] p-4">
              <div className="font-sharetech text-[8px] tracking-[0.2em] text-[#7ab3c8] mb-2">URL DE LA APP</div>
              <div className="flex gap-2">
                <div className="flex-1 bg-[#020b12] border border-[#0d2030] px-3 py-2 font-space text-[9px] text-[#8a9090] truncate">
                  {siteUrl}
                </div>
                <button onClick={() => navigator.clipboard.writeText(siteUrl).catch(() => {})}
                  className="shrink-0 px-3 py-2 font-sharetech text-[8px] tracking-[0.1em] border border-[#0d2030] text-[#7ab3c8] hover:border-[#00e5ff] hover:text-[#00e5ff] transition-colors">
                  COPIAR
                </button>
              </div>
              <div className="font-space text-[8px] text-[#5a8898] mt-2">
                Comparte esta URL con quien quieras instalar la app
              </div>
            </div>
          </div>
        </div>

        {/* Features of the app */}
        <div className="border border-[#0d2030] bg-[#040f18] p-6 mb-8">
          <div className="font-sharetech text-[9px] tracking-[0.3em] text-[#7ab3c8] mb-4">QUÉ INCLUYE LA APP</div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {FEATURES.map(f => (
              <div key={f.text} className="flex items-center gap-2 border border-[#0d2030] bg-[#020b12] px-3 py-2">
                <span className="text-sm shrink-0">{f.icon}</span>
                <span className="font-space text-[9px] text-[#6a8090]">{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* PWA vs native */}
        <div className="border border-[#0d2030] bg-[#040f18] p-5 mb-8">
          <div className="font-sharetech text-[9px] tracking-[0.3em] text-[#7ab3c8] mb-4">¿POR QUÉ COMO PWA Y NO EN APP STORE?</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: "⚡", title: "INSTANTÁNEO", desc: "Sin esperar revisión de Apple o Google. La app siempre está actualizada automáticamente sin actualizar nada." },
              { icon: "🔒", title: "IGUALMENTE SEGURO", desc: "HTTPS obligatorio, misma seguridad que cualquier app nativa. Tus datos nunca salen de tu dispositivo (localStorage)." },
              { icon: "📲", title: "MISMA EXPERIENCIA", desc: "Pantalla completa, ícono propio, funciona offline, no hay barra de navegador. Igual que una app de App Store." },
            ].map(f => (
              <div key={f.title} className="border-l-2 border-[#00e5ff40] pl-4">
                <div className="text-xl mb-1">{f.icon}</div>
                <div className="font-sharetech text-[8px] tracking-[0.15em] text-[#00e5ff] mb-1">{f.title}</div>
                <div className="font-space text-[9px] text-[#6a8090] leading-relaxed">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Trouble */}
        <div className="text-center font-space text-[10px] text-[#7ab3c8]">
          ¿Problemas para instalar? Escríbenos en{" "}
          <a href="https://t.me/psychometriks_pro" target="_blank" rel="noopener noreferrer" className="text-[#229ED9] hover:underline">
            Telegram @psychometriks_pro
          </a>
        </div>

      </div>
    </div>
  );
}

// TypeScript fix for BeforeInstallPromptEvent
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
