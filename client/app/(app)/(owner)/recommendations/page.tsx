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
  Critical: "bg-red-100 text-red-700",
  High: "bg-orange-100 text-orange-700",
  Medium: "bg-yellow-100 text-yellow-700",
  Low: "bg-green-100 text-green-700",
};

// ── Page ─────────────────────────────────────────────────────────────────────

export default function RecommendationsPage() {
  const { loading, error, get, patch } = useFetch();
  const { profile, user, session, loading: authLoading } = useAuth();

  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const riskLevelFilter = "All";

  const companyId =
    profile?.company_id ||
    (typeof user?.user_metadata?.company_id === "string"
      ? user.user_metadata.company_id
      : undefined) ||
    (typeof session?.user?.user_metadata?.company_id === "string"
      ? session.user.user_metadata.company_id
      : undefined);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    async function fetchRecommendations() {
      if (!companyId) {
        return;
      }

      try {
        const params = new URLSearchParams({ company_id: companyId });
        const data = await get<RecommendationsResponse>(
          `/insights/recommendations?${params.toString()}`
        );
        if (cancelled) return;
        setRecommendations(data.recommendations ?? []);
        setSelectedId((prev) => prev ?? data.recommendations?.[0]?.id ?? null);
      } catch {
        // error is already set by useFetch
      }
    }

    fetchRecommendations();

    return () => {
      cancelled = true;
    };
  }, [companyId, authLoading, get]);

  // ── Status Update ──────────────────────────────────────────────────────────

  const handleStatusUpdate = async (recId: string, newStatus: string) => {
    try {
      await patch(`/insights/recommendations/${recId}`, { status: newStatus });
      setRecommendations((prev) =>
        prev.map((r) => (r.id === recId ? { ...r, status: newStatus } : r))
      );
    } catch {
      // error is already set by useFetch
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
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="p-8 max-w-7xl mx-auto">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          {/* Header */}
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-medium text-black">
                Recommendations
              </h2>
              <p className="text-gray-600 text-sm">
                Review recommended actions to improve your platform.
              </p>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
            <div className="space-y-6">
              {/* Priority Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-3xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-sm font-semibold text-gray-600">
                    Critical
                  </p>
                  <p className="mt-4 text-3xl font-bold text-red-600">
                    {priorityStats.critical}
                  </p>
                </div>
                <div className="rounded-3xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-sm font-semibold text-gray-600">High</p>
                  <p className="mt-4 text-3xl font-bold text-orange-600">
                    {priorityStats.high}
                  </p>
                </div>
                <div className="rounded-3xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-sm font-semibold text-gray-600">Medium</p>
                  <p className="mt-4 text-3xl font-bold text-yellow-600">
                    {priorityStats.medium}
                  </p>
                </div>
              </div>

              {/* Recommendation List */}
              <div className="rounded-3xl border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Recommendation List
                  </h3>
                  <span className="text-xs text-gray-500">
                    {filtered.length} item{filtered.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {/* Loading skeleton */}
                {loading && recommendations.length === 0 && (
                  <div className="space-y-3">
                    {[...Array(4)].map((_, i) => (
                      <div
                        key={i}
                        className="w-full rounded-2xl border border-transparent bg-white/80 p-4 animate-pulse"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="space-y-2 flex-1">
                            <div className="h-4 bg-gray-200 rounded w-3/4" />
                            <div className="h-3 bg-gray-100 rounded w-1/3" />
                          </div>
                          <div className="h-6 w-16 bg-gray-200 rounded" />
                        </div>
                        <div className="mt-3 h-3 bg-gray-100 rounded w-1/4" />
                      </div>
                    ))}
                  </div>
                )}

                {/* Empty state */}
                {!loading && filtered.length === 0 && (
                  <div className="py-12 text-center text-sm text-gray-400">
                    No recommendations found.
                  </div>
                )}

                {/* List */}
                <div className="space-y-3">
                  {filtered.map((rec) => (
                    <button
                      key={rec.id}
                      onClick={() => setSelectedId(rec.id)}
                      className={`w-full text-left rounded-2xl border p-4 transition-colors ${rec.id === selectedId
                          ? "border-black bg-white shadow-sm"
                          : "border-transparent bg-white/80 hover:border-gray-200 hover:bg-gray-50"
                        }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 truncate">
                            {rec.recommendation}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {rec.question}
                          </p>
                        </div>
                        <span
                          className={`text-xs font-semibold px-2 py-1 rounded shrink-0 ${RISK_COLOR[rec.risk_level] ??
                            "bg-gray-100 text-gray-700"
                            }`}
                        >
                          {rec.risk_level}
                        </span>
                      </div>
                      <p className="mt-3 text-xs text-gray-500">
                        Created:{" "}
                        {new Date(rec.created_at).toLocaleDateString("en-PH", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Detail Sidebar */}
            <div className="space-y-6">
              {selectedRec ? (
                <RecommendationDetailCard
                  recommendation={selectedRec.recommendation}
                  reasoning={selectedRec.reasoning}
                  next_action={selectedRec.next_action}
                  sources={selectedRec.sources}
                  risk_level={selectedRec.risk_level}
                  status={selectedRec.status}
                  onStatusUpdate={(newStatus) =>
                    handleStatusUpdate(selectedRec.id, newStatus)
                  }
                />
              ) : (
                !loading && (
                  <div className="rounded-3xl border border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-400">
                    Select a recommendation to view details.
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>

    </>
  );
}