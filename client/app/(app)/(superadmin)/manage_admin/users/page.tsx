"use client";

import { useState, useEffect } from "react";
import AddUserModal, { UserFormData } from "./components/AddUserModal";
import { getAllUsers, User } from "@/lib/api/users";
import Toast from "@/components/Toast";

export default function UsersPage() {
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserFormData | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getAllUsers();
      setUsers(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load users";
      console.error("Fetch users error:", err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(
    (user) =>
      `${user.firstName} ${user.lastName}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.companyName.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-medium text-black">Users</h2>
            <p className="text-gray-600 text-sm">
              Manage all users across the system
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2 text-black bg-neutral-50 border border-gray-200 rounded-md px-3 py-2 flex-1 md:flex-none md:w-64 focus-within:border-black cursor-text">
              <i className="fa-solid fa-magnifying-glass "></i>
              <input
                type="text"
                placeholder="Search users..."
                className="bg-transparent text-black border-none outline-none text-sm w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              onClick={() => {
                setSelectedUser(null);
                setShowModal(true);
              }}
              className="px-4 py-2 bg-black text-white rounded-md hover:bg-neutral-800 text-sm font-medium flex items-center gap-2 transition-colors flex-1 sm:flex-none justify-center cursor-pointer focus:outline-none"
            >
              <i className="fa-solid fa-plus"></i>Add User
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-700 font-medium">
              Error loading users
            </p>
            <p className="text-sm text-red-600 mt-1">{error}</p>
            <p className="text-xs text-red-500 mt-2">
              Make sure the backend server is running at{" "}
              {process.env.NEXT_PUBLIC_API_BASE_URL ||
                process.env.NEXT_PUBLIC_API_URL ||
                "http://localhost:8000"}
            </p>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="flex flex-col items-center gap-2">
              <i className="fa-solid fa-spinner animate-spin text-2xl text-gray-400"></i>
              <p className="text-gray-600">Loading users...</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-3 font-medium text-gray-900">
                        {user.firstName} {user.lastName}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-600">
                        {user.email}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-600">
                        {user.companyName}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-600 capitalize">
                        {user.role}
                      </td>
                      <td className="px-6 py-3">
                        <span
                          className={`text-xs font-semibold px-2 py-1 rounded ${
                            user.status === "active"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {user.status === "active" ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <button
                          onClick={() => {
                            setSelectedUser({
                              id: user.id,
                              firstName: user.firstName,
                              lastName: user.lastName,
                              email: user.email,
                              company: user.companyName,
                              companyId: user.companyId,
                              role: user.role === "admin" ? "Manager" : "Admin",
                              status:
                                user.status === "active"
                                  ? "Active"
                                  : "Inactive",
                            });
                            setShowModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-700 text-sm transition-colors"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-8 text-center text-gray-600"
                    >
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AddUserModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        user={selectedUser}
        onSuccess={fetchUsers}
      />
    </div>
  );
}
