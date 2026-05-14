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
    const [messages, setMessages] = useState<Message[]>([]);
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
                // Using a plain string with newlines to allow the typing animation to work smoothly
                content: `Based on the context provided in Project_Requirements_v2.docx, here are the primary milestones for Phase 1:\n\n1. Finalize UI/UX wireframes (Due: Oct 15)\n2. Setup database schema and Next.js boilerplate (Due: Oct 20)\n3. Implement secure authentication (Due: Oct 25)\n\nWould you like me to detail the deliverables for Phase 2?`
            };
            setMessages((prev) => [...prev, newAiMsg]);
        }, 600);
    };

    const handleRemoveFile = (fileId: string) => {
        setAttachedFiles((prev) => prev.filter(f => f.id !== fileId));
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
                    <div>
                        <div className="text-xs text-gray-500 font-medium px-2 mb-2">Today</div>
                        <button className="w-full text-left px-3 py-2 text-sm bg-neutral-200 rounded-lg truncate">
                            Project Requirements Analysis
                        </button>
                    </div>
                    <div>
                        <div className="text-xs text-gray-500 font-medium px-2 mb-2">Yesterday</div>
                        <button className="w-full text-left px-3 py-2 text-sm hover:bg-neutral-200 rounded-lg truncate transition-colors">
                            Q3 Financial Report
                        </button>
                    </div>
                    <div>
                        <div className="text-xs text-gray-500 font-medium px-2 mb-2">Previous 7 Days</div>
                        <button className="w-full text-left px-3 py-2 text-sm hover:bg-neutral-200 rounded-lg truncate transition-colors">
                            Marketing Strategy 2024
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col h-full relative">
                <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 max-w-4xl mx-auto w-full">
                    {messages.length === 0 ? (
                        <EmptyState />
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
                    />
                </div>
            </div>
        </div>
    );
}