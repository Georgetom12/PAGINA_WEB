import { useState, useRef, useEffect } from "react";
import { useChat } from "@/hooks/use-chat";
import { useGetChatSuggestions, getGetChatSuggestionsQueryKey } from "@workspace/api-client-react";
import { Send, Bot, User, Sparkles, BookOpen, X, ChevronDown, TrendingUp } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

function MessageContent({ content }: { content: string }) {
  const lines = content.split("\n");
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        if (line.startsWith("**") && line.endsWith("**")) {
          return <p key={i} className="font-semibold text-foreground">{line.slice(2, -2)}</p>;
        }
        if (line.startsWith("• ")) {
          return <p key={i} className="pl-2">• {line.slice(2)}</p>;
        }
        const bold = line.replace(/\*\*(.+?)\*\*/g, (_, t) => `<strong>${t}</strong>`);
        const code = bold.replace(/`(.+?)`/g, (_, t) => `<code class="bg-black/20 px-1 rounded text-xs font-mono">${t}</code>`);
        return line ? (
          <p key={i} dangerouslySetInnerHTML={{ __html: code }} />
        ) : (
          <div key={i} className="h-1" />
        );
      })}
    </div>
  );
}

export default function ChatPage() {
  const { messages, isTyping, sendMessage, isLoadingHistory } = useChat();
  const [input, setInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { data: suggestionsData } = useGetChatSuggestions({
    query: { queryKey: getGetChatSuggestionsQueryKey() },
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen) {
      setHasUnread(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen && messages.length > 0) {
      const last = messages[messages.length - 1];
      if (last.role === "assistant") setHasUnread(true);
    }
  }, [messages, isOpen]);

  const handleSend = () => {
    if (input.trim() && !isTyping) {
      sendMessage(input.trim());
      setInput("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const suggestions = suggestionsData?.suggestions || [];

  return (
    <>
      {/* ── Widget flotante ──────────────────────────────────── */}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col items-end gap-3">

        {/* Panel de chat */}
        <div
          className={`
            w-[370px] bg-background border border-border rounded-2xl shadow-2xl
            flex flex-col overflow-hidden
            transition-all duration-300 origin-bottom-right
            ${isOpen
              ? "opacity-100 scale-100 pointer-events-auto"
              : "opacity-0 scale-90 pointer-events-none"
            }
          `}
          style={{ height: isOpen ? "520px" : "0px" }}
        >
          {/* Header */}
          <div className="flex-none flex items-center justify-between px-4 py-3 bg-card border-b border-border">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-1.5 rounded-lg">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm leading-tight">Asesor de Trading IA</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                  <span className="text-[10px] text-muted-foreground">En línea · responde al instante</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-secondary"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Mensajes */}
          <ScrollArea className="flex-1 px-3 py-3" viewportRef={scrollRef}>
            <div className="space-y-4">
              {messages.length === 0 && !isLoadingHistory && (
                <div className="flex flex-col items-center text-center pt-4 pb-2 space-y-3 animate-in fade-in duration-500">
                  <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center ring-4 ring-primary/5">
                    <Bot className="w-7 h-7 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">¡Hola! Soy tu asesor de trading</p>
                    <p className="text-xs text-muted-foreground mt-1">Pregúntame sobre RSI, Bitcoin, estrategias, riesgo...</p>
                  </div>
                  {suggestions.length > 0 && (
                    <div className="w-full text-left space-y-3 mt-1">
                      {suggestions.map((cat) => (
                        <div key={cat.category}>
                          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5 px-1">{cat.category}</p>
                          <div className="flex flex-wrap gap-1.5">
                            {cat.questions.map((q) => (
                              <button
                                key={q}
                                onClick={() => { sendMessage(q); }}
                                className="text-[11px] bg-secondary hover:bg-secondary/70 text-secondary-foreground px-3 py-1.5 rounded-full border border-border/50 transition-colors text-left"
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
                  className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                      <Bot className="w-3 h-3 text-primary" />
                    </div>
                  )}
                  <div className={`flex flex-col gap-1 max-w-[82%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
                    <div
                      className={`px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground rounded-tr-sm"
                          : "bg-card border border-border text-card-foreground rounded-tl-sm shadow-sm"
                      }`}
                    >
                      {msg.role === "assistant"
                        ? <MessageContent content={msg.content} />
                        : <p className="whitespace-pre-wrap">{msg.content}</p>
                      }
                    </div>
                    {msg.role === "assistant" && msg.source && (
                      <div className="px-1">
                        {msg.source === "faq" ? (
                          <Badge variant="secondary" className="text-[9px] h-4 px-1.5 bg-secondary/50 text-muted-foreground font-normal border-border/50">
                            <BookOpen className="w-2.5 h-2.5 mr-1" />FAQ
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[9px] h-4 px-1.5 bg-primary/10 text-primary font-normal border-primary/20">
                            <Sparkles className="w-2.5 h-2.5 mr-1" />IA
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                  {msg.role === "user" && (
                    <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 mt-1">
                      <User className="w-3 h-3 text-secondary-foreground" />
                    </div>
                  )}
                </div>
              ))}

              {isTyping && (
                <div className="flex gap-2 animate-in fade-in">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-3 h-3 text-primary" />
                  </div>
                  <div className="bg-card border border-border px-3.5 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1 shadow-sm">
                    <div className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="flex-none px-3 pb-3 pt-2 border-t border-border/50 bg-background">
            <div className="flex gap-2 items-end">
              <Textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe tu pregunta..."
                className="min-h-[40px] max-h-[120px] resize-none bg-card border-border/50 text-xs rounded-xl focus-visible:ring-primary/50"
                rows={1}
              />
              <Button
                size="icon"
                className="h-10 w-10 shrink-0 rounded-xl bg-primary hover:bg-primary/90 shadow-md transition-all active:scale-95"
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground text-center mt-1.5">
              No es asesoría financiera · DYOR
            </p>
          </div>
        </div>

        {/* Botón flotante */}
        <button
          onClick={() => setIsOpen((v) => !v)}
          data-testid="chat-toggle-button"
          className={`
            relative w-14 h-14 rounded-full shadow-xl flex items-center justify-center
            transition-all duration-300 active:scale-95
            ${isOpen
              ? "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
            }
          `}
        >
          {isOpen
            ? <X className="w-6 h-6" />
            : <TrendingUp className="w-6 h-6" />
          }
          {hasUnread && !isOpen && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-[9px] font-bold animate-pulse">
              1
            </span>
          )}
        </button>
      </div>

      {/* Página de demostración */}
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-8 text-center">
        <div className="max-w-lg space-y-6">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary border border-primary/20 px-4 py-1.5 rounded-full text-sm font-medium">
            <TrendingUp className="w-4 h-4" />
            Widget embebible
          </div>
          <h1 className="text-3xl font-bold text-white leading-tight">
            Asesor de Trading IA
          </h1>
          <p className="text-gray-400 text-base leading-relaxed">
            El bot de la esquina inferior derecha puede ser pegado en cualquier página web con una sola línea de código.
          </p>
          <div className="bg-[#111] border border-white/10 rounded-xl p-4 text-left">
            <p className="text-[11px] text-gray-500 mb-2 uppercase tracking-wide font-medium">Código para pegar en tu sitio web</p>
            <code className="text-[12px] text-emerald-400 font-mono break-all">
              {'<script src="https://TU_DOMINIO/widget.js"></script>'}
            </code>
          </div>
          <p className="text-gray-600 text-sm">
            Haz clic en el botón azul · esquina inferior derecha
          </p>
        </div>
      </div>
    </>
  );
}
