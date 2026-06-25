import React, { useState, useEffect, useRef } from "react";
import { getAuth } from "@/lib/auth";

interface Msg {
  id: number;
  sender: "user" | "admin";
  message: string;
  createdAt: string;
  readAt?: string | null;
}

function getToken(): string {
  try {
    const raw = localStorage.getItem("psyko_auth");
    return raw ? ((JSON.parse(raw) as { token?: string }).token ?? "") : "";
  } catch { return ""; }
}

export default function SupportChatWidget() {
  const auth = getAuth();
  if (!auth) return null;

  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    const token = getToken();
    if (!token) return;
    try {
      const r = await fetch("/api/support/messages", {
        headers: { "x-psy-token": token },
      });
      if (r.status === 401 || r.status === 403) {
        clearInterval(iv);
        return;
      }
      if (!r.ok) return;
      const d = await r.json() as { ok: boolean; messages: Msg[] };
      setMsgs(d.messages ?? []);
      if (!open) {
        const u = (d.messages ?? []).filter(m => m.sender === "admin" && !m.readAt).length;
        setUnread(u);
      }
    } catch { /* ignore */ }
  };

  useEffect(() => {
    void load();
    const iv = setInterval(() => { void load(); }, 15000);
    return () => clearInterval(iv);
  }, [open]);

  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  }, [open, msgs]);

  const send = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      await fetch("/api/support/message", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-psy-token": getToken() },
        body: JSON.stringify({ message: text.trim() }),
      });
      setText("");
      await load();
    } catch { /* ignore */ }
    setSending(false);
  };

  const fmt = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString("es-AR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-105"
        style={{ background: "linear-gradient(135deg,#0d1520,#1a2535)", border: "1px solid #00e5ff44" }}
        title="Soporte PSYCHOMETRIKS"
      >
        <span className="text-xl">{open ? "✕" : "💬"}</span>
        {!open && unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#ff1744] flex items-center justify-center font-space text-[9px] text-white font-bold">
            {unread}
          </span>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          className="fixed bottom-24 right-6 z-50 w-80 flex flex-col rounded-lg overflow-hidden shadow-2xl"
          style={{ height: "420px", background: "#0d1520", border: "1px solid #1a2535", boxShadow: "0 0 40px rgba(0,229,255,0.1)" }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-[#1a2535]"
            style={{ background: "linear-gradient(135deg,#0f1d2e,#0d1520)" }}>
            <div className="w-2 h-2 rounded-full bg-[#00e676] animate-pulse" />
            <div className="flex-1">
              <div className="font-space text-[10px] font-bold text-white tracking-[0.1em]">SOPORTE PSYCHOMETRIKS</div>
              <div className="font-space text-[8px] text-[#7ab3c8]">Respondemos en menos de 24h</div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {msgs.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                <div className="text-3xl">💬</div>
                <div className="font-space text-[10px] text-[#7ab3c8] leading-relaxed">
                  ¿Querés reactivar tu plan o tenés alguna consulta?<br />Escribinos acá.
                </div>
              </div>
            )}
            {msgs.map(m => (
              <div key={m.id} className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className="max-w-[80%] px-3 py-2 rounded-lg"
                  style={m.sender === "user"
                    ? { background: "#00e5ff15", border: "1px solid #00e5ff33" }
                    : { background: "#1a2535", border: "1px solid #243040" }}
                >
                  {m.sender === "admin" && (
                    <div className="font-space text-[8px] text-[#00e5ff] mb-1 tracking-[0.1em]">⬡ PSYCHOMETRIKS</div>
                  )}
                  <div className="font-space text-[11px] text-white leading-relaxed">
                    {m.message.split(/\*\*(.*?)\*\*/g).map((part, pi) =>
                      pi % 2 === 1 ? <strong key={pi}>{part}</strong> : <React.Fragment key={pi}>{part}</React.Fragment>
                    )}
                  </div>
                  <div className="font-space text-[8px] text-[#5a8898] mt-1 text-right">{fmt(m.createdAt)}</div>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-[#1a2535] p-3 flex gap-2">
            <input
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
              placeholder="Escribí tu mensaje..."
              className="flex-1 bg-[#060a0f] border border-[#1a2535] text-white font-space text-[11px] px-3 py-2 rounded outline-none"
              style={{ fontFamily: "inherit" }}
              onFocus={e => (e.target.style.borderColor = "#00e5ff44")}
              onBlur={e => (e.target.style.borderColor = "#1a2535")}
            />
            <button
              onClick={send}
              disabled={sending || !text.trim()}
              className="px-3 py-2 rounded font-space text-[11px] font-bold transition-all disabled:opacity-40"
              style={{ background: "#00e5ff15", border: "1px solid #00e5ff44", color: "#00e5ff" }}
            >
              {sending ? "..." : "→"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
