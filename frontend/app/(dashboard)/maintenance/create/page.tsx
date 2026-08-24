"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { apiJson } from "@/lib/api";

type Asset = {
  id: number;
  name: string;
  serial_number: string;
  description?: string;
  company?: number | null;
  company_name?: string | null;
  client?: number | null;
  client_username?: string | null;
  qr_active: boolean;
};

export default function CreateMaintenance() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const assetId = searchParams.get("asset");

  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!assetId) {
      setError("No asset was selected.");
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

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-blue-500" />

          <p className="mt-4 text-sm text-slate-400">
            Loading asset...
          </p>
        </div>
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-lg items-center justify-center px-6">
        <div className="w-full rounded-2xl border border-red-900 bg-slate-900 p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 text-2xl text-red-400">
            !
          </div>

          <h1 className="mt-5 text-xl font-semibold text-white">
            Unable to Load Asset
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-400">
            {error || "The requested asset could not be found."}
          </p>

          <button
            type="button"
            onClick={() => router.push("/assets")}
            className="mt-6 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
          >
            Back to Assets
          </button>
        </div>
      </div>
    );
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
          verified asset.
        </p>
      </div>

      {/* Asset Information */}
      <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">

        <div className="border-b border-slate-800 bg-blue-950/20 p-6">
          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-xl text-blue-400">
              ◈
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-blue-400">
                Verified Asset
              </p>

              <h2 className="mt-1 text-xl font-semibold text-white">
                {asset.name}
              </h2>
            </div>

          </div>
        </div>

        <div className="grid gap-6 p-6 md:grid-cols-2">

          <AssetField
            label="Asset Name"
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
            <div className="md:col-span-2">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Description
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-300">
                {asset.description}
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

        <form className="space-y-6 p-6">

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
              placeholder="Briefly describe the inspection..."
              className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
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
              placeholder="What did you find during the inspection?"
              className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
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
              placeholder="Describe the maintenance work performed..."
              className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
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
              placeholder="List any parts that were replaced..."
              className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
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
                defaultValue="MEDIUM"
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
              <label
                htmlFor="status"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Status
              </label>

              <select
                id="status"
                defaultValue="COMPLETED"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
              >
                <option value="COMPLETED">
                  Completed
                </option>

                <option value="PENDING">
                  Pending
                </option>
              </select>
            </div>

          </div>

          {/* Photos */}
          <div>
            <label
              htmlFor="photos"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Inspection Photos
            </label>

            <input
              id="photos"
              type="file"
              accept="image/*"
              multiple
              className="block w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-400 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-blue-500"
            />

            <p className="mt-2 text-xs text-slate-500">
              Upload photos showing the condition of the
              asset and any maintenance performed.
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 border-t border-slate-800 pt-6">

            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-xl border border-slate-700 px-5 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
            >
              Submit Inspection
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