"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  MessageCircle,
  X,
  Send,
  Trash2,
  Bot,
  User,
  Sparkles,
  Stethoscope,
} from "lucide-react";

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

const QUICK_PROMPTS = [
  "How do I book an appointment?",
  "What are healthy eating tips?",
  "How to read my medical report?",
  "When should I see a doctor?",
];

export default function ChatWidget({
  role = "user",
  page = "dashboard",
}: ChatWidgetProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const revealIntervalRef = useRef<number | null>(null);
  const currentAssistantIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 200);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    return () => {
      if (revealIntervalRef.current) {
        window.clearInterval(revealIntervalRef.current);
        revealIntervalRef.current = null;
      }
    };
  }, []);

  const addMessage = useCallback((m: Omit<Message, "id" | "time">) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const time = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    const msg: Message = { id, time, ...m };
    setMessages((prev) => [...prev, msg]);
    return id;
  }, []);

  const updateMessageContent = useCallback((id: string, content: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, content } : m)),
    );
  }, []);

  const stopRevealAndFinish = useCallback(() => {
    if (revealIntervalRef.current) {
      window.clearInterval(revealIntervalRef.current);
      revealIntervalRef.current = null;
    }
    setLoading(false);
    currentAssistantIdRef.current = null;
  }, []);

  const sendMessage = useCallback(
    async (text?: string) => {
      const userText = (text ?? input).trim();
      if (!userText || loading) return;

      addMessage({ role: "user", content: userText });
      setInput("");
      setLoading(true);

      const assistantId = addMessage({ role: "assistant", content: "" });
      currentAssistantIdRef.current = assistantId;

      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 25000);

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

        let parsed: Record<string, unknown> | null = null;
        let rawText: string | null = null;
        try {
          parsed = await res.clone().json();
        } catch {
          try {
            rawText = await res.text();
          } catch {
            rawText = null;
          }
        }

        if (!res.ok) {
          updateMessageContent(
            assistantId,
            "Sorry, something went wrong. Please try again.",
          );
          setLoading(false);
          currentAssistantIdRef.current = null;
          return;
        }

        const full =
          (parsed?.reply as string) ??
          (parsed?.response as string) ??
          rawText ??
          "No response from the AI model.";

        // Typewriter effect
        let idx = 0;
        const len = full.length;
        const baseDelay = Math.max(4, 14 - Math.floor(len / 150));
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
          idx += 2;
          updateMessageContent(assistantId, full.slice(0, Math.min(idx, len)));
        }, baseDelay);
      } catch (err: unknown) {
        clearTimeout(timeoutId);
        const error = err as Error;
        if (error?.name === "AbortError") {
          updateMessageContent(
            assistantId,
            "The request timed out. Please try again.",
          );
        } else {
          updateMessageContent(
            assistantId,
            "Something went wrong. Please try again.",
          );
        }
        setLoading(false);
        currentAssistantIdRef.current = null;
      }
    },
    [input, loading, role, page, addMessage, updateMessageContent],
  );

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

  const showWelcome = messages.length === 0;

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close chat" : "Open health assistant"}
        className={`fixed bottom-5 right-5 z-50 group transition-all duration-300 ${
          open
            ? "scale-0 opacity-0 pointer-events-none"
            : "scale-100 opacity-100"
        }`}
      >
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full blur-lg opacity-40 group-hover:opacity-60 transition-opacity" />
          <div className="relative flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-full shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300 hover:scale-105">
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
          {/* Notification dot */}
          <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-green-500 border-2 border-white" />
          </span>
        </div>
      </button>

      {/* Chat Window */}
      <div
        className={`fixed bottom-5 right-5 z-50 transition-all duration-300 ease-out origin-bottom-right ${
          open
            ? "scale-100 opacity-100 translate-y-0"
            : "scale-95 opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        <div className="w-[380px] h-[560px] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl shadow-black/15 dark:shadow-black/40 border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-4 py-3.5">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIvPjwvc3ZnPg==')] opacity-50" />
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-9 h-9 bg-white/15 backdrop-blur-sm rounded-xl">
                  <Stethoscope className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm tracking-tight">
                    MedBot Assistant
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-white/70 text-[11px]">
                      Powered by Gemini AI
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {messages.length > 0 && (
                  <button
                    onClick={clearChat}
                    title="Clear conversation"
                    className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  title="Close"
                  className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-gray-50/50 dark:bg-gray-950/50"
            style={{ scrollBehavior: "smooth" }}
          >
            {showWelcome && (
              <div className="flex flex-col items-center justify-center h-full text-center px-2 py-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                  <Sparkles className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                </div>
                <h4 className="text-gray-900 dark:text-gray-100 font-semibold text-base mb-1">
                  Welcome to MedBot
                </h4>
                <p className="text-gray-500 dark:text-gray-400 text-xs mb-5 max-w-[260px] leading-relaxed">
                  I can help with health questions, navigating the app, and
                  understanding your medical information.
                </p>
                <div className="w-full space-y-2">
                  <p className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-gray-500 font-medium">
                    Quick questions
                  </p>
                  {QUICK_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => sendMessage(prompt)}
                      disabled={loading}
                      className="w-full text-left px-3 py-2.5 text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all group"
                    >
                      <span className="text-gray-700 dark:text-gray-300 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
                        {prompt}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${
                  msg.role === "user" ? "flex-row-reverse" : "flex-row"
                }`}
              >
                {/* Avatar */}
                <div
                  className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center mt-0.5 ${
                    msg.role === "user"
                      ? "bg-gradient-to-br from-blue-600 to-indigo-600"
                      : "bg-gradient-to-br from-emerald-500 to-teal-600"
                  }`}
                >
                  {msg.role === "user" ? (
                    <User className="w-3.5 h-3.5 text-white" />
                  ) : (
                    <Bot className="w-3.5 h-3.5 text-white" />
                  )}
                </div>

                {/* Bubble */}
                <div
                  className={`max-w-[75%] flex flex-col ${
                    msg.role === "user" ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`px-3.5 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap break-words ${
                      msg.role === "user"
                        ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-2xl rounded-tr-md shadow-sm"
                        : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-2xl rounded-tl-md border border-gray-100 dark:border-gray-700 shadow-sm"
                    }`}
                  >
                    {msg.content ||
                      (msg.role === "assistant" && loading ? (
                        <span className="flex items-center gap-1.5">
                          <span className="flex gap-1">
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
                          </span>
                        </span>
                      ) : (
                        ""
                      ))}
                  </div>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 px-1">
                    {msg.time}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3">
            <div className="flex items-end gap-2">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your health question..."
                  rows={1}
                  className="w-full px-3.5 py-2.5 text-sm bg-gray-100 dark:bg-gray-800 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:focus:ring-blue-400/30 resize-none placeholder:text-gray-400 dark:placeholder:text-gray-500 text-gray-900 dark:text-gray-100 transition-all"
                  style={{ maxHeight: 100, minHeight: 40 }}
                  disabled={loading}
                />
              </div>
              <button
                onClick={() => sendMessage()}
                disabled={loading || !input.trim()}
                className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 ${
                  loading || !input.trim()
                    ? "bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 hover:scale-105 active:scale-95"
                }`}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center mt-2">
              MedBot provides general info only — not medical advice
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
