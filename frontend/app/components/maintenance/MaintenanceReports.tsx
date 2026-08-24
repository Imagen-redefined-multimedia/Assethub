
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import MaintenancePriorityBadge from "@/app/components/maintenance/MaintenancePriorityBadge";
import MaintenanceStatusBadge from "@/app/components/maintenance/MaintenanceStatusBadge";
import {
  getMaintenanceReport,
  reviewMaintenanceReport,
  MaintenanceReport,
} from "@/app/components/maintenance/maintenance-api";

export default function MaintenanceReportPage() {
  const params = useParams();
  const router = useRouter();

  const id = Number(params.id);

  const [report, setReport] = useState<MaintenanceReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [reviewing, setReviewing] = useState(false);
  const [reviewComment, setReviewComment] = useState("");
  const [showReview, setShowReview] = useState(false);

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

  const issuePhotos = useMemo(
    () =>
      report?.photos?.filter(
        (photo) => photo.photo_type === "ISSUE"
      ) ?? [],
    [report]
  );

  const fixedPhotos = useMemo(
    () =>
      report?.photos?.filter(
        (photo) => photo.photo_type === "FIXED"
      ) ?? [],
    [report]
  );

  async function handleReview(action: "ACCEPT" | "REJECT") {
    if (!report) return;

    if (action === "REJECT" && !reviewComment.trim()) {
      setError("Please provide a comment when rejecting a report.");
      return;
    }

    try {
      setReviewing(true);
      setError(null);

      const updatedReport = await reviewMaintenanceReport(
        report.id,
        action,
        reviewComment.trim()
      );

      setReport(updatedReport);
      setShowReview(false);
      setReviewComment("");
    } catch (err) {
      console.error("Failed to review maintenance report:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to review maintenance report."
      );
    } finally {
      setReviewing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-blue-500" />

          <p className="mt-4 text-sm text-slate-400">
            Loading maintenance report...
          </p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-lg items-center justify-center px-6">
        <div className="w-full rounded-2xl border border-red-900 bg-slate-900 p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 text-2xl text-red-400">
            !
          </div>

          <h1 className="mt-5 text-xl font-semibold text-white">
            Unable to load maintenance report
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-400">
            {error ?? "Maintenance report not found."}
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

  const isAccepted = report.review_status === "ACCEPTED";
  const isRejected = report.review_status === "REJECTED";
  const isPending = report.review_status === "PENDING";

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-6 py-8">
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
            Maintenance Report
          </p>

          <h1 className="mt-1 text-3xl font-bold text-white">
            Report #{report.id}
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Created{" "}
            {new Date(report.created_at).toLocaleDateString()}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <MaintenancePriorityBadge priority={report.priority} />

          <MaintenanceStatusBadge status={report.status} />

          <ReviewBadge status={report.review_status} />
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div className="rounded-xl border border-red-900/60 bg-red-950/20 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* REPORT OVERVIEW */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900">
        <div className="border-b border-slate-800 p-6">
          <h2 className="font-semibold text-white">
            Report Overview
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Summary of the maintenance inspection and completed work.
          </p>
        </div>

        <div className="grid gap-6 p-6 sm:grid-cols-2 lg:grid-cols-4">
          <InfoItem
            label="Report ID"
            value={`#${report.id}`}
          />

          <InfoItem
            label="Maintenance ID"
            value={`#${report.maintenance}`}
          />

          <InfoItem
            label="Technician"
            value={report.technician_username}
          />

          <InfoItem
            label="Client ID"
            value={`#${report.client_id}`}
          />
        </div>
      </section>

      {/* ASSET */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-blue-400">
          Asset
        </p>

        <h2 className="mt-2 text-2xl font-bold text-white">
          {report.asset_name}
        </h2>

        <div className="mt-5">
          <InfoItem
            label="Asset ID"
            value={`#${report.asset_id}`}
          />
        </div>
      </section>

      {/* SUMMARY */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <SectionTitle
          title="Summary"
          description="The technician's overall assessment of the maintenance task."
        />

        <TextContent value={report.summary} />
      </section>

      {/* FINDINGS */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <SectionTitle
          title="Findings"
          description="Issues and observations identified during inspection."
        />

        <TextContent value={report.findings} />
      </section>

      {/* WORK PERFORMED */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <SectionTitle
          title="Work Performed"
          description="Maintenance work completed by the technician."
        />

        <TextContent value={report.work_performed} />
      </section>

      {/* PARTS */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <SectionTitle
          title="Parts Replaced"
          description="Parts or components replaced during maintenance."
        />

        <TextContent
          value={
            report.parts_replaced?.trim()
              ? report.parts_replaced
              : "No parts were replaced."
          }
        />
      </section>

      {/* PHOTOS */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <SectionTitle
          title="Maintenance Photos"
          description="Visual evidence captured during the maintenance process."
        />

        {/* ISSUE PHOTOS */}
        <PhotoGroup
          title="Issues Found"
          photos={issuePhotos}
          emptyMessage="No issue photos were uploaded."
        />

        {/* FIXED PHOTOS */}
        <PhotoGroup
          title="After Repair"
          photos={fixedPhotos}
          emptyMessage="No fixed-condition photos were uploaded."
        />
      </section>

      {/* REVIEW */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900">
        <div className="border-b border-slate-800 p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-semibold text-white">
                Client Review
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Review the maintenance report before final approval.
              </p>
            </div>

            <ReviewBadge status={report.review_status} />
          </div>
        </div>

        <div className="p-6">
          {isAccepted && (
            <div className="rounded-xl border border-emerald-900/60 bg-emerald-950/20 p-5">
              <p className="font-semibold text-emerald-400">
                Report Accepted
              </p>

              <p className="mt-2 text-sm text-slate-400">
                This maintenance report has been accepted and can no
                longer be modified.
              </p>

              {report.review_comment && (
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Review Comment
                  </p>

                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-300">
                    {report.review_comment}
                  </p>
                </div>
              )}

              {report.reviewed_at && (
                <p className="mt-4 text-xs text-slate-500">
                  Reviewed{" "}
                  {new Date(
                    report.reviewed_at
                  ).toLocaleString()}
                </p>
              )}
            </div>
          )}

          {isRejected && (
            <div className="rounded-xl border border-red-900/60 bg-red-950/20 p-5">
              <p className="font-semibold text-red-400">
                Report Rejected
              </p>

              {report.review_comment && (
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Rejection Comment
                  </p>

                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-300">
                    {report.review_comment}
                  </p>
                </div>
              )}

              {report.reviewed_at && (
                <p className="mt-4 text-xs text-slate-500">
                  Reviewed{" "}
                  {new Date(
                    report.reviewed_at
                  ).toLocaleString()}
                </p>
              )}
            </div>
          )}

          {isPending && (
            <>
              {!showReview ? (
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-white">
                      Report awaiting review
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      Review the report and decide whether the
                      maintenance work should be accepted.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowReview(true)}
                    className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
                  >
                    Review Report
                  </button>
                </div>
              ) : (
                <div className="space-y-5">
                  <div>
                    <label
                      htmlFor="review-comment"
                      className="text-sm font-medium text-slate-300"
                    >
                      Review comment
                    </label>

                    <textarea
                      id="review-comment"
                      value={reviewComment}
                      onChange={(event) =>
                        setReviewComment(event.target.value)
                      }
                      placeholder="Add a comment about your decision..."
                      rows={5}
                      className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500"
                    />
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      disabled={reviewing}
                      onClick={() => setShowReview(false)}
                      className="rounded-xl border border-slate-700 px-5 py-3 text-sm font-medium text-slate-300 transition hover:border-slate-600 disabled:opacity-50"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      disabled={reviewing}
                      onClick={() => handleReview("REJECT")}
                      className="rounded-xl border border-red-800 bg-red-950/30 px-5 py-3 text-sm font-semibold text-red-400 transition hover:bg-red-950/60 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {reviewing ? "Processing..." : "Reject Report"}
                    </button>

                    <button
                      type="button"
                      disabled={reviewing}
                      onClick={() => handleReview("ACCEPT")}
                      className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {reviewing ? "Processing..." : "Accept Report"}
                    </button>
                  </div>
                </div>
              )}
            </>
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

function SectionTitle({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <h2 className="font-semibold text-white">{title}</h2>

      <p className="mt-1 text-sm text-slate-500">
        {description}
      </p>
    </div>
  );
}

function TextContent({ value }: { value: string }) {
  return (
    <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950/50 p-5">
      <p className="whitespace-pre-wrap text-sm leading-7 text-slate-300">
        {value || "No information provided."}
      </p>
    </div>
  );
}

function ReviewBadge({ status }: { status: string }) {
  const normalized = status?.toUpperCase();

  const styles =
    normalized === "ACCEPTED"
      ? "border-emerald-800 bg-emerald-950/40 text-emerald-400"
      : normalized === "REJECTED"
        ? "border-red-800 bg-red-950/40 text-red-400"
        : "border-amber-800 bg-amber-950/40 text-amber-400";

  const label =
    normalized === "ACCEPTED"
      ? "Accepted"
      : normalized === "REJECTED"
        ? "Rejected"
        : "Pending Review";

  return (
    <span
      className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${styles}`}
    >
      {label}
    </span>
  );
}

function PhotoGroup({
  title,
  photos,
  emptyMessage,
}: {
  title: string;
  photos: MaintenanceReport["photos"];
  emptyMessage: string;
}) {
  return (
    <div className="mt-8">
      <div className="mb-4">
        <h3 className="font-medium text-white">{title}</h3>

        <p className="mt-1 text-xs text-slate-500">
          {photos.length} photo{photos.length === 1 ? "" : "s"}
        </p>
      </div>

      {photos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950/40 p-8 text-center">
          <p className="text-sm text-slate-500">{emptyMessage}</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950"
            >
              <a
                href={photo.image}
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  src={photo.image}
                  alt={`${title} photo`}
                  className="h-56 w-full object-cover transition duration-300 hover:scale-105"
                />
              </a>

              <div className="border-t border-slate-800 px-4 py-3">
                <p className="text-xs font-medium text-slate-400">
                  Uploaded{" "}
                  {photo.uploaded_at
                    ? new Date(
                        photo.uploaded_at
                      ).toLocaleString()
                    : ""}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

