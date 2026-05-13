"use client";
import { useState } from "react";

export default function Documents() {
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [showModal, setShowModal] = useState(false);

    const docs = [
        { icon: "fa-file-pdf", name: "Q3_Financial_Report.pdf", meta: "Oct 12, 2023 • PDF" },
        { icon: "fa-file-word", name: "Project_Requirements_v2.docx", meta: "Oct 11, 2023 • DOCX" },
        { icon: "fa-file-csv", name: "User_Feedback_Q1-Q2.csv", meta: "Oct 09, 2023 • CSV" },
        { icon: "fa-file-pdf", name: "Employee_Handbook_2023.pdf", meta: "Sep 28, 2023 • PDF" },
        { icon: "fa-file-word", name: "Marketing_Strategy_Q4.docx", meta: "Sep 15, 2023 • DOCX" },
    ];

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <h2 className="text-2xl font-medium text-black">My Documents</h2>

                    <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex gap-1 bg-neutral-50 p-1 rounded-md border border-gray-200">
                            <button
                                aria-label="Grid view"
                                type="button"
                                onClick={() => setViewMode("grid")}
                                className={`w-8 h-8 rounded-md flex items-center justify-center transition-all cursor-pointer focus:outline-none ${viewMode === "grid"
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
                                className={`w-8 h-8 rounded-md flex items-center justify-center transition-all cursor-pointer focus:outline-none ${viewMode === "list"
                                        ? "bg-white text-black shadow-sm border border-gray-200"
                                        : "text-gray-500 hover:text-black hover:bg-gray-200/50 border border-transparent"
                                    }`}
                            >
                                <i className="fa-solid fa-list" aria-hidden="true"></i>
                            </button>
                        </div>

                        <div className="flex items-center gap-2 bg-neutral-50 border border-gray-200 rounded-md px-3 py-2 w-full md:w-64 focus-within:border-black cursor-text">
                            <i className="fa-solid fa-magnifying-glass text-gray-400"></i>
                            <input type="text" placeholder="Search my documents..." className="bg-transparent border-none outline-none text-sm w-full" />
                        </div>

                        <button
                            type="button"
                            onClick={() => setShowModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-transparent border border-gray-200 rounded-md text-sm font-medium text-black hover:bg-neutral-50 hover:border-black transition-colors flex-1 md:flex-none justify-center cursor-pointer focus:outline-none"
                        >
                            <i className="fa-solid fa-filter"></i> Filter
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-md text-sm font-medium hover:bg-neutral-800 transition-colors flex-1 md:flex-none justify-center cursor-pointer focus:outline-none">
                            <i className="fa-solid fa-plus"></i> Upload
                        </button>
                    </div>
                </div>

                <div className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" : "flex flex-col gap-3"}>
                    {docs.map((doc, i) => (
                        <div key={i} className={`group border border-gray-200 bg-white rounded-xl cursor-pointer hover:border-black hover:shadow-sm hover:bg-neutral-50 transition-all relative ${viewMode === "grid" ? "p-5 flex flex-col gap-2 text-left" : "p-4 flex items-center gap-4"}`}>
                            <i className={`fa-solid ${doc.icon} text-gray-500 ${viewMode === "grid" ? "text-3xl mb-1" : "text-xl"}`}></i>
                            <div className={viewMode === "list" ? "flex-1 min-w-0" : "w-full"}>
                                <span className="text-sm font-medium text-black block truncate w-full mb-1">{doc.name}</span>
                                <span className="text-xs text-gray-400 block">{doc.meta}</span>
                            </div>
                            <button aria-label="Delete document" className={`absolute right-2 top-2 w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 hover:bg-red-50 hover:border-red-200 rounded-md transition-all cursor-pointer focus:outline-none ${viewMode === "list" ? "relative top-0 right-0 border border-transparent opacity-100" : ""}`}>
                                <i className="fa-solid fa-trash text-sm" aria-hidden="true"></i>
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Filter Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
                    <div className="bg-white rounded-xl w-full max-w-md shadow-lg animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center p-5 border-b border-gray-200">
                            <h2 className="text-lg font-medium">Filter Documents</h2>
                            <button aria-label="Close filters" onClick={() => setShowModal(false)} className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-neutral-100 rounded-md cursor-pointer transition-colors focus:outline-none">
                                <i className="fa-solid fa-xmark" aria-hidden="true"></i>
                            </button>
                        </div>
                        <div className="p-6 flex flex-col gap-5">
                            <div>
                                <label htmlFor="file-type" className="block text-sm font-medium mb-2">File Type</label>
                                <select id="file-type" aria-label="File Type" className="w-full p-2.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-black bg-white cursor-pointer">
                                    <option>All Types</option>
                                    <option>PDF (.pdf)</option>
                                    <option>Word (.docx)</option>
                                    <option>Excel / CSV (.csv)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Date Modified</label>
                                <div className="flex gap-3">
                                    <div className="flex-1">
                                        <label htmlFor="start-date" className="block text-xs text-gray-500 mb-1">From</label>
                                        <input
                                            type="date"
                                            id="start-date"
                                            className="w-full p-2.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-black bg-white cursor-pointer"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label htmlFor="end-date" className="block text-xs text-gray-500 mb-1">To</label>
                                        <input
                                            type="date"
                                            id="end-date"
                                            className="w-full p-2.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-black bg-white cursor-pointer"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="p-5 border-t border-gray-200 flex justify-end gap-3 bg-neutral-50 rounded-b-xl">
                            <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-500 hover:text-black transition-colors cursor-pointer focus:outline-none">Clear All</button>
                            <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-black text-white rounded-md text-sm font-medium hover:bg-neutral-800 transition-colors cursor-pointer focus:outline-none">Apply Filters</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}