
"use client";

import { useEffect, useState } from "react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/* ============================================================
   TYPES
============================================================ */

type User = {
  id: number;
  username: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  role: "ADMIN" | "TECHNICIAN" | "CLIENT";
  company_id?: number | null;
  company_name?: string | null;
};

type Company = {
  id: number;
  name: string;
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

/* ============================================================
   API HELPERS
============================================================ */

async function fetchJson<T>(
  endpoint: string,
  token: string
): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (response.status === 401) {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    window.location.href = "/login";
    throw new Error("Session expired.");
  }

  if (!response.ok) {
    let message = `Request failed: ${response.status}`;

    try {
      const data = await response.json();

      if (typeof data?.detail === "string") {
        message = data.detail;
      }
    } catch {
      // Ignore invalid JSON
    }

    throw new Error(message);
  }

  return response.json();
}

/* ============================================================
   MAIN DASHBOARD
============================================================ */

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);

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

      try {
        setLoading(true);
        setError("");

        /*
         * STEP 1
         * Get the authenticated user first.
         */
        const currentUser = await fetchJson<User>(
          "/api/auth/me/",
          token
        );

        setUser(currentUser);

        /*
         * STEP 2
         * Load data according to the user's role.
         */
        if (currentUser.role === "ADMIN") {
          const [
            companiesData,
            usersData,
            assetsData,
            workOrdersData,
            schedulesData,
            reportsData,
          ] = await Promise.all([
            fetchJson<Company[]>(
              "/api/companies/",
              token
            ),

            fetchJson<User[]>(
              "/api/users/",
              token
            ),

            fetchJson<Asset[]>(
              "/api/assets/",
              token
            ),

            fetchJson<WorkOrder[]>(
              "/api/work-orders/",
              token
            ),

            fetchJson<MaintenanceSchedule[]>(
              "/api/maintenance-schedules/",
              token
            ),

            fetchJson<MaintenanceReport[]>(
              "/api/maintenance-reports/",
              token
            ),
          ]);

          setCompanies(companiesData);
          setUsers(usersData);
          setAssets(assetsData);
          setWorkOrders(workOrdersData);
          setSchedules(schedulesData);
          setReports(reportsData);
        }

        /*
         * CLIENT
         *
         * Clients should not request:
         *
         * /api/companies/
         * /api/users/
         *
         * because those endpoints are administrative.
         */
        if (currentUser.role === "CLIENT") {
          const [
            assetsData,
            workOrdersData,
            reportsData,
          ] = await Promise.all([
            fetchJson<Asset[]>(
              "/api/assets/",
              token
            ),

            fetchJson<WorkOrder[]>(
              "/api/work-orders/",
              token
            ),

            fetchJson<MaintenanceReport[]>(
              "/api/maintenance-reports/",
              token
            ),
          ]);

          setAssets(assetsData);
          setWorkOrders(workOrdersData);
          setReports(reportsData);
        }

        /*
         * TECHNICIAN
         */
        if (currentUser.role === "TECHNICIAN") {
          const [
            assetsData,
            workOrdersData,
            reportsData,
          ] = await Promise.all([
            fetchJson<Asset[]>(
              "/api/assets/",
              token
            ),

            fetchJson<WorkOrder[]>(
              "/api/work-orders/",
              token
            ),

            fetchJson<MaintenanceReport[]>(
              "/api/maintenance-reports/",
              token
            ),
          ]);

          setAssets(assetsData);
          setWorkOrders(workOrdersData);
          setReports(reportsData);
        }
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

  /* ============================================================
     LOADING
  ============================================================ */

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-700 border-t-blue-500" />
      </div>
    );
  }

  /* ============================================================
     ERROR
  ============================================================ */

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

  if (!user) {
    return null;
  }

  /* ============================================================
     ROLE DASHBOARDS
  ============================================================ */

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

  if (user.role === "TECHNICIAN") {
    return (
      <TechnicianDashboard
        user={user}
        assets={assets}
        workOrders={workOrders}
        reports={reports}
      />
    );
  }

  return (
    <AdminDashboard
      companies={companies}
      users={users}
      assets={assets}
      workOrders={workOrders}
      schedules={schedules}
      reports={reports}
    />
  );
}

/* ============================================================
   ADMIN DASHBOARD
============================================================ */

