"use client";
import Link from "next/link";

type RiskLevel = "Low" | "Medium" | "High" | "Critical";

interface RiskCard {
    level: RiskLevel;
    count: number;
}

interface TopRecommendation {
    id: string | number;
    title: string;
    risk: RiskLevel;
}

const riskCards: RiskCard[] = [
    { level: "Low", count: 18 },
    { level: "Medium", count: 11 },
    { level: "High", count: 7 },
    { level: "Critical", count: 3 },
];

const topRecommendations: TopRecommendation[] = [
    { id: 1, title: "Update employee data retention policy", risk: "Critical" },
    { id: 2, title: "Review Q3 financial anomalies flagged by AI", risk: "High" },
    { id: 3, title: "Resolve duplicate vendor entries in contracts", risk: "High" },
    { id: 4, title: "Archive outdated project requirement documents", risk: "Medium" },
    { id: 5, title: "Standardize date formats across CSV reports", risk: "Low" },
];

// Updated styles: Low risk is now Green
const riskStyles: Record<RiskLevel, { badge: string; dot: string; cardBg: string; cardText: string }> = {
    Low: {
        badge: "bg-green-50 text-green-700 border border-green-200",
        dot: "bg-green-500",
        cardBg: "bg-green-50 border border-green-200",
        cardText: "text-green-700",
    },
    Medium: {
        badge: "bg-yellow-50 text-yellow-700 border border-yellow-200",
        dot: "bg-yellow-500",
        cardBg: "bg-yellow-50 border border-yellow-200",
        cardText: "text-yellow-700",
    },
    High: {
        badge: "bg-red-50 text-red-700 border border-red-200",
        dot: "bg-red-500",
        cardBg: "bg-red-50 border border-red-200",
        cardText: "text-red-700",
    },
    Critical: {
        badge: "bg-purple-50 text-purple-700 border border-purple-200",
        dot: "bg-purple-500",
        cardBg: "bg-purple-50 border border-purple-200",
        cardText: "text-purple-700",
    },
};

interface RecommendationsSummaryProps {
    riskData?: RiskCard[];
    recommendations?: TopRecommendation[];
}

export default function RecommendationsSummary({
    riskData = riskCards,
    recommendations = topRecommendations,
}: RecommendationsSummaryProps) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-6">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-medium text-black">AI Insights Summary</h2>
                <Link
                    href="/recommendations"
                    className="text-xs text-black hover:underline transition-colors"
                >
                    View All
                </Link>
            </div>

            {/* Changed back to 1 row layout using flex */}
            <div className="flex w-full gap-3 overflow-x-auto pb-1 custom-scrollbar">
                {riskData.map(({ level, count }) => (
                    <div
                        key={level}
                        className={`${riskStyles[level].cardBg} rounded-lg p-4 flex flex-col gap-1 flex-1 min-w-25`}
                    >
                        <span className={`text-xs font-medium opacity-80 ${riskStyles[level].cardText} whitespace-nowrap`}>
                            {level} Risk
                        </span>
                        <span className={`text-2xl font-semibold ${riskStyles[level].cardText}`}>
                            {count}
                        </span>
                    </div>
                ))}
            </div>

            <div className="flex flex-col gap-2 mt-2">
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                    Top AI Insights
                </h3>
                <ul className="flex flex-col gap-2">
                    {recommendations.map((rec) => (
                        <li
                            key={rec.id}
                            className="flex items-center justify-between gap-3 p-3 rounded-lg bg-neutral-50 border border-gray-100 hover:border-black hover:bg-white transition-all cursor-pointer"
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <span
                                    className={`shrink-0 w-2 h-2 rounded-full ${riskStyles[rec.risk].dot}`}
                                />
                                <span className="text-sm text-black truncate">{rec.title}</span>
                            </div>
                            <span
                                className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${riskStyles[rec.risk].badge}`}
                            >
                                {rec.risk}
                            </span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}