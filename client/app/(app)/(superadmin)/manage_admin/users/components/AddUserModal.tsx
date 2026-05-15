"use client";

import { useEffect, useState } from "react";
import { createUser, updateUser } from "@/lib/api/users";
import { getCompaniesList } from "@/lib/api/companies";
import Toast from "@/components/Toast";

export interface UserFormData {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  companyId?: string;
  role: string;
  status: "Active" | "Inactive";
}

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: UserFormData | null;
  onSuccess?: () => void;
}

interface Company {
  id: string;
  name: string;
  businessLine: string;
}

const businessLineMap: Record<string, string> = {
  Logistics: "Logistics",
  "Clinic/Aesthetics": "Clinic/Aesthetics",
  "HR/Admin": "HR/Admin",
  Retail: "Retail",
  Construction: "Construction",
  "Custom Business": "Custom Business",
};

export default function AddUserModal({ isOpen, onClose, user, onSuccess }: AddUserModalProps) {
  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [companyId, setCompanyId] = useState(user?.companyId ?? "");
  const [businessLine, setBusinessLine] = useState("");
  const [role, setRole] = useState(user?.role ?? "Staff");
  const [status, setStatus] = useState<"Active" | "Inactive">(user?.status ?? "Active");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);

  const isEditing = !!user?.id;

  // Fetch companies on mount or when modal opens
  useEffect(() => {
    if (isOpen) {
      const fetchCompanies = async () => {
        try {
          setCompaniesLoading(true);
          const data = await getCompaniesList();
          setCompanies(data);
        } catch (err) {
          console.error("Failed to fetch companies:", err);
          setError("Failed to load companies");
        } finally {
          setCompaniesLoading(false);
        }
      };
      fetchCompanies();
    }
  }, [isOpen]);

  // Update business line when company changes
  useEffect(() => {
    if (companyId) {
      const selectedCompany = companies.find((c) => c.id === companyId);
      if (selectedCompany) {
        setBusinessLine(selectedCompany.businessLine);
      }
    } else {
      setBusinessLine("");
    }
  }, [companyId, companies]);

  useEffect(() => {
    if (user && isOpen) {
      setFirstName(user.firstName);
      setLastName(user.lastName);
      setEmail(user.email);
      setCompanyId(user.companyId ?? "");
      setRole(user.role);
      setStatus(user.status);
    } else if (!user && isOpen) {
      setFirstName("");
      setLastName("");
      setEmail("");
      setCompanyId("");
      setRole("Staff");
      setStatus("Active");
    }
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setShowConfirmPassword(false);
    setError(null);
    setSuccess(false);
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validation
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !companyId) {
      setError("Please fill in all required fields");
      return;
    }

    if (!isEditing && !password) {
      setError("Password is required for new users");
      return;
    }

    if (password && password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      const roleMap: Record<string, "superadmin" | "admin"> = {
        "Admin": "admin",
        "Manager": "admin",
        "Staff": "admin",
      };

      const statusMap: Record<string, "active" | "inactive"> = {
        "Active": "active",
        "Inactive": "inactive",
      };

      if (isEditing && user?.id) {
        // Update user
        await updateUser(user.id, {
          firstName,
          lastName,
          email,
          companyId,
          role: roleMap[role] || "admin",
          status: statusMap[status] || "active",
        });
        setSuccess(true);
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 1000);
      } else {
        // Create new user
        if (!password) {
          setError("Password is required");
          setIsLoading(false);
          return;
        }

        await createUser({
          firstName,
          lastName,
          email,
          password,
          companyId,
          role: roleMap[role] || "admin",
          status: statusMap[status] || "active",
        });

        setSuccess(true);
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 1000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const EyeIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );

  const EyeOffIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl w-full max-w-md shadow-lg animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-5 border-b border-gray-200">
          <h2 className="text-lg font-medium text-black">{isEditing ? "Edit User" : "Add New User"}</h2>
          <button
            aria-label="Close modal"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-neutral-100 rounded-md cursor-pointer transition-colors focus:outline-none"
          >
            <i className="fa-solid fa-xmark" aria-hidden="true"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-700">
              {isEditing ? "User updated successfully" : "User created successfully"}
            </div>
          )}
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
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              disabled={companiesLoading}
              className="w-full p-2.5 text-black border border-gray-200 rounded-md text-sm focus:outline-none focus:border-black bg-white cursor-pointer disabled:bg-gray-50 disabled:cursor-not-allowed"
            >
              <option value="">{companiesLoading ? "Loading companies..." : "Select a company"}</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
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

          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 border-b border-gray-100 pb-1.5">
            {isEditing ? "Change Password" : "Password"}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2 text-black">
                {isEditing ? "New Password" : "Password"}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-2.5 pr-10 text-black border border-gray-200 rounded-md text-sm focus:outline-none focus:border-black bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium mb-2 text-black">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirm-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full p-2.5 pr-10 text-black border border-gray-200 rounded-md text-sm focus:outline-none focus:border-black bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors focus:outline-none"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>
          </div>
        </form>

        <div className="p-5 border-t border-gray-200 flex justify-end gap-3 bg-neutral-50 rounded-b-xl">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm text-gray-600 hover:text-black transition-colors cursor-pointer focus:outline-none disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-4 py-2 bg-black text-white rounded-md text-sm font-medium hover:bg-neutral-800 transition-colors cursor-pointer focus:outline-none disabled:bg-gray-400 flex items-center gap-2"
          >
            {isLoading && <i className="fa-solid fa-spinner animate-spin"></i>}
            {isEditing ? "Save User" : "Add User"}
          </button>
        </div>
      </div>
    </div>
  );
}