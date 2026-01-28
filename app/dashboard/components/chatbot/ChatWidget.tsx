"use client";

import React, { useEffect, useRef, useState } from "react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  time?: string;
}

interface ChatWidgetProps {
  role?: string;
  page?: string;
}

export default function ChatWidget({
  role = "user",
  page = "dashboard",
}: ChatWidgetProps) {
  const [open, setOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [bounce, setBounce] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const revealIntervalRef = useRef<number | null>(null);
  const currentAssistantIdRef = useRef<string | null>(null);

  const OPEN_ANIM_MS = 380;
  const ICON_BOUNCE_MS = 460;

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 160);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isVisible) handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible]);

  useEffect(() => {
    return () => {
      if (revealIntervalRef.current) {
        window.clearInterval(revealIntervalRef.current);
        revealIntervalRef.current = null;
      }
    };
  }, []);

  const addMessage = (m: Omit<Message, "id" | "time">) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const msg: Message = { id, time, ...m };
    setMessages((prev) => [...prev, msg]);
    return id;
  };

  const updateMessageContent = (id: string, content: string) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, content } : m)));
  };

  const stopRevealAndFinish = () => {
    if (revealIntervalRef.current) {
      window.clearInterval(revealIntervalRef.current);
      revealIntervalRef.current = null;
    }
    setLoading(false);
    currentAssistantIdRef.current = null;
  };

  const handleOpen = () => {
    setIsVisible(true);
    setTimeout(() => {
      setBounce(true);
      setOpen(true);
      setTimeout(() => setBounce(false), ICON_BOUNCE_MS);
    }, 10);
  };

  const handleClose = () => {
    stopRevealAndFinish();
    setOpen(false);
    setTimeout(() => setIsVisible(false), OPEN_ANIM_MS + 20);
  };

  const handleToggleOpen = () => {
    if (isVisible && open) handleClose();
    else handleOpen();
  };

  // --- Fixed, robust sendMessage with safe logging ---
  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userText = input.trim();
    addMessage({ role: "user", content: userText });
    setInput("");
    setLoading(true);

    const assistantId = addMessage({ role: "assistant", content: "" });
    currentAssistantIdRef.current = assistantId;

    const controller = new AbortController();
    const TIMEOUT_MS = 20000;
    const timeoutId = window.setTimeout(() => controller.abort(), TIMEOUT_MS);

    if (revealIntervalRef.current) {
      window.clearInterval(revealIntervalRef.current);
      revealIntervalRef.current = null;
    }

    try {
      const res = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText, context: { role, page } }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res) {
        try { console.error("API error: no response object returned from fetch"); } catch(e) {}
        updateMessageContent(assistantId, "Something went wrong. Please try again.");
        setLoading(false);
        currentAssistantIdRef.current = null;
        return;
      }

      // safe status log
      try { console.log("/api/chatbot status:", res.status, res.statusText); } catch(e) {}

      // try parse JSON, else text
      let parsed: any = null;
      let rawText: string | null = null;
      try {
        parsed = await res.clone().json();
      } catch (jsonErr) {
        try {
          rawText = await res.text();
        } catch (textErr) {
          rawText = null;
        }
      }

      if (!res.ok) {
        // build a safe bodyPreview without throwing
        let bodyPreview = "no body";
        if (parsed) {
          try {
            const s = typeof parsed === "string" ? parsed : JSON.stringify(parsed);
            bodyPreview = s.slice(0, 1000);
          } catch (e) {
            try {
              bodyPreview = String(parsed).slice(0, 1000);
            } catch (e2) {
              bodyPreview = "unserializable body";
            }
          }
        } else if (rawText) {
          bodyPreview = rawText.slice(0, 1000);
        }

        // try/catch logging so logging never breaks app flow
        try {
          console.error(`API error: status=${res.status} bodyPreview=${bodyPreview}`);
        } catch (logErr) {
          try { console.error("API error: status=", res.status); } catch (e) {}
        }

        updateMessageContent(assistantId, "Something went wrong. Please try again.");
        setLoading(false);
        currentAssistantIdRef.current = null;
        return;
      }

      const full =
        parsed?.reply ??
        parsed?.response ??
        parsed?.result ??
        parsed?.output ??
        (Array.isArray(parsed?.results) && parsed.results[0]?.content) ??
        (parsed?.choices && parsed.choices[0]?.text) ??
        rawText ??
        "No response from model.";

      let idx = 0;
      const len = full.length;
      const baseDelay = Math.max(6, 18 - Math.floor(len / 120));
      updateMessageContent(assistantId, "");

      revealIntervalRef.current = window.setInterval(() => {
        if (idx >= len) {
          if (revealIntervalRef.current) {
            window.clearInterval(revealIntervalRef.current);
            revealIntervalRef.current = null;
          }
          setLoading(false);
          currentAssistantIdRef.current = null;
          return;
        }
        idx += 1;
        updateMessageContent(assistantId, full.slice(0, idx));
      }, baseDelay);
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err?.name === "AbortError") {
        try { console.error("sendMessage aborted due to timeout"); } catch(e) {}
        updateMessageContent(assistantId, "Request timed out. Please try again.");
      } else {
        let safeErr = "unknown error";
        try {
          safeErr = err instanceof Error ? `${err.name}: ${err.message}` : JSON.stringify(err);
        } catch (e) {
          try { safeErr = String(err); } catch (e2) { safeErr = "unserializable error"; }
        }
        try { console.error("sendMessage error:", safeErr); } catch(e) {}
        updateMessageContent(assistantId, "Something went wrong. Please try again.");
      }
      setLoading(false);
      currentAssistantIdRef.current = null;
    }
  };
  // --- end sendMessage ---

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    stopRevealAndFinish();
    setMessages([]);
  };

  return (
    <>
      <style>{`
        @keyframes icon-spring {
          0% { transform: scale(1) rotate(0deg); }
          25% { transform: scale(1.14) rotate(8deg); }
          50% { transform: scale(0.98) rotate(-4deg); }
          75% { transform: scale(1.06) rotate(4deg); }
          100% { transform: scale(1.03) rotate(0deg); }
        }
        @keyframes window-pop {
          0% { opacity: 0; transform: translateY(18px) scale(0.96); }
          60% { opacity: 1; transform: translateY(-6px) scale(1.02); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .icon-bounce-anim { animation: icon-spring ${ICON_BOUNCE_MS}ms cubic-bezier(.2,.9,.3,1) both; }
        .window-pop-anim { animation: window-pop ${OPEN_ANIM_MS}ms cubic-bezier(.2,.9,.3,1) both; }
      `}</style>

      <button
        onClick={handleToggleOpen}
        aria-label={isVisible && open ? "Close chat" : "Open chat"}
        className={`fixed bottom-4 right-4 z-50 p-4 rounded-full shadow-lg text-white
          bg-[rgb(220,38,38)]
          transform transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[rgb(220,38,38)]`}
      >
        <span
          className={`inline-block ${bounce ? "icon-bounce-anim" : "transition-transform duration-200 hover:scale-105"}`}
          style={{ transformOrigin: "center" }}
        >
          💬
        </span>
      </button>

      {isVisible && (
        <>
          <div
            onClick={handleClose}
            className={`fixed inset-0 z-40 bg-black/10 transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
            aria-hidden
          />

          <div
            aria-hidden={!open}
            className="fixed bottom-20 right-4 w-80 bg-white shadow-xl rounded-lg border z-50 flex flex-col"
            style={{ minHeight: 320, pointerEvents: open ? "auto" : "none" }}
          >
            <div
              className={`w-full h-full flex flex-col ${open ? "window-pop-anim" : ""}`}
              style={{
                opacity: open ? 1 : 0,
                transform: open ? undefined : "translateY(18px) scale(0.96)",
                transition: "opacity 180ms ease, transform 180ms ease",
              }}
            >
              <div className="p-3 font-semibold border-b flex items-center justify-between">
                <span>Health Assistant</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={clearChat}
                    title="Clear chat"
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Clear
                  </button>
                  <button
                    onClick={handleClose}
                    title="Close"
                    className="text-sm text-gray-500 hover:text-gray-700 px-2"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div ref={scrollRef} className="p-3 h-64 overflow-y-auto text-sm flex-1 space-y-2">
                {messages.map((msg) => (
                  <div key={msg.id} className={`mb-1 ${msg.role === "user" ? "text-right" : "text-left"}`}>
                    <div
                      className={`inline-block px-3 py-2 rounded-lg max-w-[80%] break-words text-sm
                        ${msg.role === "user" ? "bg-[rgb(220,38,38)] text-white" : "bg-gray-100 text-gray-800"}`}
                    >
                      {msg.content || (msg.role === "assistant" && loading ? <em>Typing…</em> : "")}
                    </div>
                    <div className="text-[10px] text-gray-400 mt-1">{msg.time}</div>
                  </div>
                ))}
                <div style={{ height: 8 }} />
              </div>

              <div className="p-2 border-t flex items-center gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask a question..."
                  className="flex-1 border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none h-10"
                  disabled={loading}
                />
                <button
                  onClick={sendMessage}
                  disabled={loading}
                  className={`ml-2 px-3 py-1 rounded text-sm text-white bg-[rgb(220,38,38)]
                    transition-transform duration-150 active:scale-95 ${loading ? "opacity-60 cursor-not-allowed" : "hover:opacity-90"}`}
                >
                  {loading ? "Sending…" : "Send"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
