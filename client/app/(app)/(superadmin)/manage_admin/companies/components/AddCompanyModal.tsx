"use client";

import { useState } from "react";
import { createCompany } from "@/lib/api/companies";

interface Company {
  id: string;
  name: string;
  businessLine: string;
  users: number;
  status: "Active" | "Inactive";
  admin: string;
}

interface AddCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCompany: (company: Company) => void;
}

export default function AddCompanyModal({
  isOpen,
  onClose,
  onAddCompany,
}: AddCompanyModalProps) {
  const [name, setName] = useState("");
  const [businessLine, setBusinessLine] = useState("logistics");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreate = async () => {
    if (!name.trim()) {
      setError("Company name is required");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const newCompany = await createCompany(name, businessLine);
      onAddCompany(newCompany);
      setName("");
      setBusinessLine("logistics");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create company";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

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
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="company-name"
              className="block text-sm font-medium mb-2 text-black"
            >
              Company Name
            </label>
            <input
              type="text"
              id="company-name"
              placeholder="Enter company name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              className="w-full p-2.5 text-black border border-gray-200 rounded-md text-sm focus:outline-none focus:border-black bg-white disabled:opacity-50"
            />
          </div>

          <div>
            <label
              htmlFor="business-line"
              className="block text-sm font-medium mb-2 text-black"
            >
              Business Line
            </label>
            <select
              id="business-line"
              value={businessLine}
              onChange={(e) => setBusinessLine(e.target.value)}
              disabled={loading}
              className="w-full p-2.5 text-black border border-gray-200 rounded-md text-sm focus:outline-none focus:border-black bg-white cursor-pointer disabled:opacity-50"
            >
              <option value="hr/admin">HR/Admin</option>
              <option value="logistics">Logistics</option>
              <option value="retail">Retail</option>
              <option value="clinic/aesthetic">Clinic/Aesthetic</option>
              <option value="construction/equipment">
                Construction/Equipment
              </option>
              <option value="custom business">Custom Business</option>
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-200 flex justify-end gap-3 bg-neutral-50 rounded-b-xl">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm text-gray-600 hover:text-black transition-colors cursor-pointer focus:outline-none disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={loading}
            className="px-4 py-2 bg-black text-white rounded-md text-sm font-medium hover:bg-neutral-800 transition-colors cursor-pointer focus:outline-none disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Company"}
          </button>
        </div>
      </div>
    </div>
  );
}
