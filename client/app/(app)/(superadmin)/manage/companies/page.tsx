"use client";

import { useState } from "react";
import AddCompanyModal from "./components/AddCompanyModal";
import CompanyDetail from "./components/CompanyDetail";

interface Company {
  id: string;
  name: string;
  businessLine: string;
  users: number;
  status: "Active" | "Inactive";
  admin: string;
}

export default function CompaniesPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const companies: Company[] = [
    { id: "1", name: "TechCorp Inc", businessLine: "Technology", users: 45, status: "Active", admin: "John Smith" },
    { id: "2", name: "LogistiX Solutions", businessLine: "Logistics", users: 32, status: "Active", admin: "Jane Doe" },
    { id: "3", name: "FinanceHub", businessLine: "Finance", users: 28, status: "Inactive", admin: "Tom Brown" },
    { id: "4", name: "RetailPro", businessLine: "Retail", users: 56, status: "Active", admin: "Sarah Wilson" },
  ];

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.businessLine.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto">

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {/* Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-gray-200">
          <div className="mb-8">
            <h2 className="text-2xl font-medium text-black">Companies</h2>
            <p className="text-gray-600 text-sm">Manage all companies in the system</p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 text-black bg-neutral-50 border border-gray-200 rounded-md px-3 py-2 flex-1 md:flex-none md:w-64 focus-within:border-black cursor-text">
              <i className="fa-solid fa-magnifying-glass text-gray-400"></i>
              <input
                type="text"
                placeholder="Search companies..."
                className="bg-transparent border-none outline-none text-sm w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-black text-white rounded-md hover:bg-neutral-800 text-sm font-medium flex items-center gap-2 transition-colors flex-1 md:flex-none justify-center cursor-pointer focus:outline-none"
            >
              <i className="fa-solid fa-plus"></i>Add Company
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Company Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Business Line</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Users</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Admin</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Status</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCompanies.map((company) => (
                <tr key={company.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer">
                  <td className="px-6 py-3 font-medium text-gray-900">{company.name}</td>
                  <td className="px-6 py-3 text-sm text-gray-600">{company.businessLine}</td>
                  <td className="px-6 py-3 text-sm text-gray-600">{company.users}</td>
                  <td className="px-6 py-3 text-sm text-gray-600">{company.admin}</td>
                  <td className="px-6 py-3">
                    <span className={`text-xs font-semibold px-2 py-1 rounded ${
                      company.status === "Active"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-700"
                    }`}>
                      {company.status}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCompany(company);
                      }}
                      className="text-blue-600 hover:text-blue-700 text-sm transition-colors"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AddCompanyModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} />
      {selectedCompany && (
        <CompanyDetail company={selectedCompany} onClose={() => setSelectedCompany(null)} />
      )}
    </div>
  );
}

