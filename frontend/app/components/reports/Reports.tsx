"use client";

import { useEffect, useMemo, useState } from "react";
import { apiJson } from "@/lib/api";

type Photo = {
  id: number;
  image: string;
  photo_type: "ISSUE" | "FIXED";
  uploaded_at: string;
};

type MaintenanceReport = {
  id: number;
  maintenance: number;

  technician_username: string;

  asset_id: number;
  asset_name: string;
  client_id: number;

  summary: string;
  findings: string;
  work_performed: string;
  parts_replaced: string;

  priority: string;
  status: string;

  photos: Photo[];

  created_at: string;
  updated_at: string;

  review_status: string;
  reviewed_at: string | null;
  review_comment: string | null;
};

export default function MaintenanceReportsPage() {
  const [reports, setReports] = useState<MaintenanceReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [priority, setPriority] = useState("ALL");
  const [status, setStatus] = useState("ALL");

  const [selectedReport, setSelectedReport] =
    useState<MaintenanceReport | null>(null);

  async function getReports() {
    try {
      setLoading(true);
      setError("");

      const data = await apiJson<
        MaintenanceReport[] | { results: MaintenanceReport[] }
      >("/api/maintenance-reports/");

      setReports(
        Array.isArray(data)
          ? data
          : data.results ?? []
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load maintenance reports."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    getReports();
  }, []);

  const filteredReports = useMemo(() => {
    const query = search.trim().toLowerCase();

    return reports.filter((report) => {
      const matchesSearch =
        !query ||
        report.asset_name
          ?.toLowerCase()
          .includes(query) ||
        report.technician_username
          ?.toLowerCase()
          .includes(query) ||
        report.summary
          ?.toLowerCase()
          .includes(query);

      const matchesPriority =
        priority === "ALL" ||
        report.priority === priority;

      const matchesStatus =
        status === "ALL" ||
        report.status === status;

      return (
        matchesSearch &&
        matchesPriority &&
        matchesStatus
      );
    });
  }, [reports, search, priority, status]);

  const statistics = useMemo(() => {
    return {
      total: reports.length,

      critical: reports.filter(
        (report) =>
          report.priority === "CRITICAL"
      ).length,

      pending: reports.filter(
        (report) =>
          report.review_status === "PENDING"
      ).length,

      completed: reports.filter(
        (report) =>
          report.status === "COMPLETED"
      ).length,
    };
  }, [reports]);

  return (
    <div className="space-y-8">

      {/* HEADER */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium text-blue-400">
            MAINTENANCE
          </p>

          <h1 className="mt-1 text-3xl font-bold text-white">
            Maintenance Reports
          </h1>

          <p className="mt-2 text-slate-400">
            Review maintenance work performed on registered assets.
          </p>
        </div>

        <button
          type="button"
          onClick={getReports}
          className="rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-300 transition hover:bg-slate-800"
        >
          Refresh
        </button>
      </div>

      {/* ERROR */}
      {error && (
        <div className="rounded-xl border border-red-900 bg-red-950/30 px-5 py-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* STATISTICS */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <StatCard
          label="Total Reports"
          value={statistics.total}
        />

        <StatCard
          label="Critical"
          value={statistics.critical}
        />

        <StatCard
          label="Pending Review"
          value={statistics.pending}
        />

        <StatCard
          label="Completed"
          value={statistics.completed}
        />

      </div>

      {/* MAIN CARD */}
      <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">

        {/* TOOLBAR */}
        <div className="flex flex-col gap-4 border-b border-slate-800 p-5 xl:flex-row xl:items-center xl:justify-between">

          <div>
            <h2 className="font-semibold text-white">
              Maintenance Reports
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {filteredReports.length} report
              {filteredReports.length !== 1 ? "s" : ""} found.
            </p>
          </div>

          <div className="flex flex-col gap-3 md:flex-row">

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search reports..."
              className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
            />

            <select
              value={priority}
              onChange={(event) =>
                setPriority(event.target.value)
              }
              className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
            >
              <option value="ALL">
                All priorities
              </option>
              <option value="LOW">
                Low
              </option>
              <option value="MEDIUM">
                Medium
              </option>
              <option value="HIGH">
                High
              </option>
              <option value="CRITICAL">
                Critical
              </option>
            </select>

            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value)
              }
              className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
            >
              <option value="ALL">
                All statuses
              </option>
              <option value="PENDING">
                Pending
              </option>
              <option value="IN_PROGRESS">
                In Progress
              </option>
              <option value="COMPLETED">
                Completed
              </option>
            </select>

          </div>
        </div>

        {/* CONTENT */}
        {loading ? (
          <div className="flex min-h-60 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-700 border-t-blue-500" />
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="p-12 text-center">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 text-2xl text-slate-500">
              ✓
            </div>

            <h3 className="mt-4 font-semibold text-white">
              No maintenance reports
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              There are no reports matching your current filters.
            </p>

          </div>
        ) : (
          <div className="overflow-x-auto">

            <table className="w-full min-w-[950px]">

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

                    {/* ASSET */}
                    <td className="px-6 py-5">

                      <div>
                        <p className="font-medium text-white">
                          {report.asset_name}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          Asset #{report.asset_id}
                        </p>
                      </div>

                    </td>

                    {/* TECHNICIAN */}
                    <td className="px-6 py-5">

                      <p className="text-sm text-slate-300">
                        {report.technician_username}
                      </p>

                    </td>

                    {/* PRIORITY */}
                    <td className="px-6 py-5">
                      <PriorityBadge
                        priority={report.priority}
                      />
                    </td>

                    {/* STATUS */}
                    <td className="px-6 py-5">
                      <StatusBadge
                        status={report.status}
                      />
                    </td>

                    {/* REVIEW */}
                    <td className="px-6 py-5">
                      <ReviewBadge
                        status={report.review_status}
                      />
                    </td>

                    {/* ACTION */}
                    <td className="px-6 py-5">

                      <div className="flex justify-end">

                        <button
                          type="button"
                          onClick={() =>
                            setSelectedReport(report)
                          }
                          className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-blue-500 hover:text-blue-400"
                        >
                          View Report
                        </button>

                      </div>

                    </td>

                  </tr>
                ))}

              </tbody>

            </table>

          </div>
        )}

      </section>

      {/* REPORT DETAIL MODAL */}
      {selectedReport && (
        <ReportModal
          report={selectedReport}
          onClose={() =>
            setSelectedReport(null)
          }
        />
      )}

    </div>
  );
}


