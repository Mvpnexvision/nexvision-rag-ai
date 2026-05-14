"use client";

import { useState } from "react";

const companyBusinessLineMap: Record<string, string> = {
    "overall": "",
    "nexvision-logistics": "Logistics",
    "nexvision-clinic": "Clinic/Aesthetics",
    "NHRIS": "HR/Admin",
    "retailpro": "Retail",
    "construct-pro": "Construction",
    "custom-business": "Custom Business",
};

export default function Dashboard() {
    const [selectedCompany, setSelectedCompany] = useState("nexvision-logistics");
    const [searchQuery, setSearchQuery] = useState("");

    const companies = [
        { id: "overall", name: "Overall" },
        { id: "nexvision-logistics", name: "NexVision Logistics" },
        { id: "nexvision-clinic", name: "NexVision Clinic" },
        { id: "NHRIS", name: "NexVision HR" },
        { id: "retailpro", name: "RetailPro" },
        { id: "construct-pro", name: "Construct Pro" },
        { id: "custom-business", name: "Custom Business" },
    ];

    const isOverall = selectedCompany === "overall";
    const businessLine = companyBusinessLineMap[selectedCompany];
    
    const kpiCards = [
        {
            label: "Total Files",
            value: "142",
            trend: "↑ 12% vs last month",
            trendUp: true,
            icon: (
                <svg viewBox="0 0 36 36" width="38" height="38" fill="none">
                    <rect x="4" y="2" width="28" height="32" rx="3" fill="#4A90D9" />
                    <rect x="4" y="2" width="14" height="14" rx="2" fill="#2563eb" />
                    <rect x="9" y="19" width="18" height="2.5" rx="1.25" fill="white" opacity="0.9" />
                    <rect x="9" y="24" width="14" height="2.5" rx="1.25" fill="white" opacity="0.9" />
                    <rect x="9" y="29" width="10" height="2.5" rx="1.25" fill="white" opacity="0.9" />
                </svg>
            ),
        },
        {
            label: "AI Questions",
            value: "87",
            trend: "↑ 8% vs last month",
            trendUp: true,
            icon: (
                <svg viewBox="0 0 42 42" width="42" height="42" fill="none">
                    <ellipse cx="21" cy="18" rx="15" ry="12" fill="#9333ea" />
                    <circle cx="14" cy="18" r="2.2" fill="white" />
                    <circle cx="21" cy="18" r="2.2" fill="white" />
                    <circle cx="28" cy="18" r="2.2" fill="white" />
                    <path d="M13 30 Q16 24 21 24 Q26 24 29 30" fill="#9333ea" />
                </svg>
            ),
        },
        {
            label: "AI Insights",
            value: "1,048",
            trend: "↑ 15% vs last month",
            trendUp: true,
            icon: (
                <svg viewBox="0 0 42 42" width="42" height="42" fill="none">
                    <polygon points="21,3 27,17 41,17 30,26 34,40 21,31 8,40 12,26 1,17 15,17" fill="#f59e0b" />
                </svg>
            ),
        },
        {
            label: "High Risk Items",
            value: "85%",
            trend: "↓ 5% vs last month",
            trendUp: false,
            icon: (
                <div className="w-11 h-11 rounded-full bg-red-100 flex items-center justify-center">
                    <svg viewBox="0 0 30 30" width="24" height="24" fill="none">
                        <polygon points="15,3 29,27 1,27" fill="#ef4444" />
                        <rect x="13.5" y="10" width="3" height="9" rx="1.5" fill="white" />
                        <circle cx="15" cy="22.5" r="1.8" fill="white" />
                    </svg>
                </div>
            ),
            hasBgCircle: true,
        },
        {
            label: "Recommendations",
            value: "32",
            trend: "↑ 14% vs last month",
            trendUp: true,
            icon: (
                <div className="w-11 h-11 rounded-full bg-teal-100 flex items-center justify-center">
                    <svg viewBox="0 0 30 30" width="24" height="24" fill="none">
                        <circle cx="15" cy="15" r="13" fill="#14b8a6" />
                        <rect x="13.5" y="14" width="3" height="7" rx="1.5" fill="white" />
                        <circle cx="15" cy="10" r="1.8" fill="white" />
                    </svg>
                </div>
            ),
            hasBgCircle: true,
        },
    ];

    const topRecommendations = [
        { text: "Update employee data retention policy", level: "Critical", levelColor: "text-purple-600", dot: "bg-purple-500" },
        { text: "Review Q3 financial anomalies flagged by AI", level: "High", levelColor: "text-red-500", dot: "bg-red-500" },
        { text: "Resolve duplicate vendor entries in contracts", level: "High", levelColor: "text-red-500", dot: "bg-red-500" },
        { text: "Implement fuel tracking for all logistics vehicles", level: "Medium", levelColor: "text-orange-500", dot: "bg-orange-400" },
        { text: "Standardize attendance policy across branches", level: "Low", levelColor: "text-green-600", dot: "bg-green-500" },
    ];

    const aiInsights = [
        { title: "Adidas - Low Sales", desc: "Revenue dropped 12% in Q3 compared to last quarter.", badge: "HIGH", badgeBg: "bg-orange-100", badgeText: "text-orange-600" },
        { title: "Nike - Low Customer Satisfaction", desc: "NPS score fell below threshold across 3 regions.", badge: "MEDIUM", badgeBg: "bg-yellow-100", badgeText: "text-yellow-700" },
        { title: "Under Armour - Low Sales", desc: "Consistent decline over the past 2 reporting periods.", badge: "CRITICAL", badgeBg: "bg-red-100", badgeText: "text-red-600" },
    ];

    const latestUploads = [
        { icon: "fa-file-pdf", iconColor: "text-red-500", name: "Q3_Financial_Report.pdf", company: "NexVision Logistics", line: "Logistics", uploader: "John Doe", status: "AI Ready", statusClass: "bg-green-100 text-green-700", date: "May 16, 2024" },
        { icon: "fa-file-word", iconColor: "text-blue-600", name: "Driver_Attendance_May.docx", company: "NexVision Logistics", line: "Logistics", uploader: "Jane Smith", status: "Processing", statusClass: "bg-blue-100 text-blue-700", date: "May 16, 2024" },
        { icon: "fa-file-excel", iconColor: "text-green-600", name: "Fuel_Usage_Report.xlsx", company: "NexVision Logistics", line: "Logistics", uploader: "Mike Johnson", status: "Extracting", statusClass: "bg-orange-100 text-orange-700", date: "May 15, 2024" },
    ];

    const searchedTopics = [
        { label: "Sales Performance", count: 128, pct: 100, hasDot: false },
        { label: "Truck PMS", count: 96, pct: 75, hasDot: false },
        { label: "Fuel Consumption", count: 72, pct: 56, hasDot: true },
        { label: "Customer Complaints", count: 54, pct: 42, hasDot: false },
        { label: "Employee Attendance", count: 41, pct: 32, hasDot: false },
    ];

    return (
        <div className="p-6 max-w-7xl mx-auto bg-gray-50 min-h-screen">

            {/* ── Top Bar ── */}
            <div className="bg-white rounded-xl border border-gray-200 px-5 py-3 mb-6 flex items-center gap-5 shadow-sm">

                {/* Company */}
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                        <svg viewBox="0 0 22 22" width="16" height="16" fill="none">
                            <rect x="1" y="1" width="8.5" height="8.5" rx="1.5" fill="#3b82f6" />
                            <rect x="12.5" y="1" width="8.5" height="8.5" rx="1.5" fill="#3b82f6" opacity="0.55" />
                            <rect x="1" y="12.5" width="8.5" height="8.5" rx="1.5" fill="#3b82f6" opacity="0.55" />
                            <rect x="12.5" y="12.5" width="8.5" height="8.5" rx="1.5" fill="#3b82f6" opacity="0.25" />
                        </svg>
                    </div>
                    <div className="min-w-[220px]">
                        <p className="text-[10px] text-gray-400 font-medium leading-none mb-1">Company</p>
                        <div className="relative">
                            <select
                                value={selectedCompany}
                                onChange={(e) => setSelectedCompany(e.target.value)}
                                className="w-full appearance-none text-sm font-semibold text-gray-800 bg-white border border-gray-200 rounded-xl px-3 py-2 pr-9 outline-none transition shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            >
                                {companies.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>

                            {/* dropdown icon (company stays) */}
                            <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                                <i className="fa-solid fa-chevron-down text-gray-400 text-xs" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="w-px h-7 bg-gray-200" />

                {/* Business Line — auto-assigned display */}
                <div className={`flex items-center gap-2.5 transition-opacity ${isOverall ? "opacity-35" : ""}`}>
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                        <svg viewBox="0 0 22 22" width="16" height="16" fill="none">
                            <rect x="2" y="7" width="18" height="13" rx="2" fill="#93c5fd" stroke="#3b82f6" strokeWidth="1.3" />
                            <path d="M7 7V5.5A2.5 2.5 0 0 1 9.5 3h3A2.5 2.5 0 0 1 15 5.5V7" stroke="#3b82f6" strokeWidth="1.3" strokeLinecap="round" />
                            <line x1="11" y1="11" x2="11" y2="15" stroke="#3b82f6" strokeWidth="1.3" strokeLinecap="round" />
                            <line x1="9" y1="13" x2="13" y2="13" stroke="#3b82f6" strokeWidth="1.3" strokeLinecap="round" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-[10px] text-gray-400 font-medium leading-none mb-1">Business Line</p>
                        <div className="flex items-center">
                            <span className="text-sm font-semibold text-gray-800">
                                {isOverall ? "—" : businessLine}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex-1" />

                {/* Search */}
                <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg bg-white min-w-[200px]">
                    <i className="fa-solid fa-magnifying-glass text-gray-400 text-sm" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search..."
                        className="flex-1 outline-none text-sm text-gray-700 bg-transparent placeholder-gray-400"
                    />
                </div>

                {/* Bell */}
                <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                    <i className="fa-regular fa-bell text-lg" />
                </button>
            </div>

                <div className="mb-8">
                    <h2 className="text-3xl font-semibold text-black tracking-tight mb-1">
                        Dashboard
                    </h2>
                </div>

            {/* ── KPI Cards ── */}
            <div className="grid grid-cols-5 gap-4 mb-5">
                {kpiCards.map((card, i) => (
                    <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                        <div className="mb-2">
                            {card.icon}
                        </div>
                        <p className="text-xs text-gray-500 mt-1 mb-0.5">{card.label}</p>
                        <p className="text-[28px] font-bold text-gray-900 leading-tight mb-1">{card.value}</p>
                        <p className={`text-xs font-medium ${card.trendUp ? "text-green-600" : "text-red-500"}`}>
                            {card.trend}
                        </p>
                    </div>
                ))}
            </div>

            {/* ── Middle Row ── */}
            <div className="grid grid-cols-2 gap-5 mb-5">

                {/* Recommendations Summary */}
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-gray-900">Recommendations Summary</h3>
                        <button className="text-xs text-blue-500 hover:underline font-medium">View All</button>
                    </div>

                    <div className="grid grid-cols-4 gap-2 mb-4">
                        {[
                            { label: "Low Risk", count: 18, border: "border-green-300", text: "text-green-700", bg: "bg-green-50" },
                            { label: "Medium Risk", count: 11, border: "border-amber-300", text: "text-amber-700", bg: "bg-amber-50" },
                            { label: "High Risk", count: 7, border: "border-red-300", text: "text-red-600", bg: "bg-red-50" },
                            { label: "Critical Risk", count: 3, border: "border-purple-300", text: "text-purple-700", bg: "bg-purple-50" },
                        ].map((r) => (
                            <div key={r.label} className={`rounded-lg border ${r.border} ${r.bg} px-2 py-2.5 text-center`}>
                                <p className={`text-[11px] font-semibold ${r.text} mb-1 leading-tight`}>{r.label}</p>
                                <p className={`text-2xl font-bold ${r.text}`}>{r.count}</p>
                            </div>
                        ))}
                    </div>

                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">Top Recommendations</p>
                    <div className="space-y-2">
                        {topRecommendations.map((rec, i) => (
                            <div key={i} className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${rec.dot}`} />
                                    <p className="text-xs text-gray-800 truncate">{rec.text}</p>
                                </div>
                                <span className={`text-xs font-semibold flex-shrink-0 ${rec.levelColor}`}>{rec.level}</span>
                            </div>
                        ))}
                    </div>

                    <button className="mt-3.5 text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
                        View All Recommendations <i className="fa-solid fa-chevron-right text-[9px]" />
                    </button>
                </div>

                {/* AI Insights */}
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-gray-900">AI Insights</h3>
                        <button className="text-xs text-blue-500 hover:underline font-medium">View All</button>
                    </div>

                    <div>
                        {aiInsights.map((ins, i) => (
                            <div key={i} className={`flex items-start gap-3 py-3.5 ${i < aiInsights.length - 1 ? "border-b border-gray-100" : ""}`}>
                                <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
                                        <polyline points="3,18 8,12 12,15 18,8 21,5" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        <polyline points="17,5 21,5 21,9" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-gray-900">{ins.title}</p>
                                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{ins.desc}</p>
                                </div>
                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md flex-shrink-0 ${ins.badgeBg} ${ins.badgeText}`}>
                                    {ins.badge}
                                </span>
                            </div>
                        ))}
                    </div>

                    <button className="mt-3 text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
                        View All Insights <i className="fa-solid fa-chevron-right text-[9px]" />
                    </button>
                </div>
            </div>

            {/* ── Bottom Row ── */}
            <div className="grid grid-cols-2 gap-5">

                {/* Latest Uploads */}
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-gray-900">Latest Uploads</h3>
                        <button className="text-xs text-blue-500 hover:underline font-medium">View All</button>
                    </div>

                    <div className="overflow-x-auto rounded-xl">
                        <table className="w-full table-fixed">

                            <thead>
                                <tr>
                                    {["File Name", "Company", "Uploaded By", "Date"].map((h) => (
                                        <th
                                            key={h}
                                            className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wide pb-2 pr-3 whitespace-nowrap"
                                        >
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>

                            <tbody>
                                {latestUploads.map((file, i) => (
                                    <tr key={i} className="border-t border-gray-50">

                                        {/* FILE NAME (priority column) */}
                                        <td className="py-2 pr-3 w-[45%] max-w-0">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <i className={`fa-solid ${file.icon} ${file.iconColor} flex-shrink-0`} />

                                                <span
                                                    className="text-[11px] font-medium text-gray-800 truncate block"
                                                    title={file.name}
                                                >
                                                    {file.name}
                                                </span>
                                            </div>
                                        </td>

                                        {/* COMPANY */}
                                        <td className="py-2 pr-3 w-[25%] max-w-0">
                                            <span className="text-[11px] text-gray-500 truncate block">
                                                {file.company}
                                            </span>
                                        </td>

                                        {/* UPLOADER */}
                                        <td className="py-2 pr-3 w-[20%] max-w-0">
                                            <span className="text-[11px] text-gray-500 truncate block">
                                                {file.uploader}
                                            </span>
                                        </td>

                                        {/* DATE */}
                                        <td className="py-2 w-[10%] whitespace-nowrap text-[11px] text-gray-400">
                                            {file.date}
                                        </td>

                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <button className="mt-3.5 text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
                        View All Uploads <i className="fa-solid fa-chevron-right text-[9px]" />
                    </button>
                </div>

                {/* Most Searched Topics */}
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="text-sm font-bold text-gray-900">Most Searched Topics</h3>
                        <button className="text-xs text-blue-500 hover:underline font-medium">View All</button>
                    </div>

                    <div className="space-y-4">
                        {searchedTopics.map((topic, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <p className="text-xs text-gray-700 w-36 flex-shrink-0">{topic.label}</p>
                                <div className="flex-1 relative h-2 bg-gray-100 rounded-full">
                                    <div
                                        className="h-full bg-teal-500 rounded-full"
                                        style={{ width: `${topic.pct}%` }}
                                    />
                                    {topic.hasDot && (
                                        <div
                                            className="absolute top-1/2 w-3 h-3 rounded-full border-2 border-white bg-teal-400 shadow-sm"
                                            style={{ left: `${topic.pct}%`, transform: "translate(-50%, -50%)" }}
                                        />
                                    )}
                                </div>
                                <span className="text-xs font-semibold text-gray-700 w-7 text-right flex-shrink-0">{topic.count}</span>
                            </div>
                        ))}
                    </div>

                    <button className="mt-5 text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
                        View All Topics <i className="fa-solid fa-chevron-right text-[9px]" />
                    </button>
                </div>
            </div>
        </div>
    );
}
