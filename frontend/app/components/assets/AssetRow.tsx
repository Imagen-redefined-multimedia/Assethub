"use client";

import { useRouter } from "next/navigation";

import type { Asset } from "@/types/asset";

type AssetRowProps = {
  asset: Asset;
  qrLoading: number | null;
  onEdit: (asset: Asset) => void;
  onDelete: (asset: Asset) => void;
  isAdmin: boolean;
  isTechnician: boolean;
  isClient: boolean;
};

export default function AssetRow({
  asset,
  qrLoading,
  onEdit,
  onDelete,
  isAdmin,
  isTechnician,
  isClient,
}: AssetRowProps) {
  const router = useRouter();

  const initial = asset.name.charAt(0).toUpperCase();

  return (
    <tr className="transition hover:bg-slate-800/30">
      {/* Asset */}
      <td className="px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 font-semibold text-blue-400">
            {initial}
          </div>

          <div>
            <p className="font-medium text-white">
              {asset.name}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              {asset.serial_number}
            </p>
          </div>
        </div>
      </td>

      {/* Company */}
      <td className="px-6 py-5 text-sm text-slate-300">
        {asset.company_name}
      </td>

      {/* Client */}
      <td className="px-6 py-5 text-sm text-slate-400">
        {asset.client_username}
      </td>

      {/* QR Status */}
      <td className="px-6 py-5">
        {asset.qr_active ? (
          <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
            Active
          </span>
        ) : (
          <span className="rounded-full bg-red-500/10 px-3 py-1 text-xs font-medium text-red-400">
            Inactive
          </span>
        )}
      </td>

      {/* Actions */}
      <td className="px-6 py-5">
        <div className="flex justify-end gap-2">

          {/* ADMIN ACTIONS */}
          {isAdmin && (
            <>
              <button
                type="button"
                onClick={() =>
                  router.push(`/assets/qr/${asset.id}`)
                }
                disabled={!asset.qr_active}
                className="rounded-lg border border-blue-900/60 px-3 py-2 text-xs font-medium text-blue-400 transition hover:bg-blue-950/40 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {qrLoading === asset.id
                  ? "Generating..."
                  : "QR Code"}
              </button>

              <button
                type="button"
                onClick={() => onEdit(asset)}
                className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-blue-500 hover:text-blue-400"
              >
                Edit
              </button>

              <button
                type="button"
                onClick={() => onDelete(asset)}
                className="rounded-lg border border-red-900/60 px-3 py-2 text-xs font-medium text-red-400 transition hover:bg-red-950/40"
              >
                Delete
              </button>
            </>
          )}

          {/* TECHNICIAN ACTIONS */}
          {isTechnician && (
            <button
              type="button"
              onClick={() =>
                router.push("/assets/qr-scanner")
              }
              className="rounded-lg border border-emerald-900/60 px-3 py-2 text-xs font-medium text-emerald-400 transition hover:bg-emerald-950/40"
            >
              Scan QR
            </button>
          )}

          {/* CLIENT ACTIONS */}
          {isClient && (
            <button
              type="button"
              className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-blue-500 hover:text-blue-400"
            >
              View
            </button>
          )}

        </div>
      </td>
    </tr>
  );
}