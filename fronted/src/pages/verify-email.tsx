import { useEffect, useState } from "react";

export default function VerifyEmail() {
  const token = window.location.pathname.split("/verify-email/")[1] ?? "";
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!token) { setStatus("error"); setMsg("Link inválido"); return; }
    fetch(`/api/auth/verify-email/${token}`)
      .then(r => r.json() as Promise<{ ok: boolean; error?: string }>)
      .then(d => {
        if (d.ok) setStatus("ok");
        else { setStatus("error"); setMsg(d.error ?? "Link inválido o expirado"); }
      })
      .catch(() => { setStatus("error"); setMsg("No se pudo conectar al servidor"); });
  }, [token]);

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
        <div className="px-8 py-10 text-center">
          <div className="font-orbitron text-2xl font-black tracking-[0.3em] text-[#00e5ff] mb-2">PSYCHOMETRIKS</div>
          <div className="font-sharetech text-[0.6rem] text-[#7a9aaa] tracking-[0.2em] mb-10">VERIFICACIÓN DE CORREO</div>

          {status === "loading" && (
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-2 border-[#00e5ff] border-t-transparent rounded-full animate-spin" />
              <div className="font-sharetech text-[0.8rem] text-[#7a9aaa]">Verificando tu cuenta...</div>
            </div>
          )}

          {status === "ok" && (
            <div className="flex flex-col items-center gap-4">
              <div className="text-5xl">✅</div>
              <div className="font-orbitron text-lg text-[#00e676]">¡CUENTA VERIFICADA!</div>
              <p className="font-sharetech text-[0.8rem] text-[#7a9aaa] leading-relaxed">
                Tu correo fue verificado correctamente. Ya podés ingresar a PSY Exchange.
              </p>
              <a href="/login"
                className="mt-4 block w-full py-3 font-orbitron text-[0.75rem] font-bold tracking-[0.2em] text-center border border-[#00e5ff] text-[#00e5ff] hover:bg-[#00e5ff15] transition-colors">
                ⬡ INGRESAR AL EXCHANGE
              </a>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center gap-4">
              <div className="text-5xl">❌</div>
              <div className="font-orbitron text-lg text-[#ff1744]">LINK INVÁLIDO</div>
              <p className="font-sharetech text-[0.8rem] text-[#7a9aaa] leading-relaxed">
                {msg || "Este link ya fue usado o expiró. Registrate nuevamente para obtener uno nuevo."}
              </p>
              <a href="/login?tab=register"
                className="mt-4 block w-full py-3 font-orbitron text-[0.75rem] font-bold tracking-[0.2em] text-center border border-[#ffd700] text-[#ffd700] hover:bg-[#ffd70015] transition-colors">
                CREAR CUENTA NUEVA
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
