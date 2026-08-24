"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { apiFetch, apiJson } from "@/lib/api";

type Photo = {
  id: number;
  image?: string;
  photo?: string;
  caption?: string;
  created_at?: string;
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
  photos: Photo[];

  work_performed: string;
  parts_replaced: string;

  priority: string;
  status: string;

  created_at: string;
  updated_at: string;

  review_status: string;
  reviewed_at?: string | null;
  review_comment?: string | null;
};

type ReportForm = {
  summary: string;
  findings: string;
  work_performed: string;
  parts_replaced: string;
  priority: string;
  status: string;
  review_status: string;
  review_comment: string;
};

const priorityOptions = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
];

const statusOptions = [
  "PENDING",
  "IN_PROGRESS",
  "COMPLETED",
];

const reviewOptions = [
  "PENDING",
  "ACCEPTED",
  "REJECTED",
];

export default function ReportsPage() {
  const [reports, setReports] = useState<MaintenanceReport[]>([]);
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [reviewFilter, setReviewFilter] = useState("ALL");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [selectedReport, setSelectedReport] =
    useState<MaintenanceReport | null>(null);

  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState<ReportForm>({
    summary: "",
    findings: "",
    work_performed: "",
    parts_replaced: "",
    priority: "MEDIUM",
    status: "PENDING",
    review_status: "PENDING",
    review_comment: "",
  });

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
        priorityFilter === "ALL" ||
        report.priority === priorityFilter;

      const matchesReview =
        reviewFilter === "ALL" ||
        report.review_status === reviewFilter;

      return (
        matchesSearch &&
        matchesPriority &&
        matchesReview
      );
    });
  }, [
    reports,
    search,
    priorityFilter,
    reviewFilter,
  ]);

  const statistics = {
    total: reports.length,

    pending: reports.filter(
      (report) =>
        report.review_status === "PENDING"
    ).length,

    accepted: reports.filter(
      (report) =>
        report.review_status === "ACCEPTED"
    ).length,

    rejected: reports.filter(
      (report) =>
        report.review_status === "REJECTED"
    ).length,

    critical: reports.filter(
      (report) =>
        report.priority === "CRITICAL"
    ).length,
  };

  function openReport(report: MaintenanceReport) {
    setSelectedReport(report);

    setForm({
      summary: report.summary ?? "",
      findings: report.findings ?? "",
      work_performed:
        report.work_performed ?? "",
      parts_replaced:
        report.parts_replaced ?? "",
      priority: report.priority ?? "MEDIUM",
      status: report.status ?? "PENDING",
      review_status:
        report.review_status ?? "PENDING",
      review_comment:
        report.review_comment ?? "",
    });

    setError("");
    setSuccess("");
    setShowModal(true);
  }

  function closeModal() {
    if (saving) return;

    setShowModal(false);
    setSelectedReport(null);
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!selectedReport) return;

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await apiFetch(
        `/api/maintenance-reports/${selectedReport.id}/`,
        {
          method: "PATCH",
          body: JSON.stringify({
            summary: form.summary,
            findings: form.findings,
            work_performed:
              form.work_performed,
            parts_replaced:
              form.parts_replaced,
            priority: form.priority,
            status: form.status,
            review_status:
              form.review_status,
            review_comment:
              form.review_comment,
          }),
        }
      );

      if (response.status === 401) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.location.href = "/login";
        return;
      }

      const data = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          extractApiError(data) ||
            "Unable to update maintenance report."
        );
      }

      setSuccess(
        "Maintenance report updated successfully."
      );

      setShowModal(false);
      setSelectedReport(null);

      await getReports();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update report."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}

      <div>
        <p className="text-sm font-medium text-blue-400">
          MAINTENANCE
        </p>

        <h1 className="mt-1 text-3xl font-bold text-white">
          Maintenance Reports
        </h1>

        <p className="mt-2 text-slate-400">
          Review maintenance inspections, findings,
          priorities and technician reports.
        </p>
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

      {/* Statistics */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          title="Total Reports"
          value={statistics.total}
          icon="▥"
        />

        <StatCard
          title="Pending Review"
          value={statistics.pending}
          icon="◷"
        />

        <StatCard
          title="Accepted"
          value={statistics.accepted}
          icon="✓"
        />

        <StatCard
          title="Rejected"
          value={statistics.rejected}
          icon="!"
        />

        <StatCard
          title="Critical"
          value={statistics.critical}
          icon="⚠"
        />
      </div>

      {/* Reports */}

      <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
        {/* Toolbar */}

        <div className="flex flex-col gap-4 border-b border-slate-800 p-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="font-semibold text-white">
              Reports
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Maintenance reports submitted through
              AssetHub.
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
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500 md:w-64"
            />

            <select
              value={priorityFilter}
              onChange={(event) =>
                setPriorityFilter(event.target.value)
              }
              className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
            >
              <option value="ALL">
                All Priorities
              </option>

              {priorityOptions.map((priority) => (
                <option
                  key={priority}
                  value={priority}
                >
                  {priority}
                </option>
              ))}
            </select>

            <select
              value={reviewFilter}
              onChange={(event) =>
                setReviewFilter(event.target.value)
              }
              className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
            >
              <option value="ALL">
                All Reviews
              </option>

              {reviewOptions.map((status) => (
                <option
                  key={status}
                  value={status}
                >
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Loading */}

        {loading ? (
          <div className="flex min-h-60 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-700 border-t-blue-500" />
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 text-2xl text-slate-500">
              ▥
            </div>

            <h3 className="mt-4 font-semibold text-white">
              No maintenance reports found
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              {search ||
              priorityFilter !== "ALL" ||
              reviewFilter !== "ALL"
                ? "Try changing your filters."
                : "No reports have been submitted yet."}
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
                        priority={report.priority}
                      />
                    </td>

                    <td className="px-6 py-5">
                      <StatusBadge
                        status={report.status}
                      />
                    </td>

                    <td className="px-6 py-5">
                      <ReviewBadge
                        status={
                          report.review_status
                        }
                      />
                    </td>

                    <td className="px-6 py-5 text-sm text-slate-500">
                      {formatDate(
                        report.created_at
                      )}
                    </td>

                    <td className="px-6 py-5 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          openReport(report)
                        }
                        className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-blue-500 hover:text-blue-400"
                      >
                        View Report
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Detail / Edit Modal */}

      {showModal && selectedReport && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/70 px-4 py-8 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
            {/* Modal Header */}

            <div className="flex items-start justify-between border-b border-slate-800 p-6">
              <div>
                <p className="text-xs font-medium uppercase tracking-widest text-blue-400">
                  Maintenance Report #
                  {selectedReport.id}
                </p>

                <h2 className="mt-2 text-xl font-semibold text-white">
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
                onClick={closeModal}
                className="rounded-lg px-3 py-2 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-6 p-6"
            >
              {error && (
                <div className="rounded-lg border border-red-900 bg-red-950/30 px-4 py-3 text-sm text-red-300">
                  {error}
                </div>
              )}

              {/* Summary */}

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
                  rows={3}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
                />
              </div>

              {/* Findings */}

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
                  rows={5}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
                />
              </div>

              {/* Work */}

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
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
                />
              </div>

              {/* Parts */}

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
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
                />
              </div>

              {/* Selects */}

              <div className="grid gap-4 md:grid-cols-3">
                <SelectField
                  label="Priority"
                  value={form.priority}
                  options={priorityOptions}
                  onChange={(value) =>
                    setForm({
                      ...form,
                      priority: value,
                    })
                  }
                />

                <SelectField
                  label="Status"
                  value={form.status}
                  options={statusOptions}
                  onChange={(value) =>
                    setForm({
                      ...form,
                      status: value,
                    })
                  }
                />

                <SelectField
                  label="Review Status"
                  value={form.review_status}
                  options={reviewOptions}
                  onChange={(value) =>
                    setForm({
                      ...form,
                      review_status: value,
                    })
                  }
                />
              </div>

              {/* Review Comment */}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Review Comment
                </label>

                <textarea
                  value={form.review_comment}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      review_comment:
                        event.target.value,
                    })
                  }
                  rows={3}
                  placeholder="Add a review comment..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
                />
              </div>

              {/* Photos */}

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-300">
                    Inspection Photos
                  </label>

                  <span className="text-xs text-slate-500">
                    {selectedReport.photos?.length ??
                      0}{" "}
                    photo(s)
                  </span>
                </div>

                {selectedReport.photos?.length ? (
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                    {selectedReport.photos.map(
                      (photo) => {
                        const imageUrl =
                          photo.image ||
                          photo.photo;

                        return (
                          <div
                            key={photo.id}
                            className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950"
                          >
                            {imageUrl ? (
                              <img
                                src={imageUrl}
                                alt={
                                  photo.caption ||
                                  "Maintenance photo"
                                }
                                className="h-40 w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-40 items-center justify-center text-sm text-slate-600">
                                Image unavailable
                              </div>
                            )}

                            {photo.caption && (
                              <p className="p-3 text-xs text-slate-400">
                                {photo.caption}
                              </p>
                            )}
                          </div>
                        );
                      }
                    )}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-700 p-6 text-center text-sm text-slate-500">
                    No photos attached to this report.
                  </div>
                )}
              </div>

              {/* Actions */}

              <div className="flex justify-end gap-3 border-t border-slate-800 pt-5">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-slate-700 px-4 py-3 text-sm font-medium text-slate-300 hover:bg-slate-800 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-400">
            {title}
          </p>

          <p className="mt-3 text-3xl font-bold text-white">
            {value}
          </p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
          {icon}
        </div>
      </div>
    </div>
  );
}

