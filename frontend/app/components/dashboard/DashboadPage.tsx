
"use client";

import { useEffect, useState } from "react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type Company = {
  id: number;
  name: string;
};

type User = {
  id: number;
  username: string;
  role: string;
};

type Asset = {
  id: number;
  name: string;
  serial_number: string;
  company_name?: string;
};

type WorkOrder = {
  id: number;
  title: string;
  status: string;
  asset_name?: string;
  company_name?: string;
};

type MaintenanceSchedule = {
  id: number;
  asset_name: string;
  frequency: number;
  frequency_unit: string;
  next_maintenance_date: string | null;
  schedule_status: string;
};

type MaintenanceReport = {
  id: number;
  asset_name: string;
  technician_username: string;
  priority: string;
  status: string;
  review_status: string;
  created_at: string;
};

export default function Dashboard() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [schedules, setSchedules] = useState<
    MaintenanceSchedule[]
  >([]);
  const [reports, setReports] = useState<
    MaintenanceReport[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      const token = localStorage.getItem("access_token");

      if (!token) {
        window.location.href = "/login";
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      try {
        const [
          companiesResponse,
          usersResponse,
          assetsResponse,
          workOrdersResponse,
          schedulesResponse,
          reportsResponse,
        ] = await Promise.all([
          fetch(`${API_URL}/api/companies/`, { headers }),
          fetch(`${API_URL}/api/users/`, { headers }),
          fetch(`${API_URL}/api/assets/`, { headers }),
          fetch(`${API_URL}/api/work-orders/`, { headers }),
          fetch(`${API_URL}/api/maintenance-schedules/`, {
            headers,
          }),
          fetch(`${API_URL}/api/maintenance-reports/`, {
            headers,
          }),
        ]);

        if (
          !companiesResponse.ok ||
          !usersResponse.ok ||
          !assetsResponse.ok ||
          !workOrdersResponse.ok ||
          !schedulesResponse.ok ||
          !reportsResponse.ok
        ) {
          throw new Error(
            "Unable to load dashboard data."
          );
        }

        const [
          companiesData,
          usersData,
          assetsData,
          workOrdersData,
          schedulesData,
          reportsData,
        ] = await Promise.all([
          companiesResponse.json(),
          usersResponse.json(),
          assetsResponse.json(),
          workOrdersResponse.json(),
          schedulesResponse.json(),
          reportsResponse.json(),
        ]);

        setCompanies(companiesData);
        setUsers(usersData);
        setAssets(assetsData);
        setWorkOrders(workOrdersData);
        setSchedules(schedulesData);
        setReports(reportsData);
      } catch (err) {
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
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-700 border-t-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-900 bg-red-950/30 p-6">
        <h2 className="font-semibold text-red-400">
          Dashboard Error
        </h2>

        <p className="mt-2 text-sm text-red-300">
          {error}
        </p>
      </div>
    );
  }

  const technicians = users.filter(
    (user) => user.role === "TECHNICIAN"
  );

  const clients = users.filter(
    (user) => user.role === "CLIENT"
  );

  const pendingWorkOrders = workOrders.filter(
    (order) => order.status === "PENDING"
  ).length;

  const inProgressWorkOrders = workOrders.filter(
    (order) => order.status === "IN_PROGRESS"
  ).length;

  const completedWorkOrders = workOrders.filter(
    (order) => order.status === "COMPLETED"
  ).length;

  const overdueSchedules = schedules.filter(
    (schedule) => schedule.schedule_status === "OVERDUE"
  ).length;

  const dueSoonSchedules = schedules.filter(
    (schedule) => schedule.schedule_status === "DUE_SOON"
  ).length;

  const upcomingSchedules = schedules.filter(
    (schedule) => schedule.schedule_status === "UPCOMING"
  ).length;

  return (
    <div className="space-y-8">

      {/* Header */}
      <div>
        <p className="text-sm font-medium text-blue-400">
          ADMINISTRATOR
        </p>

        <h1 className="mt-1 text-3xl font-bold text-white">
          Operations Dashboard
        </h1>

        <p className="mt-2 text-slate-400">
          Monitor companies, assets, maintenance and
          work orders from one place.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <StatCard
          title="Companies"
          value={companies.length}
          description="Registered companies"
          icon="▣"
        />

        <StatCard
          title="Users"
          value={users.length}
          description={`${technicians.length} technicians · ${clients.length} clients`}
          icon="♙"
        />

        <StatCard
          title="Assets"
          value={assets.length}
          description="Assets under management"
          icon="◈"
        />

        <StatCard
          title="Work Orders"
          value={workOrders.length}
          description={`${pendingWorkOrders} currently pending`}
          icon="▤"
        />

      </div>

      {/* Operations */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* Maintenance */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">
                Maintenance Overview
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Current maintenance schedule health
              </p>
            </div>

            <span className="rounded-lg bg-blue-500/10 px-3 py-2 text-blue-400">
              🔧
            </span>
          </div>

          <div className="mt-6 space-y-4">

            <StatusRow
              label="Overdue"
              value={overdueSchedules}
              status="danger"
            />

            <StatusRow
              label="Due Soon"
              value={dueSoonSchedules}
              status="warning"
            />

            <StatusRow
              label="Upcoming"
              value={upcomingSchedules}
              status="success"
            />

          </div>
        </section>

        {/* Work Orders */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">
                Work Order Status
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Current work order pipeline
              </p>
            </div>

            <span className="rounded-lg bg-purple-500/10 px-3 py-2 text-purple-400">
              ▤
            </span>
          </div>

          <div className="mt-6 space-y-4">

            <StatusRow
              label="Pending"
              value={pendingWorkOrders}
              status="warning"
            />

            <StatusRow
              label="In Progress"
              value={inProgressWorkOrders}
              status="info"
            />

            <StatusRow
              label="Completed"
              value={completedWorkOrders}
              status="success"
            />

          </div>
        </section>

      </div>

      {/* Recent Reports */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900">

        <div className="flex items-center justify-between border-b border-slate-800 p-6">

          <div>
            <h2 className="text-lg font-semibold text-white">
              Recent Maintenance Reports
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Latest reports submitted by technicians
            </p>
          </div>

          <a
            href="/reports"
            className="text-sm font-medium text-blue-400 hover:text-blue-300"
          >
            View all
          </a>

        </div>

        {reports.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            No maintenance reports available.
          </div>
        ) : (
          <div className="divide-y divide-slate-800">

            {reports.slice(0, 5).map((report) => (
              <div
                key={report.id}
                className="flex items-center justify-between gap-4 p-5"
              >

                <div className="min-w-0">

                  <p className="truncate font-medium text-white">
                    {report.asset_name}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Technician: {report.technician_username}
                  </p>

                </div>

                <div className="flex shrink-0 items-center gap-3">

                  <PriorityBadge
                    priority={report.priority}
                  />

                  <ReviewBadge
                    status={report.review_status}
                  />

                </div>

              </div>
            ))}

          </div>
        )}

      </section>

    </div>
  );
}

function StatCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: number;
  description: string;
  icon: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 transition hover:border-slate-700">

      <div className="flex items-start justify-between">

        <div>
          <p className="text-sm font-medium text-slate-400">
            {title}
          </p>

          <p className="mt-3 text-3xl font-bold text-white">
            {value}
          </p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
          {icon}
        </div>

      </div>

      <p className="mt-4 text-xs text-slate-500">
        {description}
      </p>

    </div>
  );
}

