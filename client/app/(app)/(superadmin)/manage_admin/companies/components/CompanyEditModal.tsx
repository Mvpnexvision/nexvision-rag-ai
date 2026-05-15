"use client";

import { useState } from "react";
import { updateCompany } from "@/lib/api/companies";

interface Company {
  id: string;
  name: string;
  businessLine: string;
  users: number;
  status: "Active" | "Inactive";
  admin: string;
}

interface CompanyEditModalProps {
  isOpen: boolean;
  company: Company;
  onClose: () => void;
  onSave: (updatedCompany: Company) => void;
}

export default function CompanyEditModal({
  isOpen,
  company,
  onClose,
  onSave,
}: CompanyEditModalProps) {
  const [name, setName] = useState(company.name);
  const [businessLine, setBusinessLine] = useState(company.businessLine);
  const [status, setStatus] = useState<"Active" | "Inactive">(company.status);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Company name is required");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const updatedCompany = await updateCompany(company.id, {
        name,
        businessLine,
      });
      onSave(updatedCompany);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update company";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl w-full max-w-md shadow-lg animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-5 border-b border-gray-200">
          <h2 className="text-lg font-medium text-black">Edit Company</h2>
          <button
            aria-label="Close modal"
            onClick={onClose}
            disabled={loading}
            className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-neutral-100 rounded-md cursor-pointer transition-colors focus:outline-none disabled:opacity-50"
          >
            <i className="fa-solid fa-xmark" aria-hidden="true"></i>
          </button>
        </div>

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
              id="company-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
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
              onChange={(event) => setBusinessLine(event.target.value)}
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
          {/* Status field disabled for now - requires admin user assignment */}
          {/* <div>
            <label htmlFor="company-status" className="block text-sm font-medium mb-2 text-black">Status</label>
            <select
              id="company-status"
              value={status}
              onChange={(event) => setStatus(event.target.value as "Active" | "Inactive")}
              disabled={loading}
              className="w-full p-2.5 text-black border border-gray-200 rounded-md text-sm focus:outline-none focus:border-black bg-white cursor-pointer disabled:opacity-50"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div> */}
        </div>

        <div className="p-5 border-t border-gray-200 flex justify-end gap-3 bg-neutral-50 rounded-b-xl">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm text-gray-600 hover:text-black transition-colors cursor-pointer focus:outline-none disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-4 py-2 bg-black text-white rounded-md text-sm font-medium hover:bg-neutral-800 transition-colors cursor-pointer focus:outline-none disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
