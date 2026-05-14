"use client";

interface AddCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddCompanyModal({ isOpen, onClose }: AddCompanyModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl w-full max-w-md shadow-lg animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-200">
          <h2 className="text-lg font-medium text-black">Create New Company</h2>
          <button
            aria-label="Close modal"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-neutral-100 rounded-md cursor-pointer transition-colors focus:outline-none"
          >
            <i className="fa-solid fa-xmark" aria-hidden="true"></i>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-4">
          <div>
            <label htmlFor="company-name" className="block text-sm font-medium mb-2 text-black">Company Name</label>
            <input
              type="text"
              id="company-name"
              placeholder="Enter company name"
              className="w-full p-2.5 text-black border border-gray-200 rounded-md text-sm focus:outline-none focus:border-black bg-white"
            />
          </div>

          <div>
            <label htmlFor="business-line" className="block text-sm font-medium mb-2 text-black">Business Line</label>
            <select
              id="business-line"
              className="w-full p-2.5 text-black border border-gray-200 rounded-md text-sm focus:outline-none focus:border-black bg-white cursor-pointer"
            >
              <option>Select a business line</option>
              <option>Logistics</option>
              <option>HR/Admin</option>
              <option>Sales & Marketing</option>
              <option>Operations</option>
            </select>
          </div>

          <div>
            <label htmlFor="company-admin" className="block text-sm font-medium mb-2 text-black">Company Admin</label>
            <select
              id="company-admin"
              className="w-full p-2.5 text-black border border-gray-200 rounded-md text-sm focus:outline-none focus:border-black bg-white cursor-pointer"
            >
              <option>Select a user</option>
              <option>John Smith</option>
              <option>Jane Doe</option>
              <option>Mike Johnson</option>
            </select>
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
            Create Company
          </button>
        </div>
      </div>
    </div>
  );
}
