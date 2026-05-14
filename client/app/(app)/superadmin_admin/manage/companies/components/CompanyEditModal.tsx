"use client";

import { useState } from "react";

interface Company {
  id: string;
  name: string;
  businessLine: string;
  status: "Active" | "Inactive";
  admin: string;
}

interface CompanyEditModalProps {
  isOpen: boolean;
  company: Company;
  onClose: () => void;
  onSave: (updatedCompany: Company) => void;
}

export default function CompanyEditModal({ isOpen, company, onClose, onSave }: CompanyEditModalProps) {
  const [name, setName] = useState(company.name);
  const [businessLine, setBusinessLine] = useState(company.businessLine);
  const [admin, setAdmin] = useState(company.admin);
  const [status, setStatus] = useState<"Active" | "Inactive">(company.status);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl w-full max-w-md shadow-lg animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-5 border-b border-gray-200">
          <h2 className="text-lg font-medium text-black">Edit Company</h2>
          <button
            aria-label="Close modal"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-neutral-100 rounded-md cursor-pointer transition-colors focus:outline-none"
          >
            <i className="fa-solid fa-xmark" aria-hidden="true"></i>
          </button>
        </div>

        <div className="p-6 flex flex-col gap-4">
          <div>
            <label htmlFor="company-name" className="block text-sm font-medium mb-2 text-black">Company Name</label>
            <input
              id="company-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full p-2.5 text-black border border-gray-200 rounded-md text-sm focus:outline-none focus:border-black bg-white"
            />
          </div>
          <div>
            <label htmlFor="business-line" className="block text-sm font-medium mb-2 text-black">Business Line</label>
            <select
              id="business-line"
              value={businessLine}
              onChange={(event) => setBusinessLine(event.target.value)}
              className="w-full p-2.5 text-black border border-gray-200 rounded-md text-sm focus:outline-none focus:border-black bg-white cursor-pointer"
            >
              <option>Technology</option>
              <option>Logistics</option>
              <option>Finance</option>
              <option>Retail</option>
              <option>Operations</option>
            </select>
          </div>
          <div>
            <label htmlFor="company-admin" className="block text-sm font-medium mb-2 text-black">Admin Assignment</label>
            <select
              id="company-admin"
              value={admin}
              onChange={(event) => setAdmin(event.target.value)}
              className="w-full p-2.5 text-black border border-gray-200 rounded-md text-sm focus:outline-none focus:border-black bg-white cursor-pointer"
            >
              <option>John Smith</option>
              <option>Jane Doe</option>
              <option>Mike Johnson</option>
              <option>Sarah Wilson</option>
            </select>
          </div>
          <div>
            <label htmlFor="company-status" className="block text-sm font-medium mb-2 text-black">Status</label>
            <select
              id="company-status"
              value={status}
              onChange={(event) => setStatus(event.target.value as "Active" | "Inactive")}
              className="w-full p-2.5 text-black border border-gray-200 rounded-md text-sm focus:outline-none focus:border-black bg-white cursor-pointer"
            >
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </div>
        </div>

        <div className="p-5 border-t border-gray-200 flex justify-end gap-3 bg-neutral-50 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-black transition-colors cursor-pointer focus:outline-none"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave({ ...company, name, businessLine, admin, status })}
            className="px-4 py-2 bg-black text-white rounded-md text-sm font-medium hover:bg-neutral-800 transition-colors cursor-pointer focus:outline-none"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