/* ============================================================
   STAT CARD
============================================================ */

function StatCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

      <p className="text-sm text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-3xl font-bold text-white">
        {value}
      </p>

    </div>
  );
}


/* ============================================================
   PRIORITY
============================================================ */

function PriorityBadge({
  priority,
}: {
  priority: string;
}) {
  const styles: Record<string, string> = {
    LOW:
      "border-emerald-900 bg-emerald-950/30 text-emerald-400",

    MEDIUM:
      "border-yellow-900 bg-yellow-950/30 text-yellow-400",

    HIGH:
      "border-orange-900 bg-orange-950/30 text-orange-400",

    CRITICAL:
      "border-red-900 bg-red-950/30 text-red-400",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${
        styles[priority] ??
        "border-slate-700 bg-slate-800 text-slate-300"
      }`}
    >
      {priority}
    </span>
  );
}


/* ============================================================
   STATUS
============================================================ */

function StatusBadge({
  status,
}: {
  status: string;
}) {
  return (
    <span className="inline-flex rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-medium text-slate-300">
      {status.replaceAll("_", " ")}
    </span>
  );
}


/* ============================================================
   REVIEW
============================================================ */

function ReviewBadge({
  status,
}: {
  status: string;
}) {
  const styles: Record<string, string> = {
    PENDING:
      "border-yellow-900 bg-yellow-950/30 text-yellow-400",

    ACCEPTED:
      "border-emerald-900 bg-emerald-950/30 text-emerald-400",

    REJECTED:
      "border-red-900 bg-red-950/30 text-red-400",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${
        styles[status] ??
        "border-slate-700 bg-slate-800 text-slate-300"
      }`}
    >
      {status?.replaceAll("_", " ") || "UNKNOWN"}
    </span>
  );
}


