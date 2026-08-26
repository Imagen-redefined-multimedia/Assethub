
"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { apiFetch, apiJson } from "@/lib/api";

type Role = "ADMIN" | "TECHNICIAN" | "CLIENT";

type WorkOrderStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

type CurrentUser = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: Role;
  is_active: boolean;
  company_id: number | null;
  company_name: string | null;
};

type WorkOrder = {
  id: number;
  company: number | null;
  company_name: string | null;
  client: number;
  client_username: string;
  asset: number;
  asset_name: string;
  title: string;
  description: string;
  status: WorkOrderStatus;
  created_at: string;
  updated_at: string;
};

type Client = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: Role;
  is_active: boolean;
  company_id: number | null;
  company_name: string | null;
};

type Asset = {
  id: number;
  company: number | null;
  company_name: string | null;
  client: number;
  client_username: string;
  name: string;
  serial_number: string;
  description: string;
};

type WorkOrderForm = {
  company: number | null;
  client: number | null;
  asset: number | null;
  title: string;
  description: string;
  status: WorkOrderStatus;
};

const STATUS_OPTIONS: WorkOrderStatus[] = [
  "PENDING",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
];

export default function WorkOrdersPage() {
  const [user, setUser] = useState<CurrentUser | null>(null);

  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<"ALL" | WorkOrderStatus>("ALL");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingOrder, setEditingOrder] =
    useState<WorkOrder | null>(null);

  const [form, setForm] = useState<WorkOrderForm>({
    company: null,
    client: null,
    asset: null,
    title: "",
    description: "",
    status: "PENDING",
  });

  const isAdmin = user?.role === "ADMIN";
  const isClient = user?.role === "CLIENT";

  function logout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    window.location.href = "/login";
  }

  async function loadUser(): Promise<CurrentUser> {
    const response = await apiFetch("/api/auth/me/");

    if (response.status === 401) {
      logout();
      throw new Error("Authentication required.");
    }

    if (!response.ok) {
      throw new Error("Unable to identify the current user.");
    }

    const data = await response.json();

    setUser(data);

    return data;
  }

  async function loadData(currentUser: CurrentUser) {
    try {
      setLoading(true);
      setError("");

      /*
       * ---------------------------------------------------------
       * ADMIN
       * ---------------------------------------------------------
       *
       * Admin needs:
       * - work orders
       * - clients
       * - assets
       */
      if (currentUser.role === "ADMIN") {
        const [
          ordersData,
          usersData,
          assetsData,
        ] = await Promise.all([
          apiJson<WorkOrder[] | { results: WorkOrder[] }>(
            "/api/work-orders/"
          ),

          apiJson<Client[] | { results: Client[] }>(
            "/api/users/"
          ),

          apiJson<Asset[] | { results: Asset[] }>(
            "/api/assets/"
          ),
        ]);

        setWorkOrders(
          Array.isArray(ordersData)
            ? ordersData
            : ordersData.results ?? []
        );

        const allUsers = Array.isArray(usersData)
          ? usersData
          : usersData.results ?? [];

        setClients(
          allUsers.filter(
            (user) => user.role === "CLIENT"
          )
        );

        setAssets(
          Array.isArray(assetsData)
            ? assetsData
            : assetsData.results ?? []
        );

        return;
      }

      /*
       * ---------------------------------------------------------
       * CLIENT
       * ---------------------------------------------------------
       *
       * Client only needs work orders.
       *
       * IMPORTANT:
       * We deliberately do NOT request:
       *
       * /api/users/
       * /api/assets/
       *
       * This prevents unnecessary 403 responses.
       */
      if (currentUser.role === "CLIENT") {
        const ordersData = await apiJson<
          WorkOrder[] | { results: WorkOrder[] }
        >("/api/work-orders/");

        setWorkOrders(
          Array.isArray(ordersData)
            ? ordersData
            : ordersData.results ?? []
        );

        setClients([]);
        setAssets([]);

        return;
      }

      /*
       * ---------------------------------------------------------
       * TECHNICIAN
       * ---------------------------------------------------------
       */
      if (currentUser.role === "TECHNICIAN") {
        window.location.href = "/maintenance";
        return;
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load work orders."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function initialise() {
      const token = localStorage.getItem("access_token");

      if (!token) {
        logout();
        return;
      }

      try {
        const currentUser = await loadUser();

        await loadData(currentUser);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to initialise work orders."
        );

        setLoading(false);
      }
    }

    initialise();
  }, []);

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();

    return workOrders.filter((order) => {
      const matchesSearch =
        !query ||
        [
          order.title,
          order.description,
          order.company_name ?? "",
          order.client_username,
          order.asset_name,
          order.status,
          String(order.id),
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);

      const matchesStatus =
        statusFilter === "ALL" ||
        order.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [workOrders, search, statusFilter]);

  const pendingCount = workOrders.filter(
    (order) => order.status === "PENDING"
  ).length;

  const inProgressCount = workOrders.filter(
    (order) => order.status === "IN_PROGRESS"
  ).length;

  const completedCount = workOrders.filter(
    (order) => order.status === "COMPLETED"
  ).length;

  const cancelledCount = workOrders.filter(
    (order) => order.status === "CANCELLED"
  ).length;

  function resetForm() {
    setForm({
      company: null,
      client: null,
      asset: null,
      title: "",
      description: "",
      status: "PENDING",
    });
  }

  function openCreateModal() {
    if (!isAdmin) return;

    setEditingOrder(null);
    resetForm();
    setError("");
    setSuccess("");
    setShowModal(true);
  }

  function openEditModal(order: WorkOrder) {
    setEditingOrder(order);

    setForm({
      company: order.company,
      client: order.client,
      asset: order.asset,
      title: order.title,
      description: order.description,
      status: order.status,
    });

    setError("");
    setSuccess("");
    setShowModal(true);
  }

  function closeModal() {
    if (saving) return;

    setShowModal(false);
    setEditingOrder(null);
    resetForm();
  }

  function handleClientChange(clientId: number | null) {
    const client = clients.find(
      (item) => item.id === clientId
    );

    setForm((current) => ({
      ...current,
      client: clientId,
      company: client?.company_id ?? null,
      asset: null,
    }));
  }

  const availableAssets = useMemo(() => {
    if (!form.client) {
      return [];
    }

    return assets.filter(
      (asset) => asset.client === form.client
    );
  }, [assets, form.client]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!editingOrder && !isAdmin) {
      setError(
        "Only administrators can create work orders."
      );
      return;
    }

    if (!form.client) {
      setError("Please select a client.");
      return;
    }

    if (!form.asset) {
      setError("Please select an asset.");
      return;
    }

    if (!form.title.trim()) {
      setError("Work order title is required.");
      return;
    }

    if (!form.description.trim()) {
      setError("Work order description is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const isEditing = Boolean(editingOrder);

      const body = {
        company: form.company,
        client: form.client,
        asset: form.asset,
        title: form.title.trim(),
        description: form.description.trim(),
        status: form.status,
      };

      const response = await apiFetch(
        isEditing
          ? `/api/work-orders/${editingOrder!.id}/`
          : "/api/work-orders/",
        {
          method: isEditing ? "PATCH" : "POST",
          body: JSON.stringify(body),
        }
      );

      if (response.status === 401) {
        logout();
        return;
      }

      const data = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          extractApiError(data) ||
            `Unable to ${
              isEditing ? "update" : "create"
            } work order.`
        );
      }

      setSuccess(
        isEditing
          ? "Work order updated successfully."
          : "Work order created successfully."
      );

      closeModal();

      if (user) {
        await loadData(user);
      }
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

  async function handleDelete(order: WorkOrder) {
    if (!isAdmin) {
      setError(
        "Only administrators can delete work orders."
      );
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete work order #${order.id}?`
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      const response = await apiFetch(
        `/api/work-orders/${order.id}/`,
        {
          method: "DELETE",
        }
      );

      if (response.status === 401) {
        logout();
        return;
      }

      const data = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          extractApiError(data) ||
            "Unable to delete work order."
        );
      }

      setSuccess(
        "Work order deleted successfully."
      );

      if (user) {
        await loadData(user);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete work order."
      );
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-700 border-t-blue-500" />
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="rounded-2xl border border-red-900 bg-red-950/30 p-6">
        <h2 className="font-semibold text-red-400">
          Work Orders Error
        </h2>

        <p className="mt-2 text-sm text-red-300">
          {error}
        </p>

        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {/* Header */}

      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium text-blue-400">
            {isAdmin
              ? "OPERATIONS"
              : "CLIENT PORTAL"}
          </p>

          <h1 className="mt-1 text-3xl font-bold text-white">
            Work Orders
          </h1>

          <p className="mt-2 text-slate-400">
            {isAdmin
              ? "Create, track and manage maintenance work orders across your client assets."
              : "View and manage maintenance work orders associated with your assets."}
          </p>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={openCreateModal}
            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
          >
            + Create Work Order
          </button>
        )}
      </div>

      {/* Feedback */}

      {success && (
        <div className="rounded-xl border border-emerald-900 bg-emerald-950/30 px-5 py-4 text-sm text-emerald-300">
          {success}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-900 bg-red-950/30 px-5 py-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Statistics */}

      <div
        className={`grid gap-4 ${
          isAdmin
            ? "sm:grid-cols-2 xl:grid-cols-5"
            : "sm:grid-cols-2 lg:grid-cols-4"
        }`}
      >
        <StatCard
          title="Total"
          value={workOrders.length}
          description="All work orders"
        />

        <StatCard
          title="Pending"
          value={pendingCount}
          description="Awaiting action"
        />

        <StatCard
          title="In Progress"
          value={inProgressCount}
          description="Currently being worked on"
        />

        <StatCard
          title="Completed"
          value={completedCount}
          description="Successfully completed"
        />

        {isAdmin && (
          <StatCard
            title="Cancelled"
            value={cancelledCount}
            description="Cancelled orders"
          />
        )}
      </div>

      {/* Work Orders */}

      <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">

        {/* Toolbar */}

        <div className="flex flex-col gap-4 border-b border-slate-800 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-semibold text-white">
              {isAdmin
                ? "Work Order Register"
                : "My Work Orders"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {isAdmin
                ? "View and manage maintenance requests."
                : "Track maintenance requests for your assets."}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search work orders..."
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500 sm:w-72"
            />

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as
                    | "ALL"
                    | WorkOrderStatus
                )
              }
              className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
            >
              <option value="ALL">
                All Statuses
              </option>

              <option value="PENDING">
                Pending
              </option>

              <option value="IN_PROGRESS">
                In Progress
              </option>

              <option value="COMPLETED">
                Completed
              </option>

              <option value="CANCELLED">
                Cancelled
              </option>
            </select>
          </div>
        </div>

        {/* Loading */}

        {loading ? (
          <div className="flex min-h-60 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-700 border-t-blue-500" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 text-2xl text-slate-500">
              W
            </div>

            <h3 className="mt-4 font-semibold text-white">
              {search || statusFilter !== "ALL"
                ? "No work orders found"
                : "No work orders yet"}
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              {search || statusFilter !== "ALL"
                ? "Try changing your search or filter."
                : isAdmin
                  ? "Create your first work order to get started."
                  : "There are currently no work orders associated with your account."}
            </p>

            {isAdmin &&
              !search &&
              statusFilter === "ALL" && (
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="mt-5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
                >
                  Create Work Order
                </button>
              )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-slate-800 text-left">

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Work Order
                  </th>

                  {isAdmin && (
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Company
                    </th>
                  )}

                  {isAdmin && (
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Client
                    </th>
                  )}

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Asset
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Status
                  </th>

                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800">
                {filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="transition hover:bg-slate-800/30"
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-start gap-3">

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-sm font-bold text-blue-400">
                          #{order.id}
                        </div>

                        <div>
                          <p className="font-medium text-white">
                            {order.title}
                          </p>

                          <p className="mt-1 max-w-xs truncate text-xs text-slate-500">
                            {order.description}
                          </p>

                          <p className="mt-2 text-xs text-slate-600">
                            {formatDate(order.created_at)}
                          </p>
                        </div>

                      </div>
                    </td>

                    {isAdmin && (
                      <td className="px-6 py-5">
                        <p className="text-sm font-medium text-slate-300">
                          {order.company_name ||
                            "No company"}
                        </p>
                      </td>
                    )}

                    {isAdmin && (
                      <td className="px-6 py-5">
                        <p className="text-sm text-slate-300">
                          {order.client_username}
                        </p>
                      </td>
                    )}

                    <td className="px-6 py-5">
                      <p className="text-sm font-medium text-slate-300">
                        {order.asset_name}
                      </p>
                    </td>

                    <td className="px-6 py-5">
                      <StatusBadge
                        status={order.status}
                      />
                    </td>

                    <td className="px-6 py-5">
                      <div className="flex justify-end gap-2">

                        {(isAdmin || isClient) && (
                          <button
                            type="button"
                            onClick={() =>
                              openEditModal(order)
                            }
                            className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-blue-500 hover:text-blue-400"
                          >
                            View / Edit
                          </button>
                        )}

                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(order)
                            }
                            className="rounded-lg border border-red-900/60 px-3 py-2 text-xs font-medium text-red-400 transition hover:bg-red-950/40"
                          >
                            Delete
                          </button>
                        )}

                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Modal */}

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/70 px-4 py-8 backdrop-blur-sm">

          <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">

            <div className="border-b border-slate-800 p-6">
              <h2 className="text-xl font-semibold text-white">
                {editingOrder
                  ? isAdmin
                    ? "Edit Work Order"
                    : "Update Work Order"
                  : "Create Work Order"}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {editingOrder
                  ? "Review and update the maintenance work order."
                  : "Create a new maintenance work order for a client asset."}
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

              {/* ADMIN CLIENT SELECT */}

              {isAdmin && (
                <>
                  <SelectField
                    label="Client"
                    value={
                      form.client !== null
                        ? String(form.client)
                        : ""
                    }
                    onChange={(value) =>
                      handleClientChange(
                        value
                          ? Number(value)
                          : null
                      )
                    }
                    required
                  >
                    <option value="">
                      Select a client
                    </option>

                    {clients.map((client) => (
                      <option
                        key={client.id}
                        value={client.id}
                      >
                        {client.first_name ||
                        client.last_name
                          ? `${client.first_name} ${client.last_name}`.trim()
                          : client.username}

                        {client.company_name
                          ? ` — ${client.company_name}`
                          : ""}
                      </option>
                    ))}
                  </SelectField>

                  {/* Company */}

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      Company
                    </label>

                    <input
                      type="text"
                      value={
                        clients.find(
                          (client) =>
                            client.id ===
                            form.client
                        )?.company_name || ""
                      }
                      disabled
                      placeholder="Company is assigned from the client"
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-400 outline-none"
                    />

                    <p className="mt-2 text-xs text-slate-600">
                      The company is automatically
                      determined from the selected
                      client.
                    </p>
                  </div>

                  {/* Asset */}

                  <SelectField
                    label="Asset"
                    value={
                      form.asset !== null
                        ? String(form.asset)
                        : ""
                    }
                    onChange={(value) =>
                      setForm((current) => ({
                        ...current,
                        asset: value
                          ? Number(value)
                          : null,
                      }))
                    }
                    required
                    disabled={
                      !form.client ||
                      availableAssets.length === 0
                    }
                  >
                    <option value="">
                      {!form.client
                        ? "Select a client first"
                        : availableAssets.length === 0
                          ? "No assets assigned to this client"
                          : "Select an asset"}
                    </option>

                    {availableAssets.map(
                      (asset) => (
                        <option
                          key={asset.id}
                          value={asset.id}
                        >
                          {asset.name} —{" "}
                          {asset.serial_number}
                        </option>
                      )
                    )}
                  </SelectField>
                </>
              )}

              {/* CLIENT READ-ONLY CONTEXT */}

              {isClient && editingOrder && (
                <div className="grid gap-4 sm:grid-cols-2">

                  <InfoField
                    label="Asset"
                    value={
                      editingOrder.asset_name
                    }
                  />

                  <InfoField
                    label="Company"
                    value={
                      editingOrder.company_name ||
                      user?.company_name ||
                      "Your company"
                    }
                  />

                  <InfoField
                    label="Work Order"
                    value={`#${editingOrder.id}`}
                  />

                  <InfoField
                    label="Created"
                    value={formatDate(
                      editingOrder.created_at
                    )}
                  />

                </div>
              )}

              {/* Title */}

              <Input
                label="Work Order Title"
                value={form.title}
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    title: value,
                  }))
                }
                placeholder="e.g. Generator maintenance"
                required
              />

              {/* Description */}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Description
                </label>

                <textarea
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      description:
                        event.target.value,
                    }))
                  }
                  rows={5}
                  placeholder="Describe the maintenance work required..."
                  required
                  className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
                />
              </div>

              {/* Status */}

              <SelectField
                label="Status"
                value={form.status}
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    status:
                      value as WorkOrderStatus,
                  }))
                }
                disabled={!isAdmin}
              >
                {STATUS_OPTIONS.map(
                  (status) => (
                    <option
                      key={status}
                      value={status}
                    >
                      {formatStatus(status)}
                    </option>
                  )
                )}
              </SelectField>

              {!isAdmin && (
                <p className="text-xs text-slate-500">
                  Work order status is managed by the
                  operations team.
                </p>
              )}

              {/* Actions */}

              <div className="flex justify-end gap-3 border-t border-slate-800 pt-5">

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
                    : editingOrder
                      ? "Save Changes"
                      : "Create Work Order"}
                </button>

              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   INPUT
