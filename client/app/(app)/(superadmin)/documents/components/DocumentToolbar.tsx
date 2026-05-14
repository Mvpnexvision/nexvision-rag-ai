"use client";
import { ViewMode } from "../documents";

interface DocumentToolbarProps {
    viewMode: ViewMode;
    setViewMode: (mode: ViewMode) => void;
    onOpenFilter: () => void;
    searchTerm: string;
    onSearch: (value: string) => void;
    onOpenUpload: () => void;
}

export default function DocumentToolbar({ viewMode, setViewMode, onOpenFilter, searchTerm, onSearch, onOpenUpload }: DocumentToolbarProps) {
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <h2 className="text-2xl font-medium text-black">My Documents</h2>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full md:w-auto">
                <div className="flex items-center gap-2 text-black bg-neutral-50 border border-gray-200 rounded-md px-3 py-2 w-full sm:w-72 focus-within:border-black">
                    <i className="fa-solid fa-magnifying-glass text-gray-400"></i>
                    <input
                        type="text"
                        placeholder="Search documents..."
                        className="bg-transparent border-none outline-none text-sm w-full"
                        value={searchTerm}
                        onChange={(e) => onSearch(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-2">
                    <button
                        aria-label="Grid view"
                        type="button"
                        onClick={() => setViewMode("grid")}
                        className={`w-10 h-10 rounded-md flex items-center justify-center transition-all cursor-pointer focus:outline-none pointer-events-auto ${
                            viewMode === "grid"
                                ? "bg-black text-white"
                                : "text-gray-500 hover:text-black hover:bg-gray-200/50"
                        }`}
                    >
                        <i className="fa-solid fa-border-all" aria-hidden="true"></i>
                    </button>
                    <button
                        aria-label="List view"
                        type="button"
                        onClick={() => setViewMode("list")}
                        className={`w-10 h-10 rounded-md flex items-center justify-center transition-all cursor-pointer focus:outline-none pointer-events-auto ${
                            viewMode === "list"
                                ? "bg-black text-white"
                                : "text-gray-500 hover:text-black hover:bg-gray-200/50"
                        }`}
                    >
                        <i className="fa-solid fa-list" aria-hidden="true"></i>
                    </button>
                </div>

                <button
                    type="button"
                    onClick={onOpenFilter}
                    className="flex items-center gap-2 px-4 py-2 bg-transparent border border-gray-200 rounded-md text-sm font-medium text-black hover:bg-neutral-50 hover:border-black transition-colors justify-center cursor-pointer focus:outline-none"
                >
                    <i className="fa-solid fa-filter"></i> Filter
                </button>
                <button
                    type="button"
                    onClick={onOpenUpload}
                    className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-md text-sm font-medium hover:bg-neutral-800 transition-colors justify-center cursor-pointer focus:outline-none"
                >
                    <i className="fa-solid fa-plus"></i> Upload
                </button>
            </div>
        </div>
    );
}
