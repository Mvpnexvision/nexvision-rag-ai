"use client";

interface RecommendationFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyFilter: string;
  setCompanyFilter: (value: string) => void;
  riskLevelFilter: string;
  setRiskLevelFilter: (value: string) => void;
  startDate: string;
  setStartDate: (value: string) => void;
  endDate: string;
  setEndDate: (value: string) => void;
  onClear: () => void;
}

export default function RecommendationFilterModal({
  isOpen,
  onClose,
  companyFilter,
  setCompanyFilter,
  riskLevelFilter,
  setRiskLevelFilter,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  onClear,
}: RecommendationFilterModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl w-full max-w-md shadow-lg animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-5 border-b border-gray-200">
          <h2 className="text-lg font-medium text-black">Filter Recommendations</h2>
          <button
            aria-label="Close filters"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-neutral-100 rounded-md cursor-pointer transition-colors focus:outline-none"
          >
            <i className="fa-solid fa-xmark" aria-hidden="true"></i>
          </button>
        </div>

        <div className="p-6 flex flex-col gap-5">
          <div>
            <label htmlFor="company-filter" className="block text-sm font-medium mb-2 text-black">Company</label>
            <select
              id="company-filter"
              value={companyFilter}
              onChange={(event) => setCompanyFilter(event.target.value)}
              className="w-full p-2.5 text-black border border-gray-200 rounded-md text-sm focus:outline-none focus:border-black bg-white cursor-pointer"
            >
              <option value="All">All Companies</option>
              <option value="TechCorp Inc">TechCorp Inc</option>
              <option value="LogistiX Solutions">LogistiX Solutions</option>
              <option value="FinanceHub">FinanceHub</option>
              <option value="RetailPro">RetailPro</option>
            </select>
          </div>

          <div>
            <label htmlFor="risk-filter" className="block text-sm font-medium mb-2 text-black">Risk Level</label>
            <select
              id="risk-filter"
              value={riskLevelFilter}
              onChange={(event) => setRiskLevelFilter(event.target.value)}
              className="w-full p-2.5 text-black border border-gray-200 rounded-md text-sm focus:outline-none focus:border-black bg-white cursor-pointer"
            >
              <option value="All">All Risk Levels</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-black">Date Range</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="start-date" className="block text-xs text-gray-500 mb-1">From</label>
                <input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  className="w-full p-2.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-black bg-white cursor-pointer"
                />
              </div>
              <div>
                <label htmlFor="end-date" className="block text-xs text-gray-500 mb-1">To</label>
                <input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                  className="w-full p-2.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-black bg-white cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-gray-200 flex justify-end gap-3 bg-neutral-50 rounded-b-xl">
          <button
            onClick={onClear}
            className="px-4 py-2 text-sm text-gray-500 hover:text-black transition-colors cursor-pointer focus:outline-none"
          >
            Clear All
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-black text-white rounded-md text-sm font-medium hover:bg-neutral-800 transition-colors cursor-pointer focus:outline-none"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}
