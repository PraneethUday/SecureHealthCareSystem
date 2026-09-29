import { NextRequest, NextResponse } from "next/server";
import { guard } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const auth = await guard();
    if (auth instanceof Response) return auth;
    const supabase = auth.supabase;
    const searchParams = request.nextUrl.searchParams;
    // Always the caller's own inbox; any userId in the query is ignored.
    const userId = auth.profileId;
    const userRole = auth.role;
    const limit = parseInt(searchParams.get("limit") || "20");
    const unreadOnly = searchParams.get("unreadOnly") === "true";

    if (!userId || !userRole) {
      return NextResponse.json(
        { error: "Missing userId or userRole" },
        { status: 400 },
      );
    }

    // Get notifications
    let query = supabase
      .from("notifications")
      .select("*")
      .eq("recipient_id", userId)
      .eq("recipient_role", userRole)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (unreadOnly) {
      query = query.eq("is_read", false);
    }

    const { data: notifications, error } = await query;

    if (error) {
      console.error("Error fetching notifications:", error);
      return NextResponse.json(
        { error: "Failed to fetch notifications" },
        { status: 500 },
      );
    }

    // Get unread count
    const { count: unreadCount } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("recipient_id", userId)
      .eq("recipient_role", userRole)
      .eq("is_read", false);

    return NextResponse.json({
      notifications: notifications || [],
      unreadCount: unreadCount || 0,
    });
  } catch (error) {
    console.error("Error in notifications GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await guard();
    if (auth instanceof Response) return auth;
    const supabase = auth.supabase;
    const body = await request.json();
    const {
      recipientId,
      recipientRole,
      title,
      message,
      type,
      relatedEntityType,
      relatedEntityId,
      metadata,
    } = body;

    if (!recipientId || !recipientRole || !title || !message || !type) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("notifications")
      .insert({
        recipient_id: recipientId,
        recipient_role: recipientRole,
        title,
        message,
        type,
        related_entity_type: relatedEntityType,
        related_entity_id: relatedEntityId,
        metadata: metadata || {},
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating notification:", error);
      return NextResponse.json(
        { error: "Failed to create notification" },
        { status: 500 },
      );
    }

    return NextResponse.json({ notification: data });
  } catch (error) {
    console.error("Error in notifications POST:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
