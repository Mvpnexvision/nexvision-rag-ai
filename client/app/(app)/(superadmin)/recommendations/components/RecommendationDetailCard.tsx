"use client";

interface RecommendationDetailCardProps {
  title: string;
  riskLevel: string;
  impact: string;
  status: string;
  onSave: () => void;
}

const statusStyles: Record<string, string> = {
  "In Review": "bg-blue-100 text-blue-700",
  Accepted: "bg-green-100 text-green-700",
  Rejected: "bg-red-100 text-red-700",
  Completed: "bg-gray-100 text-gray-700",
};

export default function RecommendationDetailCard({
  title,
  riskLevel,
  impact,
  status,
  onSave,
}: RecommendationDetailCardProps) {
  const riskColor =
    riskLevel === "Critical"
      ? "bg-red-100 text-red-700"
      : riskLevel === "High"
      ? "bg-orange-100 text-orange-700"
      : riskLevel === "Medium"
      ? "bg-yellow-100 text-yellow-700"
      : "bg-green-100 text-green-700";

  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h3 className="text-2xl font-semibold text-black">{title}</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded ${riskColor}`}>{riskLevel}</span>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded ${statusStyles[status] || "bg-gray-100 text-gray-700"}`}>{status}</span>
            </div>
          </div>
          <button
            onClick={onSave}
            className="inline-flex items-center justify-center px-4 py-2 bg-black text-white rounded-md text-sm font-medium hover:bg-neutral-800 transition-colors"
          >
            Save Recommendation
          </button>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-gray-900">Business Impact</h4>
          <p className="mt-2 text-sm text-gray-600">{impact}</p>
        </div>
      </div>
    </div>
  );
}
