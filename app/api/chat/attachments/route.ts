import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
    createAttachment,
    getConversation,
    sendMessage,
    validateFile,
    ALLOWED_FILE_TYPES,
    MAX_FILE_SIZE,
} from "@/lib/chat";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

// Get Supabase client
function getSupabaseClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    return createClient(supabaseUrl, supabaseKey);
}

/**
 * POST /api/chat/attachments
 * Upload a file attachment
 */
export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File | null;
        const conversationId = formData.get("conversationId") as string | null;
        const userId = formData.get("userId") as string | null;
        const userRole = formData.get("userRole") as string | null;

        if (!file || !conversationId) {
            return NextResponse.json(
                { error: "File and conversation ID are required" },
                { status: 400 }
            );
        }

        if (!userId || !userRole) {
            return NextResponse.json(
                { error: "User ID and User Role are required" },
                { status: 400 }
            );
        }

        // Validate file
        if (!ALLOWED_FILE_TYPES.includes(file.type)) {
            return NextResponse.json(
                { error: "File type not allowed. Please upload PDF, JPEG, PNG, GIF, or DOC/DOCX files." },
                { status: 400 }
            );
        }

        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { error: "File size exceeds 10MB limit." },
                { status: 400 }
            );
        }

        // Verify user has access to this conversation
        const conversationResult = await getConversation(conversationId);
        if (!conversationResult.success || !conversationResult.conversation) {
            return NextResponse.json(
                { error: "Conversation not found" },
                { status: 404 }
            );
        }

        const conversation = conversationResult.conversation;

        const isPatient = userRole === "patient" && conversation.patient_id === userId;
        const isDoctor = userRole === "doctor" && conversation.doctor_id === userId;

        if (!isPatient && !isDoctor) {
            return NextResponse.json(
                { error: "You are not authorized to upload files to this conversation" },
                { status: 403 }
            );
        }

        // Upload file to Supabase Storage
        const supabase = getSupabaseClient();
        const fileExt = file.name.split(".").pop();
        const fileName = `${conversationId}/${Date.now()}-${crypto.randomBytes(8).toString("hex")}.${fileExt}`;

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const { data: uploadData, error: uploadError } = await supabase.storage
            .from("chat-attachments")
            .upload(fileName, buffer, {
                contentType: file.type,
                cacheControl: "3600",
                upsert: false,
            });

        if (uploadError) {
            console.error("Upload error:", uploadError);
            return NextResponse.json(
                { error: "Failed to upload file" },
                { status: 500 }
            );
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from("chat-attachments")
            .getPublicUrl(uploadData.path);

        // Create a message for this attachment
        const messageResult = await sendMessage(
            conversationId,
            userId,
            userRole as "patient" | "doctor",
            `📎 Shared a file: ${file.name}`
        );

        if (!messageResult.success || !messageResult.message) {
            return NextResponse.json(
                { error: "Failed to create message for attachment" },
                { status: 500 }
            );
        }

        // Create attachment record
        const attachmentResult = await createAttachment(
            messageResult.message.id,
            file.name,
            file.type,
            file.size,
            urlData.publicUrl
        );

        if (!attachmentResult.success) {
            return NextResponse.json(
                { error: "Failed to record attachment" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            message: messageResult.message,
            attachment: attachmentResult.attachment,
        });

    } catch (error) {
        console.error("Error uploading attachment:", error);
        return NextResponse.json(
            { error: "Failed to upload attachment" },
            { status: 500 }
        );
    }
}

/**
 * GET /api/chat/attachments
 * Get attachment download URL
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const attachmentId = searchParams.get("attachmentId");
        const userId = searchParams.get("userId");
        const userRole = searchParams.get("userRole");

        if (!userId || !userRole) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!attachmentId) {
            return NextResponse.json(
                { error: "Attachment ID is required" },
                { status: 400 }
            );
        }

        const supabase = getSupabaseClient();

        // Get attachment info
        const { data: attachment, error: attachmentError } = await supabase
            .from("chat_attachments")
            .select(`
        *,
        chat_messages!inner (
          conversation_id,
          chat_conversations!inner (
            patient_id,
            doctor_id
          )
        )
      `)
            .eq("id", attachmentId)
            .single();

        if (attachmentError || !attachment) {
            return NextResponse.json(
                { error: "Attachment not found" },
                { status: 404 }
            );
        }

        // Verify user has access
        const conversation = attachment.chat_messages.chat_conversations;

        const isPatient = userRole === "patient" && conversation.patient_id === userId;
        const isDoctor = userRole === "doctor" && conversation.doctor_id === userId;

        if (!isPatient && !isDoctor) {
            return NextResponse.json(
                { error: "You are not authorized to access this attachment" },
                { status: 403 }
            );
        }

        return NextResponse.json({
            url: attachment.file_url,
            fileName: attachment.file_name,
            fileType: attachment.file_type,
            fileSize: attachment.file_size,
        });
    } catch (error) {
        console.error("Error fetching attachment:", error);
        return NextResponse.json(
            { error: "Failed to fetch attachment" },
            { status: 500 }
        );
    }
}
