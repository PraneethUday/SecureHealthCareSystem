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
  const [open, setOpen] = useState(false); // controls animation state (open/closing)
  const [isVisible, setIsVisible] = useState(false); // controls whether window/backdrop is mounted
  const [bounce, setBounce] = useState(false); // one-time bounce trigger
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const revealIntervalRef = useRef<number | null>(null);
  const currentAssistantIdRef = useRef<string | null>(null);

  const OPEN_ANIM_MS = 380; // must match CSS animation durations
  const ICON_BOUNCE_MS = 460;

  // Scroll-to-bottom helper
  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  // focus input after opening
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 160);
      return () => clearTimeout(t);
    }
  }, [open]);

  // keyboard Escape to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isVisible) handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible]);

  // cleanup reveal interval on unmount
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
    // mount the UI first so animations can run
    setIsVisible(true);
    // small timeout to allow mount before starting open animation
    setTimeout(() => {
      setBounce(true);
      setOpen(true);
      // stop bounce state after animation
      setTimeout(() => setBounce(false), ICON_BOUNCE_MS);
    }, 10);
  };

  const handleClose = () => {
    // abort reveal gracefully and keep partial content visible
    stopRevealAndFinish();
    // trigger closing animation
    setOpen(false);
    // unmount after animation completes
    setTimeout(() => setIsVisible(false), OPEN_ANIM_MS + 20);
  };

  const handleToggleOpen = () => {
    if (isVisible && open) {
      handleClose();
    } else {
      handleOpen();
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userText = input.trim();
    addMessage({ role: "user", content: userText });
    setInput("");
    setLoading(true);

    // assistant placeholder
    const assistantId = addMessage({ role: "assistant", content: "" });
    currentAssistantIdRef.current = assistantId;

    try {
      const res = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          context: { role, page },
        }),
      });

      if (!res.ok) {
        const txt = await res.text();
        console.error("API error:", txt);
        updateMessageContent(assistantId, "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }

      const data = await res.json();
      const full = data?.reply ?? "No response from model.";

      // make sure no previous reveal
      if (revealIntervalRef.current) {
        window.clearInterval(revealIntervalRef.current);
        revealIntervalRef.current = null;
      }

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
    } catch (err) {
      console.error("sendMessage error:", err);
      updateMessageContent(assistantId, "Something went wrong. Please try again.");
      setLoading(false);
    }
  };

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
      {/* custom animations */}
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

      {/* Floating Button */}
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

      {/* Only mount backdrop + window when isVisible is true to ensure it unmounts after close */}
      {isVisible && (
        <>
          {/* Backdrop */}
          <div
            onClick={handleClose}
            className={`fixed inset-0 z-40 bg-black/10 transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
            aria-hidden
          />

          {/* Chat Window */}
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
                  <div
                    key={msg.id}
                    className={`mb-1 ${msg.role === "user" ? "text-right" : "text-left"}`}
                  >
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
