"use client";

import { useState, useMemo } from "react";
import dayjs from "dayjs";
import isToday from "dayjs/plugin/isToday";
import isYesterday from "dayjs/plugin/isYesterday";

import DocumentToolbar from './components/DocumentToolbar';
import GroupedDocumentView from './components/GroupedDocumentView';
import FilterModal from './components/FilterModal';
import DocumentUploadModal from './components/DocumentUploadModal';

// Extend dayjs plugins
dayjs.extend(isToday);
dayjs.extend(isYesterday);

export type ViewMode = "grid" | "list";

export interface DocumentItem {
    id: string;
    icon: string;
    name: string;
    date: string; // ISO string
    type: string;
}

export default function Documents() {
    const [viewMode, setViewMode] = useState<ViewMode>("grid");
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    // Mock data using dynamic dates to demonstrate the Today/Yesterday grouping
    const docs: DocumentItem[] = [
        { id: "1", icon: "fa-file-pdf", name: "System_Configuration.pdf", date: dayjs().toISOString(), type: "PDF" },
        { id: "2", icon: "fa-file-pdf", name: "Security_Audit_Report.pdf", date: dayjs().toISOString(), type: "PDF" },
        { id: "3", icon: "fa-file-pdf", name: "API_Documentation.pdf", date: dayjs().toISOString(), type: "PDF" },
        { id: "4", icon: "fa-file-pdf", name: "Database_Schema.pdf", date: dayjs().toISOString(), type: "PDF" },
        { id: "5", icon: "fa-file-word", name: "System_Requirements.docx", date: dayjs().subtract(1, "day").toISOString(), type: "DOCX" },
        { id: "6", icon: "fa-file-csv", name: "User_Demographics.csv", date: dayjs().subtract(3, "day").toISOString(), type: "CSV" },
        { id: "7", icon: "fa-file-pdf", name: "Compliance_Guidelines.pdf", date: dayjs().subtract(45, "day").toISOString(), type: "PDF" },
        { id: "8", icon: "fa-file-word", name: "Data_Migration_Plan.docx", date: dayjs().subtract(60, "day").toISOString(), type: "DOCX" },
        { id: "9", icon: "fa-file-word", name: "Disaster_Recovery.docx", date: dayjs().subtract(60, "day").toISOString(), type: "DOCX" },
        { id: "10", icon: "fa-file-word", name: "Infrastructure_Overview.docx", date: dayjs().subtract(60, "day").toISOString(), type: "DOCX" },
        { id: "11", icon: "fa-file-word", name: "Backup_Strategy.docx", date: dayjs().subtract(60, "day").toISOString(), type: "DOCX" },
        { id: "12", icon: "fa-file-word", name: "Monitoring_Setup.docx", date: dayjs().subtract(60, "day").toISOString(), type: "DOCX" },
        { id: "13", icon: "fa-file-word", name: "Release_Notes.docx", date: dayjs().subtract(60, "day").toISOString(), type: "DOCX" },
    ];

    const filteredDocs = docs.filter((doc) =>
        doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.type.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Grouping logic
    const groupedDocs = useMemo(() => {
        const groups: Record<string, DocumentItem[]> = {};

        filteredDocs.forEach((doc) => {
            const d = dayjs(doc.date);
            let groupName = "";

            if (d.isToday()) {
                groupName = "Today";
            } else if (d.isYesterday()) {
                groupName = "Yesterday";
            } else {
                groupName = d.format("MMM DD, YYYY");
            }

            if (!groups[groupName]) {
                groups[groupName] = [];
            }
            groups[groupName].push(doc);
        });

        return groups;
    }, [filteredDocs]);

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="bg-white rounded-xl border border-gray-200 p-6">

                <DocumentToolbar
                    viewMode={viewMode}
                    setViewMode={setViewMode}
                    onOpenFilter={() => setShowFilterModal(true)}
                    searchTerm={searchTerm}
                    onSearch={setSearchTerm}
                    onOpenUpload={() => setShowUploadModal(true)}
                />

                <GroupedDocumentView
                    groupedDocs={groupedDocs}
                    viewMode={viewMode}
                />

            </div>

            <FilterModal
                isOpen={showFilterModal}
                onClose={() => setShowFilterModal(false)}
            />

            <DocumentUploadModal
                isOpen={showUploadModal}
                onClose={() => setShowUploadModal(false)}
            />
        </div>
    );
}
