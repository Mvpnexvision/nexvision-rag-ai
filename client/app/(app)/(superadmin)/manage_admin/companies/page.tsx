"use client";

import { useState, useEffect } from "react";
import { getCompaniesList } from "@/lib/api/companies";
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
  const [companies, setCompanies] = useState<Company[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch companies on mount
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getCompaniesList();
        setCompanies(data);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load companies";
        setError(message);
        console.error(message);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanies();
  }, []);

  const filteredCompanies = companies.filter(
    (company) =>
      company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.businessLine.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleAddCompany = (newCompany: Company) => {
    setCompanies([...companies, newCompany]);
    setShowAddModal(false);
  };

  const handleUpdateCompany = (updatedCompany: Company) => {
    setCompanies(
      companies.map((c) => (c.id === updatedCompany.id ? updatedCompany : c)),
    );
    setSelectedCompany(null);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {/* Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-gray-200">
          <div className="mb-8">
            <h2 className="text-2xl font-medium text-black">Companies</h2>
            <p className="text-gray-600 text-sm">
              Manage all companies in the system
            </p>
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

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Loading state */}
        {loading ? (
          <div className="text-center py-8 text-gray-500">
            Loading companies...
          </div>
        ) : (
          /* Table */
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">
                    Company Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">
                    Business Line
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">
                    Users
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">
                    Admin
                  </th>
                  {/* Status column hidden - requires admin user assignment */}
                  {/* <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">
                    Status
                  </th> */}
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredCompanies.map((company) => (
                  <tr
                    key={company.id}
                    className="border-b border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-3 font-medium text-gray-900">
                      {company.name}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600">
                      {company.businessLine}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600">
                      {company.users}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600">
                      {company.admin}
                    </td>
                    {/* Status cell hidden */}
                    {/* <td className="px-6 py-3">
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded ${
                          company.status === "Active"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {company.status}
                      </span>
                    </td> */}
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
        )}
      </div>

      <AddCompanyModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAddCompany={handleAddCompany}
      />
      {selectedCompany && (
        <CompanyDetail
          company={selectedCompany}
          onClose={() => setSelectedCompany(null)}
          onUpdateCompany={handleUpdateCompany}
        />
      )}
    </div>
  );
}
