"use client";

import { useEffect, useState } from "react";

type DocumentFilters = {
    fileType: string;
    dateFrom: string;
    dateTo: string;
};

interface FilterModalProps {
    isOpen: boolean;
    onClose: () => void;
    filters: DocumentFilters;
    onApply: (filters: DocumentFilters) => void;
}

export default function FilterModal({ isOpen, onClose, filters, onApply }: FilterModalProps) {
    const [draftFilters, setDraftFilters] = useState<DocumentFilters>(filters);

    useEffect(() => {
        if (isOpen) {
            setDraftFilters(filters);
        }
    }, [filters, isOpen]);

    if (!isOpen) return null;

    const handleClearAll = () => {
        const clearedFilters = {
            fileType: "",
            dateFrom: "",
            dateTo: "",
        };

        setDraftFilters(clearedFilters);
        onApply(clearedFilters);
        onClose();
    };

    const handleApply = () => {
        onApply(draftFilters);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-xl w-full max-w-md shadow-lg animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-5 border-b border-gray-200">
                    <h2 className="text-lg font-medium text-black">Filter Documents</h2>
                    <button
                        aria-label="Close filters"
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-neutral-100 rounded-md cursor-pointer transition-colors focus:outline-none"
                    >
                        <i className="fa-solid fa-xmark" aria-hidden="true"></i>
                    </button>
                </div>

                <div className="p-6 flex flex-col gap-5">
                    <div>
                        <label htmlFor="file-type" className="block text-sm font-medium mb-2 text-black">File Type</label>
                        <select
                            id="file-type"
                            aria-label="File Type"
                            className="w-full p-2.5 text-black border border-gray-200 rounded-md text-sm focus:outline-none focus:border-black bg-white cursor-pointer"
                            value={draftFilters.fileType}
                            onChange={(event) =>
                                setDraftFilters((current) => ({
                                    ...current,
                                    fileType: event.target.value,
                                }))
                            }
                        >
                            <option value="">All Types</option>
                            <option value="PDF">PDF (.pdf)</option>
                            <option value="DOCX">Word (.docx)</option>
                            <option value="XLSX">Excel (.xlsx)</option>
                            <option value="CSV">CSV (.csv)</option>
                            <option value="TXT">Text (.txt)</option>
                            <option value="MD">Markdown (.md)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2 text-black">Date Modified</label>
                        <div className="flex gap-3">
                            <div className="flex-1">
                                <label htmlFor="start-date" className="block text-xs text-gray-500 mb-1 ">From</label>
                                <input
                                    type="date"
                                    id="start-date"
                                    value={draftFilters.dateFrom}
                                    onChange={(event) =>
                                        setDraftFilters((current) => ({
                                            ...current,
                                            dateFrom: event.target.value,
                                        }))
                                    }
                                    className="w-full p-2.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-black bg-white cursor-pointer"
                                />
                            </div>
                            <div className="flex-1">
                                <label htmlFor="end-date" className="block text-xs text-gray-500 mb-1">To</label>
                                <input
                                    type="date"
                                    id="end-date"
                                    value={draftFilters.dateTo}
                                    onChange={(event) =>
                                        setDraftFilters((current) => ({
                                            ...current,
                                            dateTo: event.target.value,
                                        }))
                                    }
                                    className="w-full p-2.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-black bg-white cursor-pointer"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-5 border-t border-gray-200 flex justify-end gap-3 bg-neutral-50 rounded-b-xl">
                    <button onClick={handleClearAll} className="px-4 py-2 text-sm text-gray-500 hover:text-black transition-colors cursor-pointer focus:outline-none">Clear All</button>
                    <button onClick={handleApply} className="px-4 py-2 bg-black text-white rounded-md text-sm font-medium hover:bg-neutral-800 transition-colors cursor-pointer focus:outline-none">Apply Filters</button>
                </div>
            </div>
        </div>
    );
}