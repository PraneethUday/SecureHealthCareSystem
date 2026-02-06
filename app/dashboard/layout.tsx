"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import ChatWidget from "./components/chatbot/ChatWidget";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    const logAudit = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session?.user) return;

      await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: data.session.user.id,
          role: "patient", // or infer later
          action: "login_success",
        }),
      });
    };

    logAudit();
  }, []);

  return (
    <>
      {children}
      <ChatWidget />
    </>
  );
}
