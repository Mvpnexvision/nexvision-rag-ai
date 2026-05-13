"use client";

interface ChatMessageProps {
    role: "user" | "assistant";
    content: React.ReactNode;
}

export default function ChatMessage({ role, content }: ChatMessageProps) {
    const isUser = role === "user";

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
                    px-5 py-4 rounded-xl text-sm leading-relaxed
                    ${isUser
                        ? "bg-neutral-100 text-black rounded-br-sm"
                        : "bg-white border border-gray-200 rounded-bl-sm"
                    }
                `}
            >
                {content}
            </div>
        </div>
    );
}