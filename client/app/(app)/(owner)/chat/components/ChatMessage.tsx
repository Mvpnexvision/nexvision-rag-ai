"use client";

import { useState, useEffect } from "react";

interface ChatMessageProps {
    role: "user" | "assistant";
    content: React.ReactNode;
}

export default function ChatMessage({ role, content }: ChatMessageProps) {
    const isUser = role === "user";
    const [displayedContent, setDisplayedContent] = useState("");

    // Only animate if it's the assistant and the content is a string
    const [isTyping, setIsTyping] = useState(!isUser && typeof content === "string");

    useEffect(() => {
        if (!isUser && typeof content === "string") {
            let i = 0;

            // Removed the synchronous setDisplayedContent("") here

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
        <div className={`flex gap-4 max-w-[85%] ${isUser ? "self-end flex-row-reverse" : "self-start"}`}>

            {/* AI Avatar */}
            {!isUser && (
                <div className="w-8 h-8 rounded-md bg-black text-white flex items-center justify-center shrink-0">
                    <i className="fa-solid fa-robot"></i>
                </div>
            )}

            {/* Message Bubble */}
            <div
                className={`
                    px-5 py-4 rounded-xl text-sm leading-relaxed whitespace-pre-wrap
                    ${isUser
                        ? "bg-neutral-100 text-black rounded-br-sm"
                        : "bg-white border border-gray-200 rounded-bl-sm shadow-sm"
                    }
                `}
            >
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