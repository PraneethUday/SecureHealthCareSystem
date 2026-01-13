"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function PatientDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(async (event) => {
    console.log("AUTH EVENT:", event);

    if (event === "SIGNED_IN" || event === "INITIAL_SESSION") {
      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) {
        console.log("USER NOT READY YET — retrying...");
        setTimeout(async () => {
          const { data: retryData } = await supabase.auth.getUser();
          if (!retryData.user) return;

          console.log("CALLING AUDIT API (RETRY)");

          await fetch("/api/audit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: retryData.user.id,
              role: "patient",
              action: "login_success",
            }),
          });
        }, 300);
        return;
      }
      console.log("CALLING AUDIT API");

      await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userData.user.id,
          role: "patient",
          action: "login_success",
        }),
      });
    }
  });

  return () => {
    subscription.unsubscribe();
  };
}, []);


  return <>{children}</>;
}
