"use client";

interface AddBusinessLineModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddBusinessLineModal({ isOpen, onClose }: AddBusinessLineModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl w-full max-w-md shadow-lg animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-lg font-medium text-black">Create New Business Line</h2>
          <button
            aria-label="Close modal"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-neutral-100 rounded-md cursor-pointer transition-colors focus:outline-none flex-shrink-0"
          >
            <i className="fa-solid fa-xmark" aria-hidden="true"></i>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-4">
          <div>
            <label htmlFor="business-line-name" className="block text-sm font-medium mb-2 text-black">Business Line Name</label>
            <input
              type="text"
              id="business-line-name"
              placeholder="Enter business line name"
              className="w-full p-2.5 text-black border border-gray-200 rounded-md text-sm focus:outline-none focus:border-black bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-3 text-black">Companies</label>
            <div className="space-y-2 border border-gray-200 rounded-md p-3 bg-gray-50 max-h-48 overflow-y-auto">
              {[
                { id: 1, name: "TechCorp Inc" },
                { id: 2, name: "LogistiX Solutions" },
                { id: 3, name: "FinanceHub" },
                { id: 4, name: "RetailPro" },
              ].map((company) => (
                <label key={company.id} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-white rounded transition-colors">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border border-gray-300 cursor-pointer"
                  />
                  <span className="text-sm text-gray-900">{company.name}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-200 flex justify-end gap-3 bg-neutral-50 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-black transition-colors cursor-pointer focus:outline-none"
          >
            Cancel
          </button>
          <button className="px-4 py-2 bg-black text-white rounded-md text-sm font-medium hover:bg-neutral-800 transition-colors cursor-pointer focus:outline-none">
            Create Business Line
          </button>
        </div>
      </div>
    </div>
  );
}
