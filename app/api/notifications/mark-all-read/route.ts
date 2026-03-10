import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, userRole } = body;

    if (!userId || !userRole) {
      return NextResponse.json(
        { error: "Missing userId or userRole" },
        { status: 400 },
      );
    }

    const { error } = await supabase
      .from("notifications")
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq("recipient_id", userId)
      .eq("recipient_role", userRole)
      .eq("is_read", false);

    if (error) {
      console.error("Error marking all notifications as read:", error);
      return NextResponse.json(
        { error: "Failed to mark all notifications as read" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in mark-all-read POST:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
