
"use client";

import { useEffect, useMemo, useState } from "react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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
  company: number;
  company_name: string;
  client: number;
  client_username: string;
  name: string;
  serial_number: string;
  description: string;
  qr_active: boolean;
  qr_created_at: string | null;
  qr_revoked_at: string | null;
  last_qr_scan_at: string | null;
  created_at: string;
  updated_at: string;
};

async function fetchJson<T>(
  endpoint: string,
  token: string
): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (response.status === 401) {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    window.location.href = "/login";
    throw new Error("Session expired.");
  }

  if (!response.ok) {
    let message = `Request failed: ${response.status}`;

    try {
      const data = await response.json();

      if (typeof data?.detail === "string") {
        message = data.detail;
      }
    } catch {
      // Ignore invalid JSON.
    }

    throw new Error(message);
  }

  return response.json();
}

function formatDate(date: string | null) {
  if (!date) {
    return "Never";
  }

  return new Date(date).toLocaleString();
}

function formatShortDate(date: string | null) {
  if (!date) {
    return "Never";
  }

  return new Date(date).toLocaleDateString();
}

export default function AssetsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedAsset, setSelectedAsset] =
    useState<Asset | null>(null);

  useEffect(() => {
    async function loadAssets() {
      const token = localStorage.getItem("access_token");

      if (!token) {
        window.location.href = "/login";
        return;
      }

      try {
        setLoading(true);
        setError("");

        const currentUser = await fetchJson<User>(
          "/api/auth/me/",
          token
        );

        setUser(currentUser);

        const assetsData = await fetchJson<Asset[]>(
          "/api/assets/",
          token
        );

        setAssets(assetsData);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load assets."
        );
      } finally {
        setLoading(false);
      }
    }

    loadAssets();
  }, []);

  const filteredAssets = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return assets;
    }

    return assets.filter((asset) =>
      [
        asset.name,
        asset.serial_number,
        asset.company_name,
        asset.client_username,
        asset.description,
      ]
        .filter(Boolean)
        .some((value) =>
          value.toLowerCase().includes(query)
        )
    );
  }, [assets, search]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-700 border-t-blue-500" />
      </div>
    );
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
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const isAdmin = user.role === "ADMIN";
  const isTechnician = user.role === "TECHNICIAN";
  const isClient = user.role === "CLIENT";

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-blue-400">
            {isAdmin
              ? "ASSET MANAGEMENT"
              : isTechnician
                ? "MAINTENANCE ASSETS"
                : "MY ASSETS"}
          </p>

          <h1 className="mt-1 text-3xl font-bold text-white">
            {isClient ? "My Assets" : "Assets"}
          </h1>

          <p className="mt-2 max-w-2xl text-slate-400">
            {isAdmin
              ? "Manage company assets, ownership and QR-enabled maintenance operations."
              : isTechnician
                ? "View assets available for maintenance and service operations."
                : "View assets belonging to your company and monitor their maintenance status."}
          </p>
        </div>

        {isAdmin && (
          <button
            type="button"
            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
          >
            + Add Asset
          </button>
        )}
      </div>

      {/* SUMMARY */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Assets"
          value={assets.length}
          description={
            isClient
              ? "Assets under your company"
              : "Assets in the system"
          }
          icon="◈"
        />

        <StatCard
          title="Active QR"
          value={
            isClient
              ? 0
              : assets.filter((asset) => asset.qr_active).length
          }
          description={
            isClient
              ? "QR access is restricted"
              : "QR codes currently active"
          }
          icon="▣"
        />

        <StatCard
          title="Recently Scanned"
          value={
            isClient
              ? 0
              : assets.filter(
                  (asset) => asset.last_qr_scan_at
                ).length
          }
          description={
            isClient
              ? "Internal operational data"
              : "Assets with scan activity"
          }
          icon="⌁"
        />

        <StatCard
          title="Companies"
          value={
            new Set(
              assets.map((asset) => asset.company)
            ).size
          }
          description={
            isClient
              ? "Your company"
              : "Companies represented"
          }
          icon="▤"
        />
      </div>

      {/* SEARCH */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Asset Directory
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {filteredAssets.length} asset
              {filteredAssets.length === 1 ? "" : "s"} found
            </p>
          </div>

          <div className="relative w-full md:max-w-md">
            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search assets..."
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500"
            />
          </div>
        </div>
      </section>

      {/* EMPTY STATE */}
      {filteredAssets.length === 0 && (
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 text-2xl text-slate-400">
            ◈
          </div>

          <h2 className="mt-5 text-lg font-semibold text-white">
            {search
              ? "No matching assets"
              : "No assets available"}
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
            {search
              ? "Try searching with a different asset name, serial number or company."
              : isClient
                ? "Your company does not have any assets assigned yet."
                : "There are currently no assets in the system."}
          </p>
        </section>
      )}

      {/* DESKTOP TABLE */}
      {filteredAssets.length > 0 && (
        <section className="hidden overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 lg:block">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800 text-left">
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Asset
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Serial Number
                  </th>

                  {!isClient && (
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Company
                    </th>
                  )}

                  {isAdmin && (
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Client
                    </th>
                  )}

                  {!isClient && (
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      QR Status
                    </th>
                  )}

                  {!isClient && (
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Last Scan
                    </th>
                  )}

                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800">
                {filteredAssets.map((asset) => (
                  <tr
                    key={asset.id}
                    className="transition hover:bg-slate-800/40"
                  >
                    <td className="px-6 py-5">
                      <div>
                        <p className="font-medium text-white">
                          {asset.name}
                        </p>

                        <p className="mt-1 max-w-xs truncate text-xs text-slate-500">
                          {asset.description ||
                            "No description"}
                        </p>
                      </div>
                    </td>

                    <td className="px-6 py-5">
                      <span className="rounded-lg bg-slate-800 px-3 py-1.5 font-mono text-xs text-slate-300">
                        {asset.serial_number}
                      </span>
                    </td>

                    {!isClient && (
                      <td className="px-6 py-5 text-sm text-slate-300">
                        {asset.company_name}
                      </td>
                    )}

                    {isAdmin && (
                      <td className="px-6 py-5">
                        <div>
                          <p className="text-sm text-slate-300">
                            {asset.client_username}
                          </p>

                          <p className="mt-1 text-xs text-slate-600">
                            Client #{asset.client}
                          </p>
                        </div>
                      </td>
                    )}

                    {!isClient && (
                      <td className="px-6 py-5">
                        <QRStatus active={asset.qr_active} />
                      </td>
                    )}

                    {!isClient && (
                      <td className="px-6 py-5 text-sm text-slate-400">
                        {formatShortDate(
                          asset.last_qr_scan_at
                        )}
                      </td>
                    )}

                    <td className="px-6 py-5 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedAsset(asset)
                        }
                        className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-blue-500 hover:text-blue-400"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* MOBILE / TABLET CARDS */}
      {filteredAssets.length > 0 && (
        <section className="grid gap-4 lg:hidden">
          {filteredAssets.map((asset) => (
            <div
              key={asset.id}
              className="rounded-2xl border border-slate-800 bg-slate-900 p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="truncate font-semibold text-white">
                    {asset.name}
                  </h3>

                  <p className="mt-2 font-mono text-xs text-slate-500">
                    {asset.serial_number}
                  </p>
                </div>

                {!isClient && (
                  <QRStatus active={asset.qr_active} />
                )}
              </div>

              <div className="mt-5 space-y-3 border-t border-slate-800 pt-5">
                {!isClient && (
                  <InfoRow
                    label="Company"
                    value={asset.company_name}
                  />
                )}

                {isAdmin && (
                  <InfoRow
                    label="Client"
                    value={asset.client_username}
                  />
                )}

                <InfoRow
                  label="Description"
                  value={
                    asset.description || "No description"
                  }
                />

                {!isClient && (
                  <InfoRow
                    label="Last QR Scan"
                    value={formatDate(
                      asset.last_qr_scan_at
                    )}
                  />
                )}

                <InfoRow
                  label="Created"
                  value={formatShortDate(
                    asset.created_at
                  )}
                />
              </div>

              <button
                type="button"
                onClick={() => setSelectedAsset(asset)}
                className="mt-5 w-full rounded-xl border border-slate-700 px-4 py-3 text-sm font-medium text-slate-300 transition hover:border-blue-500 hover:text-blue-400"
              >
                View Asset
              </button>
            </div>
          ))}
        </section>
      )}

      {/* ASSET DETAIL MODAL */}
      {selectedAsset && (
        <AssetModal
          asset={selectedAsset}
          role={user.role}
          onClose={() => setSelectedAsset(null)}
        />
      )}
    </div>
  );
}

function AssetModal({
  asset,
  role,
  onClose,
}: {
  asset: Asset;
  role: Role;
  onClose: () => void;
}) {
  const isClient = role === "CLIENT";
  const isAdmin = role === "ADMIN";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-800 p-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-blue-400">
              Asset Details
            </p>

            <h2 className="mt-1 text-xl font-semibold text-white">
              {asset.name}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-800 hover:text-white"
          >
            ×
          </button>
        </div>

        <div className="grid gap-6 p-6 sm:grid-cols-2">
          <DetailItem
            label="Asset Name"
            value={asset.name}
          />

          <DetailItem
            label="Serial Number"
            value={asset.serial_number}
          />

          <DetailItem
            label="Company"
            value={asset.company_name}
          />

          {isAdmin && (
            <DetailItem
              label="Client"
              value={asset.client_username}
            />
          )}

          <DetailItem
            label="Description"
            value={asset.description || "No description"}
          />

          <DetailItem
            label="Created"
            value={formatDate(asset.created_at)}
          />

          <DetailItem
            label="Last Updated"
            value={formatDate(asset.updated_at)}
          />

          {/* QR INFORMATION IS COMPLETELY HIDDEN FROM CLIENT */}
          {!isClient && (
            <>
              <DetailItem
                label="QR Status"
                value={
                  asset.qr_active
                    ? "Active"
                    : "Revoked"
                }
              />

              <DetailItem
                label="Last QR Scan"
                value={formatDate(
                  asset.last_qr_scan_at
                )}
              />
            </>
          )}
        </div>

        {!isClient && (
          <div className="border-t border-slate-800 p-6">
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                  QR
                </div>

                <div>
                  <h3 className="font-medium text-white">
                    QR Maintenance Access
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    QR functionality is restricted to
                    internal operational users.
                  </p>

                  <div className="mt-4 flex flex-wrap gap-3">
                    {isAdmin && (
                      <button
                        type="button"
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500"
                      >
                        View QR
                      </button>
                    )}

                    <button
                      type="button"
                      className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-slate-600 hover:text-white"
                    >
                      Maintenance
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end border-t border-slate-800 p-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-700 px-5 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({
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
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 transition hover:border-slate-700">
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

function QRStatus({
  active,
}: {
  active: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${
        active
          ? "bg-emerald-500/10 text-emerald-400"
          : "bg-red-500/10 text-red-400"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          active ? "bg-emerald-400" : "bg-red-400"
        }`}
      />

      {active ? "Active" : "Revoked"}
    </span>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-xs text-slate-500">
        {label}
      </span>

      <span className="max-w-[65%] text-right text-sm text-slate-300">
        {value}
      </span>
    </div>
  );
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wider text-slate-600">
        {label}
      </p>

      <p className="mt-2 break-words text-sm text-slate-300">
        {value}
      </p>
    </div>
  );
}

