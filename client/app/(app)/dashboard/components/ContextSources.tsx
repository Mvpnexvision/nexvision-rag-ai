"use client";
import Link from "next/link";

interface SourceDocument {
    icon: string;
    name: string;
    meta: string;
}

const DEFAULT_SOURCES: SourceDocument[] = [
    { icon: "fa-file-pdf", name: "Q3_Financial_Report.pdf", meta: "2.4 MB • 2 hrs ago" },
    { icon: "fa-file-word", name: "Project_Requirements_v2.docx", meta: "1.1 MB • Yesterday" },
    { icon: "fa-file-csv", name: "User_Feedback_Q1-Q2.csv", meta: "500 KB • 3 days ago" },
];

interface ContextSourcesProps {
    sources?: SourceDocument[];
}

export default function ContextSources({ sources = DEFAULT_SOURCES }: ContextSourcesProps) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-medium text-black">Context Sources</h2>
                <Link
                    href="/documents"
                    className="text-xs text-black hover:text-black transition-colors"
                >
                    View All
                </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {sources.map((doc, i) => (
                    <Link
                        key={i}
                        href="/chat"
                        className="p-5 border border-gray-200 rounded-xl bg-white flex flex-col gap-2 hover:border-black hover:shadow-sm hover:bg-neutral-50 transition-all cursor-pointer relative group"
                    >
                        <i className={`fa-solid ${doc.icon} text-2xl text-[#122F35] mb-2`}></i>
                        <span className="text-sm font-medium text-black truncate w-full">
                            {doc.name}
                        </span>
                        <span className="text-xs text-gray-500">{doc.meta}</span>
                    </Link>
                ))}
            </div>
        </div>
    );
}