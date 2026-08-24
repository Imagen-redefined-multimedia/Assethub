
"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useRouter } from "next/navigation";
import { apiFetch, apiJson } from "@/lib/api";

type Company = {
  id: number;
  name: string;
};

type User = {
  id: number;
  username: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  role: "ADMIN" | "TECHNICIAN" | "CLIENT";
};

type Asset = {
  id: number;
  company: number;
  company_name: string;
  client: number;
  client_username: string;
  name: string;
  serial_number: string;
  description?: string;
  qr_active: boolean;
  qr_created_at?: string | null;
  qr_revoked_at?: string | null;
  last_qr_scan_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

type AssetForm = {
  client: string;
  name: string;
  serial_number: string;
  description: string;
};

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [clients, setClients] = useState<User[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);

  const router = useRouter();
  
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingAsset, setEditingAsset] =
    useState<Asset | null>(null);

  const [qrLoading, setQrLoading] = useState<number | null>(
    null
  );

  const [form, setForm] = useState<AssetForm>({
    client: "",
    name: "",
    serial_number: "",
    description: "",
  });

  async function getAssets() {
    try {
      setLoading(true);
      setError("");

      const data = await apiJson<
        Asset[] | { results: Asset[] }
      >("/api/assets/");

      setAssets(
        Array.isArray(data)
          ? data
          : data.results ?? []
      );
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

  async function getClients() {
    try {
      const data = await apiJson<
        User[] | { results: User[] }
      >("/api/users/");

      const users = Array.isArray(data)
        ? data
        : data.results ?? [];

      setClients(
        users.filter(
          (user) => user.role === "CLIENT"
        )
      );
    } catch (err) {
      console.error("Failed to load clients:", err);
    }
  }

  async function getCompanies() {
    try {
      const data = await apiJson<
        Company[] | { results: Company[] }
      >("/api/companies/");

      setCompanies(
        Array.isArray(data)
          ? data
          : data.results ?? []
      );
    } catch (err) {
      console.error("Failed to load companies:", err);
    }
  }

  useEffect(() => {
    async function load() {
      await Promise.all([
        getAssets(),
        getClients(),
        getCompanies(),
      ]);
    }

    load();
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
      ]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [assets, search]);

  function openCreateModal() {
    setEditingAsset(null);

    setForm({
      client: "",
      name: "",
      serial_number: "",
      description: "",
    });

    setError("");
    setSuccess("");
    setShowModal(true);
  }

  function openEditModal(asset: Asset) {
    setEditingAsset(asset);

    setForm({
      client: String(asset.client),
      name: asset.name,
      serial_number: asset.serial_number,
      description: asset.description ?? "",
    });

    setError("");
    setSuccess("");
    setShowModal(true);
  }

  function closeModal() {
    if (saving) return;

    setShowModal(false);
    setEditingAsset(null);

    setForm({
      client: "",
      name: "",
      serial_number: "",
      description: "",
    });
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!form.client) {
      setError("Please select a client.");
      return;
    }

    if (!form.name.trim()) {
      setError("Asset name is required.");
      return;
    }

    if (!form.serial_number.trim()) {
      setError("Serial number is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const isEditing = Boolean(editingAsset);

      const response = await apiFetch(
        isEditing
          ? `/api/assets/${editingAsset?.id}/`
          : "/api/assets/",
        {
          method: isEditing ? "PATCH" : "POST",
          body: JSON.stringify({
            client: Number(form.client),
            name: form.name.trim(),
            serial_number:
              form.serial_number.trim(),
            description:
              form.description.trim(),
          }),
        }
      );

      if (response.status === 401) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.location.href = "/login";
        return;
      }

      const data = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          extractApiError(data) ??
            `Unable to ${
              isEditing ? "update" : "create"
            } asset.`
        );
      }

      setSuccess(
        isEditing
          ? "Asset updated successfully."
          : "Asset created successfully."
      );

      closeModal();

      await getAssets();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(asset: Asset) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${asset.name}"?`
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      const response = await apiFetch(
        `/api/assets/${asset.id}/`,
        {
          method: "DELETE",
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
          extractApiError(data) ??
            "Unable to delete asset."
        );
      }

      setSuccess(
        "Asset deleted successfully."
      );

      await getAssets();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete asset."
      );
    }
  }

  async function handleDownloadQR(asset: Asset) {
    try {
      setQrLoading(asset.id);
      setError("");

      const response = await apiFetch(
        `/api/assets/${asset.id}/qr/`,
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
          extractApiError(data) ??
            "Unable to generate QR code."
        );
      }

      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = url;
      link.download = `${asset.name
        .replace(/\s+/g, "-")
        .toLowerCase()}-qr.png`;

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to generate QR code."
      );
    } finally {
      setQrLoading(null);
    }
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
            Assets
          </h1>

          <p className="mt-2 text-slate-400">
            Manage company assets and their QR
            identification codes.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
        >
          + Add Asset
        </button>
      </div>

      {/* Feedback */}

      {success && (
        <div className="rounded-xl border border-emerald-900 bg-emerald-950/30 px-5 py-4 text-sm text-emerald-300">
          {success}
        </div>
      )}

      {error && !showModal && (
        <div className="rounded-xl border border-red-900 bg-red-950/30 px-5 py-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Stats */}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          title="Total Assets"
          value={assets.length}
          icon="◈"
        />

        <StatCard
          title="Active QR Codes"
          value={
            assets.filter(
              (asset) => asset.qr_active
            ).length
          }
          icon="▦"
        />

        <StatCard
          title="Search Results"
          value={filteredAssets.length}
          icon="⌕"
        />
      </div>

      {/* Main Card */}

      <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
        {/* Toolbar */}

        <div className="flex flex-col gap-4 border-b border-slate-800 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-semibold text-white">
              Registered Assets
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              View and manage assets across
              registered companies.
            </p>
          </div>

          <input
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search assets..."
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500 md:w-80"
          />
        </div>

        {/* Loading */}

        {loading ? (
          <div className="flex min-h-60 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-700 border-t-blue-500" />
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 text-2xl text-slate-500">
              ◈
            </div>

            <h3 className="mt-4 font-semibold text-white">
              {search
                ? "No assets found"
                : "No assets yet"}
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              {search
                ? "Try a different search term."
                : "Create your first asset to get started."}
            </p>

            {!search && (
              <button
                type="button"
                onClick={openCreateModal}
                className="mt-5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
              >
                Add Asset
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead>
                <tr className="border-b border-slate-800 text-left">
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Asset
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Company
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Client
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    QR Status
                  </th>

                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800">
                {filteredAssets.map((asset) => (
                  <tr
                    key={asset.id}
                    className="transition hover:bg-slate-800/30"
                  >
                    {/* Asset */}

                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 font-semibold text-blue-400">
                          {asset.name
                            .charAt(0)
                            .toUpperCase()}
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

                    {/* QR */}

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
                        <button
                          type="button"
                          onClick={() => router.push(`/assets/qr/${asset.id}`)}
                          disabled={
                            !asset.qr_active ||
                            qrLoading === asset.id
                          }
                          className="rounded-lg border border-blue-900/60 px-3 py-2 text-xs font-medium text-blue-400 transition hover:bg-blue-950/40 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {qrLoading === asset.id
                            ? "Generating..."
                            : "QR Code"}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            openEditModal(asset)
                          }
                          className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-blue-500 hover:text-blue-400"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleDelete(asset)
                          }
                          className="rounded-lg border border-red-900/60 px-3 py-2 text-xs font-medium text-red-400 transition hover:bg-red-950/40"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Create / Edit Modal */}

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
            <div className="border-b border-slate-800 p-6">
              <h2 className="text-xl font-semibold text-white">
                {editingAsset
                  ? "Edit Asset"
                  : "Add Asset"}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {editingAsset
                  ? "Update the asset information."
                  : "Register a new company asset."}
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-6"
            >
              {error && (
                <div className="rounded-lg border border-red-900 bg-red-950/30 px-4 py-3 text-sm text-red-300">
                  {error}
                </div>
              )}

              {/* Client */}

              <div>
                <label
                  htmlFor="asset-client"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Client
                </label>

                <select
                  id="asset-client"
                  value={form.client}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      client: event.target.value,
                    })
                  }
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
                >
                  <option value="">
                    Select client
                  </option>

                  {clients.map((client) => (
                    <option
                      key={client.id}
                      value={client.id}
                    >
                      {client.username}
                    </option>
                  ))}
                </select>

                <p className="mt-2 text-xs text-slate-500">
                  The client's company will be assigned
                  automatically.
                </p>
              </div>

              {/* Asset Name */}

              <div>
                <label
                  htmlFor="asset-name"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Asset Name
                </label>

                <input
                  id="asset-name"
                  type="text"
                  value={form.name}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      name: event.target.value,
                    })
                  }
                  required
                  maxLength={255}
                  placeholder="Industrial Generator"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
                />
              </div>

              {/* Serial Number */}

              <div>
                <label
                  htmlFor="asset-serial"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Serial Number
                </label>

                <input
                  id="asset-serial"
                  type="text"
                  value={form.serial_number}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      serial_number:
                        event.target.value,
                    })
                  }
                  required
                  maxLength={255}
                  placeholder="GEN-2026-001"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
                />
              </div>

              {/* Description */}

              <div>
                <label
                  htmlFor="asset-description"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Description
                </label>

                <textarea
                  id="asset-description"
                  value={form.description}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      description:
                        event.target.value,
                    })
                  }
                  rows={4}
                  placeholder="Describe the asset..."
                  className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
                />
              </div>

              {/* Buttons */}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-slate-700 px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-800 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingAsset
                      ? "Save Changes"
                      : "Create Asset"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
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
    </div>
  );
}

function extractApiError(
  data: unknown
): string | null {
  if (!data || typeof data !== "object") {
    return null;
  }

  const object =
    data as Record<string, unknown>;

  if (typeof object.detail === "string") {
    return object.detail;
  }

  for (const value of Object.values(object)) {
    if (typeof value === "string") {
      return value;
    }

    if (
      Array.isArray(value) &&
      typeof value[0] === "string"
    ) {
      return value[0];
    }
  }

  return null;
}

