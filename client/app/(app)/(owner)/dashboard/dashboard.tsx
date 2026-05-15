"use client";
import StatsCards from "./components/StatsCard";
import RecentRecommendations from "./components/RecentRecommendations";
import ContextSources from "./components/ContextSources";
import RecommendationsSummary from "./components/RecommendationsSummary";

export default function Dashboard() {
    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="mb-8">
                <h2 className="text-3xl font-semibold text-black tracking-tight mb-1">
                    Dashboard
                </h2>
            </div>

            <StatsCards />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <RecommendationsSummary />

                <div className="flex flex-col gap-6 min-w-0">
                    <ContextSources />
                </div>
            </div>
        </div>
    );
}