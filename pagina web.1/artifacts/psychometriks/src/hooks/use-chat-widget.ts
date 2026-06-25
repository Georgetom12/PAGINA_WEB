import { useState, useEffect, useRef, useCallback } from "react";

export interface ChatMsg {
  id: number;
  role: "user" | "assistant";
  content: string;
  source?: string;
  createdAt: string;
}

function genSessionId() {
  return Math.random().toString(36).substring(2, 15);
}

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || "";

export function useChatWidget() {
  const [sessionId, setSessionId] = useState("");
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [suggestions, setSuggestions] = useState<{ category: string; questions: string[] }[]>([]);

  useEffect(() => {
    let saved = localStorage.getItem("psyko_chat_session");
    if (!saved) {
      saved = genSessionId();
      localStorage.setItem("psyko_chat_session", saved);
    }
    setSessionId(saved);
  }, []);

  useEffect(() => {
    fetch(`${API_BASE}/api/chat/suggestions`)
      .then((r) => r.json())
      .then((d) => setSuggestions(d.suggestions || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!sessionId) return;
    fetch(`${API_BASE}/api/chat/history?sessionId=${sessionId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.messages?.length) setMessages(d.messages);
      })
      .catch(() => {});
  }, [sessionId]);

  const resetChat = useCallback(() => {
    const newId = genSessionId();
    localStorage.setItem("psyko_chat_session", newId);
    setSessionId(newId);
    setMessages([]);
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || !sessionId) return;

      const userMsg: ChatMsg = {
        id: Date.now(),
        role: "user",
        content,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsTyping(true);

      const assistantId = Date.now() + 1;
      const assistantMsg: ChatMsg = {
        id: assistantId,
        role: "assistant",
        content: "",
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);

      try {
        const response = await fetch(`${API_BASE}/api/chat/message`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: content, sessionId }),
        });

        if (!response.ok) throw new Error("API error");

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (reader) {
          setIsTyping(false);
          let done = false;
          let buf = "";

          while (!done) {
            const { value, done: rDone } = await reader.read();
            done = rDone;
            if (value) {
              buf += decoder.decode(value, { stream: true });
              const lines = buf.split("\n");
              buf = lines.pop() || "";
              for (const line of lines) {
                if (line.startsWith("data: ")) {
                  try {
                    const data = JSON.parse(line.slice(6));
                    if (data.content) {
                      setMessages((prev) =>
                        prev.map((m) =>
                          m.id === assistantId
                            ? { ...m, content: m.content + data.content, source: data.source || m.source }
                            : m
                        )
                      );
                    }
                  } catch {}
                }
              }
            }
          }
        }
      } catch {
        setIsTyping(false);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: "Error de conexión. Verifica que el servidor esté activo." }
              : m
          )
        );
      }
    },
    [sessionId]
  );

  return { messages, isTyping, sendMessage, suggestions, resetChat };
}
