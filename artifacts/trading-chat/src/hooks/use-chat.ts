import { useState, useEffect, useRef, useCallback } from "react";
import { type ChatMessage } from "@workspace/api-client-react";
import { useGetChatHistory, getGetChatHistoryQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

function generateSessionId() {
  return Math.random().toString(36).substring(2, 15);
}

export function useChat() {
  const [sessionId, setSessionId] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    let saved = localStorage.getItem("trading_chat_session_id");
    if (!saved) {
      saved = generateSessionId();
      localStorage.setItem("trading_chat_session_id", saved);
    }
    setSessionId(saved);
  }, []);

  const historyQuery = useGetChatHistory(
    { sessionId },
    {
      query: {
        enabled: !!sessionId,
        queryKey: getGetChatHistoryQueryKey({ sessionId }),
      },
    }
  );

  useEffect(() => {
    if (historyQuery.data?.messages) {
      setMessages(historyQuery.data.messages);
    }
  }, [historyQuery.data]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || !sessionId) return;

      const userMessage: ChatMessage = {
        id: Date.now(),
        role: "user",
        content,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsTyping(true);

      const assistantMessageId = Date.now() + 1;
      const assistantMessage: ChatMessage = {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      try {
        const response = await fetch("/api/chat/message", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ message: content, sessionId }),
        });

        if (!response.ok) {
          throw new Error("Failed to send message");
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (reader) {
          setIsTyping(false);
          let done = false;
          let buffer = "";

          while (!done) {
            const { value, done: readerDone } = await reader.read();
            done = readerDone;
            if (value) {
              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split("\n");
              buffer = lines.pop() || "";

              for (const line of lines) {
                if (line.startsWith("data: ")) {
                  try {
                    const data = JSON.parse(line.slice(6));
                    if (data.content) {
                      setMessages((prev) =>
                        prev.map((msg) =>
                          msg.id === assistantMessageId
                            ? { ...msg, content: msg.content + data.content, source: data.source || msg.source }
                            : msg
                        )
                      );
                    }
                    if (data.done) {
                      // refresh history
                      queryClient.invalidateQueries({
                        queryKey: getGetChatHistoryQueryKey({ sessionId }),
                      });
                    }
                  } catch (e) {
                    console.error("Error parsing SSE JSON", e);
                  }
                }
              }
            }
          }
        }
      } catch (error) {
        console.error("Error sending message:", error);
        setIsTyping(false);
      }
    },
    [sessionId, queryClient]
  );

  return {
    sessionId,
    messages,
    isTyping,
    sendMessage,
    isLoadingHistory: historyQuery.isLoading,
  };
}
