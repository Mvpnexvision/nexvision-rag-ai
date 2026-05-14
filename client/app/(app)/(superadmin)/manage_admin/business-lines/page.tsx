"use client";

import { useMemo, useState } from "react";
import AddBusinessLineModal from "./components/AddBusinessLineModal";
import ViewCompaniesModal from "./components/ViewCompaniesModal";
import ConfirmArchiveModal from "./components/ConfirmArchiveModal";

interface BusinessLineCompany {
  id: string;
  name: string;
  status: "Active" | "Inactive";
}

interface BusinessLine {
  id: string;
  name: string;
  status: "Active" | "Inactive";
  companies: BusinessLineCompany[];
}

export default function BusinessLinesPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [selectedBusinessLine, setSelectedBusinessLine] = useState<BusinessLine | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [businessLines, setBusinessLines] = useState<BusinessLine[]>([
    {
      id: "1",
      name: "Sales & Marketing",
      status: "Active",
      companies: [
        { id: "1", name: "TechCorp Inc", status: "Active" },
        { id: "2", name: "RetailPro", status: "Active" },
      ],
    },
    {
      id: "2",
      name: "Operations",
      status: "Active",
      companies: [
        { id: "3", name: "LogistiX Solutions", status: "Active" },
        { id: "4", name: "FinanceHub", status: "Inactive" },
      ],
    },
    {
      id: "3",
      name: "Logistics Network",
      status: "Active",
      companies: [
        { id: "5", name: "LogistiX Solutions", status: "Active" },
      ],
    },
    {
      id: "4",
      name: "Warehouse",
      status: "Inactive",
      companies: [
        { id: "6", name: "TechCorp Inc", status: "Inactive" },
      ],
    },
  ]);

  const filteredLines = useMemo(
    () => businessLines.filter((line) =>
      line.name.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [businessLines, searchTerm]
  );

  const handleBusinessLineClick = (line: BusinessLine) => {
    setSelectedBusinessLine(line);
    setShowViewModal(true);
  };

  const archiveBusinessLine = () => {
    if (!selectedBusinessLine) return;

    setBusinessLines((previous) =>
      previous.map((item) =>
        item.id === selectedBusinessLine.id
          ? { ...item, status: "Inactive" }
          : item
      )
    );
    setSelectedBusinessLine((previous) =>
      previous ? { ...previous, status: "Inactive" } : previous
    );
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 pb-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-medium text-black">Business Lines</h2>
            <p className="text-gray-600 text-sm">Manage business lines across companies</p>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2 bg-neutral-50 border border-gray-200 rounded-md px-3 py-2 w-full sm:w-72">
              <i className="fa-solid fa-magnifying-glass text-gray-400"></i>
              <input
                type="text"
                placeholder="Search business lines..."
                className="bg-transparent border-none outline-none text-sm w-full"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-black text-white rounded-md hover:bg-neutral-800 text-sm font-medium flex items-center gap-2 transition-colors cursor-pointer focus:outline-none"
            >
              <i className="fa-solid fa-plus"></i>Add Business Line
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Business Line</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Companies</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Status</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLines.map((line) => (
                <tr key={line.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3 font-medium text-gray-900">{line.name}</td>
                  <td className="px-6 py-3 text-sm text-gray-600">{line.companies.length}</td>
                  <td className="px-6 py-3">
                    <span className={`text-xs font-semibold px-2 py-1 rounded ${
                      line.status === "Active"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-700"
                    }`}>
                      {line.status}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right">
                    <button
                      onClick={() => handleBusinessLineClick(line)}
                      className="text-blue-600 hover:text-blue-700 text-sm transition-colors"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
              {filteredLines.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-6 text-center text-sm text-gray-500">
                    No business lines match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AddBusinessLineModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} />
      {selectedBusinessLine && (
        <ViewCompaniesModal
          isOpen={showViewModal}
          onClose={() => setShowViewModal(false)}
          businessLineName={selectedBusinessLine.name}
          companies={selectedBusinessLine.companies}
          status={selectedBusinessLine.status}
          onArchive={() => setShowArchiveConfirm(true)}
        />
      )}
      <ConfirmArchiveModal
        isOpen={showArchiveConfirm && !!selectedBusinessLine}
        lineName={selectedBusinessLine?.name ?? "this business line"}
        onClose={() => setShowArchiveConfirm(false)}
        onConfirm={archiveBusinessLine}
      />
    </div>
  );
}
