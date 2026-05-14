"use client";

interface AIInsightDetailCardProps {
  title: string;
  riskLevel: string;
  reason: string;
  evidence: string;
  recommendation: string;
  impact: string;
  deadline: string;
  status: string;
}

const statusStyles: Record<string, string> = {
  "In Review": "bg-blue-100 text-blue-700",
  Accepted: "bg-green-100 text-green-700",
  Rejected: "bg-red-100 text-red-700",
  Completed: "bg-gray-100 text-gray-700",
};

export default function AIInsightDetailCard({
  title,
  riskLevel,
  reason,
  evidence,
  recommendation,
  impact,
  deadline,
  status,
}: AIInsightDetailCardProps) {
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
            <div className="mt-3 flex flex-wrap gap-2 items-center">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded ${riskColor}`}>{riskLevel}</span>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded ${statusStyles[status] || "bg-gray-100 text-gray-700"}`}>{status}</span>
            </div>
          </div>
          <div className="text-right text-sm text-gray-500">
            <p className="font-medium text-gray-900">Suggested deadline</p>
            <p className="mt-1">{deadline}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div>
            <h4 className="text-sm font-semibold text-gray-900">Reason</h4>
            <p className="mt-2 text-sm text-gray-600">{reason}</p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900">Evidence</h4>
            <p className="mt-2 text-sm text-gray-600">{evidence}</p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900">Recommendation</h4>
            <p className="mt-2 text-sm text-gray-600">{recommendation}</p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900">Business Impact</h4>
            <p className="mt-2 text-sm text-gray-600">{impact}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
