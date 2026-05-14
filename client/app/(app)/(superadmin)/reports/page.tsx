"use client";

import { useMemo, useState } from "react";

interface ReportOption {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export default function ReportsPage() {
  const [reportType, setReportType] = useState("");
  const [reportSearch, setReportSearch] = useState("");

  const reportOptions: ReportOption[] = [
    {
      id: "summaries",
      title: "Generate Summaries",
      description: "Create comprehensive summaries of system activity and performance",
      icon: "fa-file-lines"
    },
    {
      id: "ai-answers",
      title: "Export AI Answers",
      description: "Export all AI-generated responses and insights from the system",
      icon: "fa-brain"
    },
    {
      id: "recommendations",
      title: "Export Recommendation Lists",
      description: "Export all recommendations with priorities and company details",
      icon: "fa-list-check"
    },
    {
      id: "pdf-reports",
      title: "Create PDF Reports",
      description: "Generate and download formatted PDF reports with visualizations",
      icon: "fa-file-pdf"
    },
  ];

  const recentReports = [
    { name: "Monthly System Report.pdf", date: "May 1, 2024", type: "pdf" },
    { name: "Q1 Performance Review.xlsx", date: "Apr 15, 2024", type: "excel" },
    { name: "Recommendations Export.csv", date: "Apr 10, 2024", type: "csv" },
    { name: "AI Insights Summary.pdf", date: "Apr 5, 2024", type: "pdf" },
  ];

  const filteredReports = useMemo(
    () => recentReports.filter((report) =>
      report.name.toLowerCase().includes(reportSearch.toLowerCase()) ||
      report.date.toLowerCase().includes(reportSearch.toLowerCase()) ||
      report.type.toLowerCase().includes(reportSearch.toLowerCase())
    ),
    [recentReports, reportSearch]
  );

  const getFileIcon = (type: string) => {
    switch (type) {
      case "pdf":
        return "fa-file-pdf text-red-600";
      case "excel":
        return "fa-file-excel text-green-600";
      case "csv":
        return "fa-file-csv text-blue-600";
      default:
        return "fa-file text-gray-600";
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-2xl font-medium text-black">Reports</h2>
        <p className="text-gray-600 text-sm mb-4">Generate and manage system reports and exports</p>

        {/* Report Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {reportOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => setReportType(option.id)}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                reportType === option.id
                  ? "border-black bg-black text-white"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  reportType === option.id ? "bg-white/20" : "bg-gray-100"
                }`}>
                  <i className={`fa-solid ${option.icon} ${
                    reportType === option.id ? "text-white" : "text-black"
                  }`}></i>
                </div>
                <div>
                  <h4 className={`font-semibold mb-1 ${reportType === option.id ? "text-white" : "text-black"}`}>
                    {option.title}
                  </h4>
                  <p className={`text-sm ${reportType === option.id ? "text-gray-200" : "text-gray-600"}`}>
                    {option.description}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Generate Controls */}
        <div className="border-t border-gray-200 pt-6 mb-8">
          <h4 className="text-sm font-semibold text-gray-900 mb-4">Configuration</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
              <select className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black bg-white text-gray-900">
                <option>Last 7 days</option>
                <option>Last 30 days</option>
                <option>Last Quarter</option>
                <option>Custom</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Format</label>
              <select className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black bg-white text-gray-900">
                <option>PDF</option>
                <option>CSV</option>
                <option>Excel</option>
              </select>
            </div>
          </div>
          <button className="w-full px-4 py-2 bg-black text-white rounded-lg hover:bg-neutral-800 transition-colors font-medium" disabled={!reportType}>
            <i className="fa-solid fa-download mr-2"></i>Generate Report
          </button>
        </div>

        {/* Recent Reports */}
        <div className="border-t border-gray-200 pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <h4 className="text-sm font-semibold text-gray-900">Recent Reports</h4>
            <div className="flex items-center gap-2 bg-neutral-50 border border-gray-200 rounded-md px-3 py-2 w-full sm:w-80">
              <i className="fa-solid fa-magnifying-glass text-gray-400"></i>
              <input
                type="text"
                placeholder="Search recent reports..."
                className="bg-transparent border-none outline-none text-sm w-full"
                value={reportSearch}
                onChange={(event) => setReportSearch(event.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            {filteredReports.map((report, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3 flex-1">
                  <i className={`fa-solid ${getFileIcon(report.type)}`}></i>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{report.name}</p>
                    <p className="text-xs text-gray-500">{report.date}</p>
                  </div>
                </div>
                <button className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700 transition-colors">
                  <i className="fa-solid fa-download"></i>
                </button>
              </div>
            ))}
            {filteredReports.length === 0 && (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-5 text-center text-sm text-gray-500">
                No reports match your search.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
                