/* ============================================================
   REPORT MODAL
============================================================ */

function ReportModal({
  report,
  onClose,
}: {
  report: MaintenanceReport;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm">

      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">

        {/* HEADER */}
        <div className="flex items-start justify-between border-b border-slate-800 p-6">

          <div>

            <p className="text-sm font-medium text-blue-400">
              MAINTENANCE REPORT #{report.id}
            </p>

            <h2 className="mt-1 text-2xl font-bold text-white">
              {report.asset_name}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Technician: {report.technician_username}
            </p>

          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            ✕
          </button>

        </div>

        {/* BODY */}
        <div className="space-y-6 p-6">

          {/* SUMMARY */}
          <div>
            <h3 className="text-sm font-semibold text-white">
              Summary
            </h3>

            <p className="mt-2 rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm leading-6 text-slate-300">
              {report.summary || "No summary provided."}
            </p>
          </div>

          {/* FINDINGS */}
          <div>
            <h3 className="text-sm font-semibold text-white">
              Findings
            </h3>

            <p className="mt-2 rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm leading-6 text-slate-300">
              {report.findings || "No findings provided."}
            </p>
          </div>

          {/* WORK */}
          <div>
            <h3 className="text-sm font-semibold text-white">
              Work Performed
            </h3>

            <p className="mt-2 rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm leading-6 text-slate-300">
              {report.work_performed || "No work details provided."}
            </p>
          </div>

          {/* PARTS */}
          <div>
            <h3 className="text-sm font-semibold text-white">
              Parts Replaced
            </h3>

            <p className="mt-2 rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm leading-6 text-slate-300">
              {report.parts_replaced || "No parts recorded."}
            </p>
          </div>

          {/* PHOTOS */}
          {report.photos?.length > 0 && (
            <div>

              <h3 className="text-sm font-semibold text-white">
                Maintenance Photos
              </h3>

              <div className="mt-3 grid gap-4 sm:grid-cols-2">

                {report.photos.map((photo) => (
                  <div
                    key={photo.id}
                    className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950"
                  >

                    <img
                      src={photo.image}
                      alt={`${photo.photo_type} maintenance photo`}
                      className="h-64 w-full object-cover"
                    />

                    <div className="flex items-center justify-between p-3">

                      <span className="text-xs font-medium text-slate-300">
                        {photo.photo_type}
                      </span>

                      <span className="text-xs text-slate-600">
                        {new Date(
                          photo.uploaded_at
                        ).toLocaleDateString()}
                      </span>

                    </div>

                  </div>
                ))}

              </div>

            </div>
          )}

          {/* REVIEW */}
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">

            <div className="flex flex-wrap items-center justify-between gap-3">

              <div>
                <p className="text-sm font-semibold text-white">
                  Review
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Current review status
                </p>
              </div>

              <ReviewBadge
                status={report.review_status}
              />

            </div>

            {report.review_comment && (
              <div className="mt-4 border-t border-slate-800 pt-4">

                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                  Review Comment
                </p>

                <p className="mt-2 text-sm text-slate-300">
                  {report.review_comment}
                </p>

              </div>
            )}

          </div>

        </div>

        {/* FOOTER */}
        <div className="flex justify-end border-t border-slate-800 p-6">

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-800 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-700"
          >
            Close
          </button>

        </div>

      </div>

    </div>
  );
}