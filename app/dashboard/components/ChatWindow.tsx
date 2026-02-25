"use client";

import { useState, useEffect, useRef } from "react";
import {
    Send,
    Paperclip,
    X,
    FileText,
    Image as ImageIcon,
    Download,
    Check,
    CheckCheck,
    Loader2,
    AlertCircle,
} from "lucide-react";

interface ChatMessage {
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

interface ChatAttachment {
    id: string;
    message_id: string;
    file_name: string;
    file_type: string;
    file_size: number;
    file_url: string;
    created_at: string;
}

interface ChatWindowProps {
    appointmentId: string;
    currentUserId: string;
    currentUserRole: "patient" | "doctor";
    otherUserName: string;
}

export default function ChatWindow({
    appointmentId,
    currentUserId,
    currentUserRole,
    otherUserName,
}: ChatWindowProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Initialize conversation
    useEffect(() => {
        initializeConversation();
        return () => {
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
            }
        };
    }, [appointmentId]);

    // Poll for new messages
    useEffect(() => {
        if (conversationId) {
            pollIntervalRef.current = setInterval(fetchMessages, 5000);
            return () => {
                if (pollIntervalRef.current) {
                    clearInterval(pollIntervalRef.current);
                }
            };
        }
    }, [conversationId]);

    // Scroll to bottom when messages change
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const initializeConversation = async () => {
        try {
            setLoading(true);
            setError(null);

            // Create or get conversation
            const response = await fetch("/api/chat/conversations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ appointmentId }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to initialize chat");
            }

            const data = await response.json();
            setConversationId(data.conversation.id);

            // Fetch messages
            await fetchMessagesForConversation(data.conversation.id);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to initialize chat");
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async () => {
        if (!conversationId) return;
        await fetchMessagesForConversation(conversationId);
    };

    const fetchMessagesForConversation = async (convId: string) => {
        try {
            const response = await fetch(
                `/api/chat/messages?conversationId=${convId}&userId=${currentUserId}`
            );

            if (!response.ok) {
                throw new Error("Failed to fetch messages");
            }

            const data = await response.json();
            setMessages(data.messages || []);
        } catch (err) {
            console.error("Error fetching messages:", err);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !conversationId || sending) return;

        try {
            setSending(true);
            setError(null);

            const response = await fetch("/api/chat/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    conversationId,
                    content: newMessage.trim(),
                    userId: currentUserId,
                    userRole: currentUserRole,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to send message");
            }

            const data = await response.json();
            setMessages((prev) => [...prev, data.message]);
            setNewMessage("");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to send message");
        } finally {
            setSending(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !conversationId) return;

        try {
            setUploading(true);
            setError(null);

            const formData = new FormData();
            formData.append("file", file);
            formData.append("conversationId", conversationId);

            const response = await fetch("/api/chat/attachments", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to upload file");
            }

            const data = await response.json();
            setMessages((prev) => [
                ...prev,
                { ...data.message, attachments: [data.attachment] },
            ]);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to upload file");
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return "Today";
        } else if (date.toDateString() === yesterday.toDateString()) {
            return "Yesterday";
        }
        return date.toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
        });
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const getFileIcon = (fileType: string) => {
        if (fileType.startsWith("image/")) {
            return <ImageIcon className="w-5 h-5" />;
        }
        return <FileText className="w-5 h-5" />;
    };

    const renderMessage = (message: ChatMessage, index: number) => {
        const isOwn = message.sender_id === currentUserId;
        const showDate =
            index === 0 ||
            formatDate(messages[index - 1].created_at) !==
            formatDate(message.created_at);

        return (
            <div key={message.id}>
                {showDate && (
                    <div className="flex justify-center my-4">
                        <span className="px-3 py-1 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-full">
                            {formatDate(message.created_at)}
                        </span>
                    </div>
                )}
                <div
                    className={`flex mb-3 ${isOwn ? "justify-end" : "justify-start"}`}
                >
                    <div
                        className={`max-w-[75%] rounded-2xl px-4 py-2 ${isOwn
                            ? "bg-blue-600 text-white rounded-br-md"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-md"
                            }`}
                    >
                        {/* Attachments */}
                        {message.attachments && message.attachments.length > 0 && (
                            <div className="mb-2">
                                {message.attachments.map((attachment) => (
                                    <a
                                        key={attachment.id}
                                        href={attachment.file_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${isOwn
                                            ? "bg-blue-500 hover:bg-blue-400"
                                            : "bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500"
                                            }`}
                                    >
                                        {getFileIcon(attachment.file_type)}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">
                                                {attachment.file_name}
                                            </p>
                                            <p
                                                className={`text-xs ${isOwn ? "text-blue-200" : "text-gray-500 dark:text-gray-400"
                                                    }`}
                                            >
                                                {formatFileSize(attachment.file_size)}
                                            </p>
                                        </div>
                                        <Download className="w-4 h-4 flex-shrink-0" />
                                    </a>
                                ))}
                            </div>
                        )}

                        {/* Message content (hide if it's just the file shared notification) */}
                        {!message.content.startsWith("📎 Shared a file:") && (
                            <p className="text-sm whitespace-pre-wrap break-words">
                                {message.content}
                            </p>
                        )}

                        {/* Timestamp and read status */}
                        <div
                            className={`flex items-center gap-1 mt-1 ${isOwn ? "justify-end" : "justify-start"
                                }`}
                        >
                            <span
                                className={`text-xs ${isOwn ? "text-blue-200" : "text-gray-500 dark:text-gray-400"
                                    }`}
                            >
                                {formatTime(message.created_at)}
                            </span>
                            {isOwn && (
                                <span className="text-blue-200">
                                    {message.is_read ? (
                                        <CheckCheck className="w-4 h-4" />
                                    ) : (
                                        <Check className="w-4 h-4" />
                                    )}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96 bg-white dark:bg-gray-800 rounded-xl">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    <p className="text-gray-600 dark:text-gray-400">Loading chat...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[600px] bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                        Chat with {otherUserName}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        {currentUserRole === "patient" ? "Your Doctor" : "Your Patient"}
                    </p>
                </div>
            </div>

            {/* Error banner */}
            {error && (
                <div className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                    <button
                        onClick={() => setError(null)}
                        className="ml-auto p-1 hover:bg-red-100 dark:hover:bg-red-900/40 rounded"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                        <p className="text-center">No messages yet.</p>
                        <p className="text-sm text-center mt-1">
                            Start the conversation by sending a message below.
                        </p>
                    </div>
                ) : (
                    messages.map((message, index) => renderMessage(message, index))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900">
                <form onSubmit={handleSendMessage} className="flex items-end gap-2">
                    {/* File upload button */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        onChange={handleFileUpload}
                        accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx"
                        className="hidden"
                        disabled={uploading}
                    />
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="p-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
                        title="Attach file"
                    >
                        {uploading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Paperclip className="w-5 h-5" />
                        )}
                    </button>

                    {/* Message input */}
                    <div className="flex-1">
                        <textarea
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage(e);
                                }
                            }}
                            placeholder="Type a message..."
                            rows={1}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                            style={{ minHeight: "40px", maxHeight: "120px" }}
                        />
                    </div>

                    {/* Send button */}
                    <button
                        type="submit"
                        disabled={!newMessage.trim() || sending}
                        className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Send message"
                    >
                        {sending ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Send className="w-5 h-5" />
                        )}
                    </button>
                </form>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                    Press Enter to send, Shift+Enter for new line
                </p>
            </div>
        </div>
    );
}
