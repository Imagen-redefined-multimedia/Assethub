"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { apiFetch, apiJson } from "@/lib/api";

type Asset = {
  id: number;
  name: string;
  serial_number: string;
  company_name?: string;
};

type MaintenanceSchedule = {
  id: number;
  asset: number;
  asset_name: string;
  frequency: number;
  frequency_unit: string;
  next_maintenance_date: string | null;
  last_maintenance_date: string | null;
  is_active: boolean;
  schedule_status: string;
  created_by_username: string;
  created_at: string;
  updated_at: string;
};

type ScheduleForm = {
  asset: string;
  frequency: string;
  frequency_unit: string;
  is_active: boolean;
};

export default function MaintenancePage() {
  const [schedules, setSchedules] = useState<MaintenanceSchedule[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState<ScheduleForm>({
    asset: "",
    frequency: "1",
    frequency_unit: "MONTHS",
    is_active: true,
  });

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [scheduleData, assetData] = await Promise.all([
        apiJson<
          MaintenanceSchedule[] | {
            results: MaintenanceSchedule[];
          }
        >("/api/maintenance-schedules/"),

        apiJson<Asset[] | { results: Asset[] }>(
          "/api/assets/"
        ),
      ]);

      setSchedules(
        Array.isArray(scheduleData)
          ? scheduleData
          : scheduleData.results ?? []
      );

      setAssets(
        Array.isArray(assetData)
          ? assetData
          : assetData.results ?? []
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load maintenance data."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredSchedules = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return schedules;
    }

    return schedules.filter((schedule) =>
      schedule.asset_name
        .toLowerCase()
        .includes(query)
    );
  }, [schedules, search]);

  const overdueCount = schedules.filter(
    (schedule) =>
      schedule.schedule_status === "OVERDUE"
  ).length;

  const dueSoonCount = schedules.filter(
    (schedule) =>
      schedule.schedule_status === "DUE_SOON"
  ).length;

  const upcomingCount = schedules.filter(
    (schedule) =>
      schedule.schedule_status === "UPCOMING"
  ).length;

  function openCreateModal() {
    setForm({
      asset: "",
      frequency: "1",
      frequency_unit: "MONTHS",
      is_active: true,
    });

    setError("");
    setSuccess("");
    setShowModal(true);
  }

  function closeModal() {
    if (saving) return;

    setShowModal(false);

    setForm({
      asset: "",
      frequency: "1",
      frequency_unit: "MONTHS",
      is_active: true,
    });
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!form.asset) {
      setError("Please select an asset.");
      return;
    }

    const frequency = Number(form.frequency);

    if (!frequency || frequency <= 0) {
      setError(
        "Maintenance frequency must be greater than zero."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await apiFetch(
        "/api/maintenance-schedules/",
        {
          method: "POST",
          body: JSON.stringify({
            asset: Number(form.asset),
            frequency,
            frequency_unit: form.frequency_unit,
            is_active: form.is_active,
          }),
        }
      );

      const data = await response
        .json()
        .catch(() => null);

      if (response.status === 401) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.location.href = "/login";
        return;
      }

      if (!response.ok) {
        throw new Error(
          extractApiError(data) ||
            "Unable to create maintenance schedule."
        );
      }

      setSuccess(
        "Maintenance schedule created successfully."
      );

      setShowModal(false);

      await loadData();
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

  return (
    <div className="space-y-8">
      {/* Header */}

      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium text-blue-400">
            OPERATIONS
          </p>

          <h1 className="mt-1 text-3xl font-bold text-white">
            Maintenance
          </h1>

          <p className="mt-2 text-slate-400">
            Manage preventive maintenance schedules
            for registered assets.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
        >
          + Add Schedule
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

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Schedules"
          value={schedules.length}
          description="Active maintenance schedules"
        />

        <StatCard
          title="Overdue"
          value={overdueCount}
          description="Require immediate attention"
          danger
        />

        <StatCard
          title="Due Soon"
          value={dueSoonCount}
          description="Approaching maintenance date"
          warning
        />

        <StatCard
          title="Upcoming"
          value={upcomingCount}
          description="Scheduled maintenance"
          success
        />
      </div>

      {/* Main table */}

      <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
        <div className="flex flex-col gap-4 border-b border-slate-800 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-semibold text-white">
              Maintenance Schedules
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Monitor preventive maintenance across assets.
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

        {loading ? (
          <div className="flex min-h-60 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-700 border-t-blue-500" />
          </div>
        ) : filteredSchedules.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 text-2xl text-slate-500">
              🔧
            </div>

            <h3 className="mt-4 font-semibold text-white">
              {search
                ? "No schedules found"
                : "No maintenance schedules yet"}
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              {search
                ? "Try another search term."
                : "Create a maintenance schedule for an asset."}
            </p>

            {!search && (
              <button
                type="button"
                onClick={openCreateModal}
                className="mt-5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
              >
                Add Schedule
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-slate-800 text-left">
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Asset
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Frequency
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Next Maintenance
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Status
                  </th>

                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Created By
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800">
                {filteredSchedules.map(
                  (schedule) => (
                    <tr
                      key={schedule.id}
                      className="transition hover:bg-slate-800/30"
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                            ◈
                          </div>

                          <div>
                            <p className="font-medium text-white">
                              {schedule.asset_name}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              Schedule #{schedule.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-5 text-sm text-slate-300">
                        Every{" "}
                        <span className="font-semibold text-white">
                          {schedule.frequency}
                        </span>{" "}
                        {formatFrequencyUnit(
                          schedule.frequency_unit
                        )}
                      </td>

                      <td className="px-6 py-5 text-sm text-slate-400">
                        {formatDate(
                          schedule.next_maintenance_date
                        )}
                      </td>

                      <td className="px-6 py-5">
                        <StatusBadge
                          status={
                            schedule.schedule_status
                          }
                        />
                      </td>

                      <td className="px-6 py-5 text-sm text-slate-400">
                        {schedule.created_by_username}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Create modal */}

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
            <div className="border-b border-slate-800 p-6">
              <h2 className="text-xl font-semibold text-white">
                Add Maintenance Schedule
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Configure preventive maintenance for an
                asset.
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

              {/* Asset */}

              <div>
                <label
                  htmlFor="asset"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Asset
                </label>

                <select
                  id="asset"
                  value={form.asset}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      asset: event.target.value,
                    })
                  }
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
                >
                  <option value="">
                    Select an asset
                  </option>

                  {assets
                    .filter(
                      (asset) =>
                        !schedules.some(
                          (schedule) =>
                            schedule.asset ===
                            asset.id
                        )
                    )
                    .map((asset) => (
                      <option
                        key={asset.id}
                        value={asset.id}
                      >
                        {asset.name} —{" "}
                        {asset.serial_number}
                      </option>
                    ))}
                </select>
              </div>

              {/* Frequency */}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="frequency"
                    className="mb-2 block text-sm font-medium text-slate-300"
                  >
                    Frequency
                  </label>

                  <input
                    id="frequency"
                    type="number"
                    min="1"
                    value={form.frequency}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        frequency:
                          event.target.value,
                      })
                    }
                    required
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="frequency-unit"
                    className="mb-2 block text-sm font-medium text-slate-300"
                  >
                    Unit
                  </label>

                  <select
                    id="frequency-unit"
                    value={form.frequency_unit}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        frequency_unit:
                          event.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
                  >
                    <option value="DAYS">
                      Days
                    </option>

                    <option value="WEEKS">
                      Weeks
                    </option>

                    <option value="MONTHS">
                      Months
                    </option>

                    <option value="YEARS">
                      Years
                    </option>
                  </select>
                </div>
              </div>

              {/* Active */}

              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      is_active:
                        event.target.checked,
                    })
                  }
                  className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-blue-600"
                />

                <span className="text-sm text-slate-300">
                  Schedule is active
                </span>
              </label>

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
                    : "Create Schedule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function formatDate(
  value: string | null
) {
  if (!value) {
    return "Not scheduled";
  }

  return new Date(value).toLocaleDateString(
    undefined,
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    }
  );
}

