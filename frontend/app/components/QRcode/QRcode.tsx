
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

  const token = params.token as string;

  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [maintenance, setMaintenance] =
  useState<Maintenance | null>(null);

  useEffect(() => {
    if (!token) return;

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

        setAsset(data.asset);
        setMaintenance(data.maintenance);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to verify QR code."
        );
      } finally {
        setLoading(false);
      }
    }

    verifyQR();
  }, [token]);

  function startInspection() {
  if (!maintenance) {
    setError(
      "There is no active maintenance task assigned to you for this asset."
    );
    return;
  }

  router.push(`/maintenance/${maintenance.id}`);
}

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-blue-500" />

          <p className="mt-4 text-sm text-slate-400">
            Verifying asset QR code...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-lg items-center justify-center px-6">
        <div className="w-full rounded-2xl border border-red-900 bg-slate-900 p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 text-2xl text-red-400">
            !
          </div>

          <h1 className="mt-5 text-xl font-semibold text-white">
            QR Code Invalid
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-400">
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              router.push("/assets/qr-scanner")
            }
            className="mt-6 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
          >
            Back to Scanner
          </button>
        </div>
      </div>
    );
  }

  if (!asset) {
    return null;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-6 py-8">
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

      <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
        <div className="border-b border-slate-800 bg-emerald-950/20 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500/10 text-xl text-emerald-400">
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

        <div className="space-y-6 p-6">
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

          {asset.description && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Description
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-300">
                {asset.description}
              </p>
            </div>
          )}

          <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-4">
            <span className="text-sm text-slate-400">
              QR Status
            </span>

            <span
              className={
                asset.qr_active
                  ? "rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400"
                  : "rounded-full bg-red-500/10 px-3 py-1 text-xs font-medium text-red-400"
              }
            >
              {asset.qr_active
                ? "ACTIVE"
                : "INACTIVE"}
            </span>
          </div>

          <button
            type="button"
            onClick={startInspection}
            disabled={!asset.qr_active}
            className="w-full rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Start Inspection
          </button>
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

