"use client";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/authContext";
import { useFetch } from "@/hooks/useFetch";
import StatsCards from "./components/StatsCard";
import ContextSources from "./components/ContextSources";
import RecommendationsSummary from "./components/RecommendationsSummary";

type RiskLevel = "Low" | "Medium" | "High" | "Critical";

interface DashboardStatsResponse {
    company_id: string;
    total_files: number;
    ai_questions: number;
    ai_insights: number;
    high_risk_items: number;
    recommendations: number;
}

interface RecommendationStatsResponse {
    company_id: string;
    risk_distribution: Partial<Record<RiskLevel, number>>;
}

interface DashboardRecommendationItem {
    id: string;
    title: string;
    risk_level: RiskLevel;
}

interface DashboardRecommendationsResponse {
    company_id: string;
    recommendations: DashboardRecommendationItem[];
}

interface DashboardSourceItem {
    id: string;
    name: string;
    file_type: "PDF" | "DOCX" | "XLSX" | "CSV" | "TXT" | "MD";
    created_at: string;
}

interface DashboardSourcesResponse {
    company_id: string;
    sources: DashboardSourceItem[];
}

function getFileIcon(fileType: string): string {
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
}

function formatTimeAgo(isoDate: string): string {
    const now = new Date();
    const date = new Date(isoDate);
    const diffMs = now.getTime() - date.getTime();

    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;

    if (diffMs < hour) {
        const mins = Math.max(1, Math.floor(diffMs / minute));
        return `${mins} min${mins > 1 ? "s" : ""} ago`;
    }

    if (diffMs < day) {
        const hours = Math.floor(diffMs / hour);
        return `${hours} hr${hours > 1 ? "s" : ""} ago`;
    }

    const days = Math.floor(diffMs / day);
    if (days === 1) {
        return "Yesterday";
    }
    return `${days} days ago`;
}

export default function Dashboard() {
    const { profile } = useAuth();
    const { get } = useFetch();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [stats, setStats] = useState<DashboardStatsResponse | null>(null);
    const [riskDistribution, setRiskDistribution] = useState<
        Partial<Record<RiskLevel, number>>
    >({});
    const [recommendations, setRecommendations] = useState<
        DashboardRecommendationItem[]
    >([]);
    const [sources, setSources] = useState<DashboardSourceItem[]>([]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!profile?.company_id) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);

                const companyId = profile.company_id;

                const [
                    statsResponse,
                    riskStatsResponse,
                    recommendationsResponse,
                    sourcesResponse,
                ] = await Promise.all([
                    get<DashboardStatsResponse>(
                        `/dashboard/stats?company_id=${companyId}`
                    ),
                    get<RecommendationStatsResponse>(
                        `/dashboard/recommendation-stats?company_id=${companyId}`
                    ),
                    get<DashboardRecommendationsResponse>(
                        `/dashboard/recommendations?company_id=${companyId}&limit=6`
                    ),
                    get<DashboardSourcesResponse>(
                        `/dashboard/sources?company_id=${companyId}&limit=3`
                    ),
                ]);

                setStats(statsResponse);
                setRiskDistribution(riskStatsResponse.risk_distribution ?? {});
                setRecommendations(recommendationsResponse.recommendations ?? []);
                setSources(sourcesResponse.sources ?? []);
            } catch (err) {
                console.error("Failed to fetch dashboard data", err);
                setError("Failed to load dashboard data.");
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [profile?.company_id, get]);

    const statsCards = useMemo(() => {
        return [
            {
                icon: "fa-solid fa-file-lines",
                label: "Total Files",
                value: String(stats?.total_files ?? 0),
                iconColor: "text-blue-500",
            },
            {
                icon: "fa-solid fa-comments",
                label: "AI Questions",
                value: String(stats?.ai_questions ?? 0),
                iconColor: "text-green-500",
            },
            {
                icon: "fa-solid fa-circle-info",
                label: "AI Insights",
                value: String(stats?.ai_insights ?? 0),
                iconColor: "text-yellow-500",
            },
            {
                icon: "fa-solid fa-triangle-exclamation",
                label: "Critical Risk Items",
                value: String(stats?.high_risk_items ?? 0),
                iconColor: "text-purple-500",
            },
        ];
    }, [stats]);

    const summaryRiskData = useMemo(() => {
        return [
            { level: "Low" as const, count: riskDistribution.Low ?? 0 },
            { level: "Medium" as const, count: riskDistribution.Medium ?? 0 },
            { level: "High" as const, count: riskDistribution.High ?? 0 },
            { level: "Critical" as const, count: riskDistribution.Critical ?? 0 },
        ];
    }, [riskDistribution]);

    const summaryRecommendations = useMemo(() => {
        return recommendations.map((item) => ({
            id: item.id,
            title: item.title,
            risk: item.risk_level,
        }));
    }, [recommendations]);

    const sourceCards = useMemo(() => {
        return sources.map((source) => ({
            icon: getFileIcon(source.file_type),
            name: source.name,
            meta: `${source.file_type} • ${formatTimeAgo(source.created_at)}`,
        }));
    }, [sources]);

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="mb-8">
                <h2 className="text-3xl font-semibold text-black tracking-tight mb-1">
                    Dashboard
                </h2>
                {error ? (
                    <p className="text-sm text-red-600 mt-2">{error}</p>
                ) : null}
            </div>

            <StatsCards stats={statsCards} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <RecommendationsSummary
                    riskData={summaryRiskData}
                    recommendations={summaryRecommendations}
                />

                <div className="flex flex-col gap-6 min-w-0">
                    <ContextSources sources={sourceCards} />
                </div>
            </div>

        </div>
    );
}