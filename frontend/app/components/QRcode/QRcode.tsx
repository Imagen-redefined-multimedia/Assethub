
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiJson } from "@/lib/api";

type Maintenance = {
  id: number;
  status: string;
  description: string;
  technician: number;
  technician_username: string;
  work_order: number;
  work_order_title: string;
  work_order_description: string;
  work_order_status: string;
  client_id: number;
  client_username: string;
  company_id: number | null;
  company_name: string | null;
};

type Asset = {
  id: number;
  name: string;
  serial_number: string;
  description?: string;
  client?: number;
  client_username?: string;
  qr_active: boolean;
  last_qr_scan_at?: string | null;
  company_name: string | null;
};

type QRScanResponse = {
  message: string;
  asset: Asset;
  maintenance: Maintenance | null;
};

export default function AssetQRScannerPage() {
  const params = useParams();
  const router = useRouter();

  const token =
    typeof params.token === "string"
      ? params.token
      : Array.isArray(params.token)
        ? params.token[0]
        : "";

  const [asset, setAsset] = useState<Asset | null>(null);
  const [maintenance, setMaintenance] =
    useState<Maintenance | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Invalid QR code. No QR token was provided.");
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function verifyQR() {
      try {
        setLoading(true);
        setError("");

        const data = await apiJson<QRScanResponse>(
          `/api/qr/scan/${encodeURIComponent(token)}/`,
          {
            method: "POST",
          }
        );

        if (cancelled) {
          return;
        }

        setAsset(data.asset);
        setMaintenance(data.maintenance);
      } catch (err) {
        if (cancelled) {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : "Unable to verify QR code."
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    verifyQR();

    return () => {
      cancelled = true;
    };
  }, [token]);

  function startInspection() {
    if (!asset) {
      return;
    }

    if (!asset.qr_active) {
      setError("This QR code is inactive.");
      return;
    }

    if (!maintenance) {
      setError(
        "There is no active maintenance task assigned to you for this asset."
      );
      return;
    }

    setStarting(true);

    router.push(`/maintenance/${maintenance.id}`);
  }

  function goBackToAssets() {
    router.push("/assets");
  }

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-6">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-blue-500" />

          <p className="mt-4 text-sm font-medium text-white">
            Verifying asset QR code...
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Please wait while AssetHub validates the QR code.
          </p>
        </div>
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-lg items-center justify-center px-6">
        <div className="w-full rounded-2xl border border-red-900/70 bg-slate-900 p-8 text-center shadow-xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 text-2xl font-bold text-red-400">
            !
          </div>

          <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-red-400">
            Asset Verification
          </p>

          <h1 className="mt-2 text-xl font-semibold text-white">
            QR Code Invalid
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-400">
            {error || "The asset could not be identified."}
          </p>

          <button
            type="button"
            onClick={goBackToAssets}
            className="mt-6 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
          >
            Back to Assets
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-6 py-8">
      {/* Header */}
      <div>
        <p className="text-sm font-medium text-blue-400">
          ASSET VERIFICATION
        </p>

        <h1 className="mt-1 text-3xl font-bold text-white">
          Asset Found
        </h1>

        <p className="mt-2 text-sm text-slate-400">
          The QR code has been successfully verified.
        </p>
      </div>

      {/* Verification status */}
      <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-xl">
        <div className="border-b border-slate-800 bg-emerald-950/20 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-xl font-bold text-emerald-400">
              ✓
            </div>

            <div>
              <p className="font-semibold text-white">
                QR Verified
              </p>

              <p className="text-sm text-slate-500">
                AssetHub has identified this asset.
              </p>
            </div>
          </div>
        </div>

        {/* Asset details */}
        <div className="space-y-6 p-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <AssetField
              label="Asset"
              value={asset.name}
            />

            <AssetField
              label="Serial Number"
              value={asset.serial_number}
            />

            {asset.company_name && (
              <AssetField
                label="Company"
                value={asset.company_name}
              />
            )}

            {asset.client_username && (
              <AssetField
                label="Client"
                value={asset.client_username}
              />
            )}
          </div>

          {/* Description */}
          {asset.description && (
            <div className="border-t border-slate-800 pt-6">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Description
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-300">
                {asset.description}
              </p>
            </div>
          )}

          {/* QR status */}
          <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-4">
            <div>
              <p className="text-sm font-medium text-white">
                QR Code Status
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Current status of this asset's QR code.
              </p>
            </div>

            <span
              className={
                asset.qr_active
                  ? "rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400"
                  : "rounded-full bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-400"
              }
            >
              {asset.qr_active
                ? "ACTIVE"
                : "INACTIVE"}
            </span>
          </div>
        </div>
      </section>

      {/* Maintenance */}
      <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-xl">
        <div className="border-b border-slate-800 p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-400">
            Maintenance
          </p>

          <h2 className="mt-1 text-xl font-semibold text-white">
            Inspection Assignment
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Review the maintenance task assigned to this asset.
          </p>
        </div>

        <div className="p-6">
          {maintenance ? (
            <div className="space-y-5">
              {/* Work order */}
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                  Work Order
                </p>

                <p className="mt-2 text-lg font-semibold text-white">
                  {maintenance.work_order_title}
                </p>
              </div>

              {/* Maintenance description */}
              {maintenance.description && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                    Maintenance Task
                  </p>

                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    {maintenance.description}
                  </p>
                </div>
              )}

              {/* Technician */}
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                    Technician
                  </p>

                  <p className="mt-2 text-sm font-medium text-white">
                    {maintenance.technician_username}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                    Maintenance Status
                  </p>

                  <span className="mt-2 inline-flex rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400">
                    {maintenance.status}
                  </span>
                </div>
              </div>

              {/* Work order status */}
              <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-4">
                <div>
                  <p className="text-sm font-medium text-white">
                    Work Order Status
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Current status of the associated work order.
                  </p>
                </div>

                <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-300">
                  {maintenance.work_order_status}
                </span>
              </div>

              {/* Start inspection */}
              <button
                type="button"
                onClick={startInspection}
                disabled={
                  !asset.qr_active ||
                  !maintenance ||
                  starting
                }
                className="w-full rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {starting
                  ? "Opening Inspection..."
                  : "Start Inspection"}
              </button>
            </div>
          ) : (
            <div className="rounded-xl border border-amber-900/60 bg-amber-950/20 p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-lg font-bold text-amber-400">
                  !
                </div>

                <div>
                  <p className="font-semibold text-amber-300">
                    No Maintenance Assigned
                  </p>

                  <p className="mt-1 text-sm leading-6 text-slate-400">
                    There is currently no active maintenance
                    task assigned to you for this asset.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={goBackToAssets}
                className="mt-5 w-full rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-300 transition hover:bg-slate-800"
              >
                Back to Assets
              </button>
            </div>
          )}
        </div>
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

