// app/api/audit/logs/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  // TODO: Replace with your existing auth/role check
  // Example:
  // if (!isAdmin(user)) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { data, error } = await supabase
    .from("access_logs")
    .select(`
      id,
      user_id,
      user_role,
      action,
      resource_type,
      resource_id,
      timestamp,
      blockchain_verified
    `)
    .order("timestamp", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ logs: data });
}
