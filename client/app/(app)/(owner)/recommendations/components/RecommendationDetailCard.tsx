"use client";

interface RecommendationDetailCardProps {
  recommendation: string;
  reasoning: string;
  next_action: string;
  sources: string[];
  risk_level: string;
  status: string;
  onStatusUpdate: (newStatus: string) => void;
}

const statusStyles: Record<string, string> = {
  "New": "bg-purple-100 text-purple-700",
  "In Review": "bg-blue-100 text-blue-700",
  "Accepted": "bg-green-100 text-green-700",
  "Rejected": "bg-red-100 text-red-700",
  "Completed": "bg-gray-100 text-gray-700",
};

export default function RecommendationDetailCard({
  recommendation,
  reasoning,
  next_action,
  sources,
  risk_level,
  status,
  onStatusUpdate,
}: RecommendationDetailCardProps) {
  // Color Logic: Critical = Violet, Low = Green
  const riskColor =
    risk_level === "Critical"
      ? "bg-purple-100 text-purple-700"
      : risk_level === "High"
        ? "bg-orange-100 text-orange-700"
        : risk_level === "Medium"
          ? "bg-yellow-100 text-yellow-700"
          : "bg-green-100 text-green-700";

  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sticky top-8 max-w-full overflow-hidden">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <div className="flex-1 min-w-0">
            {/* break-words para hindi lumampas ang mahabang text */}
            <h3 className="text-2xl font-semibold text-black leading-tight wrap-break-word">
              {recommendation}
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded ${riskColor}`}>
                {risk_level}
              </span>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded ${statusStyles[status] || "bg-gray-100 text-gray-700"}`}>
                {status}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            {status === "New" && (
              <>
                <button
                  onClick={() => onStatusUpdate("Rejected")}
                  className="px-4 py-2 text-sm font-medium border border-gray-200 text-red-600 rounded-md hover:bg-red-50 transition-colors"
                >
                  Reject
                </button>
                <button
                  onClick={() => onStatusUpdate("In Review")}
                  className="px-4 py-2 text-sm font-medium bg-black text-white rounded-md hover:bg-neutral-800 transition-colors"
                >
                  Accept
                </button>
              </>
            )}

            {status === "In Review" && (
              <button
                onClick={() => onStatusUpdate("Completed")}
                className="w-full px-4 py-2 text-sm font-medium bg-[#0DBBC4] text-white rounded-md hover:bg-[#0aa3ab] transition-colors"
              >
                Mark as Completed
              </button>
            )}
          </div>
        </div>

        <div className="space-y-6 pt-4 border-t border-gray-100">
          <div>
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Reasoning</h4>
            <p className="mt-2 text-sm text-gray-700 leading-relaxed wrap-break-word">{reasoning}</p>
          </div>

          <div>
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Next Action</h4>
            <p className="mt-2 text-sm text-gray-700 font-medium wrap-break-word">{next_action}</p>
          </div>

          <div>
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Sources</h4>
            <div className="flex flex-wrap gap-2">
              {sources.map((source, index) => (
                <div key={index} className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600 max-w-full">
                  <i className="fa-regular fa-file-lines text-gray-400 shrink-0"></i>
                  <span className="truncate">{source}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}