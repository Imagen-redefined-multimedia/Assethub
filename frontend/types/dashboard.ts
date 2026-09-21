export type User = {
  id: number;
  username: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  role: "ADMIN" | "TECHNICIAN" | "CLIENT";
  company_id?: number | null;
  company_name?: string | null;
};

export type Company = {
  id: number;
  name: string;
};

export type Asset = {
  id: number;
  name: string;
  serial_number: string;
  company_name?: string;
};

export type WorkOrder = {
  id: number;
  title: string;
  status: string;
  asset_name?: string;
  company_name?: string;
};

export type MaintenanceSchedule = {
  id: number;
  asset_name: string;
  frequency: number;
  frequency_unit: string;
  next_maintenance_date: string | null;
  schedule_status: string;
};

export type MaintenanceReport = {
  id: number;
  asset_name: string;
  technician_username: string;
  priority: string;
  status: string;
  review_status: string;
  created_at: string;
};

export type QuoteRequest = {
  id: number;
  full_name: string;
  company_name: string;
  email: string;
  phone: string;
  package: string;
  package_display: string;
  number_of_assets: number | null;
  number_of_users: number | null;
  requirements: string;
  status: string;
  status_display: string;
  created_at: string;
  updated_at: string;
};