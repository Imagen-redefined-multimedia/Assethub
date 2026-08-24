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
    <div className="overflow-hidden rounded-lg border bg-white">
      <div className="border-b px-6 py-4">
        <h2 className="font-semibold">Maintenance Reports</h2>

        <p className="text-sm text-muted-foreground">
          Review maintenance activity across your assets.
        </p>
      </div>

      {loading ? (
        <div className="flex min-h-64 items-center justify-center px-6">
          <p className="text-sm text-muted-foreground">
            Loading maintenance reports...
          </p>
        </div>
      ) : error ? (
        <div className="flex min-h-64 items-center justify-center px-6 text-center">
          <div>
            <h3 className="font-medium text-red-600">
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
            <h3 className="font-medium">
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
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left font-medium">
                  Asset
                </th>

                <th className="px-6 py-3 text-left font-medium">
                  Technician
                </th>

                <th className="px-6 py-3 text-left font-medium">
                  Priority
                </th>

                <th className="px-6 py-3 text-left font-medium">
                  Status
                </th>

                <th className="px-6 py-3 text-left font-medium">
                  Review
                </th>

                <th className="px-6 py-3 text-left font-medium">
                  Date
                </th>

                <th className="px-6 py-3 text-right font-medium">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {reports.map((report) => (
                <tr key={report.id}>
                  <td className="px-6 py-4 font-medium">
                    {report.asset_name}
                  </td>

                  <td className="px-6 py-4">
                    {report.technician_username}
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
                    {report.review_status}
                  </td>

                  <td className="px-6 py-4">
                    {new Date(
                      report.created_at
                    ).toLocaleDateString()}
                  </td>

                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/maintenance/${report.id}`}
                      className="font-medium hover:underline"
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