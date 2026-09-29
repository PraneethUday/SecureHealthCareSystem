import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import ChatWidget from "./components/chatbot/ChatWidget";

// Every dashboard page needs a live Supabase session: without one, RLS
// returns nothing and pages would render from a stale cached profile.
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <>
      {children}
      {/* Answers only from records the signed-in user is authorized to see. */}
      <ChatWidget />
    </>
  );
}
