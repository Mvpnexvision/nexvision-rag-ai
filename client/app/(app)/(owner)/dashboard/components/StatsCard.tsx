"use client";

export interface Stat {
    icon: string;
    label: string;
    value: string;
    iconColor: string;
}

const DEFAULT_STATS: Stat[] = [
    { icon: "fa-solid fa-file-lines", label: "Total Files", value: "142", iconColor: "text-blue-500" },
    { icon: "fa-solid fa-comments", label: "AI Questions", value: "87", iconColor: "text-green-500" },
    { icon: "fa-solid fa-circle-info", label: "AI Insights", value: "1,048", iconColor: "text-yellow-500" },
    { icon: "fa-solid fa-triangle-exclamation", label: "Critical Risk Items", value: "3", iconColor: "text-purple-500" },
];

interface StatsCardsProps {
    stats?: Stat[];
}

export default function StatsCards({
    stats = DEFAULT_STATS,
}: StatsCardsProps) {
    return (
        <div className="flex w-full gap-4 mb-8 overflow-x-auto pb-2 custom-scrollbar">
            {stats.map((stat) => (
                <div
                    key={stat.label}
                    className="bg-white p-6 rounded-xl border border-gray-200 flex items-center gap-4 flex-1 min-w-50"
                >
                    {/* Icon inside a colored circle */}
                    <div className="w-12 h-12 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center shrink-0">
                        {/* Pinalitan ang hardcoded color ng dynamic {stat.iconColor} */}
                        <i className={`${stat.icon} text-xl ${stat.iconColor}`}></i>
                    </div>
                    <div>
                        <h3 className="text-xs text-gray-500 tracking-wider whitespace-nowrap">
                            {stat.label}
                        </h3>
                        <p className="text-xl font-semibold text-black mt-1">{stat.value}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}