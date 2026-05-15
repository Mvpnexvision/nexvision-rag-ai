"use client";

import { useState, useEffect } from "react";
import { AttachedFile } from "../chat";

interface ChatMessageProps {
    role: "user" | "assistant" | "system";
    content: React.ReactNode;
    attachedFiles?: AttachedFile[];
    isFromServer?: boolean;
}

export default function ChatMessage({ role, content, attachedFiles = [], isFromServer = false }: ChatMessageProps) {
    const isUser = role === "user";
    const isSystem = role === "system";
    const [displayedContent, setDisplayedContent] = useState(
        isFromServer && typeof content === "string" ? content : ""
    );

    // Only animate if it's the assistant, content is a string, and it's not from server
    const [isTyping, setIsTyping] = useState(!isUser && !isFromServer && typeof content === "string");

    useEffect(() => {
        if (!isUser && !isFromServer && typeof content === "string") {
            let i = 0;

            const intervalId = setInterval(() => {
                setDisplayedContent(content.slice(0, i + 1));
                i++;
                if (i >= content.length) {
                    clearInterval(intervalId);
                    setIsTyping(false);
                }
            }, 15);

            return () => clearInterval(intervalId);
        }
    }, [content, isUser]);

    return (
        <div
            className={`flex items-start gap-4 max-w-[85%] ${isUser ? "self-end flex-row-reverse" : "self-start"
                }`}
        >

            {/* AI Avatar */}
            {!isUser && !isSystem && (
                <div className="w-8 h-8 rounded-md bg-black text-white flex items-center justify-center shrink-0 self-start">
                    <i className="fa-solid fa-robot"></i>
                </div>
            )}

            {/* System Avatar — black bg spinner, aligned to top */}
            {isSystem && (
                <div className="w-8 h-8 rounded-md bg-black text-white flex items-center justify-center shrink-0 self-start mt-0">
                    <i className="fa-solid fa-spinner fa-spin text-sm"></i>
                </div>
            )}

            {/* Message Bubble */}
            <div
                className={`
                    px-5 py-4 rounded-xl text-sm leading-relaxed whitespace-pre-wrap
                    ${isUser
                        ? "bg-neutral-100 text-black rounded-br-sm"
                        : isSystem
                            ? "text-gray-400"
                            : "bg-white border border-gray-200 rounded-bl-sm shadow-sm"
                    }
                `}
            >
                {/* Attached file chips (user messages only) */}
                {isUser && attachedFiles.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2.5">
                        {attachedFiles.map((file) => (
                            <div
                                key={file.id}
                                className="bg-white border border-gray-200 px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 text-gray-700"
                            >
                                <i className={`fa-solid ${file.icon} text-gray-400`} aria-hidden="true"></i>
                                <span>{file.name}</span>
                            </div>
                        ))}
                    </div>
                )}
                {/* Render normal content for users, animated string for AI */}
                {isUser || typeof content !== "string" ? content : displayedContent}

                {/* Blinking cursor effect */}
                {isTyping && (
                    <span className="inline-block w-1.5 h-3.5 ml-1 bg-gray-400 animate-pulse align-middle"></span>
                )}
            </div>
        </div>
    );
}











