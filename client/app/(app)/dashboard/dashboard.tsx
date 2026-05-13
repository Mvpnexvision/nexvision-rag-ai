"use client";
import Link from "next/link";

export default function Dashboard() {
    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-semibold text-black tracking-tight mb-1">Good afternoon, User.</h1>
                <p className="text-black">Here is an overview of your document intelligence workspace.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl border border-gray-200 flex items-start gap-4">
                    <i className="fa-regular fa-file-lines text-2xl text-gray-500 mt-1"></i>
                    <div>
                        <h3 className="text-xs font-medium text-black uppercase tracking-wider">Total Files</h3>
                        <p className="text-2xl font-semibold text-black mt-1">142</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-200 flex items-start gap-4">
                    <i className="fa-regular fa-comments text-2xl text-gray-500 mt-1"></i>
                    <div>
                        <h3 className="text-xs font-medium text-black uppercase tracking-wider">Total Chats</h3>
                        <p className="text-2xl font-semibold text-black mt-1">87</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-200 flex items-start gap-4">
                    <i className="fa-solid fa-bolt text-2xl text-gray-500 mt-1"></i>
                    <div>
                        <h3 className="text-xs font-medium text-black uppercase tracking-wider">AI Responses</h3>
                        <p className="text-2xl font-semibold text-black mt-1">1,048</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Quick Upload */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col">
                    <h2 className="text-xl font-medium text-black mb-6">Quick Upload</h2>
                    <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl p-12 text-center bg-neutral-50 hover:border-black transition-colors cursor-pointer">
                        <i className="fa-solid fa-cloud-arrow-up text-4xl text-black mb-4"></i>
                        <p className="font-medium text-black mb-2">Drag and drop files here</p>
                        <span className="text-sm text-black mb-4">or</span>
                        <button className="bg-transparent border border-gray-200 text-black hover:bg-neutral-100 px-4 py-2 rounded-md text-sm font-medium transition-colors">
                            Browse Files
                        </button>
                        <p className="text-xs text-black mt-4">Supports PDF, DOCX, TXT, CSV</p>
                    </div>
                </div>

                {/* Right Column */}
                <div className="flex flex-col gap-6 min-w-0">
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h2 className="text-xl font-medium text-black mb-6">Recent Recommendations</h2>
                        <ul className="flex flex-col gap-3">
                            {[
                                "Summarize the Q3 Financial Report highlights",
                                "Extract all action items from Project Requirements v2",
                                "Identify negative sentiment in Q1-Q2 User Feedback"
                            ].map((prompt, i) => (
                                <li key={i}>
                                    <Link href="/chat" className="p-4 bg-neutral-50 border border-gray-200 rounded-md text-sm text-black flex items-center gap-3 hover:border-black hover:bg-white hover:shadow-sm transition-all cursor-pointer">
                                        <i className="fa-solid fa-wand-magic-sparkles text-gray-400 text-lg" aria-hidden="true"></i>
                                        <span>{prompt}</span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-medium text-black">Context Sources</h2>
                            <Link href="/documents" className="text-sm text-black hover:text-black transition-colors">View All</Link>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {[
                                { icon: "fa-file-pdf", name: "Q3_Financial_Report.pdf", meta: "2.4 MB • 2 hrs ago" },
                                { icon: "fa-file-word", name: "Project_Requirements_v2.docx", meta: "1.1 MB • Yesterday" },
                                { icon: "fa-file-csv", name: "User_Feedback_Q1-Q2.csv", meta: "500 KB • 3 days ago" },
                            ].map((doc, i) => (
                                <Link key={i} href="/chat" className="p-5 border border-gray-200 rounded-xl bg-white flex flex-col gap-2 hover:border-black hover:shadow-sm hover:bg-neutral-50 transition-all cursor-pointer relative group">
                                    <i className={`fa-solid ${doc.icon} text-3xl text-gray-500 mb-1`}></i>
                                    <span className="text-sm font-medium text-black truncate w-full mb-1">{doc.name}</span>
                                    <span className="text-xs text-gray-400">{doc.meta}</span>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}