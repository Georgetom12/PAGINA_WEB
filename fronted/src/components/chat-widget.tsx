import React, { useState, useRef, useEffect } from "react";
import { useChatWidget } from "@/hooks/use-chat-widget";

function BotIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M12 2v4M8 2h8M7 11V7a5 5 0 0 1 10 0v4" />
      <circle cx="9" cy="16" r="1" fill="currentColor" />
      <circle cx="15" cy="16" r="1" fill="currentColor" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="m22 2-7 20-4-9-9-4z" /><path d="M22 2 11 13" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function MsgContent({ content }: { content: string }) {
  const lines = content.split("\n");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {lines.map((line, i) => {
        if (!line) return <div key={i} style={{ height: 6 }} />;
        const parts = line.split(/(\*\*.+?\*\*|`.+?`)/g);
        return (
          <p key={i} style={{ margin: 0 }}>
            {parts.map((part, j) => {
              if (part.startsWith("**") && part.endsWith("**"))
                return <strong key={j}>{part.slice(2, -2)}</strong>;
              if (part.startsWith("`") && part.endsWith("`"))
                return <code key={j} style={{ background: "rgba(0,229,255,0.1)", padding: "1px 4px", borderRadius: 2, fontSize: 11, fontFamily: "'Share Tech Mono',monospace" }}>{part.slice(1, -1)}</code>;
              return <React.Fragment key={j}>{part}</React.Fragment>;
            })}
          </p>
        );
      })}
    </div>
  );
}

function RefreshIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M8 16H3v5" />
    </svg>
  );
}

