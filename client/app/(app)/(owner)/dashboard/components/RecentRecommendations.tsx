"use client";
import Link from "next/link";

// Added Risk level type
interface Recommendation {
    id: number;
    prompt: string;
    subtitle: string;
    risk: "Low" | "Medium" | "High" | "Critical";
}

const DEFAULT_RECOMMENDATIONS: Recommendation[] = [
    { id: 1, prompt: "Adidas - Low Sales", subtitle: "Revenue dropped 12% in Q3 compared to last quarter.", risk: "High" },
    { id: 2, prompt: "Nike - Low Customer Satisfaction", subtitle: "NPS score fell below threshold across 3 regions.", risk: "Medium" },
    { id: 3, prompt: "Under Armour - Low Sales", subtitle: "Consistent decline over the past 2 reporting periods.", risk: "Critical" },
];

// Color mapping matching the summary component
const riskStyles: Record<string, string> = {
    Low: "bg-blue-50 text-blue-700 border-blue-200",
    Medium: "bg-yellow-50 text-yellow-700 border-yellow-200",
    High: "bg-red-50 text-red-700 border-red-200",
    Critical: "bg-purple-50 text-purple-700 border-purple-200",
};

interface RecentRecommendationsProps {
    items?: Recommendation[];
}

export default function RecentRecommendations({
    items = DEFAULT_RECOMMENDATIONS,
}: RecentRecommendationsProps) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-medium text-black">AI Insights</h2>
                <Link
                    href="/recommendations"
                    className="text-xs text-black hover:underline transition-colors"
                >
                    View All
                </Link>
            </div>
            <ul className="flex flex-col gap-3">
                {items.map((item) => (
                    <li key={item.id}>
                        <Link
                            href="/chat"
                            className="p-4 bg-neutral-50 border border-gray-200 rounded-md text-black flex justify-between items-start gap-4 hover:border-black hover:bg-white hover:shadow-sm transition-all cursor-pointer"
                        >
                            <div className="flex items-start gap-4">
                                {/* Adjusted icon margin slightly to align with text */}
                                <div className="mt-0.5">
                                    <i
                                        className="fa-solid fa-wand-magic-sparkles text-[#122F35] text-md shrink-0"
                                        aria-hidden="true"
                                    ></i>
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <p className="text-sm font-medium">{item.prompt}</p>
                                    <p className="text-xs text-gray-500">{item.subtitle}</p>
                                </div>
                            </div>

                            {/* Risk badge positioned at the upper right via flex-between */}
                            <span className={`shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${riskStyles[item.risk]}`}>
                                {item.risk}
                            </span>
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}