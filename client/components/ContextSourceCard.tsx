import Link from "next/link";

type ContextSource = {
    icon: string;
    name: string;
    meta: string;
};

const docs: ContextSource[] = [
    {
        icon: "fa-file-pdf",
        name: "Q3_Financial_Report.pdf",
        meta: "2.4 MB • 2 hrs ago",
    },
    {
        icon: "fa-file-word",
        name: "Project_Requirements_v2.docx",
        meta: "1.1 MB • Yesterday",
    },
    {
        icon: "fa-file-csv",
        name: "User_Feedback_Q1-Q2.csv",
        meta: "500 KB • 3 days ago",
    },
];

export default function ContextSourceCard() {
    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-medium text-black">
                    Context Sources
                </h2>

                <Link
                    href="/documents"
                    className="text-sm text-black hover:text-black transition-colors"
                >
                    View All
                </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {docs.map((doc, i) => (
                    <Link
                        key={i}
                        href="/chat"
                        className="p-5 border border-gray-200 rounded-xl bg-white flex flex-col gap-2 hover:border-black hover:shadow-sm hover:bg-neutral-50 transition-all cursor-pointer"
                    >
                        <i className={`${doc.icon} text-3xl text-gray-500 mb-1`} />
                        <span className="text-sm font-medium text-black truncate">
                            {doc.name}
                        </span>
                        <span className="text-xs text-gray-400">
                            {doc.meta}
                        </span>
                    </Link>
                ))}
            </div>
        </div>
    );
}