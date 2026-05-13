"use client";

import { useState } from "react";
import { AttachedFile } from "../chat";

interface ChatInputProps {
    onSendMessage: (text: string) => void;
    attachedFiles: AttachedFile[];
    onRemoveFile: (id: string) => void;
}

export default function ChatInput({ onSendMessage, attachedFiles, onRemoveFile }: ChatInputProps) {
    const [inputValue, setInputValue] = useState("");

    const handleSend = () => {
        if (inputValue.trim()) {
            onSendMessage(inputValue);
            setInputValue("");
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="p-4 sm:px-8 sm:pb-8 bg-neutral-50">
            {/* Attached Files Wrapper */}
            {attachedFiles.length > 0 && (
                <div className="flex gap-2 mb-3 flex-wrap">
                    {attachedFiles.map((file) => (
                        <div key={file.id} className="bg-white border border-gray-200 px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-2 text-black">
                            <i className={`fa-solid ${file.icon} text-gray-500`} aria-hidden="true"></i>
                            <span>{file.name}</span>
                            <button
                                aria-label="Remove file"
                                onClick={() => onRemoveFile(file.id)}
                                className="ml-2 text-gray-400 hover:text-black"
                            >
                                <i className="fa-solid fa-xmark" aria-hidden="true"></i>
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Input Box */}
            <div className="bg-white border border-gray-200 rounded-xl flex items-end p-2 shadow-sm focus-within:border-black transition-colors">
                <button aria-label="Attach file" className="w-9 h-9 flex items-center justify-center text-gray-500 hover:bg-neutral-100 rounded-md transition-colors shrink-0">
                    <i className="fa-solid fa-paperclip" aria-hidden="true"></i>
                </button>

                <textarea
                    placeholder="Ask a question about your documents..."
                    rows={1}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    aria-label="Message input"
                    className="flex-1 border-none resize-none p-2 text-sm outline-none bg-transparent max-h-36 min-h-9"
                ></textarea>

                <button
                    aria-label="Send message"
                    onClick={handleSend}
                    disabled={!inputValue.trim()}
                    className="w-9 h-9 flex items-center justify-center bg-black text-white hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors shrink-0"
                >
                    <i className="fa-solid fa-arrow-up" aria-hidden="true"></i>
                </button>
            </div>

            <div className="text-center text-xs text-black mt-3">
                AI can make mistakes. Consider verifying important information.
            </div>
        </div>
    );
}