"use client";

import { useMemo, useState } from "react";
import RecommendationDetailCard from "./components/RecommendationDetailCard";
import RecommendationFilterModal from "./components/RecommendationFilterModal";

interface Recommendation {
  id: number;
  title: string;
  company: string;
  date: string;
  riskLevel: "Low" | "Medium" | "High" | "Critical";
  status: "In Review" | "Accepted" | "Rejected" | "Completed";
  impact: string;
}

export default function RecommendationsPage() {
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [companyFilter, setCompanyFilter] = useState("All");
  const [riskLevelFilter, setRiskLevelFilter] = useState("All");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedRecommendation, setSelectedRecommendation] = useState<number>(1);

  const recommendations: Recommendation[] = [
    { id: 1, title: "Review access controls", status: "In Review", date: "2026-05-14", company: "TechCorp Inc", riskLevel: "Critical", impact: "Unauthorized access may expose sensitive customer data." },
    { id: 2, title: "Update API documentation", status: "Accepted", date: "2026-05-13", company: "LogistiX Solutions", riskLevel: "High", impact: "Incomplete docs can slow developer onboarding and increase support costs." },
    { id: 3, title: "Optimize queries", status: "Completed", date: "2026-05-12", company: "FinanceHub", riskLevel: "Medium", impact: "Slow queries can reduce platform responsiveness during peak hours." },
    { id: 4, title: "Implement rate limiting", status: "Rejected", date: "2026-05-14", company: "RetailPro", riskLevel: "Critical", impact: "Flooding can lead to downtime and lost revenue." },
    { id: 5, title: "Update security headers", status: "In Review", date: "2026-05-11", company: "TechCorp Inc", riskLevel: "High", impact: "Missing headers can make the platform vulnerable to browser-based attacks." },
  ];

  const [savedRecommendations, setSavedRecommendations] = useState<Recommendation[]>([
    { id: 101, title: "Standardize encryption keys", status: "Accepted", date: "2026-04-25", company: "FinanceHub", riskLevel: "High", impact: "Weak key management increases breach risk." },
    { id: 102, title: "Consolidate vendor contracts", status: "In Review", date: "2026-04-18", company: "LogistiX Solutions", riskLevel: "Medium", impact: "Fragmented contracts cause payment errors." },
  ]);

  const filteredRecommendations = useMemo(() =>
    recommendations.filter((rec) => {
      const matchesCompany = companyFilter === "All" || rec.company === companyFilter;
      const matchesRisk = riskLevelFilter === "All" || rec.riskLevel === riskLevelFilter;
      const recDate = new Date(rec.date).toISOString().split("T")[0];
      const matchesStart = !startDate || recDate >= startDate;
      const matchesEnd = !endDate || recDate <= endDate;
      return matchesCompany && matchesRisk && matchesStart && matchesEnd;
    }),
  [recommendations, companyFilter, riskLevelFilter, startDate, endDate]);

  const filteredSavedRecommendations = savedRecommendations;

  const selectedRec = recommendations.find((rec) => rec.id === selectedRecommendation) ?? recommendations[0];

  const onSaveRecommendation = () => {
    if (!savedRecommendations.some((item) => item.id === selectedRec.id)) {
      setSavedRecommendations((prev) => [
        ...prev,
        { ...selectedRec, id: selectedRec.id + 1000 },
      ]);
    }
  };

  const priorityStats = {
    critical: recommendations.filter((rec) => rec.riskLevel === "Critical").length,
    high: recommendations.filter((rec) => rec.riskLevel === "High").length,
    medium: recommendations.filter((rec) => rec.riskLevel === "Medium").length,
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-medium text-black">Recommendations</h2>
            <p className="text-gray-600 text-sm">Review recommended actions and save the most important ones.</p>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setShowFilterModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-transparent border border-gray-200 rounded-md text-sm font-medium text-black hover:bg-neutral-50 hover:border-black transition-colors justify-center cursor-pointer focus:outline-none"
            >
              <i className="fa-solid fa-filter"></i> Filter
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px_360px] gap-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="rounded-3xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm font-semibold text-gray-600">Critical</p>
                <p className="mt-4 text-3xl font-bold text-red-600">{priorityStats.critical}</p>
              </div>
              <div className="rounded-3xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm font-semibold text-gray-600">High</p>
                <p className="mt-4 text-3xl font-bold text-orange-600">{priorityStats.high}</p>
              </div>
              <div className="rounded-3xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm font-semibold text-gray-600">Medium</p>
                <p className="mt-4 text-3xl font-bold text-yellow-600">{priorityStats.medium}</p>
              </div>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Recommendation List</h3>
                <span className="text-xs text-gray-500">{filteredRecommendations.length} items</span>
              </div>
              <div className="space-y-3">
                {filteredRecommendations.map((rec) => (
                  <button
                    key={rec.id}
                    onClick={() => setSelectedRecommendation(rec.id)}
                    className={`w-full text-left rounded-2xl border p-4 transition-colors ${
                      rec.id === selectedRecommendation ? "border-black bg-white" : "border-transparent bg-white/80 hover:border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-gray-900">{rec.title}</p>
                        <p className="text-xs text-gray-500 mt-1">{rec.company}</p>
                      </div>
                      <span className={`text-xs font-semibold px-2 py-1 rounded ${
                        rec.riskLevel === "Critical"
                          ? "bg-red-100 text-red-700"
                          : rec.riskLevel === "High"
                          ? "bg-orange-100 text-orange-700"
                          : rec.riskLevel === "Medium"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-green-100 text-green-700"
                      }`}>{rec.riskLevel}</span>
                    </div>
                    <p className="mt-3 text-xs text-gray-500">{rec.date}</p>
                  </button>
                ))}
                {filteredRecommendations.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-5 text-center text-sm text-gray-500">
                    No recommendations found.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <RecommendationDetailCard
              title={selectedRec.title}
              riskLevel={selectedRec.riskLevel}
              impact={selectedRec.impact}
              status={selectedRec.status}
              onSave={onSaveRecommendation}
            />
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-gray-200 bg-white p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-gray-900">Saved Recommendations</h3>
                <span className="text-xs text-gray-500">{filteredSavedRecommendations.length} saved</span>
              </div>
              <div className="space-y-3">
                {filteredSavedRecommendations.map((rec) => (
                  <div key={rec.id} className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                    <p className="font-semibold text-gray-900">{rec.title}</p>
                    <p className="text-xs text-gray-500 mt-1">{rec.company}</p>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <span className={`text-xs font-semibold px-2 py-1 rounded ${
                        rec.riskLevel === "Critical"
                          ? "bg-red-100 text-red-700"
                          : rec.riskLevel === "High"
                          ? "bg-orange-100 text-orange-700"
                          : rec.riskLevel === "Medium"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-green-100 text-green-700"
                      }`}>{rec.riskLevel}</span>
                      <span className="text-xs text-gray-500">{rec.date}</span>
                    </div>
                  </div>
                ))}
                {filteredSavedRecommendations.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-5 text-center text-sm text-gray-500">
                    No saved recommendations available.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <RecommendationFilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        companyFilter={companyFilter}
        setCompanyFilter={setCompanyFilter}
        riskLevelFilter={riskLevelFilter}
        setRiskLevelFilter={setRiskLevelFilter}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        onClear={() => {
          setCompanyFilter("All");
          setRiskLevelFilter("All");
          setStartDate("");
          setEndDate("");
        }}
      />
    </div>
  );
}
