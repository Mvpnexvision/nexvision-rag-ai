"use client";
import { ViewMode } from "../documents";

interface DocumentToolbarProps {
    viewMode: ViewMode;
    setViewMode: (mode: ViewMode) => void;
    onOpenFilter: () => void;
}

export default function DocumentToolbar({ viewMode, setViewMode, onOpenFilter }: DocumentToolbarProps) {
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <h2 className="text-2xl font-medium text-black">My Documents</h2>

            <div className="flex items-center gap-3 flex-wrap">
                {/* View Toggles */}
                <div className="flex gap-1 bg-neutral-50 p-1 rounded-md border border-gray-200">
                    <button
                        aria-label="Grid view"
                        type="button"
                        onClick={() => setViewMode("grid")}
                        className={`w-8 h-8 rounded-md flex items-center justify-center transition-all cursor-pointer focus:outline-none pointer-events-auto ${viewMode === "grid"
                                ? "bg-white text-black shadow-sm border border-gray-200"
                                : "text-gray-500 hover:text-black hover:bg-gray-200/50 border border-transparent"
                            }`}
                    >
                        <i className="fa-solid fa-border-all" aria-hidden="true"></i>
                    </button>
                    <button
                        aria-label="List view"
                        type="button"
                        onClick={() => setViewMode("list")}
                        className={`w-8 h-8 rounded-md flex items-center justify-center transition-all cursor-pointer focus:outline-none pointer-events-auto ${viewMode === "list"
                                ? "bg-white text-black shadow-sm border border-gray-200"
                                : "text-gray-500 hover:text-black hover:bg-gray-200/50 border border-transparent"
                            }`}
                    >
                        <i className="fa-solid fa-list" aria-hidden="true"></i>
                    </button>
                </div>

                {/* Search Bar */}
                <div className="flex items-center gap-2 text-black bg-neutral-50 border border-gray-200 rounded-md px-3 py-2 w-full md:w-64 focus-within:border-black cursor-text">
                    <i className="fa-solid fa-magnifying-glass text-gray-400"></i>
                    <input type="text" placeholder="Search my documents..." className="bg-transparent border-none outline-none text-sm w-full" />
                </div>

                {/* Filter & Upload Buttons */}
                <button
                    type="button"
                    onClick={onOpenFilter}
                    className="flex items-center gap-2 px-4 py-2 bg-transparent border border-gray-200 rounded-md text-sm font-medium text-black hover:bg-neutral-50 hover:border-black transition-colors flex-1 md:flex-none justify-center cursor-pointer focus:outline-none"
                >
                    <i className="fa-solid fa-filter"></i> Filter
                </button>
            </div>
        </div>
    );
}