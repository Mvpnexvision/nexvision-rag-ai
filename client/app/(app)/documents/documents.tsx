"use client";

import { useState, useMemo } from "react";
import dayjs from "dayjs";
import isToday from "dayjs/plugin/isToday";
import isYesterday from "dayjs/plugin/isYesterday";

import DocumentToolbar from './components/DocumentToolbar';
import GroupedDocumentView from './components/GroupedDocumentView';
import FilterModal from './components/FilterModal';

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
    const [showModal, setShowModal] = useState(false);

    // Mock data using dynamic dates to demonstrate the Today/Yesterday grouping
    const docs: DocumentItem[] = [
        { id: "1", icon: "fa-file-pdf", name: "Q3_Financial_Report.pdf", date: dayjs().toISOString(), type: "PDF" },
        { id: "2", icon: "fa-file-pdf", name: "Q3_Financial_Report.pdf", date: dayjs().toISOString(), type: "PDF" },
        { id: "3", icon: "fa-file-pdf", name: "Q3_Financial_Report.pdf", date: dayjs().toISOString(), type: "PDF" },
        { id: "4", icon: "fa-file-pdf", name: "Q3_Financial_Report.pdf", date: dayjs().toISOString(), type: "PDF" },
        { id: "5", icon: "fa-file-word", name: "Project_Requirements_v2.docx", date: dayjs().subtract(1, "day").toISOString(), type: "DOCX" },
        { id: "6", icon: "fa-file-csv", name: "User_Feedback_Q1-Q2.csv", date: dayjs().subtract(3, "day").toISOString(), type: "CSV" },
        { id: "7", icon: "fa-file-pdf", name: "Employee_Handbook_2023.pdf", date: dayjs().subtract(45, "day").toISOString(), type: "PDF" },
        { id: "8", icon: "fa-file-word", name: "Marketing_Strategy_Q4.docx", date: dayjs().subtract(60, "day").toISOString(), type: "DOCX" },
        { id: "9", icon: "fa-file-word", name: "Marketing_Strategy_Q4.docx", date: dayjs().subtract(60, "day").toISOString(), type: "DOCX" },
        { id: "10", icon: "fa-file-word", name: "Marketing_Strategy_Q4.docx", date: dayjs().subtract(60, "day").toISOString(), type: "DOCX" },
        { id: "11", icon: "fa-file-word", name: "Marketing_Strategy_Q4.docx", date: dayjs().subtract(60, "day").toISOString(), type: "DOCX" },
        { id: "12", icon: "fa-file-word", name: "Marketing_Strategy_Q4.docx", date: dayjs().subtract(60, "day").toISOString(), type: "DOCX" },
        { id: "13", icon: "fa-file-word", name: "Marketing_Strategy_Q4.docx", date: dayjs().subtract(60, "day").toISOString(), type: "DOCX" },
    ];

    // Grouping logic
    const groupedDocs = useMemo(() => {
        const groups: Record<string, DocumentItem[]> = {};

        docs.forEach((doc) => {
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
    }, [docs]);

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="bg-white rounded-xl border border-gray-200 p-6">

                <DocumentToolbar
                    viewMode={viewMode}
                    setViewMode={setViewMode}
                    onOpenFilter={() => setShowModal(true)}
                />

                <GroupedDocumentView
                    groupedDocs={groupedDocs}
                    viewMode={viewMode}
                />

            </div>

            <FilterModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
            />
        </div>
    );
}