export default function ChatWidget() {
  const { messages, isTyping, sendMessage, suggestions, resetChat } = useChatWidget();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [hasUnread, setHasUnread] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  useEffect(() => {
    if (open) {
      setHasUnread(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    if (!open && messages.length > 0) {
      const last = messages[messages.length - 1];
      if (last.role === "assistant") setHasUnread(true);
    }
  }, [messages, open]);

  const handleSend = () => {
    if (input.trim() && !isTyping) {
      sendMessage(input.trim());
      setInput("");
    }
  };

  const s: Record<string, React.CSSProperties> = {
    wrap: {
      position: "fixed",
      bottom: 24,
      right: 24,
      zIndex: 9999,
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-end",
      gap: 12,
      fontFamily: "'Rajdhani', sans-serif",
    },
    panel: {
      width: 360,
      height: open ? 520 : 0,
      background: "#0d1520",
      border: "1px solid #243040",
      borderRadius: 8,
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      opacity: open ? 1 : 0,
      transform: open ? "scale(1)" : "scale(0.92)",
      transformOrigin: "bottom right",
      transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)",
      pointerEvents: open ? "all" : "none",
      boxShadow: open ? "0 0 40px rgba(0,229,255,0.15), 0 20px 60px rgba(0,0,0,0.5)" : "none",
      position: "relative",
    },
    topBar: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: 2,
      background: "linear-gradient(90deg, #00e5ff, #00e676, #ffd700, #e040fb, #00e5ff)",
      backgroundSize: "200% 100%",
      animation: "borderFlow 3s linear infinite",
    },
    header: {
      flexShrink: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "14px 16px 12px",
      borderBottom: "1px solid #1a2a3a",
      marginTop: 2,
    },
    headerLeft: {
      display: "flex",
      alignItems: "center",
      gap: 10,
    },
    iconWrap: {
      width: 34,
      height: 34,
      background: "rgba(0,229,255,0.1)",
      border: "1px solid rgba(0,229,255,0.3)",
      borderRadius: 6,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#00e5ff",
    },
    headerTitle: {
      fontFamily: "'Orbitron', monospace",
      fontSize: 11,
      fontWeight: 700,
      color: "#00e5ff",
      letterSpacing: "0.15em",
      margin: 0,
    },
    headerSub: {
      fontFamily: "'Share Tech Mono', monospace",
      fontSize: 10,
      color: "#546e7a",
      letterSpacing: "0.1em",
      display: "flex",
      alignItems: "center",
      gap: 5,
      marginTop: 2,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: "50%",
      background: "#00e676",
      animation: "pulse 2s infinite",
    },
    closeBtn: {
      background: "none",
      border: "none",
      color: "#546e7a",
      cursor: "pointer",
      padding: 4,
      borderRadius: 4,
      display: "flex",
      transition: "color 0.2s",
    },
    messages: {
      flex: 1,
      overflowY: "auto",
      padding: "12px 14px",
      display: "flex",
      flexDirection: "column",
      gap: 12,
      scrollbarWidth: "thin",
      scrollbarColor: "#1a2a3a transparent",
    },
    emptyState: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      textAlign: "center",
      padding: "20px 8px 8px",
      gap: 12,
    },
    emptyIcon: {
      width: 52,
      height: 52,
      background: "rgba(0,229,255,0.08)",
      border: "1px solid rgba(0,229,255,0.2)",
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#00e5ff",
    },
    emptyTitle: {
      fontFamily: "'Orbitron', monospace",
      fontSize: 11,
      color: "#eceff1",
      letterSpacing: "0.1em",
      margin: 0,
    },
    emptySub: {
      fontFamily: "'Share Tech Mono', monospace",
      fontSize: 11,
      color: "#546e7a",
      margin: "4px 0 0",
    },
    sugCatLabel: {
      fontFamily: "'Share Tech Mono', monospace",
      fontSize: 9,
      color: "#546e7a",
      letterSpacing: "0.15em",
      textTransform: "uppercase",
      marginBottom: 6,
    },
    sugBtn: {
      fontSize: 11,
      fontFamily: "'Share Tech Mono', monospace",
      background: "rgba(0,229,255,0.05)",
      border: "1px solid #1a2a3a",
      borderRadius: 3,
      color: "#90a4b0",
      padding: "5px 10px",
      cursor: "pointer",
      transition: "all 0.2s",
      textAlign: "left" as const,
    },
    inputArea: {
      flexShrink: 0,
      padding: "10px 14px 12px",
      borderTop: "1px solid #1a2a3a",
    },
    inputRow: {
      display: "flex",
      gap: 8,
      alignItems: "flex-end",
    },
    textarea: {
      flex: 1,
      background: "#060a0f",
      border: "1px solid #243040",
      borderRadius: 4,
      color: "#eceff1",
      fontFamily: "'Share Tech Mono', monospace",
      fontSize: 12,
      padding: "8px 10px",
      resize: "none" as const,
      outline: "none",
      minHeight: 36,
      maxHeight: 100,
      transition: "border-color 0.2s",
    },
    sendBtn: {
      width: 36,
      height: 36,
      flexShrink: 0,
      background: "linear-gradient(135deg, rgba(0,229,255,0.2), rgba(0,230,118,0.1))",
      border: "1px solid #00e5ff",
      borderRadius: 4,
      color: "#00e5ff",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "all 0.2s",
    },
    disclaimer: {
      fontFamily: "'Share Tech Mono', monospace",
      fontSize: 9,
      color: "#263238",
      textAlign: "center" as const,
      marginTop: 6,
      letterSpacing: "0.08em",
    },
    fab: {
      width: 52,
      height: 52,
      borderRadius: "50%",
      background: open
        ? "rgba(0,229,255,0.1)"
        : "linear-gradient(135deg, rgba(0,229,255,0.2), rgba(0,230,118,0.1))",
      border: `1px solid ${open ? "#243040" : "#00e5ff"}`,
      color: "#00e5ff",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: open ? "none" : "0 0 20px rgba(0,229,255,0.3)",
      transition: "all 0.25s",
      position: "relative" as const,
    },
    badge: {
      position: "absolute" as const,
      top: -4,
      right: -4,
      width: 16,
      height: 16,
      background: "#ff1744",
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 9,
      fontWeight: 700,
      color: "#fff",
      fontFamily: "monospace",
      animation: "pulse 1.5s infinite",
    },
  };

  return (
    <>
      <style>{`
        @keyframes borderFlow { 0%{background-position:0%} 100%{background-position:200%} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
        .psyko-msg-scroll::-webkit-scrollbar { width:4px }
        .psyko-msg-scroll::-webkit-scrollbar-track { background:transparent }
        .psyko-msg-scroll::-webkit-scrollbar-thumb { background:#1a2a3a; border-radius:2px }
        .psyko-textarea:focus { border-color:#00e5ff !important; box-shadow:0 0 8px rgba(0,229,255,0.2); }
        .psyko-sug-btn:hover { background:rgba(0,229,255,0.1) !important; border-color:#00e5ff !important; color:#00e5ff !important; }
        .psyko-send:hover { background:linear-gradient(135deg,rgba(0,229,255,0.35),rgba(0,230,118,0.2)) !important; box-shadow:0 0 14px rgba(0,229,255,0.3); }
        .psyko-close:hover { color:#00e5ff !important; }
      `}</style>

      <div style={s.wrap}>
        <div style={s.panel}>
          <div style={s.topBar} />
          <div style={s.header}>
            <div style={s.headerLeft}>
              <div style={s.iconWrap}><BotIcon /></div>
              <div>
                <p style={s.headerTitle}>ASESOR TRADING IA</p>
                <div style={s.headerSub}>
                  <span style={s.dot} />
                  EN LÍNEA · RESPUESTA INMEDIATA
                </div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              {messages.length > 0 && (
                <button
                  className="psyko-close"
                  style={{ ...s.closeBtn, fontSize: 9, flexDirection: "column", gap: 2, padding: "4px 6px", opacity: 0.7 }}
                  onClick={resetChat}
                  title="Nueva conversación"
                >
                  <RefreshIcon />
                  <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 8, letterSpacing: "0.05em", color: "inherit" }}>NUEVO</span>
                </button>
              )}
              <button className="psyko-close" style={s.closeBtn} onClick={() => setOpen(false)}>
                <CloseIcon />
              </button>
            </div>
          </div>

          <div ref={scrollRef} className="psyko-msg-scroll" style={s.messages}>
            {messages.length === 0 && !isTyping && (
              <div style={s.emptyState}>
                <div style={s.emptyIcon}><BotIcon /></div>
                <div>
                  <p style={s.emptyTitle}>PSYCHOMETRIKS AI</p>
                  <p style={s.emptySub}>Consulta sobre indicadores, estrategias,<br />bots y señales de mercado</p>
                </div>
                {suggestions.length > 0 && (
                  <div style={{ width: "100%", textAlign: "left", marginTop: 4 }}>
                    {suggestions.map((cat) => (
                      <div key={cat.category} style={{ marginBottom: 10 }}>
                        <p style={s.sugCatLabel}>{cat.category}</p>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {cat.questions.map((q) => (
                            <button
                              key={q}
                              className="psyko-sug-btn"
                              style={s.sugBtn}
                              onClick={() => sendMessage(q)}
                            >
                              {q}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  display: "flex",
                  gap: 8,
                  justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                {msg.role === "assistant" && (
                  <div style={{ ...s.emptyIcon, width: 26, height: 26, flexShrink: 0, marginTop: 2, fontSize: 12 }}>
                    <BotIcon />
                  </div>
                )}
                <div
                  style={{
                    maxWidth: "78%",
                    padding: "9px 12px",
                    borderRadius: msg.role === "user" ? "8px 8px 2px 8px" : "8px 8px 8px 2px",
                    fontSize: 12,
                    lineHeight: 1.65,
                    fontFamily: "'Share Tech Mono', monospace",
                    ...(msg.role === "user"
                      ? {
                          background: "rgba(0,229,255,0.1)",
                          border: "1px solid rgba(0,229,255,0.25)",
                          color: "#eceff1",
                        }
                      : {
                          background: "#0f1820",
                          border: "1px solid #1a2a3a",
                          color: "#b0bec5",
                        }),
                  }}
                >
                  {msg.role === "assistant"
                    ? <MsgContent content={msg.content} />
                    : <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{msg.content}</p>
                  }
                  {msg.role === "assistant" && msg.source && (
                    <span style={{
                      display: "inline-block",
                      marginTop: 6,
                      fontSize: 9,
                      fontFamily: "'Share Tech Mono', monospace",
                      letterSpacing: "0.08em",
                      padding: "2px 6px",
                      borderRadius: 2,
                      ...(msg.source === "faq"
                        ? { background: "rgba(0,230,118,0.1)", border: "1px solid rgba(0,230,118,0.3)", color: "#00e676" }
                        : { background: "rgba(0,229,255,0.1)", border: "1px solid rgba(0,229,255,0.3)", color: "#00e5ff" }),
                    }}>
                      {msg.source === "faq" ? "FAQ" : "IA"}
                    </span>
                  )}
                </div>
              </div>
            ))}

            {isTyping && (
              <div style={{ display: "flex", gap: 8 }}>
                <div style={{ ...s.emptyIcon, width: 26, height: 26, flexShrink: 0 }}><BotIcon /></div>
                <div style={{
                  background: "#0f1820",
                  border: "1px solid #1a2a3a",
                  borderRadius: "8px 8px 8px 2px",
                  padding: "10px 14px",
                  display: "flex",
                  gap: 4,
                  alignItems: "center",
                }}>
                  {[0, 0.15, 0.3].map((delay, i) => (
                    <div key={i} style={{
                      width: 6, height: 6, borderRadius: "50%",
                      background: "#00e5ff", opacity: 0.6,
                      animation: `bounce 0.8s ${delay}s infinite`,
                    }} />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={s.inputArea}>
            <div style={s.inputRow}>
              <textarea
                ref={inputRef}
                className="psyko-textarea"
                style={s.textarea}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Escribe tu pregunta..."
                rows={1}
              />
              <button
                className="psyko-send"
                style={{ ...s.sendBtn, opacity: !input.trim() || isTyping ? 0.4 : 1 }}
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
              >
                <SendIcon />
              </button>
            </div>
            <p style={s.disclaimer}>NO ES ASESORÍA FINANCIERA · SOLO EDUCATIVO</p>
          </div>
        </div>

        <button style={s.fab} onClick={() => setOpen((v) => !v)} title="Asesor Trading IA">
          {open ? <CloseIcon /> : <BotIcon />}
          {hasUnread && !open && <span style={s.badge}>1</span>}
        </button>
      </div>
    </>
  );
}
