export type Company = {
  id: number;
  name: string;
};

export type User = {
  id: number;
  username: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  role: "ADMIN" | "TECHNICIAN" | "CLIENT";
};

export type Asset = {
  id: number;
  company: number;
  company_name: string;
  client: number;
  client_username: string;
  name: string;
  serial_number: string;
  description?: string;
  qr_active: boolean;
  qr_created_at?: string | null;
  qr_revoked_at?: string | null;
  last_qr_scan_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type AssetForm = {
  client: string;
  name: string;
  serial_number: string;
  description: string;
};

export const emptyAssetForm: AssetForm = {
  client: "",
  name: "",
  serial_number: "",
  description: "",
};