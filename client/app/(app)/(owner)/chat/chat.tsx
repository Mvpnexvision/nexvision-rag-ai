"use client";

import { useEffect, useRef, useState } from "react";
import EmptyState from "./components/EmptyState";
import ChatMessage from "./components/ChatMessage";
import ChatInput from "./components/ChatInput";
import { useToast } from "@/components/Toast";
import { useAuth } from "@/contexts/authContext";
import {
    AIOutput,
    CreateChatResponse,
    ChatListItem,
    ChatListResponse,
    AIQuestionRecord,
    AIQuestionsListResponse,
    useChatWorkflowApi,
} from "@/hooks/useChatWorkflowApi";
import {
    clearStagedFiles,
    isSupportedFileType,
    listStagedFiles,
    MAX_CHAT_FILES,
    removeStagedFile,
    saveStagedFiles,
    StagedFileRecord,
    toFile,
} from "@/lib/stagedFilesStore";
import { useDocumentPolling } from "@/hooks/useDocumentPolling";

export interface Message {
    id: string;
    role: "user" | "assistant" | "system";
    content: React.ReactNode;
    attachedFiles?: AttachedFile[];
    isFromServer?: boolean;
}

export interface AttachedFile {
    id: string;
    name: string;
    icon: string;
}

const CHAT_HISTORY = [
    {
        id: "existing-chat-project-requirements",
        label: "Project Requirements Analysis",
        group: "Today",
    },
    {
        id: "existing-chat-q3-financial",
        label: "Q3 Financial Report",
        group: "Yesterday",
    },
    {
        id: "existing-chat-marketing-strategy",
        label: "Marketing Strategy 2024",
        group: "Previous 7 Days",
    },
] as const;

type GroupedChats = {
    [key: string]: ChatListItem[];
};

function groupChatsByTime(chats: ChatListItem[]): GroupedChats {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const grouped: GroupedChats = {
        Today: [],
        Yesterday: [],
        "Previous 7 Days": [],
        Older: [],
    };

    chats.forEach((chat) => {
        const chatDate = new Date(chat.updated_at);
        const chatDateOnly = new Date(
            chatDate.getFullYear(),
            chatDate.getMonth(),
            chatDate.getDate()
        );

        if (chatDateOnly.getTime() === today.getTime()) {
            grouped["Today"].push(chat);
        } else if (chatDateOnly.getTime() === yesterday.getTime()) {
            grouped["Yesterday"].push(chat);
        } else if (chatDateOnly.getTime() >= sevenDaysAgo.getTime()) {
            grouped["Previous 7 Days"].push(chat);
        } else {
            grouped["Older"].push(chat);
        }
    });

    return grouped;
}

function toIcon(fileName: string): string {
    const ext = fileName.split(".").pop()?.toLowerCase();

    if (ext === "pdf") return "fa-file-pdf";
    if (ext === "docx") return "fa-file-word";
    if (ext === "xlsx") return "fa-file-excel";
    if (ext === "csv") return "fa-file-csv";
    return "fa-file-lines";
}

function mapToAttachedFile(record: StagedFileRecord): AttachedFile {
    return {
        id: record.id,
        name: record.name,
        icon: toIcon(record.name),
    };
}

function formatAIResponse(answer: AIOutput): string {
    const lines = [answer.direct_answer];

    if (answer.recommendation) {
        lines.push(`\nRecommendation: ${answer.recommendation}`);
    }

    if (answer.next_action) {
        lines.push(`\nNext Action: ${answer.next_action}`);
    }

    if (answer.sources.length > 0) {
        lines.push(`\nSources: ${answer.sources.join(", ")}`);
    }

    return lines.join("\n");
}

/**
 * Builds the system-message string shown while documents are being processed.
 *
 * - Single document  → shows only the friendly status label.
 * - Multiple docs    → shows a count summary plus the most recent status so
 *                      the user always sees live progress regardless of which
 *                      document last reported.
 */
function buildProcessingLabel(
    statusMap: Map<string, string>,   // documentId → raw status
    latestStatus: string,
    totalCount: number,
): string {
    if (totalCount === 1) {
        return latestStatus;
    }

    const completedCount = [...statusMap.values()].filter(
        (s) => s.toLowerCase() === "ai ready",
    ).length;

    return `Processing ${totalCount} documents (${completedCount}/${totalCount} ready)… ${latestStatus}`;
}

