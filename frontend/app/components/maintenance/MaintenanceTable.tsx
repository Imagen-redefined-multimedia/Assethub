
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import MaintenanceStatusBadge from "./MaintenanceStatusBadge";
import MaintenancePriorityBadge from "./MaintenancePriorityBadge";
import {
  getMaintenanceReports,
  MaintenanceReport,
} from "./maintenance-api";

export default function MaintenanceTable() {
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

  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card text-card-foreground shadow-sm">
      {/* Header */}
      <div className="border-b border-border/60 px-6 py-5">
        <h2 className="font-semibold text-card-foreground">
          Maintenance Reports
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Review maintenance activity across your assets.
        </p>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex min-h-64 items-center justify-center px-6">
          <p className="text-sm text-muted-foreground">
            Loading maintenance reports...
          </p>
        </div>
      ) : error ? (
        <div className="flex min-h-64 items-center justify-center px-6 text-center">
          <div>
            <h3 className="font-medium text-destructive">
              Failed to load reports
            </h3>

            <p className="mt-1 text-sm text-muted-foreground">
              {error}
            </p>
          </div>
        </div>
      ) : reports.length === 0 ? (
        <div className="flex min-h-64 items-center justify-center px-6 text-center">
          <div>
            <h3 className="font-medium text-card-foreground">
              No maintenance reports
            </h3>

            <p className="mt-1 text-sm text-muted-foreground">
              Maintenance reports will appear here once
              technicians submit them.
            </p>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border/60 bg-muted/30">
              <tr>
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">
                  Asset
                </th>

                <th className="px-6 py-3 text-left font-medium text-muted-foreground">
                  Technician
                </th>

                <th className="px-6 py-3 text-left font-medium text-muted-foreground">
                  Priority
                </th>

                <th className="px-6 py-3 text-left font-medium text-muted-foreground">
                  Status
                </th>

                <th className="px-6 py-3 text-left font-medium text-muted-foreground">
                  Review
                </th>

                <th className="px-6 py-3 text-left font-medium text-muted-foreground">
                  Date
                </th>

                <th className="px-6 py-3 text-right font-medium text-muted-foreground">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border/50">
              {reports.map((report) => (
                <tr
                  key={report.id}
                  className="transition-colors hover:bg-muted/30"
                >
                  <td className="px-6 py-4 font-medium text-card-foreground">
                    {report.asset_name ||
                      `Asset #${report.asset_id}`}
                  </td>

                  <td className="px-6 py-4 text-muted-foreground">
                    {report.technician_username ||
                      "Unknown technician"}
                  </td>

                  <td className="px-6 py-4">
                    <MaintenancePriorityBadge
                      priority={report.priority}
                    />
                  </td>

                  <td className="px-6 py-4">
                    <MaintenanceStatusBadge
                      status={report.status}
                    />
                  </td>

                  <td className="px-6 py-4">
                    <span className="inline-flex rounded-full border border-border/60 bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                      {report.review_status || "PENDING"}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-muted-foreground">
                    {new Date(
                      report.created_at
                    ).toLocaleDateString()}
                  </td>

                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/maintenance/${report.id}`}
                      className="font-medium text-primary transition-colors hover:opacity-80 hover:underline"
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
    </div>
  );
}
