"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import MaintenancePriorityBadge from "@/app/components/maintenance/MaintenancePriorityBadge";
import MaintenanceStatusBadge from "@/app/components/maintenance/MaintenanceStatusBadge";
import { apiJson } from "@/lib/api";

interface MaintenanceTask {
  id: number;

  status: string;
  priority?: string;

  description?: string;

  technician?: number;
  technician_username?: string;

  work_order?: number;
  work_order_title?: string;
  work_order_description?: string;
  work_order_status?: string;

  asset_id?: number;
  asset_name?: string;
  asset_serial_number?: string;

  client_id?: number;
  client_username?: string;

  company_id?: number | null;
  company_name?: string | null;

  created_at?: string;
  updated_at?: string;
}

export default function MaintenanceTaskPage() {
  const params = useParams();
  const router = useRouter();

  const id = Number(params.id);

  const [maintenance, setMaintenance] =
    useState<MaintenanceTask | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || Number.isNaN(id)) {
      setError("Invalid maintenance task ID.");
      setLoading(false);
      return;
    }

    async function loadMaintenance() {
      try {
        setLoading(true);
        setError(null);

        const data = await apiJson<MaintenanceTask>(
          `/api/maintenance/${id}/`,
          {
            method: "GET",
          }
        );

        setMaintenance(data);
      } catch (err) {
        console.error(
          "Failed to load maintenance task:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load maintenance task."
        );
      } finally {
        setLoading(false);
      }
    }

    loadMaintenance();
  }, [id]);

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

  if (error || !maintenance) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-lg items-center justify-center px-6">
        <div className="w-full rounded-2xl border border-red-900 bg-slate-900 p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 text-2xl text-red-400">
            !
          </div>

          <h1 className="mt-5 text-xl font-semibold text-white">
            Unable to load maintenance
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-400">
            {error ?? "Maintenance task not found."}
          </p>

          <button
            type="button"
            onClick={() => router.back()}
            className="mt-6 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const isCompleted =
    maintenance.status?.toUpperCase() === "COMPLETED";

  const isInProgress =
    maintenance.status?.toUpperCase() === "IN_PROGRESS";

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-6 py-8">

      {/* HEADER */}

      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <Link
            href="/maintenance"
            className="text-sm text-slate-500 transition hover:text-blue-400"
          >
            ← Maintenance
          </Link>

          <p className="mt-4 text-sm font-medium uppercase tracking-wider text-blue-400">
            Maintenance Task
          </p>

          <h1 className="mt-1 text-3xl font-bold text-white">
            Maintenance #{maintenance.id}
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            {maintenance.created_at
              ? `Created ${new Date(
                  maintenance.created_at
                ).toLocaleDateString()}`
              : "Maintenance task"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {maintenance.priority && (
            <MaintenancePriorityBadge
              priority={maintenance.priority}
            />
          )}

          <MaintenanceStatusBadge
            status={maintenance.status}
          />
        </div>
      </div>

      {/* TASK OVERVIEW */}

      <section className="rounded-2xl border border-slate-800 bg-slate-900">
        <div className="border-b border-slate-800 p-6">
          <h2 className="font-semibold text-white">
            Maintenance Overview
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Review the maintenance assignment before
            carrying out the inspection.
          </p>
        </div>

        <div className="grid gap-6 p-6 sm:grid-cols-2 lg:grid-cols-4">
          <InfoItem
            label="Maintenance ID"
            value={`#${maintenance.id}`}
          />

          <InfoItem
            label="Status"
            value={maintenance.status}
          />

          <InfoItem
            label="Priority"
            value={maintenance.priority ?? "Not specified"}
          />

          <InfoItem
            label="Technician"
            value={
              maintenance.technician_username ??
              "Not assigned"
            }
          />
        </div>
      </section>

      {/* ASSET */}

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-blue-400">
          Asset
        </p>

        <h2 className="mt-2 text-2xl font-bold text-white">
          {maintenance.asset_name ??
            `Asset #${maintenance.asset_id ?? "—"}`}
        </h2>

        <div className="mt-6 grid gap-6 md:grid-cols-3">
          <InfoItem
            label="Asset ID"
            value={`#${maintenance.asset_id ?? "—"}`}
          />

          <InfoItem
            label="Serial Number"
            value={
              maintenance.asset_serial_number ??
              "Not available"
            }
          />

          <InfoItem
            label="Company"
            value={
              maintenance.company_name ??
              "Not available"
            }
          />
        </div>
      </section>

      {/* CLIENT */}

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="font-semibold text-white">
          Client
        </h2>

        <div className="mt-5 grid gap-6 md:grid-cols-2">
          <InfoItem
            label="Client"
            value={
              maintenance.client_username ??
              "Unknown client"
            }
          />

          <InfoItem
            label="Company"
            value={
              maintenance.company_name ??
              "Unknown company"
            }
          />
        </div>
      </section>

      {/* WORK ORDER */}

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="font-semibold text-white">
          Work Order
        </h2>

        <div className="mt-5 grid gap-6 md:grid-cols-2">
          <InfoItem
            label="Work Order"
            value={
              maintenance.work_order_title ??
              `Work Order #${maintenance.work_order ?? "—"}`
            }
          />

          <InfoItem
            label="Work Order Status"
            value={
              maintenance.work_order_status ??
              "Not available"
            }
          />
        </div>

        <div className="mt-6">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Description
          </p>

          <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-400">
            {maintenance.work_order_description ??
              "No work order description provided."}
          </p>
        </div>
      </section>

      {/* MAINTENANCE INSTRUCTIONS */}

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="font-semibold text-white">
          Maintenance Instructions
        </h2>

        <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-400">
          {maintenance.description ??
            "No additional maintenance instructions were provided."}
        </p>
      </section>

      {/* STATUS INFORMATION */}

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="font-semibold text-white">
          Task Status
        </h2>

        <div className="mt-5">
          {isCompleted ? (
            <div className="rounded-xl border border-emerald-900/60 bg-emerald-950/20 p-5">
              <p className="font-semibold text-emerald-400">
                Maintenance Completed
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                This maintenance task has been completed.
                You can view the submitted maintenance report
                if one is available.
              </p>
            </div>
          ) : isInProgress ? (
            <div className="rounded-xl border border-blue-900/60 bg-blue-950/20 p-5">
              <p className="font-semibold text-blue-400">
                Maintenance In Progress
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                This maintenance task is currently being
                worked on by the assigned technician.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-amber-900/60 bg-amber-950/20 p-5">
              <p className="font-semibold text-amber-400">
                Maintenance Ready
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                Review the task details and begin the
                maintenance inspection when ready.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ACTION */}

      <section className="rounded-2xl border border-blue-900/50 bg-blue-950/20 p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-semibold text-white">
              {isCompleted
                ? "Maintenance completed"
                : "Ready to inspect?"}
            </h2>

            <p className="mt-1 max-w-xl text-sm leading-6 text-slate-400">
              {isCompleted
                ? "This task has already been completed. View the maintenance report for the inspection findings and supporting evidence."
                : "Record your findings, work performed, parts replaced, and supporting photos in the maintenance report."}
            </p>
          </div>

          {isCompleted ? (
            <Link
              href={`/maintenance/report/${maintenance.id}`}
              className="shrink-0 rounded-xl border border-slate-700 px-6 py-3 text-sm font-semibold text-slate-300 transition hover:border-blue-500 hover:text-blue-400"
            >
              View Report
            </Link>
          ) : (
            <button
              type="button"
              onClick={() =>
                router.push(
                  `/maintenance/${maintenance.id}/report`
                )
              }
              className="shrink-0 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
            >
              Start Inspection
            </button>
          )}
        </div>
      </section>

      {/* FOOTER */}

      <div>
        <Link
          href="/maintenance"
          className="inline-flex rounded-xl border border-slate-700 px-5 py-3 text-sm font-medium text-slate-300 transition hover:border-blue-500 hover:text-blue-400"
        >
          ← Back to Maintenance
        </Link>
      </div>
    </div>
  );
}

function InfoItem({
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

      <p className="mt-2 text-sm font-medium text-slate-200">
        {value}
      </p>
    </div>
  );
}