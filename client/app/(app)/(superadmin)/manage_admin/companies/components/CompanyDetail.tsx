"use client";

import { useState, useEffect } from "react";
import CompanyEditModal from "./CompanyEditModal";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8000";

interface Company {
  id: string;
  name: string;
  businessLine: string;
  users: number;
  status: "Active" | "Inactive";
  admin: string;
}

interface CompanyUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

interface AIActivity {
  id: string;
  question: string;
  created_at: string | null;
}

interface CompanyDetailProps {
  company: Company;
  onClose: () => void;
  onUpdateCompany: (company: Company) => void;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "Unknown";
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return date.toLocaleDateString();
}

export default function CompanyDetail({
  company,
  onClose,
  onUpdateCompany,
}: CompanyDetailProps) {
  const [companyState, setCompanyState] = useState(company);
  const [showEditModal, setShowEditModal] = useState(false);

  const [users, setUsers] = useState<CompanyUser[]>([]);
  const [activity, setActivity] = useState<AIActivity[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingActivity, setLoadingActivity] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoadingUsers(true);
        const res = await fetch(
          `${API_BASE_URL}/companies/${company.id}/users`,
        );
        if (!res.ok) throw new Error("Failed to fetch users");
        const data = await res.json();
        setUsers(data.users ?? []);
      } catch (err) {
        console.error("Failed to load company users:", err);
      } finally {
        setLoadingUsers(false);
      }
    };

    const fetchActivity = async () => {
      try {
        setLoadingActivity(true);
        const res = await fetch(
          `${API_BASE_URL}/companies/${company.id}/ai-activity?limit=5`,
        );
        if (!res.ok) throw new Error("Failed to fetch AI activity");
        const data = await res.json();
        setActivity(data.activity ?? []);
      } catch (err) {
        console.error("Failed to load AI activity:", err);
      } finally {
        setLoadingActivity(false);
      }
    };

    fetchUsers();
    fetchActivity();
  }, [company.id]);

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
          {/* Company Overview */}
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
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Users */}
            <div className="rounded-3xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-semibold text-gray-900">Users</h4>
                <button className="text-sm font-medium text-blue-600 hover:text-blue-700">
                  Add User
                </button>
              </div>

              {loadingUsers ? (
                <p className="text-xs text-gray-400 py-4 text-center">
                  Loading users...
                </p>
              ) : users.length === 0 ? (
                <p className="text-xs text-gray-400 py-4 text-center">
                  No users found
                </p>
              ) : (
                <div className="divide-y divide-gray-200">
                  {users.map((user) => (
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
              )}
            </div>

            {/* Recent AI Activity */}
            <div className="rounded-3xl border border-gray-200 bg-gray-50 p-4 space-y-4">
              <h4 className="text-sm font-semibold text-gray-900">
                Recent AI Activity
              </h4>

              {loadingActivity ? (
                <p className="text-xs text-gray-400 py-4 text-center">
                  Loading activity...
                </p>
              ) : activity.length === 0 ? (
                <p className="text-xs text-gray-400 py-4 text-center">
                  No AI activity yet
                </p>
              ) : (
                <div className="mt-3 divide-y divide-gray-200">
                  {activity.map((item) => (
                    <div key={item.id} className="py-3">
                      <p className="text-sm text-gray-900">{item.question}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(item.created_at)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
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
