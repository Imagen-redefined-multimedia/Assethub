import Link from "next/link";

import DashboardHeader from "./DashboardHeader";
import StatCard from "./StatCard";
import StatusRow from "./StatusRow";
import PriorityBadge from "./PriorityBadge";
import ReviewBadge from "./ReviewBadge";

import type {
  Asset,
  MaintenanceReport,
  User,
  WorkOrder,
} from "@/types/dashboard";

type ClientDashboardProps = {
  user: User;
  assets: Asset[];
  workOrders: WorkOrder[];
  reports: MaintenanceReport[];
};

export default function ClientDashboard({
  user,
  assets,
  workOrders,
  reports,
}: ClientDashboardProps) {
  const pendingWorkOrders = workOrders.filter(
    (workOrder) => workOrder.status === "PENDING"
  );

  const inProgressWorkOrders = workOrders.filter(
    (workOrder) => workOrder.status === "IN_PROGRESS"
  );

  const completedWorkOrders = workOrders.filter(
    (workOrder) => workOrder.status === "COMPLETED"
  );

  const pendingReviews = reports.filter(
    (report) => report.review_status === "PENDING"
  );

  return (
    <div className="space-y-8">
      <DashboardHeader
        label="CLIENT DASHBOARD"
        title={`Welcome back, ${
          user.first_name || user.username
        }`}
        description="View your assets, work orders, and maintenance reports."
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="My Assets"
          value={assets.length}
          description="Assets assigned to your company"
          icon="📦"
        />

        <StatCard
          title="Work Orders"
          value={workOrders.length}
          description="Total work orders"
          icon="🔧"
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
          description={`${pendingReviews.length} awaiting review`}
          icon="📋"
        />
      </div>

      {/* Work order status */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-800 p-6">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Work Order Status
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Current status of your work orders
            </p>
          </div>

          <Link
            href="/work-orders"
            className="text-sm font-medium text-blue-400 hover:text-blue-300"
          >
            View all
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

      {/* Maintenance reports */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-800 p-6">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Maintenance Reports
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Recent reports for your assets
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
            {reports.slice(0, 4).map((report) => (
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

      {/* My assets */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-800 p-6">
          <div>
            <h2 className="text-lg font-semibold text-white">
              My Assets
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Assets belonging to your company
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

                <span className="shrink-0 rounded-lg bg-slate-800 px-3 py-1 text-xs text-slate-400">
                  Asset #{asset.id}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}