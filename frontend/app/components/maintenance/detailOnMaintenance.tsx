"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

import MaintenancePriorityBadge from "@/app/components/maintenance/MaintenancePriorityBadge";
import MaintenanceStatusBadge from "@/app/components/maintenance/MaintenanceStatusBadge";

import {
  getMaintenanceReport,
  MaintenanceReport,
} from "@/app/components/maintenance/maintenance-api";

export default function IDMaintenance() {
  const params = useParams();
  const router = useRouter();

  const id = Number(params.id);

  const [report, setReport] = useState<MaintenanceReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || Number.isNaN(id)) {
      setError("Invalid maintenance report ID.");
      setLoading(false);
      return;
    }

    async function loadReport() {
      try {
        setLoading(true);
        setError(null);

        const data = await getMaintenanceReport(id);
        setReport(data);
      } catch (err) {
        console.error("Failed to load maintenance report:", err);

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load maintenance report."
        );
      } finally {
        setLoading(false);
      }
    }

    loadReport();
  }, [id]);

  /* Loading */
  if (loading) {
    return (
      <div className="flex min-h-60 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-700 border-t-blue-500" />
      </div>
    );
  }

  /* Error */
  if (error || !report) {
    return (
      <div className="space-y-5">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm font-medium text-slate-400 transition hover:text-white"
        >
          ← Back
        </button>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h1 className="font-semibold text-red-400">
            Unable to load report
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            {error ?? "Maintenance report not found."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <Link
            href="/maintenance"
            className="text-sm text-slate-500 transition hover:text-blue-400"
          >
            ← Maintenance
          </Link>

          <h1 className="mt-2 text-3xl font-bold text-white">
            Maintenance Report
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Report #{report.id} ·{" "}
            {report.asset_name || `Asset #${report.asset_id}`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <MaintenancePriorityBadge
            priority={report.priority}
          />

          <MaintenanceStatusBadge
            status={report.status}
          />
        </div>
      </div>

      {/* Asset / Technician */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Asset */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="font-semibold text-white">
            Asset
          </h2>

          <div className="mt-5 space-y-4">
            <InfoItem
              label="Asset"
              value={
                report.asset_name ||
                `Asset #${report.asset_id}`
              }
            />

            <InfoItem
              label="Asset ID"
              value={`#${report.asset_id}`}
            />

            <InfoItem
              label="Client ID"
              value={`#${report.client_id}`}
            />
          </div>
        </section>

        {/* Technician */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="font-semibold text-white">
            Technician
          </h2>

          <div className="mt-5 space-y-4">
            <InfoItem
              label="Technician"
              value={
                report.technician_username ||
                "Unknown technician"
              }
            />

            <InfoItem
              label="Report date"
              value={new Date(
                report.created_at
              ).toLocaleString()}
            />

            {report.updated_at && (
              <InfoItem
                label="Last updated"
                value={new Date(
                  report.updated_at
                ).toLocaleString()}
              />
            )}
          </div>
        </section>
      </div>

      {/* Summary */}
      <DetailCard title="Summary">
        <p className="text-sm leading-7 text-slate-400">
          {report.summary || "No summary provided."}
        </p>
      </DetailCard>

      {/* Findings */}
      <DetailCard title="Findings">
        <p className="whitespace-pre-wrap text-sm leading-7 text-slate-400">
          {report.findings || "No findings recorded."}
        </p>
      </DetailCard>

      {/* Work / Parts */}
      <div className="grid gap-4 md:grid-cols-2">
        <DetailCard title="Work Performed">
          <p className="whitespace-pre-wrap text-sm leading-7 text-slate-400">
            {report.work_performed ||
              "No work recorded."}
          </p>
        </DetailCard>

        <DetailCard title="Parts Replaced">
          <p className="whitespace-pre-wrap text-sm leading-7 text-slate-400">
            {report.parts_replaced ||
              "No parts replaced."}
          </p>
        </DetailCard>
      </div>

      {/* Photos */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <div>
          <h2 className="font-semibold text-white">
            Photos
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Photos attached to this maintenance report.
          </p>
        </div>

        {report.photos?.length > 0 ? (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {report.photos.map((photo, index) => (
              <a
                key={photo}
                href={photo}
                target="_blank"
                rel="noopener noreferrer"
                className="group overflow-hidden rounded-xl border border-slate-800 bg-slate-950 transition hover:border-blue-500/60"
              >
                <img
                  src={photo}
                  alt={`Maintenance photo ${index + 1}`}
                  className="h-56 w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                />

                <div className="border-t border-slate-800 px-4 py-3">
                  <p className="text-xs text-slate-500">
                    Photo {index + 1}
                  </p>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-xl border border-dashed border-slate-800 bg-slate-950/50 p-8 text-center">
            <p className="text-sm text-slate-500">
              No photos were attached to this report.
            </p>
          </div>
        )}
      </section>

      {/* Review */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="font-semibold text-white">
              Review
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Client review information.
            </p>
          </div>

          <ReviewBadge
            status={report.review_status}
          />
        </div>

        {report.review_comment && (
          <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Review comment
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-300">
              {report.review_comment}
            </p>
          </div>
        )}

        {report.reviewed_at && (
          <p className="mt-4 text-xs text-slate-500">
            Reviewed on{" "}
            {new Date(
              report.reviewed_at
            ).toLocaleString()}
          </p>
        )}
      </section>

      {/* Footer */}
      <div className="flex justify-between">
        <Link
          href="/maintenance"
          className="rounded-xl border border-slate-700 px-4 py-3 text-sm font-medium text-slate-300 transition hover:border-blue-500 hover:text-blue-400"
        >
          ← Back to Maintenance
        </Link>
      </div>
    </div>
  );
}

/* ============================================================
   REUSABLE INFO ITEM
============================================================ */

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

      <p className="mt-1 font-medium text-slate-200">
        {value}
      </p>
    </div>
  );
}

/* ============================================================
   REUSABLE DETAIL CARD
============================================================ */

function DetailCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <h2 className="font-semibold text-white">
        {title}
      </h2>

      <div className="mt-4">
        {children}
      </div>
    </section>
  );
}

/* ============================================================
   REVIEW BADGE
============================================================ */

function ReviewBadge({
  status,
}: {
  status?: string;
}) {
  const normalizedStatus =
    status?.toUpperCase() || "PENDING";

  const styles =
    normalizedStatus === "ACCEPTED"
      ? "border-emerald-900/60 bg-emerald-950/30 text-emerald-400"
      : normalizedStatus === "REJECTED"
        ? "border-red-900/60 bg-red-950/30 text-red-400"
        : "border-amber-900/60 bg-amber-950/30 text-amber-400";

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-semibold ${styles}`}
    >
      {normalizedStatus}
    </span>
  );
}