export default function Chat() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
    const [isCreatingChat, setIsCreatingChat] = useState(false);
    const [chats, setChats] = useState<ChatListItem[]>([]);
    const [loadingChats, setLoadingChats] = useState(false);
    const [loadingMessages, setLoadingMessages] = useState(false);

    /**
     * Holds the AbortController that cancels all in-flight document polls.
     * Aborted on component unmount so no state updates fire after teardown.
     */
    const pollingControllerRef = useRef<AbortController | null>(null);

    const { showToast } = useToast();
    const { profile, user, loading: authLoading, session } = useAuth();
    const {
        createChat,
        uploadDocument,
        linkDocumentsToChat,
        sendAIChat,
        listChats,
        getChatMessages,
    } = useChatWorkflowApi();
    const { processAndPoll } = useDocumentPolling();

    const companyId =
        profile?.company_id ||
        (typeof user?.user_metadata?.company_id === "string"
            ? user.user_metadata.company_id
            : undefined) ||
        (typeof session?.user?.user_metadata?.company_id === "string"
            ? session.user.user_metadata.company_id
            : undefined);

    // ── Abort any active polling when the component unmounts ──────────────
    useEffect(() => {
        return () => {
            pollingControllerRef.current?.abort();
        };
    }, []);

    // ── Restore staged files on mount ─────────────────────────────────────
    useEffect(() => {
        const loadStagedFiles = async () => {
            try {
                const staged = await listStagedFiles();
                setAttachedFiles(staged.map(mapToAttachedFile));
            } catch {
                showToast({
                    message: "Failed to load staged files.",
                    type: "error",
                });
            }
        };

        void loadStagedFiles();
    }, [showToast]);

    // ── Fetch chats and ensure a chat is selected ─────────────────────────
    useEffect(() => {
        const initializeChat = async () => {
            if (authLoading || !companyId || !user?.id) return;
            if (selectedChatId) return; // Already have a chat selected

            setLoadingChats(true);

            try {
                const response: ChatListResponse = await listChats({
                    companyId,
                    limit: 50,
                });

                setChats(response.chats);

                // Check if we can reuse the latest "New Chat"
                if (response.chats.length > 0) {
                    const latestChat = response.chats[0]; // First one is most recent (ordered by updated_at DESC)

                    // Reuse if it's a "New Chat" (not used yet)
                    if (latestChat.title === "New Chat") {
                        setSelectedChatId(latestChat.chat_id);
                        setLoadingChats(false);
                        return;
                    }
                }

                // Otherwise create a new chat
                setIsCreatingChat(true);
                const createdChat: CreateChatResponse = await createChat({
                    companyId,
                    userId: user.id,
                    title: "New Chat",
                });

                setSelectedChatId(createdChat.chat_id);
                // Append the newly created chat to the list
                setChats((prev) => [
                    {
                        chat_id: createdChat.chat_id,
                        title: createdChat.title,
                        company_id: createdChat.company_id,
                        user_id: user.id,
                        document_ids: [],
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    },
                    ...prev,
                ]);
            } catch (error) {
                console.error("Failed to initialize chat:", error);
                setChats([]);
            } finally {
                setIsCreatingChat(false);
                setLoadingChats(false);
            }
        };

        void initializeChat();
    }, [authLoading, companyId, user?.id, selectedChatId]);

    // ── Fetch messages when a chat is selected ─────────────────────────────
    useEffect(() => {
        const fetchMessages = async () => {
            if (!selectedChatId || selectedChatId.startsWith("existing-chat-")) return;

            setLoadingMessages(true);

            try {
                const response: AIQuestionsListResponse = await getChatMessages(selectedChatId);

                // Transform AI question records into Message objects
                const chatMessages: Message[] = response.questions.flatMap((question) => [
                    {
                        id: `${question.id}-user`,
                        role: "user" as const,
                        content: question.question,
                        isFromServer: true,
                    },
                    {
                        id: question.id,
                        role: "assistant" as const,
                        content: formatAIResponse({
                            direct_answer: question.answer,
                            evidence_found: question.evidence_found,
                            reasoning: question.reasoning,
                            recommendation: question.recommendation,
                            risk_level: question.risk_level as AIOutput["risk_level"],
                            business_impact: question.business_impact,
                            next_action: question.next_action,
                            missing_data: question.missing_data,
                            sources: question.sources_json,
                        }),
                        isFromServer: true,
                    },
                ]);

                setMessages(chatMessages);
            } catch (error) {
                console.error("Failed to fetch chat messages:", error);
                setMessages([]);
            } finally {
                setLoadingMessages(false);
            }
        };

        void fetchMessages();
    }, [selectedChatId]);

    // ── Message helpers ───────────────────────────────────────────────────

    const replaceSystemMessage = (messageId: string, text: string) => {
        setMessages((prev) =>
            prev.map((item) =>
                item.id === messageId ? { ...item, content: text } : item,
            ),
        );
    };

    const pushSystemMessage = (text: string): string => {
        const systemId = `${Date.now()}-system`;

        setMessages((prev) => [
            ...prev,
            { id: systemId, role: "system", content: text },
        ]);

        return systemId;
    };

    const removeSystemMessage = (messageId: string) => {
        setMessages((prev) => prev.filter((item) => item.id !== messageId));
    };

    // ── File helpers ──────────────────────────────────────────────────────

    const handleFilesSelected = async (files: File[]) => {
        if (files.length === 0) return;

        try {
            const existing = await listStagedFiles();
            const supported = files.filter(isSupportedFileType);
            const unsupportedCount = files.length - supported.length;

            if (unsupportedCount > 0) {
                showToast({
                    message: "Only PDF, DOCX, XLSX, CSV, and TXT files are supported.",
                    type: "error",
                });
            }

            const availableSlots = Math.max(0, MAX_CHAT_FILES - existing.length);

            if (availableSlots === 0) {
                showToast({
                    message: `You can attach a maximum of ${MAX_CHAT_FILES} files per message.`,
                    type: "error",
                });
                return;
            }

            const filesToStage = supported.slice(0, availableSlots);

            if (supported.length > availableSlots) {
                showToast({
                    message: `Only ${availableSlots} more file(s) can be attached. Some files were skipped.`,
                    type: "error",
                });
            }

            const saved = await saveStagedFiles(filesToStage);
            setAttachedFiles((prev) => [...prev, ...saved.map(mapToAttachedFile)]);
        } catch {
            showToast({
                message: "Unable to stage selected files.",
                type: "error",
            });
        }
    };

    const handleRemoveFile = async (fileId: string) => {
        try {
            await removeStagedFile(fileId);
            setAttachedFiles((prev) => prev.filter((f) => f.id !== fileId));
        } catch {
            showToast({
                message: "Unable to remove file.",
                type: "error",
            });
        }
    };

    // ── Main send handler ─────────────────────────────────────────────────

    const handleSendMessage = async (text: string) => {
        if (!text.trim()) return;

        if (authLoading) {
            showToast({
                message: "Initializing session. Please try again in a moment.",
                type: "info",
            });
            return;
        }

        if (!user?.id) {
            showToast({
                message: "No active user session found. Please sign in again.",
                type: "error",
            });
            return;
        }

        if (!companyId) {
            showToast({
                message: "Your account has no company profile yet. Please contact admin or sign in again.",
                type: "error",
            });
            return;
        }

        if (!selectedChatId) {
            showToast({
                message: "Creating your chat session. Please try again in a moment.",
                type: "info",
            });
            return;
        }

        if (selectedChatId.startsWith("existing-chat-")) {
            showToast({
                message: "This chat is a placeholder. Please wait for a real chat session to initialize.",
                type: "info",
            });
            return;
        }

        setIsSubmitting(true);

        const userMessage: Message = {
            id: `${Date.now()}-user`,
            role: "user",
            content: text,
            attachedFiles: [...attachedFiles],
        };

        setMessages((prev) => [...prev, userMessage]);

        const filesBeforeSend = [...attachedFiles];
        setAttachedFiles([]);

        const systemMessageId = pushSystemMessage("Uploading documents...");

        try {
            const stagedFiles = await listStagedFiles();
            const uploadedDocumentIds: string[] = [];

            // ── Upload ────────────────────────────────────────────────────
            for (const staged of stagedFiles) {
                const uploadResponse = await uploadDocument({
                    file: toFile(staged),
                    companyId,
                    uploadedBy: user.id,
                });
                uploadedDocumentIds.push(uploadResponse.document_id);
            }

            // ── Link + Process ────────────────────────────────────────────
            if (uploadedDocumentIds.length > 0) {
                replaceSystemMessage(systemMessageId, "Linking uploaded documents to this chat...");

                await linkDocumentsToChat({
                    chatId: selectedChatId,
                    documentIds: uploadedDocumentIds,
                });

                // Per-document status tracking for the live system message.
                // documentId → latest raw status from backend
                const docStatusMap = new Map<string, string>(
                    uploadedDocumentIds.map((id) => [id, ""]),
                );

                const totalCount = uploadedDocumentIds.length;

                replaceSystemMessage(
                    systemMessageId,
                    totalCount === 1
                        ? "Processing document..."
                        : `Processing ${totalCount} documents (0/${totalCount} ready)…`,
                );

                // Create a fresh AbortController for this batch of polls.
                // Stored in a ref so the unmount cleanup can cancel it.
                const controller = new AbortController();
                pollingControllerRef.current = controller;

                await Promise.all(
                    uploadedDocumentIds.map((docId) =>
                        processAndPoll(docId, {
                            signal: controller.signal,
                            onStatusUpdate: (rawStatus) => {
                                docStatusMap.set(docId, rawStatus);

                                const processingLabel = buildProcessingLabel(
                                    docStatusMap,
                                    rawStatus,
                                    totalCount,
                                );

                                replaceSystemMessage(systemMessageId, processingLabel);
                            },
                        }),
                    ),
                );
            }

            // ── AI response ───────────────────────────────────────────────
            replaceSystemMessage(systemMessageId, "Generating AI response...");

            const aiResponse = await sendAIChat({
                chatId: selectedChatId,
                companyId,
                userId: user.id,
                question: text,
            });

            removeSystemMessage(systemMessageId);

            setMessages((prev) => [
                ...prev,
                {
                    id: `${Date.now()}-assistant`,
                    role: "assistant",
                    content: formatAIResponse(aiResponse.answer),
                },
            ]);

            await clearStagedFiles();
        } catch (error) {
            removeSystemMessage(systemMessageId);

            // Restore file chips so the user can retry without re-attaching.
            setAttachedFiles(filesBeforeSend);

            const message =
                error instanceof Error
                    ? error.message
                    : "The request failed. Please try again.";

            showToast({ message, type: "error" });
        } finally {
            setIsSubmitting(false);
        }
    };

    // ── Render ────────────────────────────────────────────────────────────

    return (
        <div className="flex h-screen w-full bg-white text-black overflow-hidden">

            {/* Sidebar (Chat History) */}
            <div className="w-64 bg-neutral-50 border-r border-gray-200 flex flex-col h-full shrink-0">
                <div className="p-4 font-semibold text-sm border-b border-gray-200 flex items-center justify-between">
                    <span>Chat History</span>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-4">
                    {loadingChats ? (
                        <div className="text-xs text-gray-500 px-2 py-4 text-center">
                            Loading chats...
                        </div>
                    ) : chats.length === 0 ? (
                        <div className="text-xs text-gray-500 px-2 py-4 text-center">
                            No chats yet
                        </div>
                    ) : (
                        Object.entries(groupChatsByTime(chats)).map(
                            ([groupName, groupChats]) => {
                                if (groupChats.length === 0) return null;

                                return (
                                    <div key={groupName}>
                                        <div className="text-xs text-gray-500 font-medium px-2 mb-2">
                                            {groupName}
                                        </div>
                                        <div className="space-y-1.5">
                                            {groupChats.map((chat) => (
                                                <button
                                                    key={chat.chat_id}
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedChatId(chat.chat_id);
                                                        setMessages([]);
                                                    }}
                                                    className={`w-full text-left px-3 py-2 text-sm rounded-lg truncate transition-colors ${selectedChatId === chat.chat_id
                                                        ? "bg-neutral-200"
                                                        : "hover:bg-neutral-200"
                                                        }`}
                                                    title={chat.title}
                                                >
                                                    {chat.title}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                );
                            }
                        )
                    )}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col h-full relative">
                <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 max-w-4xl mx-auto w-full">
                    {loadingMessages && messages.length === 0 ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <div className="inline-block">
                                    <i className="fa-solid fa-spinner fa-spin text-4xl text-gray-400"></i>
                                </div>
                            </div>
                        </div>
                    ) : messages.length === 0 ? (
                        <EmptyState onFilesSelected={handleFilesSelected} />
                    ) : (
                        messages.map((msg) => (
                            <ChatMessage
                                key={msg.id}
                                role={msg.role}
                                content={msg.content}
                                attachedFiles={msg.attachedFiles}
                                isFromServer={msg.isFromServer}
                            />
                        ))
                    )}
                </div>

                {/* Input Area Wrapper */}
                <div className="max-w-4xl mx-auto w-full">
                    <ChatInput
                        onSendMessage={handleSendMessage}
                        attachedFiles={attachedFiles}
                        onRemoveFile={handleRemoveFile}
                        onFilesSelected={handleFilesSelected}
                        onValidationError={(message) => showToast({ message, type: "error" })}
                        disabled={isSubmitting}
                        sending={isSubmitting}
                        isEmptyState={messages.length === 0}
                    />
                </div>
            </div>
        </div>
    );
}