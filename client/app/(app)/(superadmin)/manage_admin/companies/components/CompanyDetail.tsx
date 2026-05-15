"use client";

import { useState } from "react";
import CompanyEditModal from "./CompanyEditModal";

interface Company {
  id: string;
  name: string;
  businessLine: string;
  users: number;
  status: "Active" | "Inactive";
  admin: string;
}

interface CompanyDetailProps {
  company: Company;
  onClose: () => void;
  onUpdateCompany: (company: Company) => void;
}

const mockUsers = [
  { id: "1", name: "John Smith", email: "john@company.com" },
  { id: "2", name: "Jane Doe", email: "jane@company.com" },
  { id: "3", name: "Mike Johnson", email: "mike@company.com" },
];

const mockDocuments = [
  { id: "1", name: "System_Configuration.pdf", date: "Today" },
  { id: "2", name: "Security_Audit.pdf", date: "Yesterday" },
];

const mockActivity = [
  {
    id: "1",
    question: "What are the security vulnerabilities?",
    date: "Today",
  },
  { id: "2", question: "Optimize database performance", date: "Yesterday" },
];

export default function CompanyDetail({
  company,
  onClose,
  onUpdateCompany,
}: CompanyDetailProps) {
  const [companyState, setCompanyState] = useState(company);
  const [showEditModal, setShowEditModal] = useState(false);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4 overflow-y-auto py-4">
      <div className="bg-white rounded-xl w-full max-w-4xl shadow-lg animate-in fade-in zoom-in-95 duration-200 my-auto">
        <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-black">
              {companyState.name}
            </h2>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-600">
              <span>{companyState.businessLine}</span>
              <span>{companyState.admin}</span>
              {/* Status hidden - requires admin user assignment */}
              {/* <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                  companyState.status === "Active"
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {companyState.status}
              </span> */}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowEditModal(true)}
              className="px-4 py-2 bg-black text-white rounded-xl text-sm font-medium hover:bg-neutral-800 transition-colors"
            >
              Edit
            </button>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center text-gray-500 hover:bg-neutral-100 rounded-md cursor-pointer transition-colors"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="rounded-3xl border border-gray-200 bg-gray-50 p-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Company overview
            </h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
                  Company Name
                </p>
                <p className="mt-2 text-sm text-gray-900">
                  {companyState.name}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
                  Business Line
                </p>
                <p className="mt-2 text-sm text-gray-900">
                  {companyState.businessLine}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
                  Admin Assignment
                </p>
                <p className="mt-2 text-sm text-gray-900">
                  {companyState.admin}
                </p>
              </div>
              {/* Status field hidden - requires admin user assignment */}
              {/* <div>
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
                  Status
                </p>
                <p className="mt-2 text-sm text-gray-900">
                  {companyState.status}
                </p>
              </div> */}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-semibold text-gray-900">Users</h4>
                <button className="text-sm font-medium text-blue-600 hover:text-blue-700">
                  Add User
                </button>
              </div>
              <div className="divide-y divide-gray-200">
                {mockUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {user.name}
                      </p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                    <button className="text-gray-400 hover:text-gray-600">
                      <i className="fa-solid fa-ellipsis-v"></i>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-gray-50 p-4 space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-900">
                  Recent AI Activity
                </h4>
                <div className="mt-3 divide-y divide-gray-200">
                  {mockActivity.map((item) => (
                    <div key={item.id} className="py-3">
                      <p className="text-sm text-gray-900">{item.question}</p>
                      <p className="text-xs text-gray-500 mt-1">{item.date}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-gray-200 flex justify-end bg-neutral-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-black transition-colors focus:outline-none"
          >
            Close
          </button>
        </div>
      </div>

      <CompanyEditModal
        isOpen={showEditModal}
        company={companyState}
        onClose={() => setShowEditModal(false)}
        onSave={(updatedCompany) => {
          setCompanyState(updatedCompany);
          onUpdateCompany(updatedCompany);
          setShowEditModal(false);
        }}
      />
    </div>
  );
}
