"use client";

import { useState, useEffect } from "react";
import {
  getCompanies,
  getDashboardStats,
  getDashboardInsights,
  getRecommendationStats,
  getDashboardRecommendations,
  getDashboardSources,
  type Company,
  type DashboardStats,
  type DashboardInsights,
  type RecommendationStats,
  type DashboardRecommendations,
  type DashboardSources,
} from "@/lib/api/superadmin";

// Toast function for error messages
const showErrorToast = (message: string) => {
  // Create a simple toast notification
  const toast = document.createElement("div");
  toast.className =
    "fixed bottom-4 right-4 bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg z-50";
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
};

export default function Dashboard() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  // API data states
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [insights, setInsights] = useState<DashboardInsights | null>(null);
  const [recStats, setRecStats] = useState<RecommendationStats | null>(null);
  const [recommendations, setRecommendations] =
    useState<DashboardRecommendations | null>(null);
  const [sources, setSources] = useState<DashboardSources | null>(null);

  // Loading states
  const [loading, setLoading] = useState(false);

  // Fetch companies on mount
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const data = await getCompanies();
        setCompanies(data);
        if (data.length > 0) {
          setSelectedCompany(data[0].id);
        }
      } catch (error) {
        showErrorToast("Failed to load companies");
      }
    };
    fetchCompanies();
  }, []);

  // Fetch dashboard data when company changes
  useEffect(() => {
    if (!selectedCompany) return;

    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [statsData, insightsData, recStatsData, recsData, sourcesData] =
          await Promise.all([
            getDashboardStats(selectedCompany),
            getDashboardInsights(selectedCompany),
            getRecommendationStats(selectedCompany),
            getDashboardRecommendations(selectedCompany),
            getDashboardSources(selectedCompany),
          ]);

        setStats(statsData);
        setInsights(insightsData);
        setRecStats(recStatsData);
        setRecommendations(recsData);
        setSources(sourcesData);
      } catch (error) {
        showErrorToast("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [selectedCompany]);

  const companyBusinessLineMap: Record<string, string> = {
    overall: "",
    "nexvision-logistics": "Logistics",
    "nexvision-clinic": "Clinic/Aesthetics",
    NHRIS: "HR/Admin",
    retailpro: "Retail",
    "construct-pro": "Construction",
    "custom-business": "Custom Business",
  };

  const selectedCompanyObj = companies.find((c) => c.id === selectedCompany);
  const businessLine = selectedCompanyObj
    ? selectedCompanyObj.business_line
    : "";
  const isOverall = selectedCompany === "overall";

  // Most Searched Topics (hardcoded for now)
  const searchedTopics = [
    { label: "Sales Performance", count: 128, pct: 100, hasDot: false },
    { label: "Truck PMS", count: 96, pct: 75, hasDot: false },
    { label: "Fuel Consumption", count: 72, pct: 56, hasDot: true },
    { label: "Customer Complaints", count: 54, pct: 42, hasDot: false },
    { label: "Employee Attendance", count: 41, pct: 32, hasDot: false },
  ];
  const kpiCards = stats
    ? [
        {
          label: "Total Files",
          value: stats.total_files.toString(),
          trend: "↑ 12% vs last month",
          trendUp: true,
          icon: (
            <svg viewBox="0 0 36 36" width="38" height="38" fill="none">
              <rect x="4" y="2" width="28" height="32" rx="3" fill="#4A90D9" />
              <rect x="4" y="2" width="14" height="14" rx="2" fill="#2563eb" />
              <rect
                x="9"
                y="19"
                width="18"
                height="2.5"
                rx="1.25"
                fill="white"
                opacity="0.9"
              />
              <rect
                x="9"
                y="24"
                width="14"
                height="2.5"
                rx="1.25"
                fill="white"
                opacity="0.9"
              />
              <rect
                x="9"
                y="29"
                width="10"
                height="2.5"
                rx="1.25"
                fill="white"
                opacity="0.9"
              />
            </svg>
          ),
        },
        {
          label: "AI Questions",
          value: stats.ai_questions.toString(),
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
          value: stats.ai_insights.toString(),
          trend: "↑ 15% vs last month",
          trendUp: true,
          icon: (
            <svg viewBox="0 0 42 42" width="42" height="42" fill="none">
              <polygon
                points="21,3 27,17 41,17 30,26 34,40 21,31 8,40 12,26 1,17 15,17"
                fill="#f59e0b"
              />
            </svg>
          ),
        },
        {
          label: "High Risk Items",
          value: stats.high_risk_items.toString(),
          trend: "↓ 5% vs last month",
          trendUp: false,
          icon: (
            <div className="w-11 h-11 rounded-full bg-red-100 flex items-center justify-center">
              <svg viewBox="0 0 30 30" width="24" height="24" fill="none">
                <polygon points="15,3 29,27 1,27" fill="#ef4444" />
                <rect
                  x="13.5"
                  y="10"
                  width="3"
                  height="9"
                  rx="1.5"
                  fill="white"
                />
                <circle cx="15" cy="22.5" r="1.8" fill="white" />
              </svg>
            </div>
          ),
          hasBgCircle: true,
        },
        {
          label: "Recommendations",
          value: stats.recommendations.toString(),
          trend: "↑ 14% vs last month",
          trendUp: true,
          icon: (
            <div className="w-11 h-11 rounded-full bg-teal-100 flex items-center justify-center">
              <svg viewBox="0 0 30 30" width="24" height="24" fill="none">
                <circle cx="15" cy="15" r="13" fill="#14b8a6" />
                <rect
                  x="13.5"
                  y="14"
                  width="3"
                  height="7"
                  rx="1.5"
                  fill="white"
                />
                <circle cx="15" cy="10" r="1.8" fill="white" />
              </svg>
            </div>
          ),
          hasBgCircle: true,
        },
      ]
    : [];

  // Risk distribution for recommendations
  const riskDistribution = recStats
    ? [
        {
          label: "Low Risk",
          count: recStats.risk_distribution.Low,
          border: "border-green-300",
          text: "text-green-700",
          bg: "bg-green-50",
        },
        {
          label: "Medium Risk",
          count: recStats.risk_distribution.Medium,
          border: "border-amber-300",
          text: "text-amber-700",
          bg: "bg-amber-50",
        },
        {
          label: "High Risk",
          count: recStats.risk_distribution.High,
          border: "border-red-300",
          text: "text-red-600",
          bg: "bg-red-50",
        },
        {
          label: "Critical Risk",
          count: recStats.risk_distribution.Critical,
          border: "border-purple-300",
          text: "text-purple-700",
          bg: "bg-purple-50",
        },
      ]
    : [];

  // Map recommendations to display format
  const displayedRecommendations = recommendations
    ? recommendations.recommendations.map((rec) => ({
        text: rec.title,
        level: rec.risk_level,
        levelColor:
          rec.risk_level === "Critical"
            ? "text-purple-600"
            : rec.risk_level === "High"
              ? "text-red-500"
              : rec.risk_level === "Medium"
                ? "text-orange-500"
                : "text-green-600",
        dot:
          rec.risk_level === "Critical"
            ? "bg-purple-500"
            : rec.risk_level === "High"
              ? "bg-red-500"
              : rec.risk_level === "Medium"
                ? "bg-orange-400"
                : "bg-green-500",
      }))
    : [];

  // Map insights to display format
  const displayedInsights = insights
    ? insights.insights.map((ins) => ({
        title: ins.prompt,
        desc: ins.subtitle,
        badge: ins.risk_level.toUpperCase(),
        badgeBg:
          ins.risk_level === "Critical"
            ? "bg-red-100"
            : ins.risk_level === "High"
              ? "bg-orange-100"
              : "bg-yellow-100",
        badgeText:
          ins.risk_level === "Critical"
            ? "text-red-600"
            : ins.risk_level === "High"
              ? "text-orange-600"
              : "text-yellow-700",
      }))
    : [];

  // Map sources to display format
  const displayedSources = sources
    ? sources.sources.map((src) => ({
        icon:
          src.file_type === "PDF"
            ? "fa-file-pdf"
            : src.file_type === "DOCX"
              ? "fa-file-word"
              : "fa-file-excel",
        iconColor:
          src.file_type === "PDF"
            ? "text-red-500"
            : src.file_type === "DOCX"
              ? "text-blue-600"
              : "text-green-600",
        name: src.file_name,
        company: selectedCompanyObj?.name || "",
        line: businessLine,
        uploader: "Unknown",
        status: "AI Ready",
        statusClass: "bg-green-100 text-green-700",
        date: new Date(src.created_at).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
      }))
    : [];

  return (
    <div className="p-6 max-w-7xl mx-auto bg-gray-50 min-h-screen">
      {/* ── Top Bar ── */}
      <div className="bg-white rounded-xl border border-gray-200 px-5 py-3 mb-6 flex items-center gap-5 shadow-sm">
        {/* Company */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 22 22" width="16" height="16" fill="none">
              <rect
                x="1"
                y="1"
                width="8.5"
                height="8.5"
                rx="1.5"
                fill="#3b82f6"
              />
              <rect
                x="12.5"
                y="1"
                width="8.5"
                height="8.5"
                rx="1.5"
                fill="#3b82f6"
                opacity="0.55"
              />
              <rect
                x="1"
                y="12.5"
                width="8.5"
                height="8.5"
                rx="1.5"
                fill="#3b82f6"
                opacity="0.55"
              />
              <rect
                x="12.5"
                y="12.5"
                width="8.5"
                height="8.5"
                rx="1.5"
                fill="#3b82f6"
                opacity="0.25"
              />
            </svg>
          </div>
          <div className="min-w-[220px]">
            <p className="text-[10px] text-gray-400 font-medium leading-none mb-1">
              Company
            </p>
            <div className="relative">
              <select
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                className="w-full appearance-none text-sm font-semibold text-gray-800 bg-white border border-gray-200 rounded-xl px-3 py-2 pr-9 outline-none transition shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
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
        <div
          className={`flex items-center gap-2.5 transition-opacity ${isOverall ? "opacity-35" : ""}`}
        >
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 22 22" width="16" height="16" fill="none">
              <rect
                x="2"
                y="7"
                width="18"
                height="13"
                rx="2"
                fill="#93c5fd"
                stroke="#3b82f6"
                strokeWidth="1.3"
              />
              <path
                d="M7 7V5.5A2.5 2.5 0 0 1 9.5 3h3A2.5 2.5 0 0 1 15 5.5V7"
                stroke="#3b82f6"
                strokeWidth="1.3"
                strokeLinecap="round"
              />
              <line
                x1="11"
                y1="11"
                x2="11"
                y2="15"
                stroke="#3b82f6"
                strokeWidth="1.3"
                strokeLinecap="round"
              />
              <line
                x1="9"
                y1="13"
                x2="13"
                y2="13"
                stroke="#3b82f6"
                strokeWidth="1.3"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-medium leading-none mb-1">
              Business Line
            </p>
            <div className="flex items-center">
              <span className="text-sm font-semibold text-gray-800">
                {isOverall ? "—" : businessLine}
              </span>
            </div>
          </div>
        </div>

        <div className="flex-1" />
      </div>

      <div className="mb-8">
        <h2 className="text-3xl font-semibold text-black tracking-tight mb-1">
          Dashboard
        </h2>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-5 gap-4 mb-5">
        {kpiCards.map((card, i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm"
          >
            <div className="mb-2">{card.icon}</div>
            <p className="text-xs text-gray-500 mt-1 mb-0.5">{card.label}</p>
            <p className="text-[28px] font-bold text-gray-900 leading-tight mb-1">
              {card.value}
            </p>
            <p
              className={`text-xs font-medium ${card.trendUp ? "text-green-600" : "text-red-500"}`}
            >
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
            <h3 className="text-sm font-bold text-gray-900">
              Recommendations Summary
            </h3>
          </div>

          <div className="grid grid-cols-4 gap-2 mb-4">
            {riskDistribution.map((r) => (
              <div
                key={r.label}
                className={`rounded-lg border ${r.border} ${r.bg} px-2 py-2.5 text-center`}
              >
                <p
                  className={`text-[11px] font-semibold ${r.text} mb-1 leading-tight`}
                >
                  {r.label}
                </p>
                <p className={`text-2xl font-bold ${r.text}`}>{r.count}</p>
              </div>
            ))}
          </div>

          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">
            Top Recommendations
          </p>
          <div className="space-y-2">
            {displayedRecommendations.map((rec, i) => (
              <div key={i} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span
                    className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${rec.dot}`}
                  />
                  <p className="text-xs text-gray-800 truncate">{rec.text}</p>
                </div>
                <span
                  className={`text-xs font-semibold flex-shrink-0 ${rec.levelColor}`}
                >
                  {rec.level}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* AI Insights */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-900">AI Insights</h3>
          </div>

          <div>
            {displayedInsights.map((ins, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 py-3.5 ${i < displayedInsights.length - 1 ? "border-b border-gray-100" : ""}`}
              >
                <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
                    <polyline
                      points="3,18 8,12 12,15 18,8 21,5"
                      stroke="#9ca3af"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <polyline
                      points="17,5 21,5 21,9"
                      stroke="#9ca3af"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-900">
                    {ins.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                    {ins.desc}
                  </p>
                </div>
                <span
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-md flex-shrink-0 ${ins.badgeBg} ${ins.badgeText}`}
                >
                  {ins.badge}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom Row ── */}
      <div className=" gap-5 w-full">
        {/* Latest Uploads */}
        <div className="bg-white rounded-xl border w-full border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-900">Latest Uploads</h3>
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
                {displayedSources.map((file, i) => (
                  <tr key={i} className="border-t border-gray-50">
                    {/* FILE NAME (priority column) */}
                    <td className="py-2 pr-3 w-[45%] max-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <i
                          className={`fa-solid ${file.icon} ${file.iconColor} flex-shrink-0`}
                        />

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
        </div>
      </div>
    </div>
  );
}
