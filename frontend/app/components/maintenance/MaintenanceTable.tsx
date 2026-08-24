"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import MaintenanceStatusBadge from "./MaintenanceStatusBadge";
import MaintenancePriorityBadge from "./MaintenancePriorityBadge";

import {
  getMaintenanceReports,
  MaintenanceReport,
} from "./maintenance-api";

interface MaintenanceTableProps {
  search: string;
  status: string;
  priority: string;
}

export default function MaintenanceTable({
  search,
  status,
  priority,
}: MaintenanceTableProps) {
  const [reports, setReports] = useState<MaintenanceReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadReports() {
      try {
        setLoading(true);
        setError(null);

        const data = await getMaintenanceReports();
        setReports(data);
      } catch (err) {
        console.error("Failed to load maintenance reports:", err);

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load maintenance reports."
        );
      } finally {
        setLoading(false);
      }
    }

    loadReports();
  }, []);

  const filteredReports = useMemo(() => {
    const query = search.trim().toLowerCase();

    return reports.filter((report) => {
      const matchesSearch =
        !query ||
        report.asset_name?.toLowerCase().includes(query) ||
        report.technician_username?.toLowerCase().includes(query) ||
        report.summary?.toLowerCase().includes(query) ||
        report.findings?.toLowerCase().includes(query);

      const matchesStatus =
        status === "ALL" ||
        report.status?.toUpperCase() === status;

      const matchesPriority =
        priority === "ALL" ||
        report.priority?.toUpperCase() === priority;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPriority
      );
    });
  }, [reports, search, status, priority]);

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
      <div className="flex flex-col gap-1 border-b border-slate-800 p-5">
        <h2 className="font-semibold text-white">
          Maintenance Reports
        </h2>

        <p className="text-sm text-slate-500">
          Showing {filteredReports.length} of {reports.length} reports.
        </p>
      </div>

      {loading ? (
        <div className="flex min-h-60 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-700 border-t-blue-500" />
        </div>
      ) : error ? (
        <div className="p-12 text-center">
          <h3 className="font-semibold text-red-400">
            Failed to load reports
          </h3>

          <p className="mt-2 text-sm text-slate-500">
            {error}
          </p>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="p-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 text-xl text-slate-500">
            ▣
          </div>

          <h3 className="mt-4 font-semibold text-white">
            No maintenance reports found
          </h3>

          <p className="mt-2 text-sm text-slate-500">
            Try changing your search or filter criteria.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-225">
            <thead>
              <tr className="border-b border-slate-800 text-left">
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Asset
                </th>

                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Technician
                </th>

                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Priority
                </th>

                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Status
                </th>

                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Review
                </th>

                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Date
                </th>

                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800">
              {filteredReports.map((report) => (
                <tr
                  key={report.id}
                  className="transition hover:bg-slate-800/30"
                >
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 font-semibold text-blue-400">
                        {report.asset_name
                          ?.charAt(0)
                          .toUpperCase() || "A"}
                      </div>

                      <div>
                        <p className="font-medium text-white">
                          {report.asset_name ||
                            `Asset #${report.asset_id}`}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          Asset #{report.asset_id}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-5 text-sm text-slate-400">
                    {report.technician_username}
                  </td>

                  <td className="px-6 py-5">
                    <MaintenancePriorityBadge
                      priority={report.priority}
                    />
                  </td>

                  <td className="px-6 py-5">
                    <MaintenanceStatusBadge
                      status={report.status}
                    />
                  </td>

                  <td className="px-6 py-5">
                    <span className="rounded-full border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-300">
                      {report.review_status || "PENDING"}
                    </span>
                  </td>

                  <td className="px-6 py-5 text-sm text-slate-400">
                    {new Date(
                      report.created_at
                    ).toLocaleDateString()}
                  </td>

                  <td className="px-6 py-5 text-right">
                    <Link
                      href={`/maintenance/${report.id}`}
                      className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-blue-500 hover:text-blue-400"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}