"use client";

import dayjs from "dayjs";
import DocumentCard from "./DocumentCard";
import { ViewMode, DocumentItem } from "../documents";

interface GroupedDocumentViewProps {
    groupedDocs: Record<string, DocumentItem[]>;
    viewMode: ViewMode;
}

export default function GroupedDocumentView({ groupedDocs, viewMode }: GroupedDocumentViewProps) {
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