function formatFrequencyUnit(
  unit: string
) {
  switch (unit) {
    case "DAYS":
      return "days";

    case "WEEKS":
      return "weeks";

    case "MONTHS":
      return "months";

    case "YEARS":
      return "years";

    default:
      return unit.toLowerCase();
  }
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const styles: Record<string, string> = {
    OVERDUE:
      "bg-red-500/10 text-red-400",

    DUE_SOON:
      "bg-yellow-500/10 text-yellow-400",

    UPCOMING:
      "bg-emerald-500/10 text-emerald-400",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium ${
        styles[status] ??
        "bg-slate-800 text-slate-400"
      }`}
    >
      {status.replace("_", " ")}
    </span>
  );
}

function StatCard({
  title,
  value,
  description,
  danger,
  warning,
  success,
}: {
  title: string;
  value: number;
  description: string;
  danger?: boolean;
  warning?: boolean;
  success?: boolean;
}) {
  const valueClass = danger
    ? "text-red-400"
    : warning
      ? "text-yellow-400"
      : success
        ? "text-emerald-400"
        : "text-white";

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <p className="text-sm text-slate-400">
        {title}
      </p>

      <p
        className={`mt-2 text-3xl font-bold ${valueClass}`}
      >
        {value}
      </p>

      <p className="mt-2 text-xs text-slate-500">
        {description}
      </p>
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