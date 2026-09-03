"use client";

import { FormEvent, useEffect, useState } from "react";

import { useSearchParams, useRouter } from "next/navigation";

import { apiJson } from "@/lib/api";
import {
  createMaintenanceReport,
  uploadMaintenanceReportPhoto,
} from "@/app/components/maintenance/maintenance-api";

type Maintenance = {
  id: number;
  work_order: number;
  work_order_title?: string;
  work_order_description?: string;
  status: string;
  description: string;

  technician?: number;
  technician_username?: string;

  asset_id: number;
  asset_name: string;
  asset_serial_number?: string;

  client_id?: number;
  client_username?: string;

  company_id?: number;
  company_name?: string;

  created_at: string;
  updated_at: string;
};

export default function CreateMaintenance() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const maintenanceId = searchParams.get("maintenance");

  const [maintenance, setMaintenance] =
    useState<Maintenance | null>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [summary, setSummary] = useState("");
  const [findings, setFindings] = useState("");
  const [workPerformed, setWorkPerformed] = useState("");
  const [partsReplaced, setPartsReplaced] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [status, setStatus] = useState("COMPLETED");

  const [issuePhotos, setIssuePhotos] = useState<File[]>([]);
  const [fixedPhotos, setFixedPhotos] = useState<File[]>([]);

  useEffect(() => {
    if (!maintenanceId) {
      setError("No maintenance task was selected.");
      setLoading(false);
      return;
    }

    async function loadMaintenance() {
      try {
        setLoading(true);
        setError("");

        const data = await apiJson<Maintenance>(
          `/api/maintenance/${maintenanceId}/`
        );

        setMaintenance(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load maintenance task."
        );
      } finally {
        setLoading(false);
      }
    }

    loadMaintenance();
  }, [maintenanceId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!maintenance) {
      setError("Maintenance task could not be found.");
      return;
    }

    if (!summary.trim()) {
      setError("Please provide a summary.");
      return;
    }

    if (!findings.trim()) {
      setError("Please provide the inspection findings.");
      return;
    }

    if (!workPerformed.trim()) {
      setError("Please describe the work performed.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      // ------------------------------------------------------------
      // 1. Create the maintenance report
      // ------------------------------------------------------------

      const report = await createMaintenanceReport({
        maintenance: maintenance.id,
        summary: summary.trim(),
        findings: findings.trim(),
        work_performed: workPerformed.trim(),
        parts_replaced: partsReplaced.trim(),
        priority,
        status,
      });

      // ------------------------------------------------------------
      // 2. Upload issue photos
      // ------------------------------------------------------------

      for (const photo of issuePhotos) {
        await uploadMaintenanceReportPhoto(
          report.id,
          photo,
          "ISSUE"
        );
      }

      // ------------------------------------------------------------
      // 3. Upload fixed photos
      // ------------------------------------------------------------

      for (const photo of fixedPhotos) {
        await uploadMaintenanceReportPhoto(
          report.id,
          photo,
          "FIXED"
        );
      }

      setSuccess("Maintenance report submitted successfully.");

      // Give the user a moment to see the success message,
      // then open the actual report.
      setTimeout(() => {
        router.push(`/maintenance/report/${report.id}`);
      }, 500);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to submit maintenance report."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-blue-500" />

          <p className="mt-4 text-sm text-slate-400">
            Loading maintenance task...
          </p>
        </div>
      </div>
    );
  }

  if (error && !maintenance) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-lg items-center justify-center px-6">
        <div className="w-full rounded-2xl border border-red-900 bg-slate-900 p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 text-2xl text-red-400">
            !
          </div>

          <h1 className="mt-5 text-xl font-semibold text-white">
            Unable to Load Maintenance
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-400">
            {error}
          </p>

          <button
            type="button"
            onClick={() => router.push("/maintenance")}
            className="mt-6 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
          >
            Back to Maintenance
          </button>
        </div>
      </div>
    );
  }

  if (!maintenance) {
    return null;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-6 py-8">
      {/* Header */}

      <div>
        <p className="text-sm font-medium text-blue-400">
          MAINTENANCE
        </p>

        <h1 className="mt-1 text-3xl font-bold text-white">
          Start Inspection
        </h1>

        <p className="mt-2 text-sm text-slate-400">
          Complete the maintenance inspection for the
          assigned asset.
        </p>
      </div>

      {/* Error */}

      {error && (
        <div className="rounded-xl border border-red-900 bg-red-950/30 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Success */}

      {success && (
        <div className="rounded-xl border border-emerald-900 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-300">
          {success}
        </div>
      )}

      {/* Maintenance / Asset Information */}

      <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
        <div className="border-b border-slate-800 bg-blue-950/20 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-xl text-blue-400">
              ◈
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-blue-400">
                Assigned Maintenance
              </p>

              <h2 className="mt-1 text-xl font-semibold text-white">
                {maintenance.asset_name}
              </h2>
            </div>
          </div>
        </div>

        <div className="grid gap-6 p-6 md:grid-cols-2">
          <AssetField
            label="Asset Name"
            value={maintenance.asset_name}
          />

          <AssetField
            label="Serial Number"
            value={
              maintenance.asset_serial_number || "Not provided"
            }
          />

          {maintenance.company_name && (
            <AssetField
              label="Company"
              value={maintenance.company_name}
            />
          )}

          {maintenance.client_username && (
            <AssetField
              label="Client"
              value={maintenance.client_username}
            />
          )}

          {maintenance.technician_username && (
            <AssetField
              label="Technician"
              value={maintenance.technician_username}
            />
          )}

          <AssetField
            label="Maintenance Status"
            value={formatStatus(maintenance.status)}
          />

          {maintenance.work_order_title && (
            <AssetField
              label="Work Order"
              value={maintenance.work_order_title}
            />
          )}

          {maintenance.description && (
            <div className="md:col-span-2">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Maintenance Instructions
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-300">
                {maintenance.description}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Inspection Form */}

      <section className="rounded-2xl border border-slate-800 bg-slate-900">
        <div className="border-b border-slate-800 p-6">
          <h2 className="text-lg font-semibold text-white">
            Inspection Details
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Record the condition and maintenance work
            performed on this asset.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 p-6"
        >
          {/* Summary */}

          <div>
            <label
              htmlFor="summary"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Summary
            </label>

            <textarea
              id="summary"
              rows={3}
              value={summary}
              onChange={(event) =>
                setSummary(event.target.value)
              }
              placeholder="Briefly describe the inspection..."
              disabled={submitting}
              className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>

          {/* Findings */}

          <div>
            <label
              htmlFor="findings"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Findings
            </label>

            <textarea
              id="findings"
              rows={5}
              value={findings}
              onChange={(event) =>
                setFindings(event.target.value)
              }
              placeholder="What did you find during the inspection?"
              disabled={submitting}
              className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>

          {/* Work Performed */}

          <div>
            <label
              htmlFor="work_performed"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Work Performed
            </label>

            <textarea
              id="work_performed"
              rows={5}
              value={workPerformed}
              onChange={(event) =>
                setWorkPerformed(event.target.value)
              }
              placeholder="Describe the maintenance work performed..."
              disabled={submitting}
              className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>

          {/* Parts */}

          <div>
            <label
              htmlFor="parts_replaced"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Parts Replaced
            </label>

            <textarea
              id="parts_replaced"
              rows={3}
              value={partsReplaced}
              onChange={(event) =>
                setPartsReplaced(event.target.value)
              }
              placeholder="List any parts that were replaced..."
              disabled={submitting}
              className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>

          {/* Priority + Status */}

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label
                htmlFor="priority"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Priority
              </label>

              <select
                id="priority"
                value={priority}
                onChange={(event) =>
                  setPriority(event.target.value)
                }
                disabled={submitting}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="status"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Report Status
              </label>

              <select
                id="status"
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value)
                }
                disabled={submitting}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="IN_PROGRESS">
                  In Progress
                </option>

                <option value="COMPLETED">
                  Completed
                </option>
              </select>
            </div>
          </div>

          {/* Issue Photos */}

          <div>
            <label
              htmlFor="issue_photos"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Issue Photos
            </label>

            <input
              id="issue_photos"
              type="file"
              accept="image/*"
              multiple
              disabled={submitting}
              onChange={(event) =>
                setIssuePhotos(
                  Array.from(event.target.files || [])
                )
              }
              className="block w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-400 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-blue-500"
            />

            <p className="mt-2 text-xs text-slate-500">
              Upload photos showing problems, damage, faults,
              or other issues found during inspection.
            </p>

            {issuePhotos.length > 0 && (
              <p className="mt-2 text-xs text-blue-400">
                {issuePhotos.length} issue photo
                {issuePhotos.length !== 1 ? "s" : ""} selected
              </p>
            )}
          </div>

          {/* Fixed Photos */}

          <div>
            <label
              htmlFor="fixed_photos"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Fixed / Completed Photos
            </label>

            <input
              id="fixed_photos"
              type="file"
              accept="image/*"
              multiple
              disabled={submitting}
              onChange={(event) =>
                setFixedPhotos(
                  Array.from(event.target.files || [])
                )
              }
              className="block w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-400 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-blue-500"
            />

            <p className="mt-2 text-xs text-slate-500">
              Upload photos showing the completed maintenance
              work or corrected condition of the asset.
            </p>

            {fixedPhotos.length > 0 && (
              <p className="mt-2 text-xs text-blue-400">
                {fixedPhotos.length} fixed photo
                {fixedPhotos.length !== 1 ? "s" : ""} selected
              </p>
            )}
          </div>

          {/* Actions */}

          <div className="flex justify-end gap-3 border-t border-slate-800 pt-6">
            <button
              type="button"
              onClick={() => router.back()}
              disabled={submitting}
              className="rounded-xl border border-slate-700 px-5 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting
                ? "Submitting Inspection..."
                : "Submit Inspection"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function AssetField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-sm font-medium text-white">
        {value}
      </p>
    </div>
  );
}

function formatStatus(status: string) {
  return status
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}