function AdminDashboard({
  companies,
  users,
  assets,
  workOrders,
  schedules,
  reports,
}: {
  companies: Company[];
  users: User[];
  assets: Asset[];
  workOrders: WorkOrder[];
  schedules: MaintenanceSchedule[];
  reports: MaintenanceReport[];
}) {
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
    (schedule) =>
      schedule.schedule_status === "OVERDUE"
  ).length;

  const dueSoonSchedules = schedules.filter(
    (schedule) =>
      schedule.schedule_status === "DUE_SOON"
  ).length;

  const upcomingSchedules = schedules.filter(
    (schedule) =>
      schedule.schedule_status === "UPCOMING"
  ).length;

  return (
    <div className="space-y-8">

      <DashboardHeader
        label="ADMINISTRATOR"
        title="Operations Dashboard"
        description="Monitor companies, users, assets, maintenance and work orders from one place."
      />

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

      <div className="grid gap-6 lg:grid-cols-2">

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

      <ReportsSection reports={reports} />
    </div>
  );
}

/* ============================================================
   CLIENT DASHBOARD
============================================================ */

function ClientDashboard({
  user,
  assets,
  workOrders,
  reports,
}: {
  user: User;
  assets: Asset[];
  workOrders: WorkOrder[];
  reports: MaintenanceReport[];
}) {
  const pending = workOrders.filter(
    (order) => order.status === "PENDING"
  ).length;

  const inProgress = workOrders.filter(
    (order) => order.status === "IN_PROGRESS"
  ).length;

  const completed = workOrders.filter(
    (order) => order.status === "COMPLETED"
  ).length;

  const pendingReviews = reports.filter(
    (report) => report.review_status === "PENDING"
  ).length;

  return (
    <div className="space-y-8">

      <DashboardHeader
        label="CLIENT PORTAL"
        title={`Welcome${user.first_name ? `, ${user.first_name}` : ""}`}
        description={
          user.company_name
            ? `Manage your ${user.company_name} assets, work orders and maintenance reports.`
            : "Manage your assets, work orders and maintenance reports."
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <StatCard
          title="My Assets"
          value={assets.length}
          description="Assets under your company"
          icon="◈"
        />

        <StatCard
          title="Work Orders"
          value={workOrders.length}
          description={`${pending} pending`}
          icon="▤"
        />

        <StatCard
          title="In Progress"
          value={inProgress}
          description="Currently being handled"
          icon="🔧"
        />

        <StatCard
          title="Reports"
          value={reports.length}
          description={`${pendingReviews} awaiting review`}
          icon="▣"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

          <h2 className="text-lg font-semibold text-white">
            Work Order Status
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Current status of your work orders
          </p>

          <div className="mt-6 space-y-4">

            <StatusRow
              label="Pending"
              value={pending}
              status="warning"
            />

            <StatusRow
              label="In Progress"
              value={inProgress}
              status="info"
            />

            <StatusRow
              label="Completed"
              value={completed}
              status="success"
            />
          </div>

          <a
            href="/work-orders"
            className="mt-6 inline-block text-sm font-medium text-blue-400 hover:text-blue-300"
          >
            View work orders →
          </a>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

          <h2 className="text-lg font-semibold text-white">
            Maintenance Reports
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Reports submitted by technicians
          </p>

          <div className="mt-6 space-y-3">

            {reports.length === 0 ? (
              <p className="text-sm text-slate-500">
                No maintenance reports available.
              </p>
            ) : (
              reports.slice(0, 4).map((report) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-4"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-white">
                      {report.asset_name}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {report.technician_username}
                    </p>
                  </div>

                  <ReviewBadge
                    status={report.review_status}
                  />
                </div>
              ))
            )}
          </div>

          <a
            href="/reports"
            className="mt-6 inline-block text-sm font-medium text-blue-400 hover:text-blue-300"
          >
            View reports →
          </a>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

        <div className="flex items-center justify-between">

          <div>
            <h2 className="text-lg font-semibold text-white">
              My Assets
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Assets belonging to your company
            </p>
          </div>

          <a
            href="/assets"
            className="text-sm font-medium text-blue-400 hover:text-blue-300"
          >
            View all →
          </a>
        </div>

        {assets.length === 0 ? (
          <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950 p-6 text-center">
            <p className="text-sm text-slate-500">
              No assets have been assigned to your company yet.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

            {assets.slice(0, 6).map((asset) => (
              <div
                key={asset.id}
                className="rounded-xl border border-slate-800 bg-slate-950 p-5"
              >
                <p className="font-medium text-white">
                  {asset.name}
                </p>

                <p className="mt-2 text-xs text-slate-500">
                  Serial: {asset.serial_number}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

/* ============================================================
   TECHNICIAN DASHBOARD
============================================================ */

function TechnicianDashboard({
  user,
  assets,
  workOrders,
  reports,
}: {
  user: User;
  assets: Asset[];
  workOrders: WorkOrder[];
  reports: MaintenanceReport[];
}) {
  const pending = workOrders.filter(
    (order) => order.status === "PENDING"
  ).length;

  const inProgress = workOrders.filter(
    (order) => order.status === "IN_PROGRESS"
  ).length;

  const completed = workOrders.filter(
    (order) => order.status === "COMPLETED"
  ).length;

  return (
    <div className="space-y-8">

      <DashboardHeader
        label="TECHNICIAN PORTAL"
        title={`Welcome${user.first_name ? `, ${user.first_name}` : ""}`}
        description="Manage assigned maintenance work, assets and service reports."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <StatCard
          title="Work Orders"
          value={workOrders.length}
          description="Available work orders"
          icon="▤"
        />

        <StatCard
          title="Pending"
          value={pending}
          description="Awaiting action"
          icon="⏳"
        />

        <StatCard
          title="In Progress"
          value={inProgress}
          description="Currently working"
          icon="🔧"
        />

        <StatCard
          title="Reports"
          value={reports.length}
          description="Reports submitted"
          icon="▣"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

          <h2 className="text-lg font-semibold text-white">
            Maintenance Pipeline
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Your current maintenance workload
          </p>

          <div className="mt-6 space-y-4">

            <StatusRow
              label="Pending"
              value={pending}
              status="warning"
            />

            <StatusRow
              label="In Progress"
              value={inProgress}
              status="info"
            />

            <StatusRow
              label="Completed"
              value={completed}
              status="success"
            />
          </div>

          <a
            href="/maintenance"
            className="mt-6 inline-block text-sm font-medium text-blue-400 hover:text-blue-300"
          >
            Open maintenance →
          </a>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

          <div className="flex items-center justify-between">

            <div>
              <h2 className="text-lg font-semibold text-white">
                Recent Reports
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Recently submitted maintenance reports
              </p>
            </div>

            <a
              href="/reports"
              className="text-sm font-medium text-blue-400 hover:text-blue-300"
            >
              View all
            </a>
          </div>

          <div className="mt-6 space-y-3">

            {reports.length === 0 ? (
              <p className="text-sm text-slate-500">
                No reports submitted yet.
              </p>
            ) : (
              reports.slice(0, 5).map((report) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-4"
                >
                  <div>
                    <p className="font-medium text-white">
                      {report.asset_name}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {report.priority} priority
                    </p>
                  </div>

                  <PriorityBadge
                    priority={report.priority}
                  />
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

        <h2 className="text-lg font-semibold text-white">
          Accessible Assets
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Assets available for maintenance operations
        </p>

        {assets.length === 0 ? (
          <p className="mt-6 text-sm text-slate-500">
            No assets available.
          </p>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

            {assets.slice(0, 6).map((asset) => (
              <div
                key={asset.id}
                className="rounded-xl border border-slate-800 bg-slate-950 p-5"
              >
                <p className="font-medium text-white">
                  {asset.name}
                </p>

                <p className="mt-2 text-xs text-slate-500">
                  Serial: {asset.serial_number}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

/* ============================================================
   SHARED COMPONENTS
============================================================ */

function DashboardHeader({
  label,
  title,
  description,
}: {
  label: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <p className="text-sm font-medium text-blue-400">
        {label}
      </p>

      <h1 className="mt-1 text-3xl font-bold text-white">
        {title}
      </h1>

      <p className="mt-2 text-slate-400">
        {description}
      </p>
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

function ReportsSection({
  reports,
}: {
  reports: MaintenanceReport[];
}) {
  return (
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
        styles[status] ??
        "bg-slate-800 text-slate-400"
      }`}
    >
      {status}
    </span>
  );
}
