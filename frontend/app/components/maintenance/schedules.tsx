"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { apiFetch, apiJson } from "@/lib/api";

type Maintenance = {
  id: number;

  work_order: number;
  work_order_title: string;
  work_order_description: string;
  work_order_status: string;

  company_id: number;
  company_name: string;
  company_registration_number?: string;
  company_email?: string;
  company_phone?: string;
  company_address?: string;

  client_id: number;
  client_username: string;
  client_email?: string;
  client_first_name?: string;
  client_last_name?: string;

  asset_id: number;
  asset_name: string;
  asset_serial_number: string;
  asset_description?: string;

  technician: number;
  technician_username: string;

  description: string;
  status: string;

  created_at: string;
  updated_at: string;
};

type WorkOrder = {
  id: number;
  title: string;
  description: string;
  status: string;
};

type Technician = {
  id: number;
  username: string;
  first_name?: string;
  last_name?: string;
  role: string;
  is_active: boolean;
};

function extractApiError(data: unknown): string | null {
  if (!data || typeof data !== "object") {
    return null;
  }

  const object = data as Record<string, unknown>;

  if (typeof object.detail === "string") {
    return object.detail;
  }

  for (const value of Object.values(object)) {
    if (typeof value === "string") {
      return value;
    }

    if (Array.isArray(value) && typeof value[0] === "string") {
      return value[0];
    }
  }

  return null;
}

