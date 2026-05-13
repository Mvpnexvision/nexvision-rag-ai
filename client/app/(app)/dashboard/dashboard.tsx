"use client";

import Link from "next/link";
import StatCard from "@/components/StatCard";
import UploadCard from "@/components/UploadCard";
import RecommendationList from "@/components/RecommendationList";
import ContextSourceCard from "@/components/ContextSourceCard";

export default function Dashboard() {
    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-semibold text-black tracking-tight mb-1">
                    Good afternoon, User.
                </h1>
                <p className="text-black">
                    Here is an overview of your document intelligence workspace.
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <StatCard icon="fa-regular fa-file-lines" title="Total Files" value={142} />
                <StatCard icon="fa-regular fa-comments" title="Total Chats" value={87} />
                <StatCard icon="fa-solid fa-bolt" title="AI Responses" value={1048} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <UploadCard />

                <div className="flex flex-col gap-6 min-w-0">
                    <RecommendationList />
                    <ContextSourceCard />
                </div>
            </div>
        </div>
    );
}