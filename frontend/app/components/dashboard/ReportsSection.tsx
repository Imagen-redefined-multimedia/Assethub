import PriorityBadge from "./PriorityBadge";
import ReviewBadge from "./ReviewBadge";

import type { MaintenanceReport } from "@/types/dashboard";

type ReportsSectionProps = {
  reports: MaintenanceReport[];
};

export default function ReportsSection({
  reports,
}: ReportsSectionProps) {
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