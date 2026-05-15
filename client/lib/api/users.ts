/**
 * Users Management API Client
 *
 * Functions to fetch and manage users from the backend endpoints.
 * All functions use the backend URL from environment or fallback to localhost.
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8000";

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  companyId: string;
  companyName: string;
  businessLine: string;
  role: "superadmin" | "admin";
  status: "active" | "inactive";
  createdAt: string;
}

export interface CreateUserInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  companyId: string;
  role: "superadmin" | "admin";
  status: "active" | "inactive";
}

export interface UpdateUserInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  companyId?: string;
  role?: "superadmin" | "admin";
  status?: "active" | "inactive";
}

/**
 * Fetch all users across the system
 */
export async function getAllUsers(): Promise<User[]> {
  try {
    console.log("Fetching users from:", `${API_BASE_URL}/users`);
    const response = await fetch(`${API_BASE_URL}/users`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg = `Failed to fetch users: ${response.status} ${response.statusText}`;
      console.error(errorMsg, errorData);
      throw new Error(errorMsg);
    }
    
    const data = await response.json();
    console.log("Received users data:", data);
    
    if (!data.users || !Array.isArray(data.users)) {
      console.error("Invalid response structure:", data);
      throw new Error("Invalid response structure from server");
    }
    
    return data.users.map((user: any) => ({
      id: user.id,
      firstName: user.first_name || "",
      lastName: user.last_name || "",
      email: user.email,
      companyId: user.company_id || "",
      companyName: user.company_name || "Unknown",
      businessLine: user.business_line || "",
      role: user.role || "admin",
      status: user.status || "active",
      createdAt: user.created_at || "",
    }));
  } catch (error) {
    console.error("getAllUsers error:", error);
    throw error;
  }
}

/**
 * Create a new user
 */
export async function createUser(input: CreateUserInput): Promise<User> {
  const response = await fetch(`${API_BASE_URL}/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      first_name: input.firstName,
      last_name: input.lastName,
      email: input.email,
      password: input.password,
      company_id: input.companyId,
      role: input.role,
      status: input.status,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to create user");
  }

  const data = await response.json();
  return {
    id: data.id,
    firstName: data.first_name,
    lastName: data.last_name,
    email: data.email,
    companyId: data.company_id,
    companyName: "",
    businessLine: "",
    role: data.role,
    status: data.status,
    createdAt: data.created_at,
  };
}

/**
 * Update an existing user
 */
export async function updateUser(
  userId: string,
  input: UpdateUserInput,
): Promise<User> {
  const body: any = {};
  if (input.firstName !== undefined) body.first_name = input.firstName;
  if (input.lastName !== undefined) body.last_name = input.lastName;
  if (input.email !== undefined) body.email = input.email;
  if (input.companyId !== undefined) body.company_id = input.companyId;
  if (input.role !== undefined) body.role = input.role;
  if (input.status !== undefined) body.status = input.status;

  const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to update user");
  }

  const data = await response.json();
  return {
    id: data.id,
    firstName: data.first_name,
    lastName: data.last_name,
    email: data.email,
    companyId: data.company_id,
    companyName: "",
    businessLine: "",
    role: data.role,
    status: data.status,
    createdAt: data.created_at,
  };
}
