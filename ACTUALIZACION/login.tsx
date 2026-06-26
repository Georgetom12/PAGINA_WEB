import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";

type LoginTab = "login" | "register" | "forgot";

export default function Login() {
  const [, setLocation] = useLocation();
  const [tab, setTab] = useState<LoginTab>(() => {
    const p = new URLSearchParams(window.location.search).get("tab");
    return p === "register" ? "register" : "login";
  });

  const [user, setUser]   = useState("");
  const [pass, setPass]   = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [rUser, setRUser]   = useState("");
  const [rEmail, setREmail] = useState("");
  const [rPass, setRPass]   = useState("");
  const [rMsg, setRMsg]     = useState("");
  const [rOk, setROk]       = useState(false);

  const [fEmail, setFEmail] = useState("");
  const [fMsg, setFMsg]     = useState("");
  const [fOk, setFOk]       = useState(false);

  const rawRedirect = new URLSearchParams(window.location.search).get("redirect");
  const redirectTarget =
    rawRedirect && rawRedirect.startsWith("/") && !rawRedirect.startsWith("//")
      ? rawRedirect
      : null;

  const handleLogin = async () => {
    if (!user.trim() || !pass.trim()) {
      setError("Completa los campos de acceso");
      return;
    }
    setLoading(true);
    setError("");
    await new Promise(r => setTimeout(r, 300));

    const key = user.toLowerCase().trim();

    // ── 1. Intentar superadmin-login primero (el backend valida si es el master) ──
    try {
      const saRes = await fetch("/api/auth/superadmin-login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: key, password: pass }),
      });
      const saData = await saRes.json() as {
        ok: boolean; token?: string; role?: string; plan?: string; error?: string;
      };
      if (saRes.ok && saData.ok && saData.token) {
        localStorage.setItem("psyko_auth", JSON.stringify({
          user: key, role: saData.role ?? "superadmin", plan: saData.plan ?? "elite",
          token: saData.token, ts: Date.now(),
        }));
        window.location.replace(redirectTarget ?? "/dashboard");
        return;
      }
      // Si el backend dice 401 (credenciales wrongas para superadmin) pero el user
      // podría ser un member — continuamos. Si fue 200 con ok:false, también continuamos.
    } catch { /* red caída — intentamos member */ }

    // ── 2. Intentar member-login ──────────────────────────────────────────────
    try {
      const res = await fetch("/api/auth/member-login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: key, password: pass }),
      });
      if (res.ok) {
        const data = await res.json() as {
          ok: boolean; role: string; username: string;
          displayName?: string; plan: string; token: string;
        };
        if (data.ok && data.role === "member") {
          localStorage.setItem("psyko_auth", JSON.stringify({
            user: data.username, displayName: data.displayName ?? data.username,
            role: "member", plan: data.plan, token: data.token, ts: Date.now(),
          }));
          const dest = data.plan === "exchange" ? "/exchange" : (redirectTarget ?? "/dashboard");
          window.location.replace(dest);
          return;
        }
      } else if (res.status === 401) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        setError(body.error ?? "Credenciales incorrectas o cuenta inactiva");
        setLoading(false);
        return;
      }
    } catch {
      setError("No se pudo conectar al servidor. Verifica tu conexión.");
      setLoading(false);
      return;
    }

    // ── 3. Intentar operator-login ────────────────────────────────────────────
    try {
      const res = await fetch("/api/auth/operator-login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: key, password: pass }),
      });
      if (res.ok) {
        const data = await res.json() as {
          ok: boolean; role: string; username: string;
          displayName?: string; token: string;
        };
        if (data.ok && data.role === "operator") {
          localStorage.setItem("psyko_auth", JSON.stringify({
            user: data.username, displayName: data.displayName ?? data.username,
            role: "operator", token: data.token, ts: Date.now(),
          }));
          window.location.replace("/realtime");
          return;
        }
      }
    } catch { /* no operator */ }

    setError("ACCESO DENEGADO — Credenciales incorrectas o cuenta inactiva");
    setLoading(false);
  };

  const handleRegister = async () => {
    setRMsg("");
    if (!rUser.trim() || !rEmail.trim() || !rPass.trim()) {
      setRMsg("Todos los campos son obligatorios");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: rUser.trim(), email: rEmail.trim(), password: rPass }),
      });
      const d = await res.json() as { ok?: boolean; error?: string; message?: string };
      if (d.ok) { setROk(true); setRMsg(d.message ?? "Cuenta creada. Revisá tu correo."); }
      else setRMsg(d.error ?? "Error al crear la cuenta");
    } catch { setRMsg("No se pudo conectar al servidor"); }
    setLoading(false);
  };

  const handleForgot = async () => {
    setFMsg("");
    if (!fEmail.trim()) { setFMsg("Ingresá tu correo"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: fEmail.trim() }),
      });
      const d = await res.json() as { ok?: boolean; message?: string; error?: string };
      setFOk(true);
      setFMsg(d.message ?? "Si ese correo existe, te enviamos instrucciones.");
    } catch { setFMsg("No se pudo conectar al servidor"); }
    setLoading(false);
  };

  const inputCls = "w-full bg-[#060a0f] border border-[#243040] rounded text-white font-sharetech text-[0.85rem] px-3.5 py-2.5 outline-none transition-all";

  return (
    <div className="min-h-screen bg-[#060a0f] flex items-center justify-center relative font-rajdhani overflow-hidden text-white z-10">
      <div className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(rgba(0,229,255,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(0,229,255,.04) 1px,transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 w-[420px] bg-[#0d1520] border border-[#243040] rounded-lg overflow-hidden"
        style={{ boxShadow: "0 0 60px rgba(0,229,255,0.15), 0 0 120px rgba(0,229,255,0.05)" }}
      >
        <div className="absolute top-0 left-0 right-0 h-[3px]"
          style={{
            background: "linear-gradient(90deg,#00e5ff,#00e676,#ffd700,#e040fb,#00e5ff)",
            backgroundSize: "200% 100%",
            animation: "borderFlow 3s linear infinite",
          }}
        />

        {/* Header */}
        <div className="px-8 pt-9 pb-4 text-center border-b border-[#1a2a3a]">
          <div className="font-orbitron text-2xl font-black tracking-[0.3em] text-[#00e5ff]"
            style={{ textShadow: "0 0 20px rgba(0,229,255,0.5)" }}>
            PSYCHOMETRIKS
          </div>
          <div className="font-sharetech text-[0.6rem] text-[#7a9aaa] tracking-[0.2em] mt-1.5">
            ⬡ PLATAFORMA DE TRADING · PSY EXCHANGE
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-[#1a2a3a]">
          {([
            { key: "login",    label: "INGRESAR" },
            { key: "register", label: "CREAR CUENTA" },
            { key: "forgot",   label: "RECUPERAR" },
          ] as { key: LoginTab; label: string }[]).map(t => (
            <button key={t.key}
              onClick={() => { setTab(t.key); setError(""); setRMsg(""); setFMsg(""); }}
              className="flex-1 py-3 font-sharetech text-[0.58rem] tracking-[0.12em] transition-all"
              style={{
                color: tab === t.key ? "#00e5ff" : "#546e7a",
                borderBottom: tab === t.key ? "2px solid #00e5ff" : "2px solid transparent",
                background: tab === t.key ? "rgba(0,229,255,0.05)" : "transparent",
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── LOGIN ── */}
        {tab === "login" && (
          <div className="p-8">
            <div className="mb-4">
              <label className="font-sharetech text-[0.65rem] text-[#7a9aaa] tracking-[0.12em] mb-1.5 block">USUARIO O CORREO ELECTRÓNICO</label>
              <input type="text" value={user}
                onChange={e => { setUser(e.target.value); setError(""); }}
                onKeyDown={e => e.key === "Enter" && handleLogin()}
                placeholder="usuario o correo@ejemplo.com" autoComplete="username"
                className={inputCls}
                onFocus={e => (e.target.style.borderColor = "#00e5ff")}
                onBlur={e => (e.target.style.borderColor = "#243040")} />
            </div>
            <div className="mb-6">
              <label className="font-sharetech text-[0.65rem] text-[#7a9aaa] tracking-[0.12em] mb-1.5 block">CONTRASEÑA</label>
              <input type="password" value={pass}
                onChange={e => { setPass(e.target.value); setError(""); }}
                onKeyDown={e => e.key === "Enter" && handleLogin()}
                placeholder="••••••••••••••" autoComplete="current-password"
                className={inputCls}
                onFocus={e => (e.target.style.borderColor = "#00e5ff")}
                onBlur={e => (e.target.style.borderColor = "#243040")} />
            </div>
            <button onClick={handleLogin} disabled={loading}
              className="w-full p-3 rounded font-orbitron text-[0.8rem] font-bold tracking-[0.2em] transition-all mt-2 border"
              style={{
                background: loading ? "rgba(0,229,255,0.05)" : "linear-gradient(135deg, rgba(0,229,255,0.15), rgba(0,230,118,0.1))",
                borderColor: "#00e5ff", color: "#00e5ff",
                opacity: loading ? 0.7 : 1, cursor: loading ? "not-allowed" : "pointer",
              }}>
              {loading ? "VERIFICANDO..." : "⬡ ACCEDER AL SISTEMA"}
            </button>
            <div className="font-sharetech text-[0.7rem] text-center mt-3 min-h-[18px] tracking-[0.05em]"
              style={{ color: "#ff1744" }}>
              {error}
            </div>
            <div className="mt-2 text-center">
              <button onClick={() => setTab("forgot")}
                className="font-sharetech text-[0.6rem] text-[#7a9aaa] hover:text-[#00e5ff] transition-colors">
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          </div>
        )}

        {/* ── REGISTER ── */}
        {tab === "register" && (
          <div className="p-8">
            {rOk ? (
              <div className="text-center py-4">
                <div className="text-4xl mb-4">📧</div>
                <div className="font-orbitron text-sm text-[#00e676] mb-3">¡REVISÁ TU CORREO!</div>
                <p className="font-sharetech text-[0.75rem] text-[#7a9aaa] leading-relaxed">{rMsg}</p>
                <button onClick={() => { setROk(false); setTab("login"); }}
                  className="mt-6 font-sharetech text-[0.65rem] text-[#00e5ff] hover:underline">
                  Volver al inicio de sesión
                </button>
              </div>
            ) : (
              <>
                <div className="mb-3">
                  <label className="font-sharetech text-[0.65rem] text-[#7a9aaa] tracking-[0.12em] mb-1.5 block">NOMBRE DE USUARIO</label>
                  <input type="text" value={rUser}
                    onChange={e => { setRUser(e.target.value); setRMsg(""); }}
                    placeholder="ej: satoshi_trader" autoComplete="username"
                    className={inputCls}
                    onFocus={e => (e.target.style.borderColor = "#00e5ff")}
                    onBlur={e => (e.target.style.borderColor = "#243040")} />
                </div>
                <div className="mb-3">
                  <label className="font-sharetech text-[0.65rem] text-[#7a9aaa] tracking-[0.12em] mb-1.5 block">CORREO ELECTRÓNICO</label>
                  <input type="email" value={rEmail}
                    onChange={e => { setREmail(e.target.value); setRMsg(""); }}
                    placeholder="tu@correo.com" autoComplete="email"
                    className={inputCls}
                    onFocus={e => (e.target.style.borderColor = "#00e5ff")}
                    onBlur={e => (e.target.style.borderColor = "#243040")} />
                </div>
                <div className="mb-5">
                  <label className="font-sharetech text-[0.65rem] text-[#7a9aaa] tracking-[0.12em] mb-1.5 block">CONTRASEÑA</label>
                  <input type="password" value={rPass}
                    onChange={e => { setRPass(e.target.value); setRMsg(""); }}
                    onKeyDown={e => e.key === "Enter" && handleRegister()}
                    placeholder="Mínimo 8 caracteres" autoComplete="new-password"
                    className={inputCls}
                    onFocus={e => (e.target.style.borderColor = "#00e5ff")}
                    onBlur={e => (e.target.style.borderColor = "#243040")} />
                </div>
                <div className="mb-4 p-3 border border-[#1a2535] rounded font-sharetech text-[0.6rem] text-[#7ab3c8] leading-relaxed">
                  ✦ Cuenta <strong className="text-[#00e5ff]">Exchange Free</strong> — acceso a PSY Exchange y PSY Wallet.<br />
                  Para señales, LiqMap y todas las herramientas, ver <a href="/pricing" className="text-[#ffd700] hover:underline">planes de pago</a>.
                </div>
                <button onClick={handleRegister} disabled={loading}
                  className="w-full p-3 rounded font-orbitron text-[0.8rem] font-bold tracking-[0.2em] transition-all border"
                  style={{
                    background: "linear-gradient(135deg,rgba(0,229,255,0.15),rgba(0,230,118,0.1))",
                    borderColor: "#00e5ff", color: "#00e5ff",
                    opacity: loading ? 0.7 : 1,
                  }}>
                  {loading ? "CREANDO CUENTA..." : "🚀 CREAR MI CUENTA"}
                </button>
                {rMsg && <div className="font-sharetech text-[0.7rem] text-center mt-3" style={{ color: rMsg.includes("Error") || rMsg.includes("ya") ? "#ff1744" : "#546e7a" }}>{rMsg}</div>}
              </>
            )}
          </div>
        )}

        {/* ── FORGOT ── */}
        {tab === "forgot" && (
          <div className="p-8">
            {fOk ? (
              <div className="text-center py-4">
                <div className="text-4xl mb-4">📧</div>
                <div className="font-orbitron text-sm text-[#00e676] mb-3">¡REVISÁ TU CORREO!</div>
                <p className="font-sharetech text-[0.75rem] text-[#7a9aaa] leading-relaxed">{fMsg}</p>
                <button onClick={() => { setFOk(false); setTab("login"); }}
                  className="mt-6 font-sharetech text-[0.65rem] text-[#00e5ff] hover:underline">
                  Volver al inicio de sesión
                </button>
              </div>
            ) : (
              <>
                <p className="font-sharetech text-[0.72rem] text-[#7a9aaa] leading-relaxed mb-6">
                  Ingresá el correo de tu cuenta y te enviamos un link para elegir una nueva contraseña. El link expira en 15 minutos.
                </p>
                <div className="mb-5">
                  <label className="font-sharetech text-[0.65rem] text-[#7a9aaa] tracking-[0.12em] mb-1.5 block">CORREO ELECTRÓNICO</label>
                  <input type="email" value={fEmail}
                    onChange={e => { setFEmail(e.target.value); setFMsg(""); }}
                    onKeyDown={e => e.key === "Enter" && handleForgot()}
                    placeholder="tu@correo.com" autoComplete="email"
                    className={inputCls}
                    onFocus={e => (e.target.style.borderColor = "#00e5ff")}
                    onBlur={e => (e.target.style.borderColor = "#243040")} />
                </div>
                <button onClick={handleForgot} disabled={loading}
                  className="w-full p-3 rounded font-orbitron text-[0.8rem] font-bold tracking-[0.2em] transition-all border"
                  style={{
                    background: "linear-gradient(135deg,rgba(255,215,0,0.1),rgba(255,215,0,0.05))",
                    borderColor: "#ffd700", color: "#ffd700",
                    opacity: loading ? 0.7 : 1,
                  }}>
                  {loading ? "ENVIANDO..." : "🔑 ENVIAR LINK DE RESETEO"}
                </button>
                {fMsg && <div className="font-sharetech text-[0.7rem] text-center mt-3 text-[#ff1744]">{fMsg}</div>}
              </>
            )}
          </div>
        )}

        <div className="px-8 py-3 bg-[#0f1820] border-t border-[#1a2a3a] text-center">
          <span className="font-sharetech text-[0.58rem] text-[#7a9aaa] tracking-[0.1em]">
            🔐 PSYCHOMETRIKS — Sistema de señales institucional ⬡ Solo educativo
          </span>
        </div>
      </motion.div>
    </div>
  );
}
