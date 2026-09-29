import "server-only";
import { createServerSupabase } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import crypto from "crypto";

// Types for chat system
export interface ChatConversation {
    id: string;
    appointment_id: string;
    patient_id: string;
    doctor_id: string;
    created_at: string;
    updated_at: string;
}

export interface ChatMessage {
    id: string;
    conversation_id: string;
    sender_id: string;
    sender_role: "patient" | "doctor";
    content: string;
    is_read: boolean;
    read_at: string | null;
    created_at: string;
    attachments?: ChatAttachment[];
}

export interface ChatAttachment {
    id: string;
    message_id: string;
    file_name: string;
    file_type: string;
    file_size: number;
    file_url: string;
    created_at: string;
}

// Chat messages are encrypted with AES-256-GCM before they reach the
// database. This fails closed: with no valid key the server refuses to send
// or read messages rather than storing plaintext.
const ALGORITHM = "aes-256-gcm";
export const UNREADABLE_MESSAGE = "[This message could not be decrypted]";

export class ChatEncryptionConfigError extends Error {}

function chatKey(): Buffer {
    const hex = process.env.CHAT_ENCRYPTION_KEY;
    if (!hex || !/^[0-9a-fA-F]{64}$/.test(hex)) {
        throw new ChatEncryptionConfigError(
            "CHAT_ENCRYPTION_KEY must be 64 hex characters (32 bytes). Refusing to handle chat messages without encryption.",
        );
    }
    return Buffer.from(hex, "hex");
}

/** Throws ChatEncryptionConfigError if the key is missing or malformed. */
export function assertChatEncryptionConfigured(): void {
    chatKey();
}

/** Encrypt message content. Format: iv:authTag:ciphertext (hex). */
export function encryptMessage(text: string): string {
    const key = chatKey();
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
    return `${iv.toString("hex")}:${cipher.getAuthTag().toString("hex")}:${encrypted.toString("hex")}`;
}

/**
 * Decrypt message content. Rows written before encryption was enforced are
 * plain text and are returned unchanged; anything that fails
 * authentication is replaced, never returned as raw ciphertext.
 */
export function decryptMessage(encryptedText: string): string {
    const key = chatKey();
    const parts = encryptedText.split(":");
    if (parts.length !== 3 || !parts.every((p) => /^[0-9a-f]+$/i.test(p))) {
        return encryptedText;
    }
    try {
        const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(parts[0], "hex"));
        decipher.setAuthTag(Buffer.from(parts[1], "hex"));
        return Buffer.concat([
            decipher.update(Buffer.from(parts[2], "hex")),
            decipher.final(),
        ]).toString("utf8");
    } catch {
        return UNREADABLE_MESSAGE;
    }
}

/**
 * Get or create a conversation for an appointment
 */
export async function getOrCreateConversation(
    appointmentId: string,
    patientId: string,
    doctorId: string
): Promise<{ success: boolean; conversation?: ChatConversation; error?: string }> {
    // Acts as the signed-in user, so chat RLS applies.
    const supabase = await createServerSupabase();

    // First try to get existing conversation (use maybeSingle to avoid error when not found)
    const { data: existing } = await supabase
        .from("chat_conversations")
        .select("*")
        .eq("appointment_id", appointmentId)
        .maybeSingle();

    if (existing) {
        return { success: true, conversation: existing };
    }

    // Create new conversation
    const { data: created, error: createError } = await supabase
        .from("chat_conversations")
        .insert({
            appointment_id: appointmentId,
            patient_id: patientId,
            doctor_id: doctorId,
        })
        .select()
        .single();

    if (createError) {
        // If duplicate key error, fetch the existing conversation
        if (createError.code === "23505") {
            const { data: retryExisting } = await supabase
                .from("chat_conversations")
                .select("*")
                .eq("appointment_id", appointmentId)
                .maybeSingle();
            if (retryExisting) {
                return { success: true, conversation: retryExisting };
            }
        }
        return { success: false, error: createError.message };
    }

    return { success: true, conversation: created };
}

/**
 * Get conversation by ID
 */
export async function getConversation(
    conversationId: string
): Promise<{ success: boolean; conversation?: ChatConversation; error?: string }> {
    // Acts as the signed-in user, so chat RLS applies.
    const supabase = await createServerSupabase();

    const { data, error } = await supabase
        .from("chat_conversations")
        .select("*")
        .eq("id", conversationId)
        .single();

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true, conversation: data };
}

/**
 * Get conversation by appointment ID
 */
export async function getConversationByAppointment(
    appointmentId: string
): Promise<{ success: boolean; conversation?: ChatConversation; error?: string }> {
    // Acts as the signed-in user, so chat RLS applies.
    const supabase = await createServerSupabase();

    const { data, error } = await supabase
        .from("chat_conversations")
        .select("*")
        .eq("appointment_id", appointmentId)
        .single();

    if (error && error.code !== "PGRST116") { // PGRST116 = no rows returned
        return { success: false, error: error.message };
    }

    return { success: true, conversation: data || undefined };
}

/**
 * Send a message
 */
