"use client";

import React from "react";

interface ChatMessageProps {
    role: "user" | "assistant";
    content: React.ReactNode;
}

export default function ChatMessage({ role, content }: ChatMessageProps) {
    const isUser = role === "user";

    return (
        <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
            <div className={`flex gap-3 max-w-md ${isUser ? "flex-row-reverse" : ""}`}>
                {/* Avatar */}
                <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isUser
                            ? "bg-blue-600"
                            : "bg-gray-200"
                    }`}
                >
                    <i
                        className={`fa-solid text-sm ${
                            isUser
                                ? "fa-user text-white"
                                : "fa-robot text-gray-600"
                        }`}
                    ></i>
                </div>

                {/* Message Bubble */}
                <div
                    className={`px-4 py-3 rounded-lg ${
                        isUser
                            ? "bg-blue-600 text-white rounded-br-none"
                            : "bg-gray-100 text-gray-900 rounded-bl-none"
                    }`}
                >
                    <div className="text-sm leading-relaxed">
                        {content}
                    </div>
                </div>
            </div>
        </div>
    );
}
