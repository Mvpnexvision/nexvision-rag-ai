/**
 * Superadmin Dashboard API Client
 *
 * Functions to fetch data from the backend superadmin endpoints.
 * All functions use the backend URL from environment or fallback to localhost.
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export interface Company {
  id: string;
  name: string;
}

export interface DashboardStats {
  company_id: string;
  total_files: number;
  ai_questions: number;
  ai_insights: number;
  high_risk_items: number;
  recommendations: number;
}

export interface Insight {
  id: string;
  prompt: string;
  subtitle: string;
  risk_level: "Low" | "Medium" | "High" | "Critical";
}

export interface DashboardInsights {
  company_id: string;
  insights: Insight[];
}

export interface RecommendationStats {
  company_id: string;
  risk_distribution: {
    Low: number;
    Medium: number;
    High: number;
    Critical: number;
  };
}

export interface Recommendation {
  id: string;
  title: string;
  risk_level: "Low" | "Medium" | "High" | "Critical";
}

export interface DashboardRecommendations {
  company_id: string;
  recommendations: Recommendation[];
}

export interface Source {
  id: string;
  file_name: string;
  file_type: "PDF" | "DOCX" | "XLSX" | "CSV" | "TXT" | "MD";
  created_at: string;
}

export interface DashboardSources {
  company_id: string;
  sources: Source[];
}

/**
 * Fetch all companies for the superadmin company selector
 */
export async function getCompanies(): Promise<Company[]> {
  const response = await fetch(`${API_BASE_URL}/superadmin/companies`);
  if (!response.ok) {
    throw new Error("Failed to fetch companies");
  }
  const data = await response.json();
  return data.companies;
}

/**
 * Fetch dashboard statistics for a specific company
 */
export async function getDashboardStats(
  companyId: string,
): Promise<DashboardStats> {
  const params = new URLSearchParams({ company_id: companyId });
  const response = await fetch(
    `${API_BASE_URL}/superadmin/dashboard/stats?${params}`,
  );
  if (!response.ok) {
    throw new Error("Failed to fetch dashboard stats");
  }
  return response.json();
}

/**
 * Fetch recent AI insights for a specific company
 */
export async function getDashboardInsights(
  companyId: string,
  limit: number = 3,
): Promise<DashboardInsights> {
  const params = new URLSearchParams({
    company_id: companyId,
    limit: limit.toString(),
  });
  const response = await fetch(
    `${API_BASE_URL}/superadmin/dashboard/insights?${params}`,
  );
  if (!response.ok) {
    throw new Error("Failed to fetch insights");
  }
  return response.json();
}

/**
 * Fetch recommendation statistics for a specific company
 */
export async function getRecommendationStats(
  companyId: string,
): Promise<RecommendationStats> {
  const params = new URLSearchParams({ company_id: companyId });
  const response = await fetch(
    `${API_BASE_URL}/superadmin/dashboard/recommendation-stats?${params}`,
  );
  if (!response.ok) {
    throw new Error("Failed to fetch recommendation stats");
  }
  return response.json();
}

/**
 * Fetch top recommendations for a specific company
 */
export async function getDashboardRecommendations(
  companyId: string,
  limit: number = 6,
): Promise<DashboardRecommendations> {
  const params = new URLSearchParams({
    company_id: companyId,
    limit: limit.toString(),
  });
  const response = await fetch(
    `${API_BASE_URL}/superadmin/dashboard/recommendations?${params}`,
  );
  if (!response.ok) {
    throw new Error("Failed to fetch recommendations");
  }
  return response.json();
}

/**
 * Fetch recent document sources for a specific company
 */
export async function getDashboardSources(
  companyId: string,
  limit: number = 3,
): Promise<DashboardSources> {
  const params = new URLSearchParams({
    company_id: companyId,
    limit: limit.toString(),
  });
  const response = await fetch(
    `${API_BASE_URL}/superadmin/dashboard/sources?${params}`,
  );
  if (!response.ok) {
    throw new Error("Failed to fetch sources");
  }
  return response.json();
}
