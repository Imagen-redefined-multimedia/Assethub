
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

  if (loading) {
    return (
      <div className="flex min-h-100 items-center justify-center p-6">
        <p className="text-sm text-muted-foreground">
          Loading maintenance report...
        </p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="space-y-4 p-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm font-medium hover:underline"
        >
          ← Back
        </button>

        <div className="rounded-lg border  p-6">
          <h1 className="font-semibold text-red-600">
            Unable to load report
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            {error ?? "Maintenance report not found."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/maintenance"
            className="text-sm text-muted-foreground hover:underline"
          >
            ← Maintenance
          </Link>

          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            Maintenance Report
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Report #{report.id} · {report.asset_name}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <MaintenancePriorityBadge
            priority={report.priority}
          />

          <MaintenanceStatusBadge
            status={report.status}
          />
        </div>
      </div>

      {/* Asset / Technician */}
      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-lg border  p-6">
          <h2 className="font-semibold">Asset</h2>

          <div className="mt-4 space-y-3">
            <div>
              <p className="text-xs text-muted-foreground">
                Asset
              </p>

              <p className="font-medium">
                {report.asset_name}
              </p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">
                Asset ID
              </p>

              <p className="font-medium">
                #{report.asset_id}
              </p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">
                Client ID
              </p>

              <p className="font-medium">
                #{report.client_id}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-lg border  p-6">
          <h2 className="font-semibold">Technician</h2>

          <div className="mt-4 space-y-3">
            <div>
              <p className="text-xs text-muted-foreground">
                Technician
              </p>

              <p className="font-medium">
                {report.technician_username}
              </p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">
                Report date
              </p>

              <p className="font-medium">
                {new Date(
                  report.created_at
                ).toLocaleString()}
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Summary */}
      <section className="rounded-lg border  p-6">
        <h2 className="font-semibold">Summary</h2>

        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {report.summary || "No summary provided."}
        </p>
      </section>

      {/* Findings */}
      <section className="rounded-lg border  p-6">
        <h2 className="font-semibold">Findings</h2>

        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
          {report.findings || "No findings recorded."}
        </p>
      </section>

      {/* Work performed / Parts */}
      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-lg border  p-6">
          <h2 className="font-semibold">Work Performed</h2>

          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
            {report.work_performed || "No work recorded."}
          </p>
        </section>

        <section className="rounded-lg border  p-6">
          <h2 className="font-semibold">Parts Replaced</h2>

          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
            {report.parts_replaced || "No parts replaced."}
          </p>
        </section>
      </div>

      {/* Photos */}
      <section className="rounded-lg border  p-6">
        <h2 className="font-semibold">Photos</h2>

        {report.photos?.length > 0 ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {report.photos.map((photo, index) => (
              <a
                key={photo}
                href={photo}
                target="_blank"
                rel="noopener noreferrer"
                className="overflow-hidden rounded-lg border"
              >
                <img
                  src={photo}
                  alt={`Maintenance photo ${index + 1}`}
                  className="h-56 w-full object-cover"
                />
              </a>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            No photos were attached to this report.
          </p>
        )}
      </section>

      {/* Review */}
      <section className="rounded-lg border  p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold">Review</h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Client review information.
            </p>
          </div>

          <span className="rounded-full border px-3 py-1 text-sm font-medium">
            {report.review_status}
          </span>
        </div>

        {report.review_comment && (
          <div className="mt-4 rounded-md bg-gray-50 p-4">
            <p className="text-xs font-medium text-muted-foreground">
              Review comment
            </p>

            <p className="mt-1 text-sm">
              {report.review_comment}
            </p>
          </div>
        )}

        {report.reviewed_at && (
          <p className="mt-4 text-xs text-muted-foreground">
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
          className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-gray-50"
        >
          Back to Maintenance
        </Link>
      </div>
    </div>
  );
}
