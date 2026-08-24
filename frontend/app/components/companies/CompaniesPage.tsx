
"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { apiJson, apiFetch } from "@/lib/api";

type Company = {
  id: number;
  name: string;
  created_at?: string;
  updated_at?: string;
};

type CompanyForm = {
  name: string;
};

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingCompany, setEditingCompany] =
    useState<Company | null>(null);

  const [form, setForm] = useState<CompanyForm>({
    name: "",
  });

  // ============================================================
  // LOAD COMPANIES
  // ============================================================

  async function getCompanies() {
    try {
      setLoading(true);
      setError("");

      const data = await apiJson<
        Company[] | { results: Company[] }
      >("/api/companies/");

      setCompanies(
        Array.isArray(data) ? data : data.results ?? []
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load companies."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    getCompanies();
  }, []);

  // ============================================================
  // SEARCH
  // ============================================================

  const filteredCompanies = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return companies;
    }

    return companies.filter((company) =>
      company.name.toLowerCase().includes(query)
    );
  }, [companies, search]);

  // ============================================================
  // MODAL
  // ============================================================

  function openCreateModal() {
    setEditingCompany(null);

    setForm({
      name: "",
    });

    setError("");
    setSuccess("");
    setShowModal(true);
  }

  function openEditModal(company: Company) {
    setEditingCompany(company);

    setForm({
      name: company.name,
    });

    setError("");
    setSuccess("");
    setShowModal(true);
  }

  function closeModal() {
    if (saving) return;

    setShowModal(false);
    setEditingCompany(null);

    setForm({
      name: "",
    });
  }

  // ============================================================
  // CREATE / UPDATE
  // ============================================================

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const token = localStorage.getItem("access_token");

    if (!token) {
      window.location.href = "/login";
      return;
    }

    const name = form.name.trim();

    if (!name) {
      setError("Company name is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const isEditing = Boolean(editingCompany);

      const response = await apiFetch(
        isEditing
          ? `/api/companies/${editingCompany!.id}/`
          : "/api/companies/",
        {
          method: isEditing ? "PATCH" : "POST",
          body: JSON.stringify({
            name,
          }),
        }
      );

      // Handle expired/invalid token first
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
            } company.`
        );
      }

      setSuccess(
        isEditing
          ? "Company updated successfully."
          : "Company created successfully."
      );

      setShowModal(false);
      setEditingCompany(null);

      setForm({
        name: "",
      });

      await getCompanies();
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
  // DELETE
  // ============================================================

  async function handleDelete(company: Company) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${company.name}"?`
    );

    if (!confirmed) return;

    const token = localStorage.getItem("access_token");

    if (!token) {
      window.location.href = "/login";
      return;
    }

    try {
      setError("");
      setSuccess("");

      const response = await apiFetch(
        `/api/companies/${company.id}/`,
        {
          method: "DELETE",
        }
      );

      // Handle expired token
      if (response.status === 401) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");

        window.location.href = "/login";
        return;
      }

      if (!response.ok) {
        const data = await response.json().catch(() => null);

        throw new Error(
          extractApiError(data) ||
            "Unable to delete company."
        );
      }

      setSuccess("Company deleted successfully.");

      await getCompanies();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete company."
      );
    }
  }

  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="space-y-8">

      {/* Header */}

      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium text-blue-400">
            ADMINISTRATION
          </p>

          <h1 className="mt-1 text-3xl font-bold text-white">
            Companies
          </h1>

          <p className="mt-2 text-slate-400">
            Manage companies registered on AssetHub.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
        >
          + Add Company
        </button>
      </div>

      {/* Success */}

      {success && (
        <div className="rounded-xl border border-emerald-900 bg-emerald-950/30 px-5 py-4 text-sm text-emerald-300">
          {success}
        </div>
      )}

      {/* Error */}

      {error && !showModal && (
        <div className="rounded-xl border border-red-900 bg-red-950/30 px-5 py-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Stats */}

      <div className="grid gap-4 sm:grid-cols-2">

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <p className="text-sm text-slate-400">
            Total Companies
          </p>

          <p className="mt-2 text-3xl font-bold text-white">
            {companies.length}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <p className="text-sm text-slate-400">
            Search Results
          </p>

          <p className="mt-2 text-3xl font-bold text-white">
            {filteredCompanies.length}
          </p>
        </div>

      </div>

      {/* Companies Table */}

      <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">

        {/* Toolbar */}

        <div className="flex flex-col gap-4 border-b border-slate-800 p-5 md:flex-row md:items-center md:justify-between">

          <div>
            <h2 className="font-semibold text-white">
              Registered Companies
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              View and manage company records.
            </p>
          </div>

          <div className="w-full md:w-80">
            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search companies..."
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500"
            />
          </div>

        </div>

        {/* Loading */}

        {loading ? (
          <div className="flex min-h-60 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-700 border-t-blue-500" />
          </div>
        ) : filteredCompanies.length === 0 ? (

          <div className="p-12 text-center">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 text-2xl text-slate-500">
              ▣
            </div>

            <h3 className="mt-4 font-semibold text-white">
              {search
                ? "No companies found"
                : "No companies yet"}
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              {search
                ? "Try a different search term."
                : "Create your first company to get started."}
            </p>

            {!search && (
              <button
                type="button"
                onClick={openCreateModal}
                className="mt-5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
              >
                Add Company
              </button>
            )}

          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full min-w-165.5">

              <thead>
                <tr className="border-b border-slate-800 text-left">

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Company
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    ID
                  </th>

                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Actions
                  </th>

                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800">

                {filteredCompanies.map((company) => (

                  <tr
                    key={company.id}
                    className="transition hover:bg-slate-800/30"
                  >

                    <td className="px-6 py-5">

                      <div className="flex items-center gap-3">

                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 font-semibold text-blue-400">
                          {company.name
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div>
                          <p className="font-medium text-white">
                            {company.name}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            Company account
                          </p>
                        </div>

                      </div>

                    </td>

                    <td className="px-6 py-5 text-sm text-slate-400">
                      #{company.id}
                    </td>

                    <td className="px-6 py-5">

                      <div className="flex justify-end gap-2">

                        <button
                          type="button"
                          onClick={() =>
                            openEditModal(company)
                          }
                          className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-blue-500 hover:text-blue-400"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleDelete(company)
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

        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">

          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">

            <div className="border-b border-slate-800 p-6">

              <h2 className="text-xl font-semibold text-white">
                {editingCompany
                  ? "Edit Company"
                  : "Add Company"}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {editingCompany
                  ? "Update the company information."
                  : "Create a new company account."}
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

              <div>

                <label
                  htmlFor="company-name"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Company Name
                </label>

                <input
                  id="company-name"
                  type="text"
                  value={form.name}
                  onChange={(event) =>
                    setForm({
                      name: event.target.value,
                    })
                  }
                  required
                  maxLength={255}
                  autoFocus
                  placeholder="Enter company name"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500"
                />

              </div>

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
                    : editingCompany
                      ? "Save Changes"
                      : "Create Company"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}

// ============================================================
// API ERROR HANDLER
// ============================================================

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

