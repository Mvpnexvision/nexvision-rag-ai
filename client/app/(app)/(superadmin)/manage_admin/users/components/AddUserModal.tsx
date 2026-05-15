"use client";

import { useEffect, useState } from "react";

export interface UserFormData {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  role: string;
  status: "Active" | "Inactive";
}

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: UserFormData | null;
}

const companyBusinessLineMap: Record<string, string> = {
  "NexVision Logistics": "Logistics",
  "NexVision Clinic": "Clinic/Aesthetics",
  "NexVision HR": "HR/Admin",
  RetailPro: "Retail",
  "Construct Pro": "Construction",
  "Custom Business": "Custom Business",
};

export default function AddUserModal({ isOpen, onClose, user }: AddUserModalProps) {
  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [company, setCompany] = useState(user?.company ?? "");
  const [role, setRole] = useState(user?.role ?? "Staff");
  const [status, setStatus] = useState<"Active" | "Inactive">(user?.status ?? "Active");
  const [businessLine, setBusinessLine] = useState("");

  useEffect(() => {
    if (company) {
      setBusinessLine(companyBusinessLineMap[company] || "");
    } else {
      setBusinessLine("");
    }
  }, [company]);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName);
      setLastName(user.lastName);
      setEmail(user.email);
      setCompany(user.company);
      setRole(user.role);
      setStatus(user.status);
    } else {
      setFirstName("");
      setLastName("");
      setEmail("");
      setCompany("");
      setRole("Staff");
      setStatus("Active");
    }
  }, [user]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl w-full max-w-md shadow-lg animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-5 border-b border-gray-200">
          <h2 className="text-lg font-medium text-black">{user ? "Edit User" : "Add New User"}</h2>
          <button
            aria-label="Close modal"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-neutral-100 rounded-md cursor-pointer transition-colors focus:outline-none"
          >
            <i className="fa-solid fa-xmark" aria-hidden="true"></i>
          </button>
        </div>

        <div className="p-6 flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="first-name" className="block text-sm font-medium mb-2 text-black">First Name</label>
              <input
                type="text"
                id="first-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Enter first name"
                className="w-full p-2.5 text-black border border-gray-200 rounded-md text-sm focus:outline-none focus:border-black bg-white"
              />
            </div>
            <div>
              <label htmlFor="last-name" className="block text-sm font-medium mb-2 text-black">Last Name</label>
              <input
                type="text"
                id="last-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Enter last name"
                className="w-full p-2.5 text-black border border-gray-200 rounded-md text-sm focus:outline-none focus:border-black bg-white"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2 text-black">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email"
              className="w-full p-2.5 text-black border border-gray-200 rounded-md text-sm focus:outline-none focus:border-black bg-white"
            />
          </div>

          <div>
            <label htmlFor="company" className="block text-sm font-medium mb-2 text-black">Company</label>
            <select
              id="company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full p-2.5 text-black border border-gray-200 rounded-md text-sm focus:outline-none focus:border-black bg-white cursor-pointer"
            >
              <option value="">Select a company</option>
              <option value="NexVision Logistics">NexVision Logistics</option>
              <option value="NexVision Clinic">NexVision Clinic</option>
              <option value="NexVision HR">NexVision HR</option>
              <option value="RetailPro">RetailPro</option>
              <option value="Construct Pro">Construct Pro</option>
              <option value="Custom Business">Custom Business</option>
            </select>
          </div>

          <div>
            <label htmlFor="business-line" className="block text-sm font-medium mb-2 text-black">Business Line</label>
            <input
              type="text"
              id="business-line"
              value={businessLine}
              disabled
              className="w-full p-2.5 text-gray-600 border border-gray-200 rounded-md text-sm bg-gray-50 cursor-not-allowed"
              placeholder="Auto-filled based on company"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="role" className="block text-sm font-medium mb-2 text-black">Role</label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full p-2.5 text-black border border-gray-200 rounded-md text-sm focus:outline-none focus:border-black bg-white cursor-pointer"
              >
                <option>Admin</option>
                <option>Manager</option>
                <option>Staff</option>
              </select>
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-medium mb-2 text-black">Status</label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as "Active" | "Inactive")}
                className="w-full p-2.5 text-black border border-gray-200 rounded-md text-sm focus:outline-none focus:border-black bg-white cursor-pointer"
              >
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-gray-200 flex justify-end gap-3 bg-neutral-50 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-black transition-colors cursor-pointer focus:outline-none"
          >
            Cancel
          </button>
          <button className="px-4 py-2 bg-black text-white rounded-md text-sm font-medium hover:bg-neutral-800 transition-colors cursor-pointer focus:outline-none">
            {user ? "Save User" : "Add User"}
          </button>
        </div>
      </div>
    </div>
  );
}
