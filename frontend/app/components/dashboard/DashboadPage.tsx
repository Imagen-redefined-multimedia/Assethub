```tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { apiJson, ApiError } from "@/lib/api";

/* ============================================================
   TYPES
============================================================ */

type Role = "ADMIN" | "TECHNICIAN" | "CLIENT";

type User = {
  id: number;
  username: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  role: Role;
  company_id?: number | null;
  company_name?: string | null;
};

type Asset = {
  id: number;
  name: string;
  serial_number: string;
  description?: string | null;

  company?: number | null;
  company_name?: string | null;

  qr_active?: boolean;
  qr_created_at?: string | null;
  qr_revoked_at?: string | null;
  last_qr_scan_at?: string | null;

  created_at?: string;
  updated_at?: string;
};

/* ============================================================
   PAGE
============================================================ */

export default function AssetsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedAsset, setSelectedAsset] =
    useState<Asset | null>(null);

  useEffect(() => {
    loadAssets();
  }, []);

  async function loadAssets() {
    try {
      setLoading(true);
      setError("");

      const [currentUser, assetData] = await Promise.all([
        apiJson<User>("/api/auth/me/"),
        apiJson<Asset[]>("/api/assets/"),
      ]);

      setUser(currentUser);
      setAssets(assetData);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to load assets.");
      }
    } finally {
      setLoading(false);
    }
  }

  const filteredAssets = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return assets;
    }

    return assets.filter((asset) => {
      return (
        asset.name.toLowerCase().includes(query) ||
        asset.serial_number.toLowerCase().includes(query) ||
        asset.company_name?.toLowerCase().includes(query)
      );
    });
  }, [assets, search]);

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-900 bg-red-950/30 p-6">
        <h2 className="font-semibold text-red-400">
          Assets Error
        </h2>

        <p className="mt-2 text-sm text-red-300">
          {error}
        </p>

        <button
          onClick={loadAssets}
          className="mt-4 rounded-lg bg-red-500/10 px-4 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/20"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const canCreateAsset = user.role === "ADMIN";

  return (
    <div className="space-y-8">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">

        <div>
          <p className="text-sm font-medium text-blue-400">
            {user.role === "CLIENT"
              ? "CLIENT PORTAL"
              : user.role === "TECHNICIAN"
                ? "TECHNICIAN PORTAL"
                : "ADMINISTRATION"}
          </p>

          <h1 className="mt-1 text-3xl font-bold text-white">
            Assets
          </h1>

          <p className="mt-2 max-w-2xl text-slate-400">
            {user.role === "CLIENT"
              ? "View the assets belonging to your company and monitor their maintenance status."
              : user.role === "TECHNICIAN"
                ? "View assets available for maintenance operations."
                : "Manage registered assets and their company assignments."}
          </p>
        </div>

        {canCreateAsset && (
          <a
            href="/assets/new"
            className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
          >
            <span className="mr-2 text-lg">+</span>
            Add Asset
          </a>
        )}
      </div>

      {/* ======================================================
          SUMMARY
      ====================================================== */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <SummaryCard
          title="Total Assets"
          value={assets.length}
          description={
            user.role === "CLIENT"
              ? "Assets assigned to your company"
              : "Assets available"
          }
          icon="◈"
        />

        <SummaryCard
          title="Active QR Codes"
          value={
            assets.filter(
              (asset) => asset.qr_active === true
            ).length
          }
          description="QR codes currently active"
          icon="▣"
        />

        <SummaryCard
          title="Inactive QR Codes"
          value={
            assets.filter(
              (asset) => asset.qr_active === false
            ).length
          }
          description="QR codes requiring attention"
          icon="⚠"
        />

        <SummaryCard
          title="Recently Scanned"
          value={
            assets.filter(
              (asset) => asset.last_qr_scan_at
            ).length
          }
          description="Assets with QR scan history"
          icon="⌁"
        />

      </div>

      {/* ======================================================
          SEARCH
      ====================================================== */}

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

          <div>
            <h2 className="font-semibold text-white">
              Asset Register
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {filteredAssets.length}{" "}
              {filteredAssets.length === 1
                ? "asset"
                : "assets"}{" "}
              displayed
            </p>
          </div>

          <div className="relative w-full md:max-w-md">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
              ⌕
            </span>

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search by asset or serial number..."
              className="w-full rounded-xl border border-slate-800 bg-slate-950 py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500"
            />
          </div>

        </div>
      </section>

      {/* ======================================================
          EMPTY STATE
      ====================================================== */}

      {filteredAssets.length === 0 ? (
        <EmptyState
          hasSearch={Boolean(search.trim())}
          canCreateAsset={canCreateAsset}
        />
      ) : (
        <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">

          {filteredAssets.map((asset) => (
            <AssetCard
              key={asset.id}
              asset={asset}
              userRole={user.role}
              onClick={() => setSelectedAsset(asset)}
            />
          ))}

        </section>
      )}

      {/* ======================================================
          DETAILS MODAL
      ====================================================== */}

      {selectedAsset && (
        <AssetDetailsModal
          asset={selectedAsset}
          userRole={user.role}
          onClose={() => setSelectedAsset(null)}
        />
      )}

    </div>
  );
}

/* ============================================================
   ASSET CARD
============================================================ */

function AssetCard({
  asset,
  userRole,
  onClick,
}: {
  asset: Asset;
  userRole: Role;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group text-left"
    >
      <div className="h-full rounded-2xl border border-slate-800 bg-slate-900 p-6 transition duration-200 hover:-translate-y-1 hover:border-slate-700 hover:bg-slate-900/80">

        {/* Icon + QR status */}

        <div className="flex items-start justify-between">

          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-xl text-blue-400">
            ◈
          </div>

          <QRBadge active={asset.qr_active} />

        </div>

        {/* Asset information */}

        <div className="mt-6">

          <h3 className="truncate text-lg font-semibold text-white group-hover:text-blue-400">
            {asset.name}
          </h3>

          <p className="mt-2 text-sm text-slate-500">
            Serial Number
          </p>

          <p className="mt-1 font-mono text-sm text-slate-300">
            {asset.serial_number}
          </p>

        </div>

        {/* Company */}

        {userRole !== "CLIENT" &&
          asset.company_name && (
            <div className="mt-5 border-t border-slate-800 pt-4">
              <p className="text-xs uppercase tracking-wide text-slate-600">
                Company
              </p>

              <p className="mt-1 text-sm text-slate-400">
                {asset.company_name}
              </p>
            </div>
          )}

        {/* Footer */}

        <div className="mt-5 flex items-center justify-between border-t border-slate-800 pt-4">

          <span className="text-xs text-slate-500">
            Asset #{asset.id}
          </span>

          <span className="text-sm font-medium text-blue-400">
            View details →
          </span>

        </div>

      </div>
    </button>
  );
}

/* ============================================================
   DETAILS MODAL
============================================================ */

function AssetDetailsModal({
  asset,
  userRole,
  onClose,
}: {
  asset: Asset;
  userRole: Role;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >

        {/* Header */}

        <div className="flex items-start justify-between border-b border-slate-800 p-6">

          <div>
            <p className="text-sm font-medium text-blue-400">
              ASSET DETAILS
            </p>

            <h2 className="mt-1 text-2xl font-bold text-white">
              {asset.name}
            </h2>

            <p className="mt-1 font-mono text-sm text-slate-500">
              {asset.serial_number}
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-slate-500 transition hover:bg-slate-800 hover:text-white"
          >
            ✕
          </button>

        </div>

        {/* Body */}

        <div className="space-y-6 p-6">

          {/* Basic information */}

          <div>
            <h3 className="text-sm font-semibold text-white">
              Asset Information
            </h3>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">

              <DetailItem
                label="Asset Name"
                value={asset.name}
              />

              <DetailItem
                label="Serial Number"
                value={asset.serial_number}
              />

              {userRole !== "CLIENT" && (
                <DetailItem
                  label="Company"
                  value={
                    asset.company_name || "Not assigned"
                  }
                />
              )}

              <DetailItem
                label="Asset ID"
                value={`#${asset.id}`}
              />

            </div>
          </div>

          {/* Description */}

          {asset.description && (
            <div>
              <h3 className="text-sm font-semibold text-white">
                Description
              </h3>

              <p className="mt-3 rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm leading-6 text-slate-400">
                {asset.description}
              </p>
            </div>
          )}

          {/* QR information */}

          <div>
            <div className="flex items-center justify-between">

              <div>
                <h3 className="text-sm font-semibold text-white">
                  QR Code
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  Asset identification and maintenance scanning
                </p>
              </div>

              <QRBadge active={asset.qr_active} />

            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">

              <DetailItem
                label="QR Status"
                value={
                  asset.qr_active
                    ? "Active"
                    : "Inactive"
                }
              />

              <DetailItem
                label="Last Scan"
                value={
                  asset.last_qr_scan_at
                    ? formatDate(asset.last_qr_scan_at)
                    : "Never scanned"
                }
              />

              <DetailItem
                label="QR Created"
                value={
                  asset.qr_created_at
                    ? formatDate(asset.qr_created_at)
                    : "Not available"
                }
              />

              {asset.qr_revoked_at && (
                <DetailItem
                  label="QR Revoked"
                  value={formatDate(asset.qr_revoked_at)}
                />
              )}

            </div>
          </div>

          {/* Actions */}

          <div className="flex flex-col gap-3 border-t border-slate-800 pt-6 sm:flex-row">

            {userRole === "TECHNICIAN" && (
              <a
                href="/maintenance"
                className="flex-1 rounded-xl bg-blue-600 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-blue-500"
              >
                Open Maintenance
              </a>
            )}

            {userRole === "ADMIN" && (
              <a
                href={`/assets/${asset.id}`}
                className="flex-1 rounded-xl bg-blue-600 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-blue-500"
              >
                Manage Asset
              </a>
            )}

            <button
              onClick={onClose}
              className="rounded-xl border border-slate-700 px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
            >
              Close
            </button>

          </div>

        </div>
      </div>
    </div>
  );
}

