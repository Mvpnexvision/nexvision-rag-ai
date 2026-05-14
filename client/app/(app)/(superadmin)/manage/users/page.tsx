"use client";

import { useState } from "react";
import AddUserModal, { UserFormData } from "./components/AddUserModal";

interface User {
  id: number;
  fullName: string;
  email: string;
  company: string;
  role: string;
  status: "Active" | "Inactive";
}

export default function UsersPage() {
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserFormData | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const allUsers: User[] = [
    { id: 1, fullName: "John Smith", email: "john@techcorp.com", company: "TechCorp Inc", role: "Admin", status: "Active" },
    { id: 2, fullName: "Jane Doe", email: "jane@techcorp.com", company: "TechCorp Inc", role: "Manager", status: "Active" },
    { id: 3, fullName: "Mike Johnson", email: "mike@logistix.com", company: "LogistiX Solutions", role: "Manager", status: "Active" },
    { id: 4, fullName: "Sarah Wilson", email: "sarah@logistix.com", company: "LogistiX Solutions", role: "Staff", status: "Inactive" },
    { id: 5, fullName: "Tom Brown", email: "tom@finance.com", company: "FinanceHub", role: "Admin", status: "Active" },
  ];

  const filteredUsers = allUsers.filter((user) =>
    user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-medium text-black">Users</h2>
            <p className="text-gray-600 text-sm">Manage all users across the system</p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2 bg-neutral-50 border border-gray-200 rounded-md px-3 py-2 w-full sm:w-72">
              <i className="fa-solid fa-magnifying-glass text-gray-400"></i>
              <input
                type="text"
                placeholder="Search users..."
                className="bg-transparent border-none outline-none text-sm w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Email</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Company</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Role</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Status</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3 font-medium text-gray-900">{user.fullName}</td>
                  <td className="px-6 py-3 text-sm text-gray-600">{user.email}</td>
                  <td className="px-6 py-3 text-sm text-gray-600">{user.company}</td>
                  <td className="px-6 py-3 text-sm text-gray-600">{user.role}</td>
                  <td className="px-6 py-3">
                    <span className={`text-xs font-semibold px-2 py-1 rounded ${
                      user.status === "Active"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-700"
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right">
                    <button
                      onClick={() => {
                        setSelectedUser({
                          fullName: user.fullName,
                          email: user.email,
                          company: user.company,
                          role: user.role,
                          status: user.status,
                        });
                        setShowModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-700 text-sm transition-colors"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AddUserModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        user={selectedUser}
      />
    </div>
  );
}
