"use client";

import { useMemo, useState } from "react";
import AIInsightDetailCard from "./components/AIInsightDetailCard";
import AIInsightFilterModal from "./components/AIInsightFilterModal";

interface AIInsight {
  id: string;
  title: string;
  company: string;
  date: string;
  status: string;
  riskLevel: "Low" | "Medium" | "High" | "Critical";
  reason: string;
  evidence: string;
  recommendation: string;
  impact: string;
  deadline: string;
}

export default function AIInsightsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [companyFilter, setCompanyFilter] = useState("All");
  const [riskLevelFilter, setRiskLevelFilter] = useState("All");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedInsight, setSelectedInsight] = useState<string>("1");

  const insights: AIInsight[] = [
    {
      id: "1",
      title: "Supply Chain Delay Risk",
      company: "LogistiX Solutions",
      date: "May 12, 2026",
      status: "In Review",
      riskLevel: "Critical",
      reason: "Shipment delays are increasing costs and impacting customer commitments.",
      evidence: "Multiple carrier reports and delivery timelines from April and May.",
      recommendation: "Prioritize alternate carriers and re-route critical shipments.",
      impact: "Operational interruption across the network and penalty exposure.",
      deadline: "May 20, 2026",
    },
    {
      id: "2",
      title: "Data Privacy Gap",
      company: "TechCorp Inc",
      date: "May 10, 2026",
      status: "Accepted",
      riskLevel: "High",
      reason: "A privacy control is missing for customer ingestion flows.",
      evidence: "Audit log shows unmasked PII in the ingestion pipeline.",
      recommendation: "Implement masking and access controls on sensitive fields.",
      impact: "Compliance fines and customer trust erosion.",
      deadline: "May 25, 2026",
    },
    {
      id: "3",
      title: "API Timeout Trend",
      company: "FinanceHub",
      date: "May 8, 2026",
      status: "Rejected",
      riskLevel: "Medium",
      reason: "Frequent timeouts can degrade user experience and revenue flows.",
      evidence: "Monitoring shows 12% timeout rate for the payments endpoint.",
      recommendation: "Review query performance and increase timeout thresholds.",
      impact: "Loss of completed transactions and support tickets.",
      deadline: "May 30, 2026",
    },
    {
      id: "4",
      title: "Inventory Forecast Error",
      company: "RetailPro",
      date: "May 5, 2026",
      status: "Completed",
      riskLevel: "Low",
      reason: "Forecast model underestimates demand in a seasonal category.",
      evidence: "Sales data from the last 3 weeks shows consistent under-forecast.",
      recommendation: "Refine model inputs and schedule weekly recalibration.",
      impact: "Stockouts and markdown pressure if ignored.",
      deadline: "June 5, 2026",
    },
  ];

  const filteredInsights = useMemo(() => {
    return insights.filter((insight) => {
      const matchesSearch =
        insight.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        insight.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        insight.date.toLowerCase().includes(searchTerm.toLowerCase()) ||
        insight.status.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === "All" || insight.status === statusFilter;
      const matchesCompany = companyFilter === "All" || insight.company === companyFilter;
      const matchesRisk = riskLevelFilter === "All" || insight.riskLevel === riskLevelFilter;

      const insightDate = new Date(insight.date).toISOString().split("T")[0];
      const matchesStart = !startDate || insightDate >= startDate;
      const matchesEnd = !endDate || insightDate <= endDate;

      return matchesSearch && matchesStatus && matchesCompany && matchesRisk && matchesStart && matchesEnd;
    });
  }, [insights, searchTerm, statusFilter, companyFilter, riskLevelFilter, startDate, endDate]);

  const activeInsight = insights.find((insight) => insight.id === selectedInsight) ?? insights[0];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-medium text-black">AI Insights</h2>
            <p className="text-gray-600 text-sm">Search insights, filter by status, and review issue details.</p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2 text-black bg-neutral-50 border border-gray-200 rounded-md px-3 py-2 w-full sm:w-72 focus-within:border-black">
              <i className="fa-solid fa-magnifying-glass text-gray-400"></i>
              <input
                type="text"
                placeholder="Search insights..."
                className="bg-transparent border-none outline-none text-sm w-full"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
            <button
              type="button"
              onClick={() => setShowFilterModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-transparent border border-gray-200 rounded-md text-sm font-medium text-black hover:bg-neutral-50 hover:border-black transition-colors justify-center cursor-pointer focus:outline-none"
            >
              <i className="fa-solid fa-filter"></i> Filter
            </button>
          </div>
        </div>

        <AIInsightFilterModal
          isOpen={showFilterModal}
          onClose={() => setShowFilterModal(false)}
          companyFilter={companyFilter}
          setCompanyFilter={setCompanyFilter}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          riskLevel={riskLevelFilter}
          setRiskLevel={setRiskLevelFilter}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          onClear={() => {
            setCompanyFilter("All");
            setStatusFilter("All");
            setRiskLevelFilter("All");
            setStartDate("");
            setEndDate("");
          }}
        />

        <div className="grid grid-cols-1 xl:grid-cols-[380px_1fr] gap-6">
          <div className="space-y-3">
            <div className="rounded-3xl border border-gray-200 bg-gray-50 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Insights List</h3>
              <div className="space-y-3">
                {filteredInsights.map((insight) => (
                  <button
                    key={insight.id}
                    onClick={() => setSelectedInsight(insight.id)}
                    className={`w-full text-left border rounded-2xl p-4 transition-colors ${
                      insight.id === selectedInsight ? "border-black bg-white" : "border-transparent bg-white/80 hover:border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-gray-900">{insight.title}</p>
                        <p className="text-xs text-gray-500 mt-1">{insight.company} • {insight.date}</p>
                      </div>
                      <span className={`text-xs font-semibold px-2 py-1 rounded ${
                        insight.riskLevel === "Critical"
                          ? "bg-red-100 text-red-700"
                          : insight.riskLevel === "High"
                          ? "bg-orange-100 text-orange-700"
                          : insight.riskLevel === "Medium"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-green-100 text-green-700"
                      }`}>{insight.riskLevel}</span>
                    </div>
                    <p className="mt-3 text-xs text-gray-500">Status: {insight.status}</p>
                  </button>
                ))}
                {filteredInsights.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-5 text-center text-sm text-gray-500">
                    No insights match your search.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <AIInsightDetailCard
              title={activeInsight.title}
              riskLevel={activeInsight.riskLevel}
              reason={activeInsight.reason}
              evidence={activeInsight.evidence}
              recommendation={activeInsight.recommendation}
              impact={activeInsight.impact}
              deadline={activeInsight.deadline}
              status={activeInsight.status}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