/* ============================================================
   SUMMARY CARD
============================================================ */

function SummaryCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: number;
  description: string;
  icon: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

      <div className="flex items-start justify-between">

        <div>
          <p className="text-sm font-medium text-slate-400">
            {title}
          </p>

          <p className="mt-3 text-3xl font-bold text-white">
            {value}
          </p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
          {icon}
        </div>

      </div>

      <p className="mt-4 text-xs text-slate-500">
        {description}
      </p>

    </div>
  );
}

/* ============================================================
   DETAIL ITEM
============================================================ */

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">

      <p className="text-xs uppercase tracking-wide text-slate-600">
        {label}
      </p>

      <p className="mt-2 break-words text-sm font-medium text-slate-300">
        {value}
      </p>

    </div>
  );
}

/* ============================================================
   QR BADGE
============================================================ */

function QRBadge({
  active,
}: {
  active?: boolean;
}) {
  if (active === undefined) {
    return (
      <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-slate-400">
        QR Unknown
      </span>
    );
  }

  return (
    <span
      className={
        active
          ? "rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400"
          : "rounded-full bg-red-500/10 px-3 py-1 text-xs font-medium text-red-400"
      }
    >
      {active ? "QR Active" : "QR Inactive"}
    </span>
  );
}

/* ============================================================
   EMPTY STATE
============================================================ */

