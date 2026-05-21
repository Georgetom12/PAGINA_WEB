import { useState } from "react";

export default function ResetPassword() {
  const token = window.location.pathname.split("/reset-password/")[1] ?? "";
  const [pass, setPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [msg, setMsg] = useState("");

  const handleSubmit = async () => {
    if (!pass || pass.length < 8) { setMsg("Mínimo 8 caracteres"); return; }
    if (pass !== confirm) { setMsg("Las contraseñas no coinciden"); return; }
    setStatus("loading"); setMsg("");
    try {
      const r = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: pass }),
      });
      const d = await r.json() as { ok: boolean; error?: string };
      if (d.ok) setStatus("ok");
      else { setStatus("error"); setMsg(d.error ?? "Error al resetear"); }
    } catch { setStatus("error"); setMsg("No se pudo conectar al servidor"); }
  };

  return (
    <div className="min-h-screen bg-[#060a0f] flex items-center justify-center font-rajdhani">
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(rgba(0,229,255,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(0,229,255,.04) 1px,transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      <div className="relative z-10 w-[420px] bg-[#0d1520] border border-[#243040] rounded-lg overflow-hidden text-white"
        style={{ boxShadow: "0 0 60px rgba(0,229,255,0.15)" }}>
        <div className="h-[3px]" style={{ background: "linear-gradient(90deg,#00e5ff,#00e676,#ffd700,#e040fb)" }} />
        <div className="px-8 py-10">
          <div className="text-center mb-8">
            <div className="font-orbitron text-2xl font-black tracking-[0.3em] text-[#00e5ff] mb-2">PSYCHOMETRIKS</div>
            <div className="font-sharetech text-[0.6rem] text-[#7a9aaa] tracking-[0.2em]">NUEVA CONTRASEÑA</div>
          </div>

          {status === "ok" ? (
            <div className="text-center">
              <div className="text-5xl mb-4">✅</div>
              <div className="font-orbitron text-lg text-[#00e676] mb-3">CONTRASEÑA ACTUALIZADA</div>
              <p className="font-sharetech text-[0.8rem] text-[#7a9aaa] mb-6">Ya podés ingresar con tu nueva contraseña.</p>
              <a href="/login" className="block w-full py-3 font-orbitron text-[0.75rem] font-bold tracking-[0.2em] text-center border border-[#00e5ff] text-[#00e5ff] hover:bg-[#00e5ff15] transition-colors">
                ⬡ INGRESAR
              </a>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <label className="font-sharetech text-[0.65rem] text-[#7a9aaa] tracking-[0.12em] mb-1.5 block">NUEVA CONTRASEÑA</label>
                <input type="password" value={pass} onChange={e => { setPass(e.target.value); setMsg(""); }}
                  placeholder="Mínimo 8 caracteres"
                  className="w-full bg-[#060a0f] border border-[#243040] rounded text-white font-sharetech text-[0.85rem] px-3.5 py-2.5 outline-none"
                  onFocus={e => (e.target.style.borderColor = "#00e5ff")}
                  onBlur={e => (e.target.style.borderColor = "#243040")} />
              </div>
              <div className="mb-6">
                <label className="font-sharetech text-[0.65rem] text-[#7a9aaa] tracking-[0.12em] mb-1.5 block">CONFIRMAR CONTRASEÑA</label>
                <input type="password" value={confirm} onChange={e => { setConfirm(e.target.value); setMsg(""); }}
                  placeholder="Repetí la contraseña"
                  onKeyDown={e => e.key === "Enter" && handleSubmit()}
                  className="w-full bg-[#060a0f] border border-[#243040] rounded text-white font-sharetech text-[0.85rem] px-3.5 py-2.5 outline-none"
                  onFocus={e => (e.target.style.borderColor = "#00e5ff")}
                  onBlur={e => (e.target.style.borderColor = "#243040")} />
              </div>
              {msg && <div className="font-sharetech text-[0.7rem] text-[#ff1744] mb-3 text-center">{msg}</div>}
              <button onClick={handleSubmit} disabled={status === "loading"}
                className="w-full py-3 font-orbitron text-[0.8rem] font-bold tracking-[0.2em] border border-[#00e5ff] text-[#00e5ff] hover:bg-[#00e5ff15] transition-colors disabled:opacity-50">
                {status === "loading" ? "ACTUALIZANDO..." : "🔑 CAMBIAR CONTRASEÑA"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
