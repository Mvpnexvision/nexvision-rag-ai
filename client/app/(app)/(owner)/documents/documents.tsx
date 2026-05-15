"use client";

import { useState, useMemo, useEffect } from "react";
import dayjs from "dayjs";
import isToday from "dayjs/plugin/isToday";
import isYesterday from "dayjs/plugin/isYesterday";

import DocumentToolbar from './components/DocumentToolbar';
import GroupedDocumentView from './components/GroupedDocumentView';
import FilterModal from './components/FilterModal';
import { useFetch } from "@/hooks/useFetch";
import { useAuth } from "@/contexts/authContext";

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

interface DocumentPageItem {
    id: string;
    file_name: string;
    file_type: string;
    processing_status: string;
    created_at: string;
}

interface DocumentsPageListResponse {
    total: number;
    documents: DocumentPageItem[];
}

type DocumentFilters = {
    fileType: string;
    dateFrom: string;
    dateTo: string;
};

const DEFAULT_FILTERS: DocumentFilters = {
    fileType: "",
    dateFrom: "",
    dateTo: "",
};

const SEARCH_DEBOUNCE_MS = 350;
const PAGE_SIZE = 100;

const getFileIcon = (fileType: string): string => {
    const type = fileType.toUpperCase();
    switch (type) {
        case "PDF":
            return "fa-file-pdf";
        case "DOCX":
        case "DOC":
            return "fa-file-word";
        case "XLSX":
        case "XLS":
            return "fa-file-excel";
        case "CSV":
            return "fa-file-csv";
        case "TXT":
        case "MD":
            return "fa-file-text";
        default:
            return "fa-file";
    }
};

export default function Documents() {
    const [viewMode, setViewMode] = useState<ViewMode>("grid");
    const [showModal, setShowModal] = useState(false);
    const [documents, setDocuments] = useState<DocumentItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchValue, setSearchValue] = useState("");
    const [debouncedSearchValue, setDebouncedSearchValue] = useState("");
    const [filters, setFilters] = useState<DocumentFilters>(DEFAULT_FILTERS);
    const { profile } = useAuth();
    const { get } = useFetch();

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchValue(searchValue.trim());
        }, SEARCH_DEBOUNCE_MS);

        return () => clearTimeout(timer);
    }, [searchValue]);

    useEffect(() => {
        const fetchDocuments = async () => {
            if (!profile?.company_id) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                let offset = 0;
                let total = 0;
                const fetchedDocuments: DocumentItem[] = [];

                do {
                    const params = new URLSearchParams({
                        company_id: profile.company_id,
                        limit: String(PAGE_SIZE),
                        offset: String(offset),
                    });

                    if (debouncedSearchValue) {
                        params.set("search", debouncedSearchValue);
                    }

                    if (filters.fileType) {
                        params.set("file_type", filters.fileType);
                    }

                    if (filters.dateFrom) {
                        params.set("date_from", filters.dateFrom);
                    }

                    if (filters.dateTo) {
                        params.set("date_to", filters.dateTo);
                    }

                    const response = await get<DocumentsPageListResponse>(
                        `/documents/page/list?${params.toString()}`
                    );

                    total = response.total;

                    fetchedDocuments.push(
                        ...response.documents.map((doc) => ({
                            id: doc.id,
                            icon: getFileIcon(doc.file_type),
                            name: doc.file_name,
                            date: doc.created_at,
                            type: doc.file_type,
                        })),
                    );

                    offset += PAGE_SIZE;
                } while (fetchedDocuments.length < total && total > 0);

                setDocuments(fetchedDocuments);
            } catch (error) {
                console.error("Failed to fetch documents:", error);
                setDocuments([]);
            } finally {
                setLoading(false);
            }
        };

        fetchDocuments();
    }, [profile?.company_id, debouncedSearchValue, filters, get]);

    const docs = documents;

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
                    searchValue={searchValue}
                    onSearchChange={setSearchValue}
                />

                <GroupedDocumentView
                    groupedDocs={groupedDocs}
                    viewMode={viewMode}
                />

            </div>

            <FilterModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                filters={filters}
                onApply={setFilters}
            />
        </div>
    );
}