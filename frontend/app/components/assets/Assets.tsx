"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import { apiFetch, apiJson } from "@/lib/api";

import {
  Asset,
  AssetForm,
  User,
  emptyAssetForm,
} from "@/types/asset";

import { extractApiError } from "@/lib/asset-utils";

import AssetHeader from "./AssetHeader";
import AssetStats from "./AssetStats";
import AssetToolbar from "./AssetToolbar";
import AssetTable from "./AssetTable";
import AssetEmptyState from "./AssetEmptyState";
import AssetLoading from "./AssetLoading";
import AssetModal from "./AssetModal";
import Feedback from "./Feedback";

export default function Assets() {
  // ============================================================
  // STATE
  // ============================================================

  const [assets, setAssets] = useState<Asset[]>([]);
  const [clients, setClients] = useState<User[]>([]);
  const [user, setUser] = useState<User | null>(null);

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [qrLoading, setQrLoading] = useState<number | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showModal, setShowModal] = useState(false);

  const [editingAsset, setEditingAsset] =
    useState<Asset | null>(null);

  const [form, setForm] =
    useState<AssetForm>(emptyAssetForm);


  const isAdmin = user?.role === "ADMIN";
  const isTechnician = user?.role === "TECHNICIAN";
  const isClient = user?.role === "CLIENT";
  // ============================================================
  // GET ASSETS
  // ============================================================

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

  // ============================================================
  // GET CLIENTS
  // ============================================================

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
      console.error(
        "Failed to load clients:",
        err
      );
    }
  }

  // ============================================================
// INITIAL LOAD
// ============================================================

useEffect(() => {
  async function load() {
    try {
      setLoading(true);
      setError("");

      // Get logged-in user
      const currentUser = await apiJson<User>(
        "/api/auth/me/"
      );

      setUser(currentUser);

      // Assets are available to authenticated roles
      await getAssets();

      // Only Admin needs the client list
      if (currentUser.role === "ADMIN") {
        await getClients();
      }
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

  load();
}, []);

  // ============================================================
  // SEARCH
  // ============================================================

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

  // ============================================================
  // CREATE MODAL
  // ============================================================

  function openCreateModal() {
    setEditingAsset(null);

    setForm({
      ...emptyAssetForm,
    });

    setError("");
    setSuccess("");
    setShowModal(true);
  }

  // ============================================================
  // EDIT MODAL
  // ============================================================

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

  // ============================================================
  // CLOSE MODAL
  // ============================================================

  function closeModal() {
    if (saving) {
      return;
    }

    setShowModal(false);
    setEditingAsset(null);

    setForm({
      ...emptyAssetForm,
    });
  }

  // ============================================================
  // FORM SUBMIT
  // ============================================================

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    // -----------------------------
    // Validation
    // -----------------------------

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

      // -----------------------------
      // Authentication failure
      // -----------------------------

      if (response.status === 401) {
        localStorage.removeItem(
          "access_token"
        );

        localStorage.removeItem(
          "refresh_token"
        );

        window.location.href = "/login";

        return;
      }

      // -----------------------------
      // Response
      // -----------------------------

      const data = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          extractApiError(data) ??
            `Unable to ${
              isEditing
                ? "update"
                : "create"
            } asset.`
        );
      }

      // -----------------------------
      // Success
      // -----------------------------

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

  // ============================================================
  // DELETE ASSET
  // ============================================================

  async function handleDelete(asset: Asset) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${asset.name}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      const response = await apiFetch(
        `/api/assets/${asset.id}/`,
        {
          method: "DELETE",
        }
      );

      // -----------------------------
      // Authentication failure
      // -----------------------------

      if (response.status === 401) {
        localStorage.removeItem(
          "access_token"
        );

        localStorage.removeItem(
          "refresh_token"
        );

        window.location.href = "/login";

        return;
      }

      // -----------------------------
      // Error
      // -----------------------------

      if (!response.ok) {
        const data = await response
          .json()
          .catch(() => null);

        throw new Error(
          extractApiError(data) ??
            "Unable to delete asset."
        );
      }

      // -----------------------------
      // Success
      // -----------------------------

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

  // ============================================================
  // QR CODE
  // ============================================================

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

      // -----------------------------
      // Authentication failure
      // -----------------------------

      if (response.status === 401) {
        localStorage.removeItem(
          "access_token"
        );

        localStorage.removeItem(
          "refresh_token"
        );

        window.location.href = "/login";

        return;
      }

      // -----------------------------
      // Error
      // -----------------------------

      if (!response.ok) {
        const data = await response
          .json()
          .catch(() => null);

        throw new Error(
          extractApiError(data) ??
            "Unable to generate QR code."
        );
      }

      // -----------------------------
      // Download
      // -----------------------------

      const blob = await response.blob();

      const url =
        window.URL.createObjectURL(blob);

      const link =
        document.createElement("a");

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

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="space-y-8">
      {/* Header */}

      <AssetHeader
        onAdd={openCreateModal}
        isAdmin={isAdmin}
      />

      {/* Feedback */}

      <Feedback
        success={success}
        error={error}
        showError={!showModal}
      />

      {/* Stats */}

      <AssetStats
        total={assets.length}
        activeQr={
          assets.filter(
            (asset) => asset.qr_active
          ).length
        }
        searchResults={
          filteredAssets.length
        }
      />

      {/* Main */}

      <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
        {/* Toolbar */}

        <AssetToolbar
          search={search}
          onSearchChange={setSearch}
        />

        {/* Content */}

        {loading ? (
          <AssetLoading />
        ) : filteredAssets.length === 0 ? (
          <AssetEmptyState
            hasSearch={Boolean(
              search.trim()
            )}
            onAdd={openCreateModal}
            isAdmin={isAdmin}
          />
        ) : (
          <AssetTable
            assets={filteredAssets}
            qrLoading={qrLoading}
            onEdit={openEditModal}
            onDelete={handleDelete}
            isAdmin={isAdmin}
            isTechnician={isTechnician}
            isClient={isClient}
          />
        )}
      </section>

      {/* Modal */}

      <AssetModal
        open={showModal}
        isEditing={Boolean(
          editingAsset
        )}
        form={form}
        clients={clients}
        saving={saving}
        error={error}
        onChange={(field, value) =>
          setForm((current) => ({
            ...current,
            [field]: value,
          }))
        }
        onSubmit={handleSubmit}
        onClose={closeModal}
      />
    </div>
  );
}