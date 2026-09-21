"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { apiJson } from "@/lib/api";

import type {
  Asset,
  Company,
  MaintenanceReport,
  MaintenanceSchedule,
  QuoteRequest,
  User,
  WorkOrder,
} from "@/types/dashboard";

import TechnicianDashboard from "./TechnicianDashboard";
import ClientDashboard from "./ClientDashboard";
import AdminDashboard from "./AdminDashboard";

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [schedules, setSchedules] = useState<
    MaintenanceSchedule[]
  >([]);
  const [reports, setReports] = useState<MaintenanceReport[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [quotes, setQuotes] = useState<QuoteRequest[]>([]);

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        if (!localStorage.getItem("access_token")) {
          router.replace("/login");
          return;
        }

        const currentUser = await apiJson<User>(
          "/api/auth/me/"
        );

        setUser(currentUser);

        if (currentUser.role === "ADMIN") {
          const [
            companiesData,
            usersData,
            assetsData,
            workOrdersData,
            schedulesData,
            reportsData,
            quotesData,
          ] = await Promise.all([
            apiJson<Company[]>("/api/companies/"),
            apiJson<User[]>("/api/users/"),
            apiJson<Asset[]>("/api/assets/"),
            apiJson<WorkOrder[]>("/api/work-orders/"),
            apiJson<MaintenanceSchedule[]>(
              "/api/maintenance-schedules/"
            ),
            apiJson<MaintenanceReport[]>(
              "/api/maintenance-reports/"
            ),
            apiJson<QuoteRequest[]>(
                "/api/quote-requests/admin/"
              ),
          ]);

          setCompanies(companiesData);
          setUsers(usersData);
          setAssets(assetsData);
          setWorkOrders(workOrdersData);
          setSchedules(schedulesData);
          setReports(reportsData);
          setQuotes(quotesData);
        }

        if (currentUser.role === "CLIENT") {
          const [
            assetsData,
            workOrdersData,
            reportsData,
          ] = await Promise.all([
            apiJson<Asset[]>("/api/assets/"),
            apiJson<WorkOrder[]>("/api/work-orders/"),
            apiJson<MaintenanceReport[]>(
              "/api/maintenance-reports/"
            ),
            
          ]);

          setAssets(assetsData);
          setWorkOrders(workOrdersData);
          setReports(reportsData);
        }

        if (currentUser.role === "TECHNICIAN") {
          const [
            assetsData,
            workOrdersData,
            reportsData,
          ] = await Promise.all([
            apiJson<Asset[]>("/api/assets/"),
            apiJson<WorkOrder[]>("/api/work-orders/"),
            apiJson<MaintenanceReport[]>(
              "/api/maintenance-reports/"
            ),
          ]);

          setAssets(assetsData);
          setWorkOrders(workOrdersData);
          setReports(reportsData);
        }
      } catch (err) {
        console.error("Dashboard loading error:", err);

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load dashboard."
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-700 border-t-blue-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
        <p className="text-sm font-medium text-red-400">
          {error}
        </p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (user.role === "ADMIN") {
    return (
      <AdminDashboard
        user={user}
        companies={companies}
        users={users}
        assets={assets}
        workOrders={workOrders}
        schedules={schedules}
        reports={reports}
        quotes={quotes}

      />
    );
  }

  if (user.role === "CLIENT") {
    return (
      <ClientDashboard
        user={user}
        assets={assets}
        workOrders={workOrders}
        reports={reports}
      />
    );
  }

  return (
    <TechnicianDashboard
      user={user}
      assets={assets}
      workOrders={workOrders}
      reports={reports}
    />
  );
}

