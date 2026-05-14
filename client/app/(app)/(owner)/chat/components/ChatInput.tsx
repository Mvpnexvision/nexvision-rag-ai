"use client";

import { useRef, useState } from "react";
import { AttachedFile } from "../chat";

interface ChatInputProps {
    onSendMessage: (text: string) => void | Promise<void>;
    attachedFiles: AttachedFile[];
    onRemoveFile: (id: string) => void;
    onFilesSelected: (files: File[]) => void;
    disabled?: boolean;
    sending?: boolean;
}

export default function ChatInput({
    onSendMessage,
    attachedFiles,
    onRemoveFile,
    onFilesSelected,
    disabled = false,
    sending = false,
}: ChatInputProps) {
    const [inputValue, setInputValue] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSend = async () => {
        if (!inputValue.trim() || disabled || sending) {
            return;
        }

        await onSendMessage(inputValue);
        setInputValue("");
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey && !disabled && !sending) {
            e.preventDefault();
            void handleSend();
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) {
            return;
        }

        onFilesSelected(Array.from(e.target.files));
        e.target.value = "";
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
                <button
                    aria-label="Attach file"
                    type="button"
                    disabled={disabled || sending}
                    onClick={() => fileInputRef.current?.click()}
                    className="w-9 h-9 flex items-center justify-center text-gray-500 hover:bg-neutral-100 rounded-md transition-colors shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    <i className="fa-solid fa-paperclip" aria-hidden="true"></i>
                </button>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx,.xlsx,.txt,.csv"
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                    aria-label="Attach chat documents"
                    title="Attach chat documents"
                />

                <textarea
                    placeholder="Ask a question about your documents..."
                    rows={1}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={disabled || sending}
                    aria-label="Message input"
                    className="flex-1 border-none resize-none p-2 text-sm outline-none bg-transparent max-h-36 min-h-9"
                ></textarea>

                <button
                    aria-label="Send message"
                    onClick={() => void handleSend()}
                    disabled={!inputValue.trim() || disabled || sending}
                    className="w-9 h-9 flex items-center justify-center bg-black text-white hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors shrink-0"
                >
                    {sending ? (
                        <i className="fa-solid fa-spinner fa-spin" aria-hidden="true"></i>
                    ) : (
                        <i className="fa-solid fa-arrow-up" aria-hidden="true"></i>
                    )}
                </button>
            </div>

            <div className="text-center text-xs text-black mt-3">
                AI can make mistakes. Consider verifying important information.
            </div>
        </div>
    );
}