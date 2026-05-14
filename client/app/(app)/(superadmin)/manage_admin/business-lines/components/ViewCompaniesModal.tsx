"use client";

interface BusinessLineCompany {
  id: string;
  name: string;
  status: "Active" | "Inactive";
}

interface ViewCompaniesModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessLineName: string;
  status: "Active" | "Inactive";
  companies: BusinessLineCompany[];
  onArchive: () => void;
}

export default function ViewCompaniesModal({
  isOpen,
  onClose,
  businessLineName,
  status,
  companies,
  onArchive,
}: ViewCompaniesModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl w-full max-w-md shadow-lg animate-in fade-in zoom-in-95 duration-200">
        <div className="flex flex-col gap-4 p-5 border-b border-gray-200 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-medium text-black">{businessLineName}</h2>
            <p className="mt-2 text-sm text-gray-500">Details and linked companies for this business line.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded ${
              status === "Active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
            }`}>
              {status}
            </span>
            <button
              aria-label="Close modal"
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-neutral-100 rounded-md cursor-pointer transition-colors focus:outline-none"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Companies ({companies.length})</h3>
            <div className="space-y-3">
              {companies.map((company) => (
                <div key={company.id} className="flex items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{company.name}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded ${
                    company.status === "Active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                  }`}>
                    {company.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-gray-50 p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Archive Business Line</h4>
            <p className="text-sm text-gray-600">Archiving will mark this business line as inactive across the system.</p>
            <button
              onClick={onArchive}
              disabled={status === "Inactive"}
              className="mt-4 inline-flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              Archive
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
