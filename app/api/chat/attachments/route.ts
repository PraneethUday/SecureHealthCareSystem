import { NextRequest, NextResponse } from "next/server";
import { guard } from "@/lib/supabase/server";
import {
    createAttachment,
    sendMessage,
    signAttachmentUrl,
    uploadChatFile,
    ALLOWED_FILE_TYPES,
    MAX_FILE_SIZE,
} from "@/lib/chat";

/**
 * POST /api/chat/attachments
 * Upload a file attachment
 */
export async function POST(request: NextRequest) {
    const auth = await guard("patient", "doctor");
    if (auth instanceof Response) return auth;

    try {
        const formData = await request.formData();
        const file = formData.get("file") as File | null;
        const conversationId = formData.get("conversationId") as string | null;

        if (!file || !conversationId) {
            return NextResponse.json(
                { error: "File and conversation ID are required" },
                { status: 400 }
            );
        }

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

        // Fails unless the conversation is visible to the caller under RLS.
        const upload = await uploadChatFile(file, conversationId);
        if (!upload.success || !upload.url) {
            return NextResponse.json(
                { error: "You are not authorized to upload files to this conversation" },
                { status: 403 }
            );
        }

        const messageResult = await sendMessage(
            conversationId,
            auth.profileId,
            auth.role as "patient" | "doctor",
            `📎 Shared a file: ${file.name}`
        );

        if (!messageResult.success || !messageResult.message) {
            return NextResponse.json(
                { error: "Failed to create message for attachment" },
                { status: 500 }
            );
        }

        const attachmentResult = await createAttachment(
            messageResult.message.id,
            file.name,
            file.type,
            file.size,
            upload.url
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
 * Get a short-lived download URL for an attachment
 */
export async function GET(request: NextRequest) {
    const auth = await guard("patient", "doctor");
    if (auth instanceof Response) return auth;

    const attachmentId = new URL(request.url).searchParams.get("attachmentId");
    if (!attachmentId) {
        return NextResponse.json(
            { error: "Attachment ID is required" },
            { status: 400 }
        );
    }

    // RLS only returns attachments in the caller's own conversations.
    const { data: attachment } = await auth.supabase
        .from("chat_attachments")
        .select("file_url, file_name, file_type, file_size")
        .eq("id", attachmentId)
        .maybeSingle();

    if (!attachment) {
        return NextResponse.json(
            { error: "Attachment not found" },
            { status: 404 }
        );
    }

    return NextResponse.json({
        url: await signAttachmentUrl(attachment.file_url),
        fileName: attachment.file_name,
        fileType: attachment.file_type,
        fileSize: attachment.file_size,
    });
}
