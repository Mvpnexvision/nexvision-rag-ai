"use client";

import { useState } from "react";
import EmptyState from "./components/EmptyState";
import ChatMessage from "./components/ChatMessage";
import ChatInput from "./components/ChatInput";

export interface Message {
    id: string;
    role: "user" | "assistant";
    content: React.ReactNode;
}

export interface AttachedFile {
    id: string;
    name: string;
    icon: string;
}

export default function Chat() {
    // Start empty to show the Empty State first
    const [messages, setMessages] = useState<Message[]>([]);

    // Initializing with the file from your mockup
    const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([
        { id: "1", name: "Project_Requirements_v2.docx", icon: "fa-file-word" }
    ]);

    const handleSendMessage = (text: string) => {
        if (!text.trim()) return;

        // 1. Add user message
        const newUserMsg: Message = {
            id: Date.now().toString(),
            role: "user",
            content: text
        };
        setMessages((prev) => [...prev, newUserMsg]);

        // 2. Simulate AI response after a short delay
        setTimeout(() => {
            const newAiMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: (
                    <>
                        Based on the context provided in <strong>Project_Requirements_v2.docx</strong>, here are the primary milestones for Phase 1: <br /><br />
                        1. Finalize UI/UX wireframes (Due: Oct 15)<br />
                        2. Setup database schema and Next.js boilerplate (Due: Oct 20)<br />
                        3. Implement secure authentication (Due: Oct 25)<br />
                        <br />
                        Would you like me to detail the deliverables for Phase 2?
                    </>
                )
            };
            setMessages((prev) => [...prev, newAiMsg]);
        }, 600);
    };

    const handleRemoveFile = (fileId: string) => {
        setAttachedFiles((prev) => prev.filter(f => f.id !== fileId));
    };

    return (
        <div className="flex flex-col h-full w-full max-w-4xl mx-auto relative text-black">

            {/* Thread or Empty State */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
                {messages.length === 0 ? (
                    <EmptyState onSuggestionClick={handleSendMessage} />
                ) : (
                    messages.map((msg) => (
                        <ChatMessage key={msg.id} role={msg.role} content={msg.content} />
                    ))
                )}
            </div>

            {/* Input Area */}
            <ChatInput
                onSendMessage={handleSendMessage}
                attachedFiles={attachedFiles}
                onRemoveFile={handleRemoveFile}
            />
        </div>
    );
}