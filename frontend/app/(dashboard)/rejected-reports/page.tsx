"use client";

import { useEffect, useState } from "react";

import {
  getRejectedMaintenanceReports,
  reassignMaintenance,
  MaintenanceReport,
} from "@/app/components/maintenance/maintenance-api";

type Technician = {
  id: number;
  username: string;
  first_name?: string;
  last_name?: string;
  role: "ADMIN" | "TECHNICIAN" | "CLIENT";
  is_active?: boolean;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function RejectedReportsPage() {
  const [reports, setReports] = useState<MaintenanceReport[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedReport, setSelectedReport] =
    useState<MaintenanceReport | null>(null);

  const [selectedTechnician, setSelectedTechnician] =
    useState("");

  const [reassigning, setReassigning] = useState(false);

  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("access_token");

        if (!token) {
          throw new Error("You are not authenticated.");
        }

        const [rejectedReports, usersResponse] =
          await Promise.all([
            getRejectedMaintenanceReports(),

            fetch(`${API_URL}/api/users/`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }),
          ]);

        if (!usersResponse.ok) {
          throw new Error("Failed to load technicians.");
        }

        const usersData = await usersResponse.json();

        const users: Technician[] =
          usersData.results ?? usersData;

        setReports(rejectedReports);

        setTechnicians(
          users.filter(
            (user) =>
              user.role === "TECHNICIAN" &&
              user.is_active !== false
          )
        );
      } catch (err) {
        console.error(err);

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load rejected reports."
        );
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  async function handleReassign() {
    if (!selectedReport || !selectedTechnician) {
      return;
    }

    try {
      setReassigning(true);
      setError("");
      setSuccessMessage("");

      const result = await reassignMaintenance(
        selectedReport.id,
        Number(selectedTechnician)
      );

      setReports((current) =>
        current.filter(
          (report) => report.id !== selectedReport.id
        )
      );

      setSelectedReport(null);
      setSelectedTechnician("");

      setSuccessMessage(
        result?.message ||
          "Maintenance reassigned successfully."
      );
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to reassign maintenance."
      );
    } finally {
      setReassigning(false);
    }
  }

  function getPriorityClass(priority: string) {
    switch (priority) {
      case "CRITICAL":
        return "border-red-500/20 bg-red-500/10 text-red-400";

      case "HIGH":
        return "border-orange-500/20 bg-orange-500/10 text-orange-400";

      case "MEDIUM":
        return "border-yellow-500/20 bg-yellow-500/10 text-yellow-400";

      default:
        return "border-blue-500/20 bg-blue-500/10 text-blue-400";
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-700 border-t-blue-500" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      {/* Header */}
      <div>
        <p className="text-sm font-medium text-red-400">
          MAINTENANCE
        </p>

        <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">
          Rejected Reports
        </h1>

        <p className="mt-2 max-w-2xl text-sm text-slate-400 sm:text-base">
          Review rejected maintenance reports and reassign
          maintenance tasks to technicians.
        </p>
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Statistics */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-sm text-slate-500">
            Rejected Reports
          </p>

          <p className="mt-2 text-3xl font-bold text-white">
            {reports.length}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-sm text-slate-500">
            Available Technicians
          </p>

          <p className="mt-2 text-3xl font-bold text-blue-400">
            {technicians.length}
          </p>
        </div>
      </div>

      {/* Reports */}
      <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
        <div className="border-b border-slate-800 px-5 py-5 sm:px-6">
          <h2 className="text-lg font-semibold text-white">
            Reports Requiring Action
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            These reports have been rejected and require
            reassignment.
          </p>
        </div>

        {reports.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-2xl text-emerald-400">
              ✓
            </div>

            <h3 className="mt-4 text-lg font-semibold text-white">
              No rejected reports
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              There are currently no rejected maintenance
              reports requiring action.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {reports.map((report) => (
              <div
                key={report.id}
                className="p-5 transition hover:bg-slate-800/30 sm:p-6"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  {/* Report information */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-lg font-semibold text-white">
                        {report.asset_name}
                      </h3>

                      <span
                        className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${getPriorityClass(
                          report.priority
                        )}`}
                      >
                        {report.priority}
                      </span>

                      <span className="rounded-full border border-red-500/20 bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-red-400">
                        REJECTED
                      </span>
                    </div>

                    <p className="mt-1 text-xs text-slate-500">
                      Maintenance Report #{report.id}
                    </p>

                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                          Technician
                        </p>

                        <p className="mt-1 text-sm text-slate-300">
                          {report.technician_username}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                          Reviewed
                        </p>

                        <p className="mt-1 text-sm text-slate-300">
                          {report.reviewed_at
                            ? new Date(
                                report.reviewed_at
                              ).toLocaleDateString()
                            : "—"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5">
                      <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                        Rejection Reason
                      </p>

                      <div className="mt-2 rounded-xl border border-slate-800 bg-slate-950 p-4">
                        <p className="text-sm leading-6 text-slate-300">
                          {report.review_comment ||
                            "No rejection comment was provided."}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action */}
                  <div className="shrink-0 lg:pl-6">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedReport(report);
                        setSelectedTechnician("");
                        setError("");
                      }}
                      className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 lg:w-auto"
                    >
                      Reassign Maintenance
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Reassign modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
            <div className="border-b border-slate-800 px-5 py-5 sm:px-6">
              <h2 className="text-lg font-semibold text-white">
                Reassign Maintenance
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Select a technician to handle the rejected
                maintenance task.
              </p>
            </div>

            <div className="space-y-5 p-5 sm:p-6">
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                  Asset
                </p>

                <p className="mt-1 font-medium text-white">
                  {selectedReport.asset_name}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Report #{selectedReport.id}
                </p>
              </div>

              <div>
                <label
                  htmlFor="technician"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Assign Technician
                </label>

                <select
                  id="technician"
                  value={selectedTechnician}
                  onChange={(event) =>
                    setSelectedTechnician(event.target.value)
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">
                    Select a technician
                  </option>

                  {technicians.map((technician) => {
                    const name =
                      technician.first_name ||
                      technician.last_name
                        ? `${technician.first_name ?? ""} ${
                            technician.last_name ?? ""
                          }`.trim()
                        : technician.username;

                    return (
                      <option
                        key={technician.id}
                        value={technician.id}
                      >
                        {name}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-800 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
              <button
                type="button"
                disabled={reassigning}
                onClick={() => {
                  setSelectedReport(null);
                  setSelectedTechnician("");
                }}
                className="w-full rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white disabled:opacity-50 sm:w-auto"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={
                  reassigning || !selectedTechnician
                }
                onClick={handleReassign}
                className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                {reassigning
                  ? "Reassigning..."
                  : "Confirm Reassignment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}