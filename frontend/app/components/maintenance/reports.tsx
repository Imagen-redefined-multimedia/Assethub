
"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import { apiFetch, apiJson } from "@/lib/api";

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

  review_status?: string;
  reviewed_at?: string | null;
  review_comment?: string | null;

  created_at: string;
  updated_at: string;

  photos: MaintenanceReportPhoto[];
};

type MaintenanceReportPhoto = {
  id: number;
  image: string;
  photo_type: "ISSUE" | "FIXED";
  uploaded_at: string;
};

type Maintenance = {
  id: number;
  work_order: number;

  work_order_title: string;
  work_order_description: string;
  work_order_status: string;

  company_id: number;
  company_name: string;

  client_id: number;
  client_username: string;
  client_email: string;
  client_first_name: string;
  client_last_name: string;

  asset_id: number;
  asset_name: string;
  asset_serial_number: string;
  asset_description: string;

  technician: number;
  technician_username: string;

  description: string;
  status: string;
};

type ReportForm = {
  maintenance: string;
  summary: string;
  findings: string;
  work_performed: string;
  parts_replaced: string;
  priority: string;
  status: string;
};

export default function MaintenanceReportsPage() {
  const [reports, setReports] = useState<
    MaintenanceReport[]
  >([]);

  const [maintenanceTasks, setMaintenanceTasks] =
    useState<Maintenance[]>([]);

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showModal, setShowModal] =
    useState(false);

  const [selectedReport, setSelectedReport] =
    useState<MaintenanceReport | null>(null);

  const [showDetails, setShowDetails] =
    useState(false);

  const [form, setForm] = useState<ReportForm>({
    maintenance: "",
    summary: "",
    findings: "",
    work_performed: "",
    parts_replaced: "",
    priority: "MEDIUM",
    status: "COMPLETED",
  });

  async function getReports() {
    try {
      setLoading(true);
      setError("");

      const data = await apiJson<
        MaintenanceReport[] | {
          results: MaintenanceReport[];
        }
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

  async function getMaintenanceTasks() {
    try {
      const data = await apiJson<
        Maintenance[] | {
          results: Maintenance[];
        }
      >("/api/maintenance/");

      setMaintenanceTasks(
        Array.isArray(data)
          ? data
          : data.results ?? []
      );
    } catch (err) {
      console.error(
        "Failed to load maintenance tasks:",
        err
      );
    }
  }

  useEffect(() => {
    getReports();
    getMaintenanceTasks();
  }, []);

  const filteredReports = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return reports;
    }

    return reports.filter((report) =>
      [
        report.asset_name,
        report.technician_username,
        report.summary,
        report.priority,
        report.status,
      ]
        .filter(Boolean)
        .some((value) =>
          value
            .toLowerCase()
            .includes(query)
        )
    );
  }, [reports, search]);

  const openCreateModal = () => {
    setForm({
      maintenance: "",
      summary: "",
      findings: "",
      work_performed: "",
      parts_replaced: "",
      priority: "MEDIUM",
      status: "COMPLETED",
    });

    setError("");
    setSuccess("");
    setShowModal(true);
  };

  const closeCreateModal = () => {
    if (saving) return;

    setShowModal(false);
  };

  const openDetails = (
    report: MaintenanceReport
  ) => {
    setSelectedReport(report);
    setShowDetails(true);
  };

  const closeDetails = () => {
    setSelectedReport(null);
    setShowDetails(false);
  };

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!form.maintenance) {
      setError(
        "Please select a maintenance task."
      );
      return;
    }

    if (!form.summary.trim()) {
      setError("Summary is required.");
      return;
    }

    if (!form.findings.trim()) {
      setError("Findings are required.");
      return;
    }

    try {
      setSaving(true);

      const response = await apiFetch(
        "/api/maintenance-reports/",
        {
          method: "POST",
          body: JSON.stringify({
            maintenance: Number(
              form.maintenance
            ),
            summary: form.summary.trim(),
            findings: form.findings.trim(),
            work_performed:
              form.work_performed.trim(),
            parts_replaced:
              form.parts_replaced.trim(),
            priority: form.priority,
            status: form.status,
          }),
        }
      );

      const data = await response
        .json()
        .catch(() => null);

      if (response.status === 401) {
        localStorage.removeItem(
          "access_token"
        );

        localStorage.removeItem(
          "refresh_token"
        );

        window.location.href = "/login";
        return;
      }

      if (!response.ok) {
        throw new Error(
          extractApiError(data) ||
            "Unable to create maintenance report."
        );
      }

      setSuccess(
        "Maintenance report created successfully."
      );

      setShowModal(false);

      await getReports();
      await getMaintenanceTasks();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}

      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium text-blue-400">
            MAINTENANCE
          </p>

          <h1 className="mt-1 text-3xl font-bold text-white">
            Maintenance Reports
          </h1>

          <p className="mt-2 text-slate-400">
            Track inspection findings, work performed,
            priorities and maintenance outcomes.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
        >
          + Create Report
        </button>
      </div>

      {/* Feedback */}

      {success && (
        <div className="rounded-xl border border-emerald-900 bg-emerald-950/30 px-5 py-4 text-sm text-emerald-300">
          {success}
        </div>
      )}

      {error && !showModal && (
        <div className="rounded-xl border border-red-900 bg-red-950/30 px-5 py-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Stats */}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Reports"
          value={reports.length}
        />

        <StatCard
          label="High Priority"
          value={
            reports.filter(
              (report) =>
                report.priority === "HIGH" ||
                report.priority === "CRITICAL"
            ).length
          }
        />

        <StatCard
          label="Completed"
          value={
            reports.filter(
              (report) =>
                report.status === "COMPLETED"
            ).length
          }
        />

        <StatCard
          label="Pending Review"
          value={
            reports.filter(
              (report) =>
                report.review_status ===
                  "PENDING" ||
                !report.review_status
            ).length
          }
        />
      </div>

      {/* Reports */}

      <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
        <div className="flex flex-col gap-4 border-b border-slate-800 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-semibold text-white">
              Maintenance Reports
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Review maintenance activity and
              inspection results.
            </p>
          </div>

          <input
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search reports..."
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 md:w-80"
          />
        </div>

        {loading ? (
          <div className="flex min-h-60 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-700 border-t-blue-500" />
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 text-2xl text-slate-500">
              ▣
            </div>

            <h3 className="mt-4 font-semibold text-white">
              {search
                ? "No reports found"
                : "No maintenance reports yet"}
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              {search
                ? "Try a different search term."
                : "Create a maintenance report to get started."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
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
                {filteredReports.map(
                  (report) => (
                    <tr
                      key={report.id}
                      className="transition hover:bg-slate-800/30"
                    >
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

                      <td className="px-6 py-5 text-sm text-slate-400">
                        {report.technician_username}
                      </td>

                      <td className="px-6 py-5">
                        <PriorityBadge
                          priority={
                            report.priority
                          }
                        />
                      </td>

                      <td className="px-6 py-5">
                        <StatusBadge
                          status={report.status}
                        />
                      </td>

                      <td className="px-6 py-5">
                        <span className="text-xs text-slate-400">
                          {report.review_status ||
                            "PENDING"}
                        </span>
                      </td>

                      <td className="px-6 py-5 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            openDetails(report)
                          }
                          className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-blue-500 hover:text-blue-400"
                        >
                          View Report
                        </button>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Create Report Modal */}

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/70 px-4 py-8 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
            <div className="border-b border-slate-800 p-6">
              <h2 className="text-xl font-semibold text-white">
                Create Maintenance Report
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Record the results of a maintenance
                task.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-6"
            >
              {error && (
                <div className="rounded-lg border border-red-900 bg-red-950/30 px-4 py-3 text-sm text-red-300">
                  {error}
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Maintenance Task
                </label>

                <select
                  value={form.maintenance}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      maintenance:
                        event.target.value,
                    })
                  }
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
                >
                  <option value="">
                    Select maintenance task
                  </option>

                  {maintenanceTasks.map(
                    (maintenance) => (
                      <option
                        key={maintenance.id}
                        value={maintenance.id}
                      >
                        #{maintenance.id} —{" "}
                        {maintenance.asset_name} —{" "}
                        {maintenance.work_order_title}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Summary
                </label>

                <textarea
                  value={form.summary}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      summary:
                        event.target.value,
                    })
                  }
                  required
                  rows={3}
                  placeholder="Briefly summarize the maintenance visit..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Findings
                </label>

                <textarea
                  value={form.findings}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      findings:
                        event.target.value,
                    })
                  }
                  required
                  rows={4}
                  placeholder="Describe faults, defects or observations..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Work Performed
                </label>

                <textarea
                  value={form.work_performed}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      work_performed:
                        event.target.value,
                    })
                  }
                  rows={4}
                  placeholder="Describe the maintenance work performed..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Parts Replaced
                </label>

                <textarea
                  value={form.parts_replaced}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      parts_replaced:
                        event.target.value,
                    })
                  }
                  rows={3}
                  placeholder="List replaced parts, if any..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Priority
                  </label>

                  <select
                    value={form.priority}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        priority:
                          event.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
                  >
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
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Status
                  </label>

                  <select
                    value={form.status}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        status:
                          event.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
                  >
                    <option value="COMPLETED">
                      Completed
                    </option>

                    <option value="IN_PROGRESS">
                      In Progress
                    </option>

                    <option value="PENDING">
                      Pending
                    </option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-800 pt-5">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  disabled={saving}
                  className="rounded-xl border border-slate-700 px-5 py-3 text-sm font-medium text-slate-300 hover:bg-slate-800 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Creating..."
                    : "Create Report"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Report Details */}

      {showDetails &&
        selectedReport && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/70 px-4 py-8 backdrop-blur-sm">
            <div className="w-full max-w-3xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
              <div className="flex items-start justify-between border-b border-slate-800 p-6">
                <div>
                  <p className="text-sm text-blue-400">
                    REPORT #{selectedReport.id}
                  </p>

                  <h2 className="mt-1 text-xl font-semibold text-white">
                    {selectedReport.asset_name}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Technician:{" "}
                    {
                      selectedReport.technician_username
                    }
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeDetails}
                  className="rounded-lg px-3 py-2 text-slate-400 hover:bg-slate-800 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6 p-6">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                    <p className="text-xs uppercase text-slate-500">
                      Priority
                    </p>

                    <div className="mt-2">
                      <PriorityBadge
                        priority={
                          selectedReport.priority
                        }
                      />
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                    <p className="text-xs uppercase text-slate-500">
                      Status
                    </p>

                    <div className="mt-2">
                      <StatusBadge
                        status={
                          selectedReport.status
                        }
                      />
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                    <p className="text-xs uppercase text-slate-500">
                      Review
                    </p>

                    <p className="mt-2 text-sm font-medium text-white">
                      {selectedReport.review_status ||
                        "PENDING"}
                    </p>
                  </div>
                </div>

                <ReportSection
                  title="Summary"
                  value={selectedReport.summary}
                />

                <ReportSection
                  title="Findings"
                  value={selectedReport.findings}
                />

                <ReportSection
                  title="Work Performed"
                  value={
                    selectedReport.work_performed
                  }
                />

                <ReportSection
                  title="Parts Replaced"
                  value={
                    selectedReport.parts_replaced
                  }
                />

                {selectedReport.photos.length >
                  0 && (
                  <div>
                    <h3 className="mb-3 text-sm font-semibold text-white">
                      Maintenance Photos
                    </h3>

                    <div className="grid gap-4 sm:grid-cols-2">
                      {selectedReport.photos.map(
                        (photo) => (
                          <div
                            key={photo.id}
                            className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950"
                          >
                            <img
                              src={photo.image}
                              alt={`${photo.photo_type} maintenance photo`}
                              className="h-56 w-full object-cover"
                            />

                            <div className="p-3">
                              <span className="text-xs font-medium text-slate-400">
                                {photo.photo_type}
                              </span>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

                {selectedReport.review_comment && (
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">
                    <p className="text-xs font-semibold uppercase text-slate-500">
                      Review Comment
                    </p>

                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      {
                        selectedReport.review_comment
                      }
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
    </div>
  );
}

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

function PriorityBadge({
  priority,
}: {
  priority: string;
}) {
  const classes =
    priority === "CRITICAL"
      ? "bg-red-950 text-red-300 border-red-900"
      : priority === "HIGH"
      ? "bg-orange-950 text-orange-300 border-orange-900"
      : priority === "MEDIUM"
      ? "bg-yellow-950 text-yellow-300 border-yellow-900"
      : "bg-slate-800 text-slate-300 border-slate-700";

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${classes}`}
    >
      {priority}
    </span>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const classes =
    status === "COMPLETED"
      ? "bg-emerald-950 text-emerald-300 border-emerald-900"
      : status === "IN_PROGRESS"
      ? "bg-blue-950 text-blue-300 border-blue-900"
      : "bg-slate-800 text-slate-300 border-slate-700";

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${classes}`}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}

function ReportSection({
  title,
  value,
}: {
  title: string;
  value?: string;
}) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-white">
        {title}
      </h3>

      <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
        <p className="whitespace-pre-wrap text-sm leading-6 text-slate-300">
          {value?.trim() || "No information provided."}
        </p>
      </div>
    </div>
  );
}

function extractApiError(
  data: unknown
): string | null {
  if (!data || typeof data !== "object") {
    return null;
  }

  const object = data as Record<
    string,
    unknown
  >;

  if (typeof object.detail === "string") {
    return object.detail;
  }

  for (const value of Object.values(object)) {
    if (typeof value === "string") {
      return value;
    }

    if (
      Array.isArray(value) &&
      typeof value[0] === "string"
    ) {
      return value[0];
    }
  }

  return null;
}
