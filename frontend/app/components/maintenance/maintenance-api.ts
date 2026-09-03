import { apiFetch, apiJson } from "@/lib/api";

// ============================================================
// MAINTENANCE REPORT
// ============================================================

export interface MaintenanceReportPhoto {
  id: number;
  image: string;
  photo_type: "ISSUE" | "FIXED";
  uploaded_at: string;
}

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
  photos: MaintenanceReportPhoto[];

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

// ============================================================
// GET ALL REPORTS
// ============================================================

export async function getMaintenanceReports(): Promise<
  MaintenanceReport[]
> {
  const data = await apiJson<
    MaintenanceReport[] | MaintenanceReportResponse
  >("/api/maintenance-reports/");

  if (Array.isArray(data)) {
    return data;
  }

  return data.results ?? [];
}

// ============================================================
// GET SINGLE REPORT
// ============================================================

export async function getMaintenanceReport(
  id: number
): Promise<MaintenanceReport> {
  return apiJson<MaintenanceReport>(
    `/api/maintenance-reports/${id}/`
  );
}

// ============================================================
// CREATE REPORT
// ============================================================

export interface CreateMaintenanceReportData {
  maintenance: number;
  summary: string;
  findings: string;
  work_performed: string;
  parts_replaced: string;
  priority: string;
  status?: string;
}

export async function createMaintenanceReport(
  data: CreateMaintenanceReportData
): Promise<MaintenanceReport> {
  return apiJson<MaintenanceReport>(
    "/api/maintenance-reports/",
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );
}

// ============================================================
// UPLOAD REPORT PHOTO
// ============================================================

export async function uploadMaintenanceReportPhoto(
  reportId: number,
  image: File,
  photoType: "ISSUE" | "FIXED"
): Promise<MaintenanceReportPhoto> {
  const formData = new FormData();

  formData.append("image", image);
  formData.append("photo_type", photoType);

  const response = await apiFetch(
    `/api/maintenance-reports/${reportId}/photos/`,
    {
      method: "POST",
      body: formData,
    }
  );

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.detail ||
        data?.error ||
        "Unable to upload maintenance report photo."
    );
  }

  return data.photo;
}

// ============================================================
// REVIEW REPORT
// ============================================================

export async function reviewMaintenanceReport(
  id: number,
  action: "ACCEPT" | "REJECT",
  comment: string
): Promise<MaintenanceReport> {
  const response = await apiFetch(
    `/api/maintenance-reports/${id}/review/`,
    {
      method: "POST",
      body: JSON.stringify({
        action,
        comment,
      }),
    }
  );

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.detail ||
        data?.error ||
        "Unable to review maintenance report."
    );
  }

  return data;
}

// ============================================================
// GET REJECTED REPORTS
// ============================================================

export async function getRejectedMaintenanceReports(): Promise<
  MaintenanceReport[]
> {
  const data = await apiJson<
    MaintenanceReport[] | MaintenanceReportResponse
  >("/api/maintenance-reports/rejected/");

  if (Array.isArray(data)) {
    return data;
  }

  return data.results ?? [];
}

// ============================================================
// REASSIGN MAINTENANCE
// ============================================================

export interface ReassignMaintenanceResponse {
  message: string;
  report_id: number;
  maintenance_id: number;
  technician: number;
  technician_username: string;
  status: string;
  reassignment_count: number;
}

export async function reassignMaintenance(
  reportId: number,
  technicianId: number
): Promise<ReassignMaintenanceResponse> {
  const response = await apiFetch(
    `/api/maintenance-reports/${reportId}/reassign/`,
    {
      method: "POST",
      body: JSON.stringify({
        technician: technicianId,
      }),
    }
  );

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.detail ||
        data?.technician?.[0] ||
        "Failed to reassign maintenance."
    );
  }

  return data;
}