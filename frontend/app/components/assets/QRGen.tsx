
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiFetch, apiJson } from "@/lib/api";

type Asset = {
  id: number;
  company_name: string;
  client_username: string;
  name: string;
  serial_number: string;
  description?: string;
  qr_active: boolean;
  qr_created_at?: string | null;
  qr_revoked_at?: string | null;
};

export default function AssetQRCode() {
  const params = useParams();
  const router = useRouter();

  const assetId = Number(params.id);

  const [asset, setAsset] = useState<Asset | null>(null);
  const [qrUrl, setQrUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [qrLoading, setQrLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!assetId || Number.isNaN(assetId)) {
      setError("Invalid asset ID.");
      setLoading(false);
      return;
    }

    async function loadAsset() {
      try {
        setLoading(true);
        setError("");

        const data = await apiJson<Asset>(
          `/api/assets/${assetId}/`
        );

        setAsset(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load asset."
        );
      } finally {
        setLoading(false);
      }
    }

    loadAsset();
  }, [assetId]);

  useEffect(() => {
    if (!assetId || Number.isNaN(assetId)) return;

    async function loadQRCode() {
      try {
        setQrLoading(true);

        const response = await apiFetch(
          `/api/assets/${assetId}/qr/`,
          {
            method: "GET",
          }
        );

        if (response.status === 401) {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          window.location.href = "/login";
          return;
        }

        if (!response.ok) {
          const data = await response
            .json()
            .catch(() => null);

          throw new Error(
            data?.detail ||
              data?.error ||
              "Unable to generate QR code."
          );
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);

        setQrUrl(url);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to generate QR code."
        );
      } finally {
        setQrLoading(false);
      }
    }

    loadQRCode();

    return () => {
      setQrUrl((currentUrl) => {
        if (currentUrl) {
          window.URL.revokeObjectURL(currentUrl);
        }

        return "";
      });
    };
  }, [assetId]);

  function handleDownload() {
    if (!qrUrl || !asset) return;

    const link = document.createElement("a");

    link.href = qrUrl;
    link.download = `${asset.name
      .replace(/\s+/g, "-")
      .toLowerCase()}-qr.png`;

    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-blue-500" />
      </div>
    );
  }

  if (error && !asset) {
    return (
      <div className="space-y-6">
        <button
          type="button"
          onClick={() => router.push("/assets")}
          className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
        >
          ← Back to Assets
        </button>

        <div className="rounded-xl border border-red-900 bg-red-950/30 px-5 py-4 text-sm text-red-300">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium text-blue-400">
            ASSET MANAGEMENT
          </p>

          <h1 className="mt-1 text-3xl font-bold text-white">
            Asset QR Code
          </h1>

          <p className="mt-2 text-slate-400">
            View and download the secure QR identification code
            for this asset.
          </p>
        </div>

        <button
          type="button"
          onClick={() => router.push("/assets")}
          className="rounded-xl border border-slate-700 px-5 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
        >
          ← Back to Assets
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-900 bg-red-950/30 px-5 py-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {asset && (
        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          {/* Asset Information */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div className="border-b border-slate-800 pb-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Asset
              </p>

              <h2 className="mt-2 text-2xl font-bold text-white">
                {asset.name}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {asset.serial_number}
              </p>
            </div>

            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500">
                  Company
                </p>

                <p className="mt-2 text-sm text-slate-200">
                  {asset.company_name}
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500">
                  Client
                </p>

                <p className="mt-2 text-sm text-slate-200">
                  {asset.client_username}
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500">
                  QR Status
                </p>

                <div className="mt-2">
                  {asset.qr_active ? (
                    <span className="inline-flex rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex rounded-full bg-red-500/10 px-3 py-1 text-xs font-medium text-red-400">
                      Inactive
                    </span>
                  )}
                </div>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500">
                  Asset ID
                </p>

                <p className="mt-2 text-sm text-slate-200">
                  #{asset.id}
                </p>
              </div>

              {asset.description && (
                <div className="sm:col-span-2">
                  <p className="text-xs uppercase tracking-wider text-slate-500">
                    Description
                  </p>

                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    {asset.description}
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* QR Code */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div className="text-center">
              <p className="text-sm font-semibold text-white">
                QR Identification Code
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Scan this code to access the asset workflow.
              </p>
            </div>

            <div className="mt-6 flex min-h-[320px] items-center justify-center rounded-2xl bg-white p-6">
              {qrLoading ? (
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-blue-600" />
              ) : qrUrl ? (
                <img
                  src={qrUrl}
                  alt={`QR code for ${asset.name}`}
                  className="h-auto w-full max-w-[280px]"
                />
              ) : (
                <p className="text-sm text-red-500">
                  QR code unavailable.
                </p>
              )}
            </div>

            <div className="mt-6 space-y-3">
              <button
                type="button"
                onClick={handleDownload}
                disabled={!qrUrl || qrLoading || !asset.qr_active}
                className="w-full rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Download QR Code
              </button>

              <button
                type="button"
                onClick={() => router.push("/assets")}
                className="w-full rounded-xl border border-slate-700 px-5 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
              >
                Back to Assets
              </button>
            </div>

            {!asset.qr_active && (
              <p className="mt-4 text-center text-xs text-red-400">
                This QR code is inactive and cannot be used for
                scanning.
              </p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