export async function sendMessage(
    conversationId: string,
    senderId: string,
    senderRole: "patient" | "doctor",
    content: string
): Promise<{ success: boolean; message?: ChatMessage; error?: string }> {
    // Acts as the signed-in user, so chat RLS applies.
    const supabase = await createServerSupabase();

    // Encrypt the message content
    const encryptedContent = encryptMessage(content);

    const { data, error } = await supabase
        .from("chat_messages")
        .insert({
            conversation_id: conversationId,
            sender_id: senderId,
            sender_role: senderRole,
            content: encryptedContent,
        })
        .select()
        .single();

    if (error) {
        return { success: false, error: error.message };
    }

    // Return with decrypted content for immediate display
    return {
        success: true,
        message: { ...data, content },
    };
}

/**
 * Get messages for a conversation
 */
export async function getMessages(
    conversationId: string,
    limit: number = 50,
    offset: number = 0
): Promise<{ success: boolean; messages?: ChatMessage[]; error?: string }> {
    // Acts as the signed-in user, so chat RLS applies.
    const supabase = await createServerSupabase();

    const { data: messages, error } = await supabase
        .from("chat_messages")
        .select(`
      *,
      chat_attachments (*)
    `)
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })
        .range(offset, offset + limit - 1);

    if (error) {
        return { success: false, error: error.message };
    }

    // Decrypt messages; attachments get short-lived signed URLs.
    const decryptedMessages = await Promise.all(
        messages.map(async (msg: any) => ({
            ...msg,
            content: decryptMessage(msg.content),
            attachments: await Promise.all(
                (msg.chat_attachments || []).map(async (a: ChatAttachment) => ({
                    ...a,
                    file_url: await signAttachmentUrl(a.file_url),
                })),
            ),
        })),
    );

    return { success: true, messages: decryptedMessages };
}

/**
 * Mark messages as read
 */
export async function markMessagesAsRead(
    conversationId: string,
    userId: string
): Promise<{ success: boolean; error?: string }> {
    // Acts as the signed-in user, so chat RLS applies.
    const supabase = await createServerSupabase();

    const { error } = await supabase
        .from("chat_messages")
        .update({
            is_read: true,
            read_at: new Date().toISOString(),
        })
        .eq("conversation_id", conversationId)
        .neq("sender_id", userId)
        .eq("is_read", false);

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true };
}

/**
 * Get unread message count
 */
export async function getUnreadCount(
    conversationId: string,
    userId: string
): Promise<{ success: boolean; count?: number; error?: string }> {
    // Acts as the signed-in user, so chat RLS applies.
    const supabase = await createServerSupabase();

    const { count, error } = await supabase
        .from("chat_messages")
        .select("*", { count: "exact", head: true })
        .eq("conversation_id", conversationId)
        .neq("sender_id", userId)
        .eq("is_read", false);

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true, count: count || 0 };
}

/**
 * Create an attachment record
 */
export async function createAttachment(
    messageId: string,
    fileName: string,
    fileType: string,
    fileSize: number,
    fileUrl: string
): Promise<{ success: boolean; attachment?: ChatAttachment; error?: string }> {
    // Acts as the signed-in user, so chat RLS applies.
    const supabase = await createServerSupabase();

    const { data, error } = await supabase
        .from("chat_attachments")
        .insert({
            message_id: messageId,
            file_name: fileName,
            file_type: fileType,
            file_size: fileSize,
            file_url: fileUrl,
        })
        .select()
        .single();

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true, attachment: data };
}

/**
 * Upload file to Supabase Storage
 */
export const CHAT_BUCKET = "chat-attachments";

/**
 * Upload a file into a conversation's folder in the private bucket. The
 * conversation must be visible to the caller under RLS first; the upload
 * itself uses the service role. Returns the object path (not a URL);
 * getMessages signs short-lived URLs on read.
 */
export async function uploadChatFile(
    file: File,
    conversationId: string
): Promise<{ success: boolean; url?: string; error?: string }> {
    const conversation = await getConversation(conversationId);
    if (!conversation.success || !conversation.conversation) {
        return { success: false, error: "Conversation not found" };
    }

    const fileExt = file.name.split(".").pop()?.replace(/[^\w]/g, "") || "bin";
    const fileName = `${conversationId}/${Date.now()}-${crypto.randomBytes(8).toString("hex")}.${fileExt}`;

    const { data, error } = await supabaseAdmin.storage
        .from(CHAT_BUCKET)
        .upload(fileName, await file.arrayBuffer(), {
            contentType: file.type,
            upsert: false,
        });

    if (error) {
        return { success: false, error: error.message };
    }
    return { success: true, url: data.path };
}

export async function signAttachmentUrl(path: string): Promise<string> {
    // Legacy rows hold a full public URL; new rows hold the object path.
    const objectPath = path.includes(`/${CHAT_BUCKET}/`) ? path.split(`/${CHAT_BUCKET}/`)[1] : path;
    const { data } = await supabaseAdmin.storage.from(CHAT_BUCKET).createSignedUrl(objectPath, 3600);
    return data?.signedUrl ?? "";
}

// Allowed file types for medical reports
export const ALLOWED_FILE_TYPES = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/gif",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Validate file for upload
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        return {
            valid: false,
            error: "File type not allowed. Please upload PDF, JPEG, PNG, GIF, or DOC/DOCX files.",
        };
    }

    if (file.size > MAX_FILE_SIZE) {
        return {
            valid: false,
            error: "File size exceeds 10MB limit.",
        };
    }

    return { valid: true };
}