function StatusRow({
  label,
  value,
  status,
}: {
  label: string;
  value: number;
  status: "danger" | "warning" | "success" | "info";
}) {
  const styles = {
    danger: "bg-red-500/10 text-red-400",
    warning: "bg-yellow-500/10 text-yellow-400",
    success: "bg-emerald-500/10 text-emerald-400",
    info: "bg-blue-500/10 text-blue-400",
  };

  return (
    <div className="flex items-center justify-between">

      <div className="flex items-center gap-3">

        <span
          className={`h-2 w-2 rounded-full ${styles[status]}`}
        />

        <span className="text-sm text-slate-300">
          {label}
        </span>

      </div>

      <span
        className={`rounded-lg px-3 py-1 text-sm font-semibold ${styles[status]}`}
      >
        {value}
      </span>

    </div>
  );
}

function PriorityBadge({
  priority,
}: {
  priority: string;
}) {
  const styles: Record<string, string> = {
    LOW: "bg-slate-800 text-slate-400",
    MEDIUM: "bg-yellow-500/10 text-yellow-400",
    HIGH: "bg-orange-500/10 text-orange-400",
    CRITICAL: "bg-red-500/10 text-red-400",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium ${
        styles[priority] ?? styles.MEDIUM
      }`}
    >
      {priority}
    </span>
  );
}

function ReviewBadge({
  status,
}: {
  status: string;
}) {
  const styles: Record<string, string> = {
    PENDING: "bg-yellow-500/10 text-yellow-400",
    ACCEPTED: "bg-emerald-500/10 text-emerald-400",
    REJECTED: "bg-red-500/10 text-red-400",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium ${
        styles[status] ?? "bg-slate-800 text-slate-400"
      }`}
    >
      {status}
    </span>
  );
}
