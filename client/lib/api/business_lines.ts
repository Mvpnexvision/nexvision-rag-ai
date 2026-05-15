/**
 * Business Lines API Client
 *
 * Functions to fetch data from the backend business lines endpoints.
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8000";

export interface BusinessLineRecord {
  name: string;
  company_count: number;
}

export interface BusinessLinesResponse {
  business_lines: BusinessLineRecord[];
}

/**
 * Get all business lines with company counts
 */
export async function getBusinessLines(): Promise<BusinessLineRecord[]> {
  const response = await fetch(`${API_BASE_URL}/business-lines/`);
  if (!response.ok) {
    throw new Error(`Failed to fetch business lines: ${response.statusText}`);
  }

  const data: BusinessLinesResponse = await response.json();
  return data.business_lines;
}