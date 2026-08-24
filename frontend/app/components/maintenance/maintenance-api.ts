import { apiJson } from "@/lib/api";

export interface MaintenanceReport {
  id: number;

  // Related maintenance record
  maintenance: number;

  // Technician
  technician_username: string;

  // Asset
  asset_id: number;
  asset_name: string;

  // Client
  client_id: number;

  // Report content
  summary: string;
  findings: string;
  work_performed: string;
  parts_replaced: string;

  // Photos
  photos: string[];

  // Maintenance classification
  priority: string;
  status: string;

  // Client/Admin review
  review_status: string;
  reviewed_at: string | null;
  review_comment: string | null;

  // Timestamps
  created_at: string;
  updated_at: string;
}

interface MaintenanceReportResponse {
  results?: MaintenanceReport[];
  count?: number;
  next?: string | null;
  previous?: string | null;
}

export async function getMaintenanceReports(): Promise<MaintenanceReport[]> {
  const data = await apiJson<
    MaintenanceReport[] | MaintenanceReportResponse
  >("/api/maintenance-reports/");

  if (Array.isArray(data)) {
    return data;
  }

  return data.results ?? [];
}

export async function getMaintenanceReport(
  id: number
): Promise<MaintenanceReport> {
  return apiJson<MaintenanceReport>(
    `/api/maintenance-reports/${id}/`
  );
}