export default function MaintenancePage() {
  const [maintenance, setMaintenance] = useState<Maintenance[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [selectedMaintenance, setSelectedMaintenance] =
    useState<Maintenance | null>(null);

  const [form, setForm] = useState({
    work_order: "",
    technician: "",
    description: "",
  });

  async function loadMaintenance() {
    try {
      setLoading(true);
      setError("");

      const data = await apiJson<
        Maintenance[] | { results: Maintenance[] }
      >("/api/maintenance/");

      setMaintenance(
        Array.isArray(data) ? data : data.results ?? []
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load maintenance."
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadFormData() {
    try {
      const [workOrderData, userData] = await Promise.all([
        apiJson<WorkOrder[] | { results: WorkOrder[] }>(
          "/api/work-orders/"
        ),
        apiJson<Technician[] | { results: Technician[] }>(
          "/api/users/"
        ),
      ]);

      const orders = Array.isArray(workOrderData)
        ? workOrderData
        : workOrderData.results ?? [];

      const users = Array.isArray(userData)
        ? userData
        : userData.results ?? [];

      setWorkOrders(orders);

      setTechnicians(
        users.filter(
          (user) =>
            user.role === "TECHNICIAN" &&
            user.is_active
        )
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load form data."
      );
    }
  }

  useEffect(() => {
    loadMaintenance();
  }, []);

  const filteredMaintenance = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return maintenance;
    }

    return maintenance.filter((item) => {
      return (
        item.work_order_title
          ?.toLowerCase()
          .includes(query) ||
        item.asset_name
          ?.toLowerCase()
          .includes(query) ||
        item.asset_serial_number
          ?.toLowerCase()
          .includes(query) ||
        item.client_username
          ?.toLowerCase()
          .includes(query) ||
        item.company_name
          ?.toLowerCase()
          .includes(query) ||
        item.technician_username
          ?.toLowerCase()
          .includes(query) ||
        item.status
          ?.toLowerCase()
          .includes(query)
      );
    });
  }, [maintenance, search]);

  const activeCount = maintenance.filter(
    (item) =>
      item.status === "PENDING" ||
      item.status === "IN_PROGRESS"
  ).length;

  const completedCount = maintenance.filter(
    (item) => item.status === "COMPLETED"
  ).length;

  function openCreateModal() {
    setSelectedMaintenance(null);

    setForm({
      work_order: "",
      technician: "",
      description: "",
    });

    setError("");
    setSuccess("");

    loadFormData();
    setShowModal(true);
  }

  function closeModal() {
    if (saving) return;

    setShowModal(false);
    setSelectedMaintenance(null);

    setForm({
      work_order: "",
      technician: "",
      description: "",
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const token = localStorage.getItem("access_token");

    if (!token) {
      window.location.href = "/login";
      return;
    }

    if (!form.work_order) {
      setError("Please select a work order.");
      return;
    }

    if (!form.technician) {
      setError("Please select a technician.");
      return;
    }

    if (!form.description.trim()) {
      setError("Maintenance description is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await apiFetch("/api/maintenance/", {
        method: "POST",
        body: JSON.stringify({
          work_order: Number(form.work_order),
          technician: Number(form.technician),
          description: form.description.trim(),
        }),
      });

      const data = await response.json().catch(() => null);

      if (response.status === 401) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");

        window.location.href = "/login";
        return;
      }

      if (!response.ok) {
        throw new Error(
          extractApiError(data) ||
            "Unable to create maintenance task."
        );
      }

      setSuccess(
        "Maintenance task created successfully."
      );

      closeModal();

      await loadMaintenance();
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

  function getStatusClass(status: string) {
    switch (status) {
      case "COMPLETED":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";

      case "IN_PROGRESS":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";

      case "CANCELLED":
        return "bg-red-500/10 text-red-400 border-red-500/20";

      default:
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    }
  }

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium text-blue-400">
            MAINTENANCE
          </p>

          <h1 className="mt-1 text-3xl font-bold text-white">
            Maintenance
          </h1>

          <p className="mt-2 text-slate-400">
            Manage maintenance tasks assigned to technicians.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
        >
          + Create Maintenance
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

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <p className="text-sm text-slate-400">
            Total Maintenance
          </p>

          <p className="mt-2 text-3xl font-bold text-white">
            {maintenance.length}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <p className="text-sm text-slate-400">
            Active
          </p>

          <p className="mt-2 text-3xl font-bold text-amber-400">
            {activeCount}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <p className="text-sm text-slate-400">
            Completed
          </p>

          <p className="mt-2 text-3xl font-bold text-emerald-400">
            {completedCount}
          </p>
        </div>

      </div>

      {/* Main Card */}
      <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">

        {/* Toolbar */}
        <div className="flex flex-col gap-4 border-b border-slate-800 p-5 md:flex-row md:items-center md:justify-between">

          <div>
            <h2 className="font-semibold text-white">
              Maintenance Tasks
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Track assigned maintenance work.
            </p>
          </div>

          <input
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search maintenance..."
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 md:w-80"
          />

        </div>

        {/* Loading */}
        {loading ? (
          <div className="flex min-h-60 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-700 border-t-blue-500" />
          </div>
        ) : filteredMaintenance.length === 0 ? (
          <div className="p-12 text-center">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 text-2xl text-slate-500">
              🔧
            </div>

            <h3 className="mt-4 font-semibold text-white">
              {search
                ? "No maintenance found"
                : "No maintenance tasks yet"}
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              {search
                ? "Try a different search term."
                : "Create a maintenance task from a work order."}
            </p>

            {!search && (
              <button
                type="button"
                onClick={openCreateModal}
                className="mt-5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
              >
                Create Maintenance
              </button>
            )}

          </div>
        ) : (

          <div className="overflow-x-auto">

            <table className="w-full min-w-275">

              <thead>
                <tr className="border-b border-slate-800 text-left">

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Asset
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Client
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Technician
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Work Order
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Status
                  </th>

                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Action
                  </th>

                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800">

                {filteredMaintenance.map((item) => (

                  <tr
                    key={item.id}
                    className="transition hover:bg-slate-800/30"
                  >

                    {/* Asset */}
                    <td className="px-6 py-5">

                      <div>
                        <p className="font-medium text-white">
                          {item.asset_name}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {item.asset_serial_number}
                        </p>
                      </div>

                    </td>

                    {/* Client */}
                    <td className="px-6 py-5">

                      <p className="text-sm text-slate-300">
                        {item.client_first_name ||
                        item.client_last_name
                          ? `${item.client_first_name ?? ""} ${
                              item.client_last_name ?? ""
                            }`
                          : item.client_username}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {item.company_name}
                      </p>

                    </td>

                    {/* Technician */}
                    <td className="px-6 py-5">

                      <p className="text-sm text-slate-300">
                        {item.technician_username}
                      </p>

                    </td>

                    {/* Work Order */}
                    <td className="max-w-xs px-6 py-5">

                      <p className="truncate text-sm font-medium text-white">
                        {item.work_order_title}
                      </p>

                      <p className="mt-1 truncate text-xs text-slate-500">
                        {item.work_order_description}
                      </p>

                    </td>

                    {/* Status */}
                    <td className="px-6 py-5">

                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${getStatusClass(
                          item.status
                        )}`}
                      >
                        {item.status.replaceAll(
                          "_",
                          " "
                        )}
                      </span>

                    </td>

                    {/* Action */}
                    <td className="px-6 py-5 text-right">

                      <button
                        type="button"
                        onClick={() =>
                          setSelectedMaintenance(item)
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

        )}

      </section>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">

          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">

            <div className="border-b border-slate-800 p-6">

              <h2 className="text-xl font-semibold text-white">
                Create Maintenance
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Assign a work order to a technician.
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

              {/* Work Order */}
              <div>

                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Work Order
                </label>

                <select
                  value={form.work_order}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      work_order: event.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
                >

                  <option value="">
                    Select work order
                  </option>

                  {workOrders.map((order) => (
                    <option
                      key={order.id}
                      value={order.id}
                    >
                      #{order.id} — {order.title}
                    </option>
                  ))}

                </select>

              </div>

              {/* Technician */}
              <div>

                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Technician
                </label>

                <select
                  value={form.technician}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      technician: event.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
                >

                  <option value="">
                    Select technician
                  </option>

                  {technicians.map((technician) => (
                    <option
                      key={technician.id}
                      value={technician.id}
                    >
                      {technician.first_name ||
                      technician.last_name
                        ? `${technician.first_name ?? ""} ${
                            technician.last_name ?? ""
                          }`
                        : technician.username}
                    </option>
                  ))}

                </select>

              </div>

              {/* Description */}
              <div>

                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Maintenance Description
                </label>

                <textarea
                  value={form.description}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      description: event.target.value,
                    })
                  }
                  rows={4}
                  placeholder="Describe the maintenance work..."
                  className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
                />

              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-2">

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-slate-700 px-4 py-3 text-sm font-medium text-slate-300 hover:bg-slate-800 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Creating..."
                    : "Create Maintenance"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

      {/* Detail Modal */}
      {selectedMaintenance && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">

          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">

            <div className="flex items-start justify-between border-b border-slate-800 p-6">

              <div>

                <p className="text-sm text-blue-400">
                  MAINTENANCE #{selectedMaintenance.id}
                </p>

                <h2 className="mt-1 text-xl font-semibold text-white">
                  {selectedMaintenance.asset_name}
                </h2>

              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedMaintenance(null)
                }
                className="rounded-lg px-3 py-2 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                ✕
              </button>

            </div>

            <div className="grid gap-6 p-6 md:grid-cols-2">

              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500">
                  Asset
                </p>

                <p className="mt-1 text-sm text-white">
                  {selectedMaintenance.asset_name}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {selectedMaintenance.asset_serial_number}
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500">
                  Company
                </p>

                <p className="mt-1 text-sm text-white">
                  {selectedMaintenance.company_name}
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500">
                  Client
                </p>

                <p className="mt-1 text-sm text-white">
                  {selectedMaintenance.client_username}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {selectedMaintenance.client_email}
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500">
                  Technician
                </p>

                <p className="mt-1 text-sm text-white">
                  {selectedMaintenance.technician_username}
                </p>
              </div>

              <div className="md:col-span-2">

                <p className="text-xs uppercase tracking-wider text-slate-500">
                  Work Order
                </p>

                <p className="mt-1 text-sm font-medium text-white">
                  {selectedMaintenance.work_order_title}
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  {selectedMaintenance.work_order_description}
                </p>

              </div>

              <div className="md:col-span-2">

                <p className="text-xs uppercase tracking-wider text-slate-500">
                  Maintenance Description
                </p>

                <p className="mt-1 text-sm leading-6 text-slate-300">
                  {selectedMaintenance.description}
                </p>

              </div>

              <div>

                <p className="text-xs uppercase tracking-wider text-slate-500">
                  Status
                </p>

                <span
                  className={`mt-2 inline-flex rounded-full border px-3 py-1 text-xs font-medium ${getStatusClass(
                    selectedMaintenance.status
                  )}`}
                >
                  {selectedMaintenance.status.replaceAll(
                    "_",
                    " "
                  )}
                </span>

              </div>

              <div>

                <p className="text-xs uppercase tracking-wider text-slate-500">
                  Created
                </p>

                <p className="mt-1 text-sm text-slate-300">
                  {new Date(
                    selectedMaintenance.created_at
                  ).toLocaleString()}
                </p>

              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}