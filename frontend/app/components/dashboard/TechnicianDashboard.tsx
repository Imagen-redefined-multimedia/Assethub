import Link from "next/link";

import DashboardHeader from "./DashboardHeader";
import StatCard from "./StatCard";
import StatusRow from "./StatusRow";
import PriorityBadge from "./PriorityBadge";

import type {
  Asset,
  MaintenanceReport,
  User,
  WorkOrder,
} from "@/types/dashboard";

type TechnicianDashboardProps = {
  user: User;
  assets: Asset[];
  workOrders: WorkOrder[];
  reports: MaintenanceReport[];
};

export default function TechnicianDashboard({
  user,
  assets,
  workOrders,
  reports,
}: TechnicianDashboardProps) {
  const pendingWorkOrders = workOrders.filter(
    (workOrder) => workOrder.status === "PENDING"
  );

  const inProgressWorkOrders = workOrders.filter(
    (workOrder) => workOrder.status === "IN_PROGRESS"
  );

  const completedWorkOrders = workOrders.filter(
    (workOrder) => workOrder.status === "COMPLETED"
  );

  return (
    <div className="space-y-8">
      <DashboardHeader
        label="TECHNICIAN DASHBOARD"
        title={`Welcome back, ${
          user.first_name || user.username
        }`}
        description="Manage maintenance work, assets, and maintenance reports."
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Work Orders"
          value={workOrders.length}
          description="Assigned maintenance work"
          icon="🔧"
        />

        <StatCard
          title="Pending"
          value={pendingWorkOrders.length}
          description="Work orders waiting to be started"
          icon="⏳"
        />

        <StatCard
          title="In Progress"
          value={inProgressWorkOrders.length}
          description="Currently being worked on"
          icon="⚙️"
        />

        <StatCard
          title="Reports"
          value={reports.length}
          description="Maintenance reports submitted"
          icon="📋"
        />
      </div>

      {/* Maintenance pipeline */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-800 p-6">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Maintenance Pipeline
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Current status of your maintenance work
            </p>
          </div>

          <Link
            href="/maintenance"
            className="text-sm font-medium text-blue-400 hover:text-blue-300"
          >
            View maintenance
          </Link>
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

      {/* Recent reports */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-800 p-6">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Recent Reports
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Your recently submitted maintenance reports
            </p>
          </div>

          <Link
            href="/reports"
            className="text-sm font-medium text-blue-400 hover:text-blue-300"
          >
            View all
          </Link>
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
                    Status: {report.status}
                  </p>
                </div>

                <PriorityBadge
                  priority={report.priority}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Accessible assets */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-800 p-6">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Accessible Assets
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Assets available for maintenance
            </p>
          </div>

          <Link
            href="/assets"
            className="text-sm font-medium text-blue-400 hover:text-blue-300"
          >
            View all
          </Link>
        </div>

        {assets.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            No assets available.
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {assets.slice(0, 6).map((asset) => (
              <div
                key={asset.id}
                className="flex items-center justify-between gap-4 p-5"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-white">
                    {asset.name}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Serial: {asset.serial_number}
                  </p>
                </div>

                <span className="shrink-0 text-sm text-slate-500">
                  {asset.company_name || "Company"}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
