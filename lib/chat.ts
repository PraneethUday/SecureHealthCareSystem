import { createClient } from "@supabase/supabase-js";
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

// Encryption utilities using AES-256-GCM
// NOTE: For development, encryption is disabled because no persistent CHAT_ENCRYPTION_KEY is set
const ENCRYPTION_KEY = process.env.CHAT_ENCRYPTION_KEY;
const ALGORITHM = "aes-256-gcm";

/**
 * Encrypt message content (disabled for now - returns plain text)
 */
export function encryptMessage(text: string): string {
    // Skip encryption if no key is configured
    if (!ENCRYPTION_KEY) {
        return text;
    }

    const iv = crypto.randomBytes(16);
    const key = Buffer.from(ENCRYPTION_KEY.slice(0, 64), "hex");
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");

    const authTag = cipher.getAuthTag();

    // Format: iv:authTag:encryptedData
    return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

/**
 * Decrypt message content
 */
export function decryptMessage(encryptedText: string): string {
    try {
        const parts = encryptedText.split(":");
        if (parts.length !== 3) {
            // If not encrypted format, return as-is (plain text message)
            return encryptedText;
        }

        // If no encryption key is configured, return as-is
        if (!ENCRYPTION_KEY) {
            return encryptedText;
        }

        const iv = Buffer.from(parts[0], "hex");
        const authTag = Buffer.from(parts[1], "hex");
        const encrypted = parts[2];

        const key = Buffer.from(ENCRYPTION_KEY.slice(0, 64), "hex");
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(encrypted, "hex", "utf8");
        decrypted += decipher.final("utf8");

        return decrypted;
    } catch {
        // Return original if decryption fails
        return encryptedText;
    }
}


// Supabase client factory
function getSupabaseClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
        process.env.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        "placeholder-key";
    return createClient(supabaseUrl, supabaseKey);
}


/**
 * Get or create a conversation for an appointment
 */
export async function getOrCreateConversation(
    appointmentId: string,
    patientId: string,
    doctorId: string
): Promise<{ success: boolean; conversation?: ChatConversation; error?: string }> {
    const supabase = getSupabaseClient();

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
    const supabase = getSupabaseClient();

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
    const supabase = getSupabaseClient();

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
    const supabase = getSupabaseClient();

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
    const supabase = getSupabaseClient();

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

    // Decrypt messages
    const decryptedMessages = messages.map((msg: any) => ({
        ...msg,
        content: decryptMessage(msg.content),
        attachments: msg.chat_attachments || [],
    }));

    return { success: true, messages: decryptedMessages };
}

/**
 * Mark messages as read
 */
export async function markMessagesAsRead(
    conversationId: string,
    userId: string
): Promise<{ success: boolean; error?: string }> {
    const supabase = getSupabaseClient();

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
    const supabase = getSupabaseClient();

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
    const supabase = getSupabaseClient();

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
export async function uploadChatFile(
    file: File,
    conversationId: string
): Promise<{ success: boolean; url?: string; error?: string }> {
    const supabase = getSupabaseClient();

    const fileExt = file.name.split(".").pop();
    const fileName = `${conversationId}/${Date.now()}-${crypto.randomBytes(8).toString("hex")}.${fileExt}`;

    const { data, error } = await supabase.storage
        .from("chat-attachments")
        .upload(fileName, file, {
            cacheControl: "3600",
            upsert: false,
        });

    if (error) {
        return { success: false, error: error.message };
    }

    const { data: urlData } = supabase.storage
        .from("chat-attachments")
        .getPublicUrl(data.path);

    return { success: true, url: urlData.publicUrl };
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