function EmptyState({
  hasSearch,
  canCreateAsset,
}: {
  hasSearch: boolean;
  canCreateAsset: boolean;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/50 p-12 text-center">

      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800 text-2xl text-slate-500">
        ◈
      </div>

      <h2 className="mt-5 text-lg font-semibold text-white">
        {hasSearch
          ? "No assets found"
          : "No assets yet"}
      </h2>

      <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
        {hasSearch
          ? "Try adjusting your search to find the asset you are looking for."
          : "There are currently no assets available for this account."}
      </p>

      {canCreateAsset && !hasSearch && (
        <a
          href="/assets/new"
          className="mt-6 inline-flex rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
        >
          Add your first asset
        </a>
      )}

    </div>
  );
}

/* ============================================================
   LOADING
============================================================ */

function LoadingState() {
  return (
    <div className="space-y-8">

      <div>
        <div className="h-4 w-28 animate-pulse rounded bg-slate-800" />
        <div className="mt-3 h-9 w-40 animate-pulse rounded bg-slate-800" />
        <div className="mt-3 h-4 w-96 max-w-full animate-pulse rounded bg-slate-800" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="h-32 animate-pulse rounded-2xl border border-slate-800 bg-slate-900"
          />
        ))}
      </div>

      <div className="h-20 animate-pulse rounded-2xl border border-slate-800 bg-slate-900" />

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <div
            key={item}
            className="h-64 animate-pulse rounded-2xl border border-slate-800 bg-slate-900"
          />
        ))}
      </div>

    </div>
  );
}

/* ============================================================
   DATE FORMATTER
============================================================ */

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
```