============================================================ */

function Input({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-300">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        required={required}
        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
      />
    </div>
  );
}

/* ============================================================
   SELECT
============================================================ */

function SelectField({
  label,
  value,
  onChange,
  children,
  required = false,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-300">
        {label}
      </label>

      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        required={required}
        disabled={disabled}
        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {children}
      </select>
    </div>
  );
}

/* ============================================================
   INFO FIELD
============================================================ */

function InfoField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <div className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-300">
        {value}
      </div>
    </div>
  );
}

/* ============================================================
   STAT CARD
============================================================ */

function StatCard({
  title,
  value,
  description,
}: {
  title: string;
  value: number;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <p className="text-sm text-slate-400">
        {title}
      </p>

      <p className="mt-2 text-3xl font-bold text-white">
        {value}
      </p>

      <p className="mt-3 text-xs text-slate-500">
        {description}
      </p>
    </div>
  );
}

/* ============================================================
   STATUS BADGE
============================================================ */

function StatusBadge({
  status,
}: {
  status: WorkOrderStatus;
}) {
  const styles: Record<
    WorkOrderStatus,
    string
  > = {
    PENDING:
      "bg-amber-500/10 text-amber-400",

    IN_PROGRESS:
      "bg-blue-500/10 text-blue-400",

    COMPLETED:
      "bg-emerald-500/10 text-emerald-400",

    CANCELLED:
      "bg-red-500/10 text-red-400",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium ${styles[status]}`}
    >
      {formatStatus(status)}
    </span>
  );
}

/* ============================================================
   HELPERS
============================================================ */

function formatStatus(
  status: WorkOrderStatus
) {
  return status
    .replace("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

function formatDate(
  date: string
) {
  if (!date) return "—";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleDateString(
    undefined,
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    }
  );
}

function extractApiError(
  data: unknown
): string | null {
  if (
    !data ||
    typeof data !== "object"
  ) {
    return null;
  }

  const object =
    data as Record<string, unknown>;

  if (
    typeof object.detail === "string"
  ) {
    return object.detail;
  }

  for (
    const [field, value]
    of Object.entries(object)
  ) {
    if (typeof value === "string") {
      return `${field}: ${value}`;
    }

    if (
      Array.isArray(value) &&
      typeof value[0] === "string"
    ) {
      return `${field}: ${value[0]}`;
    }

    if (
      value &&
      typeof value === "object"
    ) {
      const nested =
        extractApiError(value);

      if (nested) {
        return `${field}: ${nested}`;
      }
    }
  }

  return null;
}
