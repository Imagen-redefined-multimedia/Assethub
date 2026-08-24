"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { apiFetch, apiJson } from "@/lib/api";

type User = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: "ADMIN" | "TECHNICIAN" | "CLIENT";
  is_active: boolean;
};

type UserForm = {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: "ADMIN" | "TECHNICIAN" | "CLIENT";
  password: string;
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [form, setForm] = useState<UserForm>({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    role: "CLIENT",
    password: "",
  });

  async function getUsers() {
    try {
      setLoading(true);
      setError("");

      const data = await apiJson<User[] | { results: User[] }>(
        "/api/users/"
      );

      setUsers(Array.isArray(data) ? data : data.results ?? []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load users."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    getUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return users;
    }

    return users.filter((user) =>
      [
        user.username,
        user.email,
        user.first_name,
        user.last_name,
        user.role,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [users, search]);

  const admins = users.filter(
    (user) => user.role === "ADMIN"
  ).length;

  const technicians = users.filter(
    (user) => user.role === "TECHNICIAN"
  ).length;

  const clients = users.filter(
    (user) => user.role === "CLIENT"
  ).length;

  function openCreateModal() {
    setEditingUser(null);

    setForm({
      username: "",
      email: "",
      first_name: "",
      last_name: "",
      role: "CLIENT",
      password: "",
    });

    setError("");
    setSuccess("");
    setShowModal(true);
  }

  function openEditModal(user: User) {
    setEditingUser(user);

    setForm({
      username: user.username,
      email: user.email,
      first_name: user.first_name ?? "",
      last_name: user.last_name ?? "",
      role: user.role,
      password: "",
    });

    setError("");
    setSuccess("");
    setShowModal(true);
  }

  function closeModal() {
    if (saving) return;

    setShowModal(false);
    setEditingUser(null);

    setForm({
      username: "",
      email: "",
      first_name: "",
      last_name: "",
      role: "CLIENT",
      password: "",
    });
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const username = form.username.trim();
    const email = form.email.trim();
    const first_name = form.first_name.trim();
    const last_name = form.last_name.trim();

    if (!username) {
      setError("Username is required.");
      return;
    }

    if (!email) {
      setError("Email is required.");
      return;
    }

    if (!editingUser && !form.password) {
      setError("Password is required when creating a user.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const isEditing = Boolean(editingUser);

      const body: Record<string, unknown> = {
        username,
        email,
        first_name,
        last_name,
        role: form.role,
      };

      if (!isEditing) {
        body.password = form.password;
      } else if (form.password.trim()) {
        body.password = form.password;
      }

      const response = await apiFetch(
        isEditing
          ? `/api/users/${editingUser!.id}/`
          : "/api/users/",
        {
          method: isEditing ? "PATCH" : "POST",
          body: JSON.stringify(body),
        }
      );

      if (response.status === 401) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.location.href = "/login";
        return;
      }

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          extractApiError(data) ||
            `Unable to ${
              isEditing ? "update" : "create"
            } user.`
        );
      }

      setSuccess(
        isEditing
          ? "User updated successfully."
          : "User created successfully."
      );

      closeModal();
      await getUsers();
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

  async function handleDelete(user: User) {
    if (user.role === "ADMIN") {
      const confirmed = window.confirm(
        `Are you sure you want to delete admin "${user.username}"?`
      );

      if (!confirmed) return;
    } else {
      const confirmed = window.confirm(
        `Are you sure you want to delete "${user.username}"?`
      );

      if (!confirmed) return;
    }

    try {
      setError("");
      setSuccess("");

      const response = await apiFetch(
        `/api/users/${user.id}/`,
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

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          extractApiError(data) ||
            "Unable to delete user."
        );
      }

      setSuccess("User deleted successfully.");

      await getUsers();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete user."
      );
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium text-blue-400">
            ADMINISTRATION
          </p>

          <h1 className="mt-1 text-3xl font-bold text-white">
            Users
          </h1>

          <p className="mt-2 text-slate-400">
            Manage AssetHub administrators, technicians and clients.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
        >
          + Add User
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

      {/* Statistics */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Users"
          value={users.length}
          description="All registered users"
        />

        <StatCard
          title="Administrators"
          value={admins}
          description="System administrators"
        />

        <StatCard
          title="Technicians"
          value={technicians}
          description="Maintenance technicians"
        />

        <StatCard
          title="Clients"
          value={clients}
          description="Client accounts"
        />
      </div>

      {/* Users */}
      <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
        {/* Toolbar */}
        <div className="flex flex-col gap-4 border-b border-slate-800 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-semibold text-white">
              Registered Users
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              View and manage user accounts.
            </p>
          </div>

          <input
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search users..."
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500 md:w-80"
          />
        </div>

        {/* Loading */}
        {loading ? (
          <div className="flex min-h-60 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-700 border-t-blue-500" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 text-2xl text-slate-500">
              ♙
            </div>

            <h3 className="mt-4 font-semibold text-white">
              {search
                ? "No users found"
                : "No users yet"}
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              {search
                ? "Try a different search term."
                : "Create your first user to get started."}
            </p>

            {!search && (
              <button
                type="button"
                onClick={openCreateModal}
                className="mt-5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
              >
                Add User
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-slate-800 text-left">
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    User
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Email
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Role
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
                {filteredUsers.map((user) => {
                  const name =
                    `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() ||
                    user.username;

                  return (
                    <tr
                      key={user.id}
                      className="transition hover:bg-slate-800/30"
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 font-semibold text-blue-400">
                            {name.charAt(0).toUpperCase()}
                          </div>

                          <div>
                            <p className="font-medium text-white">
                              {name}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              @{user.username}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-5 text-sm text-slate-400">
                        {user.email}
                      </td>

                      <td className="px-6 py-5">
                        <RoleBadge role={user.role} />
                      </td>

                      <td className="px-6 py-5">
                        <StatusBadge
                          active={user.is_active}
                        />
                      </td>

                      <td className="px-6 py-5">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              openEditModal(user)
                            }
                            className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-blue-500 hover:text-blue-400"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(user)
                            }
                            className="rounded-lg border border-red-900/60 px-3 py-2 text-xs font-medium text-red-400 transition hover:bg-red-950/40"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
            <div className="border-b border-slate-800 p-6">
              <h2 className="text-xl font-semibold text-white">
                {editingUser
                  ? "Edit User"
                  : "Add User"}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {editingUser
                  ? "Update this user's account information."
                  : "Create a new AssetHub user account."}
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

              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="First Name"
                  value={form.first_name}
                  onChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      first_name: value,
                    }))
                  }
                />

                <Input
                  label="Last Name"
                  value={form.last_name}
                  onChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      last_name: value,
                    }))
                  }
                />
              </div>

              <Input
                label="Username"
                value={form.username}
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    username: value,
                  }))
                }
                required
              />

              <Input
                label="Email"
                type="email"
                value={form.email}
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    email: value,
                  }))
                }
                required
              />

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Role
                </label>

                <select
                  value={form.role}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      role: event.target.value as UserForm["role"],
                    }))
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
                >
                  <option value="CLIENT">Client</option>
                  <option value="TECHNICIAN">
                    Technician
                  </option>
                  <option value="ADMIN">Administrator</option>
                </select>
              </div>

              <Input
                label={
                  editingUser
                    ? "New Password (optional)"
                    : "Password"
                }
                type="password"
                value={form.password}
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    password: value,
                  }))
                }
                required={!editingUser}
              />

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
                    : editingUser
                      ? "Save Changes"
                      : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
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
        required={required}
        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
      />
    </div>
  );
}

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

function RoleBadge({
  role,
}: {
  role: User["role"];
}) {
  const styles = {
    ADMIN: "bg-purple-500/10 text-purple-400",
    TECHNICIAN: "bg-blue-500/10 text-blue-400",
    CLIENT: "bg-emerald-500/10 text-emerald-400",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium ${styles[role]}`}
    >
      {role}
    </span>
  );
}

function StatusBadge({
  active,
}: {
  active: boolean;
}) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium ${
        active
          ? "bg-emerald-500/10 text-emerald-400"
          : "bg-red-500/10 text-red-400"
      }`}
    >
      {active ? "ACTIVE" : "INACTIVE"}
    </span>
  );
}

function extractApiError(
  data: unknown
): string | null {
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

    if (
      Array.isArray(value) &&
      typeof value[0] === "string"
    ) {
      return value[0];
    }
  }

  return null;
}

