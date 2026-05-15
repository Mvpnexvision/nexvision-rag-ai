"use client";

import dayjs from "dayjs";
import DocumentCard from "./DocumentCard";
import { ViewMode, DocumentItem } from "../documents";

interface GroupedDocumentViewProps {
    groupedDocs: Record<string, DocumentItem[]>;
    viewMode: ViewMode;
    loading?: boolean;
    hasActiveFilters?: boolean;
}

export default function GroupedDocumentView({
    groupedDocs,
    viewMode,
    loading = false,
    hasActiveFilters = false,
}: GroupedDocumentViewProps) {
    if (loading) {
        return (
            <div className="flex min-h-80 items-center justify-center rounded-xl border border-dashed border-gray-200 bg-neutral-50">
                <div className="flex flex-col items-center gap-3 text-center text-gray-500">
                    <i className="fa-solid fa-spinner fa-spin text-3xl text-black" aria-hidden="true"></i>
                    <p className="text-sm font-medium text-black">Loading documents...</p>
                    <p className="text-xs text-gray-500">We&apos;re fetching the latest results for your search and filters.</p>
                </div>
            </div>
        );
    }

    const hasDocuments = Object.keys(groupedDocs).length > 0;

    if (!hasDocuments) {
        return (
            <div className="flex min-h-80 items-center justify-center rounded-xl border border-dashed border-gray-200 bg-neutral-50 px-6 text-center">
                <div className="max-w-md">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white border border-gray-200 shadow-sm">
                        <i className="fa-solid fa-folder-open text-2xl text-black" aria-hidden="true"></i>
                    </div>
                    <h3 className="text-lg font-semibold text-black">
                        {hasActiveFilters ? "No documents match your search" : "No documents yet"}
                    </h3>
                    <p className="mt-2 text-sm text-gray-500">
                        {hasActiveFilters
                            ? "Try a different keyword, file type, or date range."
                            : "Upload a document to start building your library and searching across files."}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8">
            {Object.entries(groupedDocs).map(([groupName, groupDocs]) => (
                <div key={groupName}>
                    {/* Group Header */}
                    <h3 className="text-sm font-semibold text-gray-500 mb-4 tracking-wider uppercase">
                        {groupName}
                    </h3>

                    {/* Documents Wrapper */}
                    <div className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" : "flex flex-col gap-3"}>
                        {groupDocs.map((doc) => (
                            <DocumentCard
                                key={doc.id}
                                icon={doc.icon}
                                name={doc.name}
                                meta={`${dayjs(doc.date).format("MMM DD, YYYY")} • ${doc.type}`}
                                viewMode={viewMode}
                                onDelete={() => console.log("Delete:", doc.name)}
                            />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}