"use client";

import { useRef } from "react";

interface EmptyStateProps {
    onFilesSelected: (files: File[]) => void;
}

export default function EmptyState({ onFilesSelected }: EmptyStateProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) {
            return;
        }

        onFilesSelected(Array.from(e.target.files));
        e.target.value = "";
    };

    return (
        <div className="flex-1 flex flex-col items-center justify-center text-center h-full py-12">
            <div className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center mb-6 border border-gray-200 shadow-sm">
                <i className="fa-solid fa-file-arrow-up text-2xl text-black"></i>
            </div>

            <h2 className="text-2xl font-semibold text-black mb-3">
                Upload your documents
            </h2>

            <p className="text-gray-500 max-w-md mx-auto mb-10 text-sm">
                Upload your files to extract insights, summarize data, or generate reports instantly.
            </p>

            {/* Drag & Drop Upload Zone */}
            <div
                className="w-full max-w-xl border-2 border-dashed border-gray-300 rounded-xl p-10 flex flex-col items-center gap-4 hover:bg-neutral-50 hover:border-gray-400 transition-colors cursor-pointer group"
                onClick={() => fileInputRef.current?.click()}
            >
                <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center group-hover:bg-white transition-colors shadow-sm">
                    <i className="fa-solid fa-cloud-arrow-up text-xl text-gray-600"></i>
                </div>

                <div>
                    <p className="font-medium text-black mb-1">
                        Click to upload <span className="font-normal text-gray-500">or drag and drop</span>
                    </p>
                    <p className="text-xs text-gray-500">
                        Supports PDF, DOCX, XLSX, TXT, CSV, and MD (max. 20MB)
                    </p>
                </div>

                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    aria-label="Upload documents"
                    title="Upload documents"
                    accept=".pdf,.docx,.xlsx,.txt,.csv,.md"
                    multiple
                    onChange={handleFileChange}
                />
            </div>
        </div>
    );
}











