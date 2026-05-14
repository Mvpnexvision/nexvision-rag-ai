"use client";

import { useEffect, useState } from "react";
import EmptyState from "./components/EmptyState";
import ChatMessage from "./components/ChatMessage";
import ChatInput from "./components/ChatInput";
import { useToast } from "@/components/Toast";
import { useAuth } from "@/contexts/authContext";
import {
    AIOutput,
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

export interface Message {
    id: string;
    role: "user" | "assistant" | "system";
    content: React.ReactNode;
}

export interface AttachedFile {
    id: string;
    name: string;
    icon: string;
}

const STATUS_POLL_MS = 2500;

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

function sleep(ms: number) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
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

function mapStatus(status: string): "processing" | "completed" | "failed" {
    const normalized = status.toLowerCase();

    if (normalized === "failed") {
        return "failed";
    }

    if (normalized === "ai ready") {
        return "completed";
    }

    return "processing";
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

export default function Chat() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedChatId, setSelectedChatId] = useState<string>(CHAT_HISTORY[0].id);
    const { showToast } = useToast();
    const { profile, user, loading: authLoading, session } = useAuth();
    const {
        uploadDocument,
        linkDocumentsToChat,
        processDocument,
        getDocumentStatus,
        sendAIChat,
    } = useChatWorkflowApi();

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

    const companyId =
        profile?.company_id ||
        (typeof user?.user_metadata?.company_id === "string"
            ? user.user_metadata.company_id
            : undefined) ||
        (typeof session?.user?.user_metadata?.company_id === "string"
            ? session.user.user_metadata.company_id
            : undefined);

    const replaceSystemMessage = (messageId: string, text: string) => {
        setMessages((prev) => {
            return prev.map((item) =>
                item.id === messageId
                    ? { ...item, content: text }
                    : item,
            );
        });
    };

    const pushSystemMessage = (text: string): string => {
        const systemId = `${Date.now()}-system`;

        setMessages((prev) => [
            ...prev,
            {
                id: systemId,
                role: "system",
                content: text,
            },
        ]);
        return systemId;
    };

    const removeSystemMessage = (messageId: string) => {
        setMessages((prev) => prev.filter((item) => item.id !== messageId));
    };

    const handleFilesSelected = async (files: File[]) => {
        if (files.length === 0) {
            return;
        }

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
            if (availableSlots <= 0) {
                showToast({
                    message: "You can upload up to 5 files only.",
                    type: "error",
                });
                return;
            }

            const toAdd = supported.slice(0, availableSlots);
            if (supported.length > availableSlots) {
                showToast({
                    message: "You can upload up to 5 files only.",
                    type: "error",
                });
            }

            if (toAdd.length === 0) {
                return;
            }

            await saveStagedFiles(toAdd);
            const updated = await listStagedFiles();
            setAttachedFiles(updated.map(mapToAttachedFile));
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

    const processAndWaitForReady = async (documentId: string) => {
        await processDocument(documentId);

        for (;;) {
            const status = await getDocumentStatus(documentId);
            const mapped = mapStatus(status.processing_status);

            if (mapped === "completed") {
                return;
            }

            if (mapped === "failed") {
                throw new Error(`Document '${status.file_name}' failed during processing.`);
            }

            await sleep(STATUS_POLL_MS);
        }
    };

    const handleSendMessage = async (text: string) => {
        if (!text.trim()) {
            return;
        }

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

        setIsSubmitting(true);

        const userMessage: Message = {
            id: `${Date.now()}-user`,
            role: "user",
            content: text,
        };
        setMessages((prev) => [...prev, userMessage]);

        const systemMessageId = pushSystemMessage("Uploading documents...");

        try {
            const stagedFiles = await listStagedFiles();
            const uploadedDocumentIds: string[] = [];

            for (const staged of stagedFiles) {
                const uploadResponse = await uploadDocument({
                    file: toFile(staged),
                    companyId,
                    uploadedBy: user.id,
                });
                uploadedDocumentIds.push(uploadResponse.document_id);
            }

            if (uploadedDocumentIds.length > 0) {
                replaceSystemMessage(systemMessageId, "Linking uploaded documents to this chat...");
                await linkDocumentsToChat({
                    chatId: selectedChatId,
                    documentIds: uploadedDocumentIds,
                });

                replaceSystemMessage(systemMessageId, "Processing documents...");
                await Promise.all(uploadedDocumentIds.map((id) => processAndWaitForReady(id)));
            }

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
            setAttachedFiles([]);
        } catch (error) {
            removeSystemMessage(systemMessageId);
            const message =
                error instanceof Error
                    ? error.message
                    : "The request failed. Please try again.";

            showToast({
                message,
                type: "error",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex h-screen w-full bg-white text-black overflow-hidden">

            {/* Sidebar (Chat History) */}
            <div className="w-64 bg-neutral-50 border-r border-gray-200 flex flex-col h-full shrink-0">
                <div className="p-4 font-semibold text-sm border-b border-gray-200 flex items-center justify-between">
                    <span>Chat History</span>
                    <button
                        aria-label="Create new chat"
                        title="Create new chat"
                        className="text-gray-500 hover:text-black"
                    >
                        <i className="fa-solid fa-pen-to-square"></i>
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-4">
                    {["Today", "Yesterday", "Previous 7 Days"].map((groupName) => {
                        const entries = CHAT_HISTORY.filter((item) => item.group === groupName);
                        if (entries.length === 0) {
                            return null;
                        }

                        return (
                            <div key={groupName}>
                                <div className="text-xs text-gray-500 font-medium px-2 mb-2">{groupName}</div>
                                <div className="space-y-1.5">
                                    {entries.map((item) => (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={() => setSelectedChatId(item.id)}
                                            className={`w-full text-left px-3 py-2 text-sm rounded-lg truncate transition-colors ${
                                                selectedChatId === item.id
                                                    ? "bg-neutral-200"
                                                    : "hover:bg-neutral-200"
                                            }`}
                                        >
                                            {item.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col h-full relative">
                <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 max-w-4xl mx-auto w-full">
                    {messages.length === 0 ? (
                        <EmptyState onFilesSelected={handleFilesSelected} />
                    ) : (
                        messages.map((msg) => (
                            <ChatMessage key={msg.id} role={msg.role} content={msg.content} />
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
                        disabled={isSubmitting}
                        sending={isSubmitting}
                    />
                </div>
            </div>
        </div>
    );
}