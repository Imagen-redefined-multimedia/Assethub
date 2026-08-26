
"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import { apiFetch, apiJson, logout } from "@/lib/api";

/* ============================================================
   TYPES
============================================================ */

type Role = "ADMIN" | "TECHNICIAN" | "CLIENT";

type WorkOrderStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

type ClientResponse =
  | "PENDING"
  | "ACCEPTED"
  | "REJECTED";

type ResponseAction = "ACCEPT" | "REJECT";

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

  /*
   * Added by your new Django migration.
   */
  client_response?: ClientResponse | null;
  client_response_comment?: string | null;
  client_responded_at?: string | null;

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

/* ============================================================
   CONSTANTS
============================================================ */

const STATUS_OPTIONS: WorkOrderStatus[] = [
  "PENDING",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
];

/*
 * These values correspond to the WorkOrderResponseSerializer
 * action field.
 */
const RESPONSE_ACTIONS: ResponseAction[] = [
  "ACCEPT",
  "REJECT",
];

/* ============================================================
   MAIN PAGE
============================================================ */

export default function WorkOrdersPage() {
  const [user, setUser] =
    useState<CurrentUser | null>(null);

  const [workOrders, setWorkOrders] =
    useState<WorkOrder[]>([]);

  const [clients, setClients] =
    useState<Client[]>([]);

  const [assets, setAssets] =
    useState<Asset[]>([]);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] =
    useState<"ALL" | WorkOrderStatus>("ALL");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [showModal, setShowModal] =
    useState(false);

  const [editingOrder, setEditingOrder] =
    useState<WorkOrder | null>(null);

  /*
   * Client response state.
   */
  const [responseAction, setResponseAction] =
    useState<ResponseAction>("ACCEPT");

  const [responseComment, setResponseComment] =
    useState("");

  /*
   * Admin form.
   */
  const [form, setForm] =
    useState<WorkOrderForm>({
      company: null,
      client: null,
      asset: null,
      title: "",
      description: "",
      status: "PENDING",
    });

  const isAdmin =
    user?.role === "ADMIN";

  const isClient =
    user?.role === "CLIENT";

  /* ============================================================
     USER
  ============================================================ */

  async function loadUser(): Promise<CurrentUser> {
    const response =
      await apiFetch("/api/auth/me/");

    if (response.status === 401) {
      logout();
      throw new Error(
        "Authentication required."
      );
    }

    if (!response.ok) {
      throw new Error(
        "Unable to identify the current user."
      );
    }

    const data =
      await response.json();

    setUser(data);

    return data;
  }

  /* ============================================================
     LOAD DATA
  ============================================================ */

  async function loadData(
    currentUser: CurrentUser
  ) {
    try {
      setLoading(true);
      setError("");

      /*
       * ADMIN
       *
       * Admin can see:
       * - Work orders
       * - Users
       * - Assets
       */
      if (
        currentUser.role === "ADMIN"
      ) {
        const [
          ordersData,
          usersData,
          assetsData,
        ] = await Promise.all([
          apiJson<
            WorkOrder[] |
            { results: WorkOrder[] }
          >("/api/work-orders/"),

          apiJson<
            Client[] |
            { results: Client[] }
          >("/api/users/"),

          apiJson<
            Asset[] |
            { results: Asset[] }
          >("/api/assets/"),
        ]);

        setWorkOrders(
          Array.isArray(ordersData)
            ? ordersData
            : ordersData.results ?? []
        );

        const allUsers =
          Array.isArray(usersData)
            ? usersData
            : usersData.results ?? [];

        setClients(
          allUsers.filter(
            (item) =>
              item.role === "CLIENT"
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
       * CLIENT
       *
       * Client only needs work orders.
       */
      if (
        currentUser.role === "CLIENT"
      ) {
        const ordersData =
          await apiJson<
            WorkOrder[] |
            { results: WorkOrder[] }
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
       * TECHNICIAN
       */
      if (
        currentUser.role === "TECHNICIAN"
      ) {
        window.location.href =
          "/maintenance";

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

  /* ============================================================
     INITIALISE
  ============================================================ */

  useEffect(() => {
    async function initialise() {
      const token =
        localStorage.getItem(
          "access_token"
        );

      if (!token) {
        logout();
        return;
      }

      try {
        const currentUser =
          await loadUser();

        await loadData(
          currentUser
        );
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

  /* ============================================================
     FILTERING
  ============================================================ */

  const filteredOrders =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return workOrders.filter(
        (order) => {
          const matchesSearch =
            !query ||
            [
              order.title,
              order.description,
              order.company_name ?? "",
              order.client_username,
              order.asset_name,
              order.status,
              order.client_response ?? "",
              String(order.id),
            ]
              .join(" ")
              .toLowerCase()
              .includes(query);

          const matchesStatus =
            statusFilter === "ALL" ||
            order.status ===
              statusFilter;

          return (
            matchesSearch &&
            matchesStatus
          );
        }
      );
    }, [
      workOrders,
      search,
      statusFilter,
    ]);

  /* ============================================================
     STATISTICS
  ============================================================ */

  const pendingCount =
    workOrders.filter(
      (order) =>
        order.status === "PENDING"
    ).length;

  const inProgressCount =
    workOrders.filter(
      (order) =>
        order.status ===
        "IN_PROGRESS"
    ).length;

  const completedCount =
    workOrders.filter(
      (order) =>
        order.status === "COMPLETED"
    ).length;

  const cancelledCount =
    workOrders.filter(
      (order) =>
        order.status === "CANCELLED"
    ).length;

  const awaitingResponseCount =
    workOrders.filter(
      (order) =>
        !order.client_response ||
        order.client_response ===
          "PENDING"
    ).length;

  /* ============================================================
     ADMIN FORM
  ============================================================ */

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

  function resetResponseForm() {
    setResponseAction("ACCEPT");
    setResponseComment("");
  }

  function openCreateModal() {
    if (!isAdmin) return;

    setEditingOrder(null);
    resetForm();
    resetResponseForm();

    setError("");
    setSuccess("");

    setShowModal(true);
  }

  function openEditModal(
    order: WorkOrder
  ) {
    setEditingOrder(order);

    setForm({
      company: order.company,
      client: order.client,
      asset: order.asset,
      title: order.title,
      description: order.description,
      status: order.status,
    });

    resetResponseForm();

    setError("");
    setSuccess("");

    setShowModal(true);
  }

  function closeModal() {
    if (saving) return;

    setShowModal(false);
    setEditingOrder(null);

    resetForm();
    resetResponseForm();
  }

  /* ============================================================
     CLIENT CHANGE
  ============================================================ */

  function handleClientChange(
    clientId: number | null
  ) {
    const client =
      clients.find(
        (item) =>
          item.id === clientId
      );

    setForm((current) => ({
      ...current,

      client: clientId,

      company:
        client?.company_id ??
        null,

      asset: null,
    }));
  }

  /* ============================================================
     AVAILABLE ASSETS
  ============================================================ */

  const availableAssets =
    useMemo(() => {
      if (!form.client) {
        return [];
      }

      return assets.filter(
        (asset) =>
          asset.client ===
          form.client
      );
    }, [
      assets,
      form.client,
    ]);

  /* ============================================================
     ADMIN CREATE / EDIT
  ============================================================ */

  async function handleAdminSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!isAdmin) {
      setError(
        "Only administrators can manage work orders."
      );
      return;
    }

    if (!form.client) {
      setError(
        "Please select a client."
      );
      return;
    }

    if (!form.asset) {
      setError(
        "Please select an asset."
      );
      return;
    }

    if (!form.title.trim()) {
      setError(
        "Work order title is required."
      );
      return;
    }

    if (!form.description.trim()) {
      setError(
        "Work order description is required."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const isEditing =
        Boolean(editingOrder);

      const body = {
        company: form.company,
        client: form.client,
        asset: form.asset,
        title: form.title.trim(),
        description:
          form.description.trim(),
        status: form.status,
      };

      const response =
        await apiFetch(
          isEditing
            ? `/api/work-orders/${editingOrder!.id}/`
            : "/api/work-orders/",
          {
            method: isEditing
              ? "PATCH"
              : "POST",

            body:
              JSON.stringify(body),
          }
        );

      if (
        response.status === 401
      ) {
        logout();
        return;
      }

      const data =
        await response
          .json()
          .catch(() => null);

      if (!response.ok) {
        throw new Error(
          extractApiError(data) ||
            `Unable to ${
              isEditing
                ? "update"
                : "create"
            } work order.`
        );
      }

      setSuccess(
        isEditing
          ? "Work order updated successfully."
          : "Work order created successfully."
      );

      setShowModal(false);
      setEditingOrder(null);

      resetForm();

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

  /* ============================================================
     CLIENT ACCEPT / REJECT
  ============================================================ */

  async function handleClientResponse(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      !isClient ||
      !editingOrder
    ) {
      return;
    }

    if (
      responseAction === "REJECT" &&
      !responseComment.trim()
    ) {
      setError(
        "Please provide a reason when rejecting a work order."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      /*
       * IMPORTANT:
       *
       * This endpoint uses POST.
       *
       * DO NOT use PATCH here.
       *
       * The serializer expects:
       *
       * {
       *   action: "ACCEPT" | "REJECT",
       *   comment: "..."
       * }
       */
      const response =
        await apiFetch(
          `/api/work-orders/${editingOrder.id}/respond/`,
          {
            method: "POST",

            body: JSON.stringify({
              action:
                responseAction,

              comment:
                responseComment.trim(),
            }),
          }
        );

      if (
        response.status === 401
      ) {
        logout();
        return;
      }

      const data =
        await response
          .json()
          .catch(() => null);

      if (!response.ok) {
        throw new Error(
          extractApiError(data) ||
            "Unable to submit your response."
        );
      }

      setSuccess(
        responseAction === "ACCEPT"
          ? "Work order accepted successfully."
          : "Work order rejected successfully."
      );

      setShowModal(false);
      setEditingOrder(null);

      resetResponseForm();

      if (user) {
        await loadData(user);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to submit your response."
      );
    } finally {
      setSaving(false);
    }
  }

  /* ============================================================
     DELETE
  ============================================================ */

  async function handleDelete(
    order: WorkOrder
  ) {
    if (!isAdmin) {
      setError(
        "Only administrators can delete work orders."
      );
      return;
    }

    const confirmed =
      window.confirm(
        `Are you sure you want to delete work order #${order.id}?`
      );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      const response =
        await apiFetch(
          `/api/work-orders/${order.id}/`,
          {
            method: "DELETE",
          }
        );

      if (
        response.status === 401
      ) {
        logout();
        return;
      }

      const data =
        await response
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

  /* ============================================================
     LOADING
  ============================================================ */

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-700 border-t-blue-500" />
      </div>
    );
  }

  /* ============================================================
     AUTH ERROR
  ============================================================ */

  if (error && !user) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-red-900 bg-red-950/30 p-6">
        <h2 className="font-semibold text-red-400">
          Work Orders Error
        </h2>

        <p className="mt-2 text-sm text-red-300">
          {error}
        </p>

        <button
          type="button"
          onClick={() =>
            window.location.reload()
          }
          className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
        >
          Retry
        </button>
      </div>
    );
  }

  /* ============================================================
     PAGE
  ============================================================ */

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-widest text-blue-400 sm:text-sm">
            {isAdmin
              ? "OPERATIONS"
              : "CLIENT PORTAL"}
          </p>

          <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">
            Work Orders
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            {isAdmin
              ? "Create, track and manage maintenance work orders across your client assets."
              : "Review maintenance work orders associated with your assets and respond to requests."}
          </p>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={
              openCreateModal
            }
            className="w-full rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 sm:w-auto"
          >
            + Create Work Order
          </button>
        )}
      </div>

      {/* ======================================================
          FEEDBACK
      ====================================================== */}

      {success && (
        <div className="rounded-xl border border-emerald-900 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-300 sm:px-5">
          {success}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-900 bg-red-950/30 px-4 py-3 text-sm text-red-300 sm:px-5">
          {error}
        </div>
      )}

      {/* ======================================================
          STATISTICS
      ====================================================== */}

      <div
        className={`grid gap-3 sm:gap-4 ${
          isAdmin
            ? "grid-cols-2 xl:grid-cols-5"
            : "grid-cols-2 lg:grid-cols-4"
        }`}
      >
        <StatCard
          title="Total"
          value={
            workOrders.length
          }
          description="All work orders"
        />

        <StatCard
          title="Pending"
          value={
            pendingCount
          }
          description="Awaiting action"
        />

        <StatCard
          title="In Progress"
          value={
            inProgressCount
          }
          description="Currently being worked on"
        />

        <StatCard
          title="Completed"
          value={
            completedCount
          }
          description="Successfully completed"
        />

        {isAdmin && (
          <StatCard
            title="Cancelled"
            value={
              cancelledCount
            }
            description="Cancelled orders"
          />
        )}
      </div>

      {/* ======================================================
          CLIENT RESPONSE SUMMARY
      ====================================================== */}

      {isClient &&
        awaitingResponseCount > 0 && (
          <div className="rounded-2xl border border-amber-900/60 bg-amber-950/20 p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-amber-300">
                  Action required
                </p>

                <p className="mt-1 text-sm text-amber-400/80">
                  You have{" "}
                  {awaitingResponseCount}{" "}
                  work order
                  {awaitingResponseCount !==
                  1
                    ? "s"
                    : ""}{" "}
                  awaiting your response.
                </p>
              </div>

              <span className="w-fit rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400">
                {awaitingResponseCount}{" "}
                pending
              </span>
            </div>
          </div>
        )}

      {/* ======================================================
          WORK ORDERS
      ====================================================== */}

      <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
        {/* Toolbar */}

        <div className="border-b border-slate-800 p-4 sm:p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="font-semibold text-white">
                {isAdmin
                  ? "Work Order Register"
                  : "My Work Orders"}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {isAdmin
                  ? "View and manage maintenance requests."
                  : "Review and respond to maintenance requests."}
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 sm:flex-row xl:w-auto">
              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search work orders..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500 sm:w-72"
              />

              <select
                value={
                  statusFilter
                }
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value as
                      | "ALL"
                      | WorkOrderStatus
                  )
                }
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500 sm:w-48"
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
        </div>

        {/* ====================================================
            EMPTY
        ==================================================== */}

        {filteredOrders.length ===
        0 ? (
          <div className="p-8 text-center sm:p-12">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 text-xl font-bold text-slate-500">
              W
            </div>

            <h3 className="mt-4 font-semibold text-white">
              {search ||
              statusFilter !==
                "ALL"
                ? "No work orders found"
                : "No work orders yet"}
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              {search ||
              statusFilter !==
                "ALL"
                ? "Try changing your search or filter."
                : isAdmin
                  ? "Create your first work order to get started."
                  : "There are currently no work orders associated with your account."}
            </p>

            {isAdmin &&
              !search &&
              statusFilter ===
                "ALL" && (
                <button
                  type="button"
                  onClick={
                    openCreateModal
                  }
                  className="mt-5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
                >
                  Create Work Order
                </button>
              )}
          </div>
        ) : (
          <>
            {/* ==================================================
                DESKTOP TABLE
            ================================================== */}

            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[1000px]">
                <thead>
                  <tr className="border-b border-slate-800 text-left">
                    <TableHeader>
                      Work Order
                    </TableHeader>

                    {isAdmin && (
                      <TableHeader>
                        Company
                      </TableHeader>
                    )}

                    {isAdmin && (
                      <TableHeader>
                        Client
                      </TableHeader>
                    )}

                    <TableHeader>
                      Asset
                    </TableHeader>

                    <TableHeader>
                      Status
                    </TableHeader>

                    {isClient && (
                      <TableHeader>
                        Response
                      </TableHeader>
                    )}

                    <TableHeader align="right">
                      Actions
                    </TableHeader>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-800">
                  {filteredOrders.map(
                    (order) => (
                      <tr
                        key={
                          order.id
                        }
                        className="transition hover:bg-slate-800/30"
                      >
                        <td className="px-6 py-5">
                          <WorkOrderIdentity
                            order={order}
                          />
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
                              {
                                order.client_username
                              }
                            </p>
                          </td>
                        )}

                        <td className="px-6 py-5">
                          <p className="text-sm font-medium text-slate-300">
                            {
                              order.asset_name
                            }
                          </p>
                        </td>

                        <td className="px-6 py-5">
                          <StatusBadge
                            status={
                              order.status
                            }
                          />
                        </td>

                        {isClient && (
                          <td className="px-6 py-5">
                            <ResponseBadge
                              response={
                                order.client_response
                              }
                            />
                          </td>
                        )}

                        <td className="px-6 py-5">
                          <OrderActions
                            order={
                              order
                            }
                            isAdmin={
                              isAdmin
                            }
                            isClient={
                              isClient
                            }
                            onEdit={
                              openEditModal
                            }
                            onDelete={
                              handleDelete
                            }
                          />
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>

            {/* ==================================================
                MOBILE / TABLET CARDS
            ================================================== */}

            <div className="grid gap-3 p-3 sm:p-4 lg:hidden">
              {filteredOrders.map(
                (order) => (
                  <WorkOrderCard
                    key={
                      order.id
                    }
                    order={
                      order
                    }
                    isAdmin={
                      isAdmin
                    }
                    isClient={
                      isClient
                    }
                    onEdit={
                      openEditModal
                    }
                    onDelete={
                      handleDelete
                    }
                  />
                )
              )}
            </div>
          </>
        )}
      </section>

      {/* ======================================================
          MODAL
      ====================================================== */}

      {showModal &&
        editingOrder &&
        isClient && (
          <ClientResponseModal
            order={
              editingOrder
            }
            action={
              responseAction
            }
            comment={
              responseComment
            }
            saving={
              saving
            }
            onActionChange={
              setResponseAction
            }
            onCommentChange={
              setResponseComment
            }
            onSubmit={
              handleClientResponse
            }
            onClose={
              closeModal
            }
            error={
              error
            }
          />
        )}

      {showModal &&
        (isAdmin ||
          !editingOrder) && (
          <AdminWorkOrderModal
            editingOrder={
              editingOrder
            }
            form={form}
            clients={
              clients
            }
            availableAssets={
              availableAssets
            }
            saving={
              saving
            }
            error={
              error
            }
            isAdmin={
              isAdmin
            }
            onFormChange={
              setForm
            }
            onClientChange={
              handleClientChange
            }
            onSubmit={
              handleAdminSubmit
            }
            onClose={
              closeModal
            }
          />
        )}
    </div>
  );
}

/* ============================================================
   ADMIN MODAL
============================================================ */

function AdminWorkOrderModal({
  editingOrder,
  form,
  clients,
  availableAssets,
  saving,
  error,
  isAdmin,
  onFormChange,
  onClientChange,
  onSubmit,
  onClose,
}: {
  editingOrder:
    | WorkOrder
    | null;

  form: WorkOrderForm;

  clients: Client[];

  availableAssets: Asset[];

  saving: boolean;

  error: string;

  isAdmin: boolean;

  onFormChange: React.Dispatch<
    React.SetStateAction<WorkOrderForm>
  >;

  onClientChange: (
    id: number | null
  ) => void;

  onSubmit: (
    event: FormEvent<HTMLFormElement>
  ) => void;

  onClose: () => void;
}) {
  return (
    <ModalShell>
      <div className="border-b border-slate-800 p-5 sm:p-6">
        <h2 className="text-xl font-semibold text-white">
          {editingOrder
            ? "Edit Work Order"
            : "Create Work Order"}
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          {editingOrder
            ? "Update the maintenance work order."
            : "Create a new maintenance work order for a client asset."}
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="space-y-5 p-5 sm:p-6"
      >
        {error && (
          <ErrorMessage
            message={
              error
            }
          />
        )}

        <SelectField
          label="Client"
          value={
            form.client !==
            null
              ? String(
                  form.client
                )
              : ""
          }
          onChange={(
            value
          ) =>
            onClientChange(
              value
                ? Number(
                    value
                  )
                : null
            )
          }
          required
        >
          <option value="">
            Select a client
          </option>

          {clients.map(
            (client) => (
              <option
                key={
                  client.id
                }
                value={
                  client.id
                }
              >
                {client.first_name ||
                client.last_name
                  ? `${client.first_name} ${client.last_name}`.trim()
                  : client.username}

                {client.company_name
                  ? ` — ${client.company_name}`
                  : ""}
              </option>
            )
          )}
        </SelectField>

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
              )?.company_name ||
              ""
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

        <SelectField
          label="Asset"
          value={
            form.asset !==
            null
              ? String(
                  form.asset
                )
              : ""
          }
          onChange={(
            value
          ) =>
            onFormChange(
              (current) => ({
                ...current,
                asset: value
                  ? Number(
                      value
                    )
                  : null,
              })
            )
          }
          required
          disabled={
            !form.client ||
            availableAssets.length ===
              0
          }
        >
          <option value="">
            {!form.client
              ? "Select a client first"
              : availableAssets.length ===
                  0
                ? "No assets assigned to this client"
                : "Select an asset"}
          </option>

          {availableAssets.map(
            (asset) => (
              <option
                key={
                  asset.id
                }
                value={
                  asset.id
                }
              >
                {
                  asset.name
                }{" "}
                —{" "}
                {
                  asset.serial_number
                }
              </option>
            )
          )}
        </SelectField>

        <Input
          label="Work Order Title"
          value={
            form.title
          }
          onChange={(
            value
          ) =>
            onFormChange(
              (current) => ({
                ...current,
                title: value,
              })
            )
          }
          placeholder="e.g. Generator maintenance"
          required
        />

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">
            Description
          </label>

          <textarea
            value={
              form.description
            }
            onChange={(
              event
            ) =>
              onFormChange(
                (current) => ({
                  ...current,
                  description:
                    event
                      .target
                      .value,
                })
              )
            }
            rows={5}
            placeholder="Describe the maintenance work required..."
            required
            className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
          />
        </div>

        <SelectField
          label="Status"
          value={
            form.status
          }
          onChange={(
            value
          ) =>
            onFormChange(
              (current) => ({
                ...current,
                status:
                  value as WorkOrderStatus,
              })
            )
          }
          disabled={
            !isAdmin
          }
        >
          {STATUS_OPTIONS.map(
            (status) => (
              <option
                key={
                  status
                }
                value={
                  status
                }
              >
                {
                  formatStatus(
                    status
                  )
                }
              </option>
            )
          )}
        </SelectField>

        <ModalActions
          saving={
            saving
          }
          submitText={
            editingOrder
              ? "Save Changes"
              : "Create Work Order"
          }
          onClose={
            onClose
          }
        />
      </form>
    </ModalShell>
  );
}

/* ============================================================
   CLIENT RESPONSE MODAL
============================================================ */

function ClientResponseModal({
  order,
  action,
  comment,
  saving,
  error,
  onActionChange,
  onCommentChange,
  onSubmit,
  onClose,
}: {
  order: WorkOrder;

  action: ResponseAction;

  comment: string;

  saving: boolean;

  error: string;

  onActionChange: (
    action: ResponseAction
  ) => void;

  onCommentChange: (
    comment: string
  ) => void;

  onSubmit: (
    event: FormEvent<HTMLFormElement>
  ) => void;

  onClose: () => void;
}) {
  const alreadyResponded =
    order.client_response ===
      "ACCEPTED" ||
    order.client_response ===
      "REJECTED";

  return (
    <ModalShell>
      <div className="border-b border-slate-800 p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-400">
              Work Order #
              {order.id}
            </p>

            <h2 className="mt-1 text-xl font-semibold text-white">
              {order.title}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Review this maintenance
              request.
            </p>
          </div>

          <StatusBadge
            status={
              order.status
            }
          />
        </div>
      </div>

      <form
        onSubmit={
          onSubmit
        }
        className="space-y-5 p-5 sm:p-6"
      >
        {error && (
          <ErrorMessage
            message={
              error
            }
          />
        )}

        {/* Work order details */}

        <div className="grid gap-4 sm:grid-cols-2">
          <InfoField
            label="Asset"
            value={
              order.asset_name
            }
          />

          <InfoField
            label="Company"
            value={
              order.company_name ||
              "Your company"
            }
          />

          <InfoField
            label="Created"
            value={formatDate(
              order.created_at
            )}
          />

          <InfoField
            label="Current Status"
            value={formatStatus(
              order.status
            )}
          />
        </div>

        {/* Description */}

        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
            Description
          </p>

          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm leading-6 text-slate-300">
            {
              order.description
            }
          </div>
        </div>

        {/* Existing response */}

        {alreadyResponded && (
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Previous Response
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <ResponseBadge
                response={
                  order.client_response
                }
              />

              {order.client_responded_at && (
                <span className="text-xs text-slate-500">
                  {formatDate(
                    order.client_responded_at
                  )}
                </span>
              )}
            </div>

            {order.client_response_comment && (
              <p className="mt-3 text-sm leading-6 text-slate-400">
                {
                  order.client_response_comment
                }
              </p>
            )}
          </div>
        )}

        {/* Response */}

        <div>
          <p className="mb-3 text-sm font-medium text-slate-300">
            Your Response
          </p>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ResponseOption
              selected={
                action ===
                "ACCEPT"
              }
              title="Accept"
              description="Approve the work order."
              onClick={() =>
                onActionChange(
                  "ACCEPT"
                )
              }
            />

            <ResponseOption
              selected={
                action ===
                "REJECT"
              }
              title="Reject"
              description="Decline the work order."
              onClick={() =>
                onActionChange(
                  "REJECT"
                )
              }
            />
          </div>
        </div>

        {/* Comment */}

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">
            Comment
            {action ===
              "REJECT" && (
              <span className="ml-1 text-red-400">
                *
              </span>
            )}
          </label>

          <textarea
            value={
              comment
            }
            onChange={(
              event
            ) =>
              onCommentChange(
                event.target
                  .value
              )
            }
            rows={4}
            placeholder={
              action ===
              "REJECT"
                ? "Please explain why you are rejecting this work order..."
                : "Add an optional comment..."
            }
            className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
          />
        </div>

        <div className="rounded-xl border border-blue-900/50 bg-blue-950/20 p-4">
          <p className="text-xs leading-5 text-blue-300">
            Your response will be recorded
            against this work order and
            made available to the operations
            team.
          </p>
        </div>

        <ModalActions
          saving={
            saving
          }
          submitText={
            action ===
            "ACCEPT"
              ? "Accept Work Order"
              : "Reject Work Order"
          }
          onClose={
            onClose
          }
        />
      </form>
    </ModalShell>
  );
}

/* ============================================================
   MOBILE CARD
============================================================ */

function WorkOrderCard({
  order,
  isAdmin,
  isClient,
  onEdit,
  onDelete,
}: {
  order: WorkOrder;

  isAdmin: boolean;

  isClient: boolean;

  onEdit: (
    order: WorkOrder
  ) => void;

  onDelete: (
    order: WorkOrder
  ) => void;
}) {
  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-xs font-bold text-blue-400">
            #
            {
              order.id
            }
          </div>

          <div className="min-w-0">
            <h3 className="truncate font-medium text-white">
              {
                order.title
              }
            </h3>

            <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
              {
                order.description
              }
            </p>
          </div>
        </div>

        <StatusBadge
          status={
            order.status
          }
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <MobileDetail
          label="Asset"
          value={
            order.asset_name
          }
        />

        {isAdmin && (
          <MobileDetail
            label="Client"
            value={
              order.client_username
            }
          />
        )}

        {isAdmin && (
          <MobileDetail
            label="Company"
            value={
              order.company_name ||
              "No company"
            }
          />
        )}

        <MobileDetail
          label="Created"
          value={formatDate(
            order.created_at
          )}
        />

        {isClient && (
          <div className="col-span-2">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
              Response
            </p>

            <ResponseBadge
              response={
                order.client_response
              }
            />
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-2 border-t border-slate-800 pt-4 sm:flex-row sm:justify-end">
        {(isAdmin ||
          isClient) && (
          <button
            type="button"
            onClick={() =>
              onEdit(order)
            }
            className="w-full rounded-lg border border-slate-700 px-3 py-2.5 text-xs font-medium text-slate-300 transition hover:border-blue-500 hover:text-blue-400 sm:w-auto"
          >
            {isClient
              ? "Review Work Order"
              : "Edit"}
          </button>
        )}

        {isAdmin && (
          <button
            type="button"
            onClick={() =>
              onDelete(
                order
              )
            }
            className="w-full rounded-lg border border-red-900/60 px-3 py-2.5 text-xs font-medium text-red-400 transition hover:bg-red-950/40 sm:w-auto"
          >
            Delete
          </button>
        )}
      </div>
    </article>
  );
}

/* ============================================================
   ORDER ACTIONS
============================================================ */

function OrderActions({
  order,
  isAdmin,
  isClient,
  onEdit,
  onDelete,
}: {
  order: WorkOrder;

  isAdmin: boolean;

  isClient: boolean;

  onEdit: (
    order: WorkOrder
  ) => void;

  onDelete: (
    order: WorkOrder
  ) => void;
}) {
  return (
    <div className="flex justify-end gap-2">
      {(isAdmin ||
        isClient) && (
        <button
          type="button"
          onClick={() =>
            onEdit(order)
          }
          className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-blue-500 hover:text-blue-400"
        >
          {isClient
            ? "Review"
            : "Edit"}
        </button>
      )}

      {isAdmin && (
        <button
          type="button"
          onClick={() =>
            onDelete(order)
          }
          className="rounded-lg border border-red-900/60 px-3 py-2 text-xs font-medium text-red-400 transition hover:bg-red-950/40"
        >
          Delete
        </button>
      )}
    </div>
  );
}

/* ============================================================
   RESPONSE OPTION
============================================================ */

function ResponseOption({
  selected,
  title,
  description,
  onClick,
}: {
  selected: boolean;

  title: string;

  description: string;

  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border p-4 text-left transition ${
        selected
          ? "border-blue-500 bg-blue-500/10"
          : "border-slate-700 bg-slate-950 hover:border-slate-600"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`h-4 w-4 rounded-full border ${
            selected
              ? "border-blue-400 bg-blue-500"
              : "border-slate-600"
          }`}
        />

        <span className="font-medium text-white">
          {title}
        </span>
      </div>

      <p className="mt-2 text-xs leading-5 text-slate-500">
        {description}
      </p>
    </button>
  );
}

/* ============================================================
   MODAL SHELL
============================================================ */

function ModalShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/70 px-3 py-4 backdrop-blur-sm sm:px-4 sm:py-8">
      <div className="my-auto w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
        {children}
      </div>
    </div>
  );
}

