import DashboardHeader from "./DashboardHeader";
import StatCard from "./StatCard";
import StatusRow from "./StatusRow";
import ReportsSection from "./ReportsSection";

import type {
  Asset,
  Company,
  MaintenanceReport,
  MaintenanceSchedule,
  QuoteRequest,
  User,
  WorkOrder,
} from "@/types/dashboard";
import QuotesSection from "./QuoteSection";

type AdminDashboardProps = {
  user: User;
  companies: Company[];
  users: User[];
  assets: Asset[];
  workOrders: WorkOrder[];
  schedules: MaintenanceSchedule[];
  reports: MaintenanceReport[];
  quotes: QuoteRequest[];
};

export default function AdminDashboard({
  user,
  companies,
  users,
  assets,
  workOrders,
  schedules,
  reports,
  quotes,
}: AdminDashboardProps) {
  const technicians = users.filter(
    (item) => item.role === "TECHNICIAN"
  );

  const clients = users.filter(
    (item) => item.role === "CLIENT"
  );

  const pendingWorkOrders = workOrders.filter(
    (workOrder) => workOrder.status === "PENDING"
  );

  const inProgressWorkOrders = workOrders.filter(
    (workOrder) => workOrder.status === "IN_PROGRESS"
  );

  const completedWorkOrders = workOrders.filter(
    (workOrder) => workOrder.status === "COMPLETED"
  );

  const overdueSchedules = schedules.filter(
    (schedule) => schedule.schedule_status === "OVERDUE"
  );

  const dueSoonSchedules = schedules.filter(
    (schedule) => schedule.schedule_status === "DUE_SOON"
  );

  const upcomingSchedules = schedules.filter(
    (schedule) => schedule.schedule_status === "UPCOMING"
  );

  return (
    <div className="space-y-8">
      <DashboardHeader
        label="ADMIN DASHBOARD"
        title={`Welcome back, ${
          user.first_name || user.username
        }`}
        description="Manage your organizations, assets, users, and maintenance operations."
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Companies"
          value={companies.length}
          description="Registered organizations"
          icon="🏢"
        />

        <StatCard
          title="Users"
          value={users.length}
          description={`${technicians.length} technicians · ${clients.length} clients`}
          icon="👥"
        />

        <StatCard
          title="Assets"
          value={assets.length}
          description="Assets currently registered"
          icon="📦"
        />

        <StatCard
          title="Work Orders"
          value={workOrders.length}
          description="Total maintenance work orders"
          icon="🔧"
        />
      </div>

      {/* Maintenance overview */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900">
        <div className="border-b border-slate-800 p-6">
          <h2 className="text-lg font-semibold text-white">
            Maintenance Overview
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Current maintenance schedule status
          </p>
        </div>

        <div className="space-y-5 p-6">
          <StatusRow
            label="Overdue"
            value={overdueSchedules.length}
            status="danger"
          />

          <StatusRow
            label="Due Soon"
            value={dueSoonSchedules.length}
            status="warning"
          />

          <StatusRow
            label="Upcoming"
            value={upcomingSchedules.length}
            status="success"
          />
        </div>
      </section>

      {/* Work order status */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900">
        <div className="border-b border-slate-800 p-6">
          <h2 className="text-lg font-semibold text-white">
            Work Order Status
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Current work order pipeline
          </p>
        </div>

        <div className="space-y-5 p-6">
          <StatusRow
            label="Pending"
            value={pendingWorkOrders.length}
            status="warning"
          />

          <StatusRow
            label="In Progress"
            value={inProgressWorkOrders.length}
            status="info"
          />

          <StatusRow
            label="Completed"
            value={completedWorkOrders.length}
            status="success"
          />
        </div>
      </section>

      <ReportsSection reports={reports} />

<QuotesSection quotes={quotes} />
    </div>
  );
}