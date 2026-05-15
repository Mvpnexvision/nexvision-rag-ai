"use client";

import { useMemo, useState, useEffect } from "react";
import {
  getBusinessLines,
  type BusinessLineRecord,
} from "@/lib/api/business_lines";

interface BusinessLineCompany {
  id: string;
  name: string;
  status: "Active" | "Inactive";
}

interface BusinessLine {
  id: string;
  name: string;
  companies: BusinessLineCompany[];
  count: number;
}

export default function BusinessLinesPage() {
  const [businessLines, setBusinessLines] = useState<BusinessLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBusinessLines = async () => {
      try {
        const data = await getBusinessLines();
        const mappedData: BusinessLine[] = data.map((item, index) => ({
          id: index.toString(),
          name: item.name,
          companies: [], // Not provided by API
          count: item.company_count,
        }));
        setBusinessLines(mappedData);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch business lines",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchBusinessLines();
  }, []);

  const filteredLines = useMemo(
    () =>
      businessLines.filter((line) =>
        line.name.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [businessLines, searchTerm],
  );

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 pb-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-medium text-black">Business Lines</h2>
            <p className="text-gray-600 text-sm">
              Manage business lines across companies
            </p>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2 text-black bg-neutral-50 border border-gray-200 rounded-md px-3 py-2 flex-1 md:flex-none md:w-64 focus-within:border-black cursor-text">
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
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto"></div>
        </div>

        {loading && (
          <div className="text-center py-8">
            <p className="text-gray-600">Loading business lines...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-8">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">
                    Business Line
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 text-center">
                    Company Count
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredLines.map((line) => (
                  <tr
                    key={line.id}
                    className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-3 font-medium text-gray-900">
                      {line.name}
                    </td>
                    <td className="px-6 py-3 font-medium text-gray-600 align-middle">
                      {line.count}
                    </td>
                  </tr>
                ))}
                {businessLines.length === 0 && (
                  <tr>
                    <td
                      colSpan={2}
                      className="px-6 py-6 text-center text-sm text-gray-500"
                    >
                      No business lines match your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
