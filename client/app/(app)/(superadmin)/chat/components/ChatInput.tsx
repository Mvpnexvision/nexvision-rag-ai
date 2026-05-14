"use client";

import { useState } from "react";
import { AttachedFile } from "../chat";

interface ChatInputProps {
    onSendMessage: (text: string) => void;
    attachedFiles: AttachedFile[];
    onRemoveFile: (fileId: string) => void;
}

export default function ChatInput({
    onSendMessage,
    attachedFiles,
    onRemoveFile,
}: ChatInputProps) {
    const [input, setInput] = useState("");
    const [isFocused, setIsFocused] = useState(false);

    const handleSend = () => {
        if (input.trim()) {
            onSendMessage(input);
            setInput("");
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="border-t border-gray-200 p-6 bg-white">
            {/* Attached Files */}
            {attachedFiles.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-2">
                    {attachedFiles.map((file) => (
                        <div
                            key={file.id}
                            className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg"
                        >
                            <i className={`fa-solid ${file.icon} text-gray-600`}></i>
                            <span className="text-sm text-gray-700">{file.name}</span>
                            <button
                                onClick={() => onRemoveFile(file.id)}
                                className="ml-1 text-gray-500 hover:text-gray-700"
                            >
                                <i className="fa-solid fa-xmark"></i>
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Input Area */}
            <div className={`flex gap-2 transition-all border rounded-lg ${
                isFocused
                    ? "border-blue-500 ring-2 ring-blue-100"
                    : "border-gray-300"
            }`}>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder="Ask anything about your system..."
                    className="flex-1 px-4 py-3 bg-transparent outline-none text-gray-900"
                />
                <button
                    onClick={() => {
                        const fileInput = document.createElement("input");
                        fileInput.type = "file";
                        fileInput.click();
                    }}
                    className="px-3 py-3 text-gray-500 hover:text-gray-700 transition-colors"
                    title="Attach file"
                >
                    <i className="fa-solid fa-paperclip"></i>
                </button>
                <button
                    onClick={handleSend}
                    disabled={!input.trim()}
                    className="px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white transition-colors rounded-r-md"
                >
                    <i className="fa-solid fa-arrow-up"></i>
                </button>
            </div>
        </div>
    );
}