function PriorityBadge({
  priority,
}: {
  priority: string;
}) {
  const styles: Record<string, string> = {
    LOW: "bg-slate-800 text-slate-400",
    MEDIUM:
      "bg-yellow-500/10 text-yellow-400",
    HIGH:
      "bg-orange-500/10 text-orange-400",
    CRITICAL:
      "bg-red-500/10 text-red-400",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium ${
        styles[priority] ??
        styles.MEDIUM
      }`}
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
  const styles: Record<string, string> = {
    PENDING:
      "bg-yellow-500/10 text-yellow-400",
    IN_PROGRESS:
      "bg-blue-500/10 text-blue-400",
    COMPLETED:
      "bg-emerald-500/10 text-emerald-400",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium ${
        styles[status] ??
        "bg-slate-800 text-slate-400"
      }`}
    >
      {status.replace("_", " ")}
    </span>
  );
}

function ReviewBadge({
  status,
}: {
  status: string;
}) {
  const styles: Record<string, string> = {
    PENDING:
      "bg-yellow-500/10 text-yellow-400",
    ACCEPTED:
      "bg-emerald-500/10 text-emerald-400",
    REJECTED:
      "bg-red-500/10 text-red-400",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium ${
        styles[status] ??
        "bg-slate-800 text-slate-400"
      }`}
    >
      {status}
    </span>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-300">
        {label}
      </label>

      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
      >
        {options.map((option) => (
          <option
            key={option}
            value={option}
          >
            {option.replace("_", " ")}
          </option>
        ))}
      </select>
    </div>
  );
}

function formatDate(date: string) {
  if (!date) return "—";

  return new Date(date).toLocaleDateString(
    "en-ZA",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    }
  );
}

function extractApiError(
  data: unknown
): string | null {
  if (!data || typeof data !== "object") {
    return null;
  }

  const object =
    data as Record<string, unknown>;

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