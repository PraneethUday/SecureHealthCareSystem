import { NextRequest, NextResponse } from "next/server";
import {
    getMessages,
    sendMessage,
    markMessagesAsRead,
    getConversation,
} from "@/lib/chat";

/**
 * GET /api/chat/messages
 * Get messages for a conversation
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const conversationId = searchParams.get("conversationId");
        const userId = searchParams.get("userId");
        const limit = parseInt(searchParams.get("limit") || "50");
        const offset = parseInt(searchParams.get("offset") || "0");

        if (!conversationId) {
            return NextResponse.json(
                { error: "Conversation ID is required" },
                { status: 400 }
            );
        }

        // Get messages without access check for development
        const result = await getMessages(conversationId, limit, offset);

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }

        // Mark messages as read if userId provided
        if (userId) {
            await markMessagesAsRead(conversationId, userId);
        }

        return NextResponse.json({ messages: result.messages });
    } catch (error) {
        console.error("Error fetching messages:", error);
        return NextResponse.json(
            { error: "Failed to fetch messages" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/chat/messages
 * Send a new message
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { conversationId, content, userId, userRole } = body;

        if (!conversationId || !content) {
            return NextResponse.json(
                { error: "Conversation ID and content are required" },
                { status: 400 }
            );
        }

        if (!userId || !userRole) {
            return NextResponse.json(
                { error: "User ID and role are required" },
                { status: 400 }
            );
        }

        if (content.trim().length === 0) {
            return NextResponse.json(
                { error: "Message cannot be empty" },
                { status: 400 }
            );
        }

        if (content.length > 5000) {
            return NextResponse.json(
                { error: "Message is too long (max 5000 characters)" },
                { status: 400 }
            );
        }

        // Verify conversation exists
        const conversationResult = await getConversation(conversationId);
        if (!conversationResult.success || !conversationResult.conversation) {
            return NextResponse.json(
                { error: "Conversation not found" },
                { status: 404 }
            );
        }

        // Send message
        const result = await sendMessage(
            conversationId,
            userId,
            userRole as "patient" | "doctor",
            content.trim()
        );

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }

        return NextResponse.json({ message: result.message });
    } catch (error) {
        console.error("Error sending message:", error);
        return NextResponse.json(
            { error: "Failed to send message" },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/chat/messages
 * Mark messages as read
 */
export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const { conversationId, userId } = body;

        if (!conversationId || !userId) {
            return NextResponse.json(
                { error: "Conversation ID and User ID are required" },
                { status: 400 }
            );
        }

        const result = await markMessagesAsRead(conversationId, userId);

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error marking messages as read:", error);
        return NextResponse.json(
            { error: "Failed to mark messages as read" },
            { status: 500 }
        );
    }
}

