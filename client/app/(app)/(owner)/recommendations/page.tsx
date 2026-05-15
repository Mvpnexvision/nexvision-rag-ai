"use client";

import { useState, useEffect } from "react";
import { useFetch } from "@/hooks/useFetch";
import { useAuth } from "@/contexts/authContext";
import RecommendationDetailCard from "./components/RecommendationDetailCard";

// ── Types ────────────────────────────────────────────────────────────────────

interface Recommendation {
  id: string;
  ai_question_id: string;
  company_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  question: string;
  direct_answer: string;
  evidence_found: string[];
  reasoning: string;
  recommendation: string;
  risk_level: "Low" | "Medium" | "High" | "Critical";
  business_impact: string;
  next_action: string;
  sources: string[];
}

interface RecommendationsResponse {
  company_id: string;
  recommendations: Recommendation[];
  total: number;
}

// ── Constants ────────────────────────────────────────────────────────────────

const RISK_COLOR: Record<string, string> = {
  Critical: "bg-purple-100 text-purple-700",
  High: "bg-orange-100 text-orange-700",
  Medium: "bg-yellow-100 text-yellow-700",
  Low: "bg-green-100 text-green-700",
};

const STATUS_COLOR: Record<string, string> = {
  New: "bg-gray-100 text-gray-700",
  "In Review": "bg-gray-100 text-gray-700",
  Accepted: "bg-gray-100 text-gray-700",
  Rejected: "bg-gray-100 text-gray-700",
  Completed: "bg-gray-100 text-gray-700",
};

// ── Page ─────────────────────────────────────────────────────────────────────

export default function RecommendationsPage() {
  const { error, get, patch } = useFetch();
  const { profile, user, session, loading: authLoading } = useAuth();

  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const riskLevelFilter = "All";

  const companyId =
    profile?.company_id ||
    user?.user_metadata?.company_id ||
    session?.user?.user_metadata?.company_id;

  // ── Fetch ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    async function fetchRecommendations() {
      if (!companyId) return;

      try {
        const params = new URLSearchParams({ company_id: companyId });
        const data = await get<RecommendationsResponse>(
          `/insights/recommendations?${params.toString()}`
        );
        if (cancelled) return;
        setRecommendations(data.recommendations ?? []);
        setSelectedId((prev) => prev ?? data.recommendations?.[0]?.id ?? null);
      } catch {
        // Error handled by useFetch
      }
    }

    fetchRecommendations();
    return () => { cancelled = true; };
  }, [companyId, authLoading, get]);

  // ── Status Update ──────────────────────────────────────────────────────────

  const handleStatusUpdate = async (recId: string, newStatus: string) => {
    try {
      await patch(`/insights/recommendations/${recId}`, { status: newStatus });
      setRecommendations((prev) =>
        prev.map((r) => (r.id === recId ? { ...r, status: newStatus } : r))
      );
    } catch {
      // Error handled by useFetch
    }
  };

  // ── Derived Data ───────────────────────────────────────────────────────────

  const filtered = recommendations.filter((rec) => {
    return riskLevelFilter === "All" || rec.risk_level === riskLevelFilter;
  });

  const selectedRec = filtered.find((r) => r.id === selectedId) ?? filtered[0];

  const priorityStats = {
    critical: recommendations.filter((r) => r.risk_level === "Critical").length,
    high: recommendations.filter((r) => r.risk_level === "High").length,
    medium: recommendations.filter((r) => r.risk_level === "Medium").length,
    low: recommendations.filter((r) => r.risk_level === "Low").length,
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-medium text-black">AI Insights</h2>
          <p className="text-gray-600 text-sm">Review recommended actions to improve your platform.</p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
          <div className="space-y-6 overflow-hidden">
            {/* Priority Stats - 4 Columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="rounded-3xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm font-semibold text-gray-600">Critical</p>
                <p className="mt-4 text-3xl font-bold text-purple-600">{priorityStats.critical}</p>
              </div>
              <div className="rounded-3xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm font-semibold text-gray-600">High</p>
                <p className="mt-4 text-3xl font-bold text-orange-600">{priorityStats.high}</p>
              </div>
              <div className="rounded-3xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm font-semibold text-gray-600">Medium</p>
                <p className="mt-4 text-3xl font-bold text-yellow-600">{priorityStats.medium}</p>
              </div>
              <div className="rounded-3xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm font-semibold text-gray-600">Low</p>
                <p className="mt-4 text-3xl font-bold text-green-600">{priorityStats.low}</p>
              </div>
            </div>

            {/* Recommendation List */}
            <div className="rounded-3xl border border-gray-200 bg-gray-50 p-4 overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">AI Insights List</h3>
                <span className="text-xs text-gray-500">{filtered.length} items</span>
              </div>

              <div className="space-y-3">
                {filtered.map((rec) => (
                  <button
                    key={rec.id}
                    onClick={() => setSelectedId(rec.id)}
                    className={`w-full text-left rounded-2xl border p-4 transition-colors overflow-hidden ${rec.id === selectedId
                        ? "border-black bg-white shadow-sm"
                        : "border-transparent bg-white/80 hover:border-gray-200 hover:bg-gray-50"
                      }`}
                  >
                    <div className="flex flex-col gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 truncate max-w-full">
                          {rec.recommendation}
                        </p>
                        <p className="text-xs text-gray-500 mt-1 truncate">
                          {rec.question}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 justify-start">
                        <span className={`text-[11px] font-semibold px-2 py-1 rounded shrink-0 ${RISK_COLOR[rec.risk_level]}`}>
                          {rec.risk_level}
                        </span>
                        <span className={`text-[11px] font-semibold px-2 py-1 rounded shrink-0 ${STATUS_COLOR[rec.status] || "bg-gray-100 text-gray-700"}`}>
                          {rec.status}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="min-w-0">
            {selectedRec && (
              <RecommendationDetailCard
                recommendation={selectedRec.recommendation}
                reasoning={selectedRec.reasoning}
                next_action={selectedRec.next_action}
                sources={selectedRec.sources}
                risk_level={selectedRec.risk_level}
                status={selectedRec.status}
                onStatusUpdate={(newStatus) => handleStatusUpdate(selectedRec.id, newStatus)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}