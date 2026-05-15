"use client";

import { useMemo, useState } from "react";

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
  const [searchTerm, setSearchTerm] = useState("");

  const [businessLines, setBusinessLines] = useState<BusinessLine[]>([
    {
      id: "1",
      name: "Logistics",
      status: "Active",
      companies: [
        { id: "1", name: "NexVision Logistics", status: "Active" },
      ],
    },
    {
      id: "2",
      name: "Clinic/Aesthetics",
      status: "Active",
      companies: [
        { id: "2", name: "NexVision Clinic", status: "Active" },
      ],
    },
    {
      id: "3",
      name: "HR/Admin",
      status: "Active",
      companies: [
        { id: "3", name: "NexVision HR", status: "Active" },
      ],
    },
    {
      id: "4",
      name: "Retail",
      status: "Active",
      companies: [
        { id: "4", name: "RetailPro", status: "Inactive" },
      ],
    },
        {
      id: "5",
      name: "Construction",
      status: "Active",
      companies: [
        { id: "5", name: "Construct Pro", status: "Inactive" },
      ],
    },
        {
      id: "6",
      name: "Custom Business",
      status: "Active",
      companies: [
        { id: "6", name: "Custom Business", status: "Inactive" },
      ],
    },
  ]);

  const filteredLines = useMemo(
    () => businessLines.filter((line) =>
      line.name.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [businessLines, searchTerm]
  );

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
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Business Line</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredLines.map((line) => (
                <tr key={line.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3 font-medium text-gray-900">{line.name}</td>
                  <td className="px-6 py-3">
                    <span className={`text-xs font-semibold px-2 py-1 rounded ${
                      line.status === "Active"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-700"
                    }`}>
                      {line.status}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredLines.length === 0 && (
                <tr>
                  <td colSpan={2} className="px-6 py-6 text-center text-sm text-gray-500">
                    No business lines match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
