"use client";

import { useRef, useState, type ChangeEvent, type DragEvent } from "react";

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DocumentUploadModal({ isOpen, onClose }: DocumentUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
  };

  const onBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.[0]) {
      handleFileSelect(event.target.files[0]);
    }
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer.files?.[0]) {
      handleFileSelect(event.dataTransfer.files[0]);
    }
  };

  const onDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl w-full max-w-lg shadow-lg animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-black">Upload Document</h2>
            <p className="text-sm text-gray-600">Drop a file or browse from your computer.</p>
          </div>
          <button
            aria-label="Close upload modal"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-neutral-100 rounded-md cursor-pointer transition-colors focus:outline-none"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div
            className="border-2 border-dashed border-gray-300 rounded-3xl h-56 flex flex-col items-center justify-center gap-4 text-center cursor-pointer hover:border-black transition-colors"
            onDrop={onDrop}
            onDragOver={onDragOver}
            onClick={onBrowseClick}
          >
            <i className="fa-solid fa-cloud-arrow-up text-3xl text-gray-400"></i>
            <div>
              <p className="text-base font-semibold text-black">Drop your file here</p>
              <p className="text-sm text-gray-500">or browse to choose a document</p>
            </div>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onBrowseClick();
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-md text-sm font-medium hover:bg-neutral-800 transition-colors"
            >
              <i className="fa-solid fa-folder-open"></i>Browse file
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={onFileChange}
          />

          {selectedFile ? (
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
              <p className="text-sm font-medium text-gray-900">Selected file</p>
              <p className="text-sm text-gray-600 mt-1">{selectedFile.name}</p>
            </div>
          ) : null}
        </div>

        <div className="p-5 border-t border-gray-200 bg-neutral-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-black transition-colors cursor-pointer focus:outline-none"
          >
            Cancel
          </button>
          <button
            disabled={!selectedFile}
            className="px-4 py-2 bg-black text-white rounded-md text-sm font-medium hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Upload document
          </button>
        </div>
      </div>
    </div>
  );
}
