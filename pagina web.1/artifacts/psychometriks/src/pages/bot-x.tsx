import React, { useState, useRef } from "react";
import SiteNav from "@/components/site-nav";

const API = import.meta.env.BASE_URL.replace(/\/$/, "");

// ─── Plan Gate ────────────────────────────────────────────────────────────────
function PlanGate() {
  return (
    <div className="min-h-screen bg-[#020408] text-white font-rajdhani flex flex-col">
      <SiteNav />
      <div className="flex-1 flex items-center justify-center px-6 pt-20">
        <div className="border border-[#1a2535] bg-[#060a0f] p-10 max-w-md w-full text-center">
          <div className="text-5xl mb-5">🔒</div>
          <div className="font-sharetech text-[9px] tracking-[0.4em] text-[#e040fb] mb-3">ACCESO RESTRINGIDO</div>
          <div className="font-bebas text-3xl text-white mb-2">BOT X</div>
          <div className="font-space text-[12px] text-[#7a9aaa] mb-6 leading-relaxed">
            Esta herramienta está disponible exclusivamente para miembros del plan
            <span className="text-[#e040fb] font-bold"> Institucional</span>.
          </div>
          <div className="border border-[#e040fb33] bg-[#e040fb08] px-5 py-4 mb-6">
            <div className="font-sharetech text-[10px] tracking-[0.2em] text-[#e040fb] mb-3">⬡ PLAN INSTITUCIONAL — $99/mes</div>
            <div className="space-y-1.5 text-left">
              {["Bot X — Generador de posts para X/Twitter","Análisis de señales avanzado","PSY AUTOPSY — Forense de trades","PSY JOURNAL IA — Diario con IA","Aula Virtual completa"].map(f => (
                <div key={f} className="flex items-center gap-2 font-space text-[11px] text-[#8a9ab0]">
                  <span className="text-[#e040fb] text-[9px]">✦</span> {f}
                </div>
              ))}
            </div>
          </div>
          <a href="/pricing"
            className="block w-full py-3 font-space text-[12px] font-bold tracking-[0.2em] uppercase text-[#020408] transition-opacity hover:opacity-90"
            style={{ background: "#e040fb" }}>
            VER PLANES →
          </a>
          <div className="mt-4 font-space text-[10px] text-[#5a8898]">
            ¿Ya sos miembro? <a href="/login" className="text-[#00e5ff] hover:underline">Iniciá sesión</a>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────
type Style = "analysis" | "educational" | "alert";

const STYLE_OPTIONS: { id: Style; label: string; icon: string; desc: string; color: string }[] = [
  { id: "analysis",    label: "ANÁLISIS",   icon: "📊", desc: "Análisis técnico Wyckoff + CVD",   color: "#00e5ff" },
  { id: "educational", label: "EDUCATIVO",  icon: "🎓", desc: "Contenido formativo que engancha",  color: "#00e676" },
  { id: "alert",       label: "ALERTA",     icon: "⚡", desc: "Señal urgente de mercado",           color: "#ffd700" },
];

const TONES = [
  "Brutal y honesto", "Filosófico", "Urgente", "Didáctico", "Provocador",
  "Inspirador", "Técnico extremo", "Street trader",
];

const PAIRS = ["BTC/USDT","ETH/USDT","SOL/USDT","BNB/USDT","XRP/USDT","Mercado general","DeFi","Altcoins","Macro cripto"];

interface Post {
  id: string;
  text: string;
  style: Style;
  topic: string;
  ts: number;
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).catch(() => {});
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function BotX() {
  const auth = (() => { try { return JSON.parse(localStorage.getItem("psyko_auth") ?? "null") as { user?: string; role?: string; plan?: string; token?: string } | null; } catch { return null; } })();
  const plan = auth?.plan ?? "";
  const isInstitucional = plan === "elite" || auth?.role === "superadmin";
  if (!isInstitucional) return <PlanGate />;

  return <BotXApp auth={auth} />;
}

function BotXApp({ auth }: { auth: { user?: string; role?: string; plan?: string; token?: string } | null }) {
  const [style, setStyle] = useState<Style>("analysis");
  const [topic, setTopic] = useState("");
  const [pair, setPair] = useState("");
  const [marketContext, setMarketContext] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [tone, setTone] = useState("");
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [history, setHistory] = useState<Post[]>([]);
  const [copied, setCopied] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const styleInfo = STYLE_OPTIONS.find(s => s.id === style)!;

  async function generate() {
    if (!topic.trim()) return;
    setLoading(true);
    setOutput("");
    setError("");
    abortRef.current = new AbortController();

    try {
      const res = await fetch(`${API}/api/bot-x`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-PSY-Token": auth?.token ?? "" },
        body: JSON.stringify({ topic, style, pair: pair || undefined, marketContext: marketContext || undefined, additionalInfo: additionalInfo || undefined, tone: tone || undefined }),
        signal: abortRef.current.signal,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error ?? `Error ${res.status}`);
      }
      if (!res.body) throw new Error("Stream BOT-X no disponible");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";
        for (const part of parts) {
          if (!part.startsWith("data: ")) continue;
          try {
            const json = JSON.parse(part.slice(6)) as { text?: string; done?: boolean; error?: string };
            if (json.error) { setError(json.error); break; }
            if (json.done) break;
            if (json.text) { fullText += json.text; setOutput(prev => prev + json.text); }
          } catch { /* skip */ }
        }
      }
      if (fullText.length > 20) {
        const post: Post = { id: Date.now().toString(), text: fullText, style, topic, ts: Date.now() };
        setHistory(prev => [post, ...prev].slice(0, 30));
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setError((err as Error).message ?? "Error de conexión");
      }
    } finally {
      setLoading(false);
    }
  }

  function handleCopy(text: string) {
    copyToClipboard(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function charCount(text: string) {
    return text.length;
  }

  return (
    <div className="min-h-screen bg-[#020408] text-white font-rajdhani">
      <SiteNav />

      {/* Hero */}
      <section className="pt-28 pb-6 px-6 md:px-12 max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <div className="font-sharetech text-[9px] tracking-[0.3em] text-[#e040fb] border border-[#e040fb30] px-3 py-1.5 uppercase">
            𝕏 BOT X · GENERADOR IA · CLAUDE SONNET
          </div>
          <div className="font-sharetech text-[9px] tracking-[0.2em] text-[#ffd700] border border-[#ffd70033] px-3 py-1.5">
            ⬡ PLAN INSTITUCIONAL
          </div>
        </div>
        <h1 className="font-bebas text-[clamp(40px,6vw,80px)] leading-none mb-2">
          GENERADOR DE POSTS <span className="text-[#e040fb]">PARA X</span>
        </h1>
        <p className="font-space text-[12px] text-[#7ab3c8] max-w-xl leading-relaxed">
          Claude genera posts virales de análisis cripto con la voz y metodología de PSYCHOMETRIKS. Copiá y publicá directo.
        </p>
      </section>

      {/* Main */}
      <section className="px-6 md:px-12 pb-24 max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-[1fr_420px] gap-6">

          {/* ── Left: Form ─────────────────────────────────────────────────── */}
          <div className="space-y-5">

            {/* Style selector */}
            <div className="grid grid-cols-3 gap-px bg-[#1a2535]">
              {STYLE_OPTIONS.map(s => (
                <button key={s.id} onClick={() => setStyle(s.id)}
                  className="py-5 px-3 text-center transition-all"
                  style={{ background: style === s.id ? `${s.color}12` : "#060a0f", borderBottom: style === s.id ? `2px solid ${s.color}` : "2px solid transparent" }}>
                  <div className="text-2xl mb-1">{s.icon}</div>
                  <div className="font-sharetech text-[10px] tracking-[0.15em]" style={{ color: style === s.id ? s.color : "#4a6070" }}>{s.label}</div>
                  <div className="font-space text-[9px] text-[#5a8898] mt-1">{s.desc}</div>
                </button>
              ))}
            </div>

            {/* Topic */}
            <div>
              <label className="font-sharetech text-[9px] tracking-[0.25em] text-[#5a8898] block mb-2 uppercase">Tema del Post *</label>
              <textarea
                value={topic}
                onChange={e => setTopic(e.target.value)}
                rows={3}
                placeholder={
                  style === "analysis" ? "Ej: BTC rechazó resistencia en 97k con CVD bajista y Whale Flow negativo..." :
                  style === "educational" ? "Ej: Por qué el 90% de traders pierde en el UTAD..." :
                  "Ej: BTC rompiendo zona clave con alto volumen y funding extremo..."
                }
                className="w-full bg-[#060a0f] border border-[#1a2535] text-white font-space text-[12px] px-4 py-3 resize-none focus:outline-none transition-all"
                style={{ fontFamily: "'Space Mono', monospace" }}
                onFocus={e => (e.target.style.borderColor = "#e040fb44")}
                onBlur={e => (e.target.style.borderColor = "#1a2535")}
              />
            </div>

            {/* Pair + Tone */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-sharetech text-[9px] tracking-[0.25em] text-[#5a8898] block mb-2 uppercase">Par / Activo</label>
                <div className="flex flex-wrap gap-1.5">
                  {PAIRS.slice(0,6).map(p => (
                    <button key={p} onClick={() => setPair(pair === p ? "" : p)}
                      className="font-space text-[10px] px-2.5 py-1 border transition-all"
                      style={{ borderColor: pair === p ? "#e040fb" : "#1a2535", color: pair === p ? "#e040fb" : "#4a6070", background: pair === p ? "#e040fb15" : "transparent" }}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="font-sharetech text-[9px] tracking-[0.25em] text-[#5a8898] block mb-2 uppercase">Tono</label>
                <div className="flex flex-wrap gap-1.5">
                  {TONES.slice(0,5).map(t => (
                    <button key={t} onClick={() => setTone(tone === t ? "" : t)}
                      className="font-space text-[10px] px-2.5 py-1 border transition-all"
                      style={{ borderColor: tone === t ? "#00e5ff" : "#1a2535", color: tone === t ? "#00e5ff" : "#4a6070", background: tone === t ? "#00e5ff15" : "transparent" }}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Context */}
            <div>
              <label className="font-sharetech text-[9px] tracking-[0.25em] text-[#5a8898] block mb-2 uppercase">Contexto de Mercado <span className="text-[#1a2535]">(opcional)</span></label>
              <input
                value={marketContext}
                onChange={e => setMarketContext(e.target.value)}
                placeholder="Ej: BTC en $96,500 | Dominance 53% | Funding +0.04% | OI bajando"
                className="w-full bg-[#060a0f] border border-[#1a2535] text-white font-space text-[11px] px-4 py-2.5 focus:outline-none transition-all"
                onFocus={e => (e.target.style.borderColor = "#e040fb44")}
                onBlur={e => (e.target.style.borderColor = "#1a2535")}
              />
            </div>

            {/* Additional */}
            <div>
              <label className="font-sharetech text-[9px] tracking-[0.25em] text-[#5a8898] block mb-2 uppercase">Info adicional / Ángulo específico</label>
              <input
                value={additionalInfo}
                onChange={e => setAdditionalInfo(e.target.value)}
                placeholder="Ej: Mencionar el PSY-ULT1 score en 28, zona de liquidaciones en 94k"
                className="w-full bg-[#060a0f] border border-[#1a2535] text-white font-space text-[11px] px-4 py-2.5 focus:outline-none transition-all"
                onFocus={e => (e.target.style.borderColor = "#e040fb44")}
                onBlur={e => (e.target.style.borderColor = "#1a2535")}
              />
            </div>

            {/* Generate button */}
            <button
              onClick={generate}
              disabled={loading || !topic.trim()}
              className="w-full py-4 font-space text-[13px] font-bold tracking-[0.2em] uppercase transition-all"
              style={{
                background: loading || !topic.trim() ? "#1a1030" : "linear-gradient(135deg, #e040fb, #9c27b0)",
                color: loading || !topic.trim() ? "#5a3060" : "#fff",
                cursor: loading || !topic.trim() ? "not-allowed" : "pointer",
              }}>
              {loading ? "⏳ GENERANDO POST..." : `✦ GENERAR POST ${styleInfo.icon}`}
            </button>

            {error && (
              <div className="border border-[#ff174433] bg-[#ff174408] px-4 py-3 font-space text-[11px] text-[#ff1744]">
                ⚠ {error}
              </div>
            )}
          </div>

          {/* ── Right: Output + History ─────────────────────────────────────── */}
          <div className="space-y-4">

            {/* Output */}
            <div className="border border-[#e040fb33] bg-[#0a060f]">
              <div className="px-5 py-3 border-b border-[#e040fb22] flex items-center justify-between">
                <div className="font-sharetech text-[9px] tracking-[0.3em] text-[#e040fb] flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${loading ? "animate-pulse bg-[#e040fb]" : "bg-[#5a8898]"}`} />
                  {loading ? "GENERANDO..." : output ? "POST LISTO" : "RESULTADO"}
                </div>
                {output && !loading && (
                  <div className="flex items-center gap-3">
                    <span className="font-sharetech text-[9px] text-[#5a8898]">{charCount(output)} car.</span>
                    <button onClick={() => handleCopy(output)}
                      className="font-space text-[9px] px-3 py-1 border transition-all"
                      style={{ borderColor: copied ? "#00e676" : "#e040fb44", color: copied ? "#00e676" : "#e040fb" }}>
                      {copied ? "✓ COPIADO" : "📋 COPIAR"}
                    </button>
                  </div>
                )}
              </div>
              <div className="p-5 min-h-[280px] flex items-start">
                {!output && !loading && (
                  <div className="w-full flex flex-col items-center justify-center py-12 text-center">
                    <div className="text-4xl mb-3">𝕏</div>
                    <div className="font-space text-[11px] text-[#5a8898]">Tu post aparecerá aquí</div>
                  </div>
                )}
                {(output || loading) && (
                  <div className="font-space text-[12px] text-[#d0e8ff] leading-[1.7] whitespace-pre-wrap w-full">
                    {output}
                    {loading && <span className="inline-block w-[2px] h-[14px] bg-[#e040fb] animate-pulse ml-0.5 align-middle" />}
                  </div>
                )}
              </div>
              {output && !loading && (
                <div className="px-5 pb-4 flex gap-2">
                  <button
                    onClick={generate}
                    className="flex-1 py-2.5 font-space text-[10px] font-bold tracking-[0.1em] uppercase border border-[#e040fb44] text-[#e040fb] hover:bg-[#e040fb10] transition-colors">
                    ↺ REGENERAR
                  </button>
                  <button
                    onClick={() => { setOutput(""); setError(""); }}
                    className="px-4 py-2.5 font-space text-[10px] text-[#7ab3c8] border border-[#1a2535] hover:text-[#ff1744] hover:border-[#ff174430] transition-colors">
                    ✕
                  </button>
                </div>
              )}
            </div>

            {/* Tips */}
            <div className="border border-[#1a2535] bg-[#060a0f] p-5">
              <div className="font-sharetech text-[9px] tracking-[0.3em] text-[#5a8898] mb-3">💡 TIPS PARA MAYOR ENGAGEMENT</div>
              <div className="space-y-2">
                {[
                  "Publicá BTC en horario de NY (14:00-18:00 UTC)",
                  "Los threads de 3-5 posts tienen 3x más alcance",
                  "Terminá siempre con una pregunta al público",
                  "Usá el post como hilo: primero el gancho, luego el análisis",
                ].map(tip => (
                  <div key={tip} className="flex items-start gap-2">
                    <span className="text-[#e040fb] text-[9px] mt-0.5">▸</span>
                    <span className="font-space text-[10px] text-[#7a9aaa] leading-relaxed">{tip}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* History */}
            {history.length > 0 && (
              <div className="border border-[#1a2535] bg-[#060a0f]">
                <div className="px-5 py-3 border-b border-[#1a2535]">
                  <div className="font-sharetech text-[9px] tracking-[0.3em] text-[#5a8898]">POSTS GENERADOS ({history.length})</div>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {history.map(post => (
                    <div key={post.id} className="px-5 py-3 border-b border-[#1a2535] last:border-0 hover:bg-[#0a0f18] transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-sharetech text-[8px] text-[#5a8898] tracking-[0.1em]">{STYLE_OPTIONS.find(s => s.id === post.style)?.icon} {post.style.toUpperCase()} · {new Date(post.ts).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}</div>
                        <button onClick={() => handleCopy(post.text)} className="font-space text-[8px] text-[#7ab3c8] hover:text-[#e040fb] transition-colors">COPIAR</button>
                      </div>
                      <div className="font-space text-[10px] text-[#7a9aaa] line-clamp-2 leading-relaxed">{post.text.slice(0, 120)}...</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
