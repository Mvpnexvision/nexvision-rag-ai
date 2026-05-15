const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export interface Company {
  id: string;
  name: string;
  businessLine: string;
  users: number;
  status: "Active" | "Inactive";
  admin: string;
}

/**
 * Get all companies with full details for management page
 */
export async function getCompaniesList(): Promise<Company[]> {
  const response = await fetch(`${API_BASE_URL}/companies`);
  if (!response.ok)
    throw new Error(`Failed to fetch companies: ${response.statusText}`);

  const data = await response.json();
  // Map snake_case from backend to camelCase for frontend
  return data.companies.map((company: any) => ({
    id: company.id,
    name: company.company_name,
    businessLine: company.business_line,
    users: company.users,
    status: company.status,
    admin: company.admin,
  }));
}

/**
 * Get single company details
 */
export async function getCompanyDetails(companyId: string): Promise<Company> {
  const response = await fetch(`${API_BASE_URL}/companies/${companyId}`);
  if (!response.ok)
    throw new Error(`Failed to fetch company: ${response.statusText}`);

  const data = await response.json();
  return {
    id: data.id,
    name: data.company_name,
    businessLine: data.business_line,
    users: data.users,
    status: data.status,
    admin: data.admin,
  };
}

/**
 * Create new company
 */
export async function createCompany(
  name: string,
  businessLine: string,
): Promise<Company> {
  const response = await fetch(`${API_BASE_URL}/companies`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ company_name: name, business_line: businessLine }),
  });

  if (!response.ok)
    throw new Error(`Failed to create company: ${response.statusText}`);

  const data = await response.json();
  return {
    id: data.id,
    name: data.company_name,
    businessLine: data.business_line,
    users: data.users,
    status: data.status,
    admin: data.admin,
  };
}

/**
 * Update company details
 */
export async function updateCompany(
  companyId: string,
  updates: {
    name?: string;
    businessLine?: string;
    status?: string;
  },
): Promise<Company> {
  const body: any = {};
  if (updates.name) body.company_name = updates.name;
  if (updates.businessLine) body.business_line = updates.businessLine;
  if (updates.status) body.status = updates.status;

  const response = await fetch(`${API_BASE_URL}/companies/${companyId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok)
    throw new Error(`Failed to update company: ${response.statusText}`);

  const data = await response.json();
  return {
    id: data.id,
    name: data.company_name,
    businessLine: data.business_line,
    users: data.users,
    status: data.status,
    admin: data.admin,
  };
}