/* ============================================================
   MODAL ACTIONS
============================================================ */

function ModalActions({
  saving,
  submitText,
  onClose,
}: {
  saving: boolean;

  submitText: string;

  onClose: () => void;
}) {
  return (
    <div className="flex flex-col-reverse gap-3 border-t border-slate-800 pt-5 sm:flex-row sm:justify-end">
      <button
        type="button"
        onClick={onClose}
        disabled={
          saving
        }
        className="w-full rounded-xl border border-slate-700 px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-800 disabled:opacity-50 sm:w-auto"
      >
        Cancel
      </button>

      <button
        type="submit"
        disabled={
          saving
        }
        className="w-full rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
      >
        {saving
          ? "Saving..."
          : submitText}
      </button>
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

  onChange: (
    value: string
  ) => void;

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
        value={
          value
        }
        onChange={(event) =>
          onChange(
            event.target
              .value
          )
        }
        placeholder={
          placeholder
        }
        required={
          required
        }
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

  onChange: (
    value: string
  ) => void;

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
        value={
          value
        }
        onChange={(event) =>
          onChange(
            event.target
              .value
          )
        }
        required={
          required
        }
        disabled={
          disabled
        }
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
   MOBILE DETAIL
============================================================ */

function MobileDetail({
  label,
  value,
}: {
  label: string;

  value: string;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">
        {label}
      </p>

      <p className="mt-1 truncate text-xs text-slate-300">
        {value}
      </p>
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
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:p-6">
      <p className="text-xs text-slate-400 sm:text-sm">
        {title}
      </p>

      <p className="mt-2 text-2xl font-bold text-white sm:text-3xl">
        {value}
      </p>

      <p className="mt-2 hidden text-xs text-slate-500 sm:mt-3 sm:block">
        {description}
      </p>
    </div>
  );
}

/* ============================================================
   TABLE HEADER
============================================================ */

function TableHeader({
  children,
  align = "left",
}: {
  children: React.ReactNode;

  align?: "left" | "right";
}) {
  return (
    <th
      className={`px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 ${
        align === "right"
          ? "text-right"
          : "text-left"
      }`}
    >
      {children}
    </th>
  );
}

/* ============================================================
   WORK ORDER IDENTITY
============================================================ */

function WorkOrderIdentity({
  order,
}: {
  order: WorkOrder;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-sm font-bold text-blue-400">
        #
        {
          order.id
        }
      </div>

      <div>
        <p className="font-medium text-white">
          {
            order.title
          }
        </p>

        <p className="mt-1 max-w-xs truncate text-xs text-slate-500">
          {
            order.description
          }
        </p>

        <p className="mt-2 text-xs text-slate-600">
          {formatDate(
            order.created_at
          )}
        </p>
      </div>
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
      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap ${styles[status]}`}
    >
      {formatStatus(
        status
      )}
    </span>
  );
}

/* ============================================================
   RESPONSE BADGE
============================================================ */

function ResponseBadge({
  response,
}: {
  response:
    | ClientResponse
    | null
    | undefined;
}) {
  if (
    !response ||
    response ===
      "PENDING"
  ) {
    return (
      <span className="inline-flex rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400">
        Awaiting Response
      </span>
    );
  }

  if (
    response ===
    "ACCEPTED"
  ) {
    return (
      <span className="inline-flex rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
        Accepted
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full bg-red-500/10 px-3 py-1 text-xs font-medium text-red-400">
      Rejected
    </span>
  );
}

/* ============================================================
   ERROR MESSAGE
============================================================ */

function ErrorMessage({
  message,
}: {
  message: string;
}) {
  return (
    <div className="rounded-xl border border-red-900 bg-red-950/30 px-4 py-3 text-sm text-red-300">
      {message}
    </div>
  );
}

/* ============================================================
   HELPERS
============================================================ */

function formatStatus(
  status: string
) {
  return status
    .replace(
      /_/g,
      " "
    )
    .toLowerCase()
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase()
    );
}

function formatDate(
  date: string
) {
  if (!date) {
    return "—";
  }

  const parsed =
    new Date(date);

  if (
    Number.isNaN(
      parsed.getTime()
    )
  ) {
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
    typeof data !==
      "object"
  ) {
    return null;
  }

  const object =
    data as Record<
      string,
      unknown
    >;

  if (
    typeof object.detail ===
    "string"
  ) {
    return object.detail;
  }

  if (
    typeof object.message ===
    "string"
  ) {
    return object.message;
  }

  for (const [
    field,
    value,
  ] of Object.entries(
    object
  )) {
    if (
      typeof value ===
      "string"
    ) {
      return `${field}: ${value}`;
    }

    if (
      Array.isArray(
        value
      ) &&
      typeof value[0] ===
        "string"
    ) {
      return `${field}: ${value[0]}`;
    }

    if (
      value &&
      typeof value ===
        "object"
    ) {
      const nested =
        extractApiError(
          value
        );

      if (nested) {
        return `${field}: ${nested}`;
      }
    }
  }

  return null;
}

