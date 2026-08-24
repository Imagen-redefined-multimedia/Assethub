"use client";

import { FormEvent, useState } from "react";
import { apiFetch } from "@/lib/api";

type PasswordForm = {
  current_password: string;
  new_password: string;
  confirm_password: string;
};

export default function ChangePasswordPage() {
  const [form, setForm] = useState<PasswordForm>({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function updateField(
    field: keyof PasswordForm,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (form.new_password.length < 8) {
      setError(
        "Your new password must contain at least 8 characters."
      );
      return;
    }

    if (form.new_password !== form.confirm_password) {
      setError("The new passwords do not match.");
      return;
    }

    if (
      form.current_password === form.new_password
    ) {
      setError(
        "Your new password must be different from your current password."
      );
      return;
    }

    try {
      setSaving(true);

      const response = await apiFetch(
        "/api/auth/change-password/",
        {
          method: "POST",
          body: JSON.stringify(form),
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
            "Unable to change password."
        );
      }

      setSuccess(
        "Your password has been changed successfully."
      );

      setForm({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
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
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <p className="text-sm font-medium text-blue-400">
          ACCOUNT SETTINGS
        </p>

        <h1 className="mt-1 text-3xl font-bold text-white">
          Change Password
        </h1>

        <p className="mt-2 text-slate-400">
          Update your AssetHub account password.
        </p>
      </div>

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

      <section className="rounded-2xl border border-slate-800 bg-slate-900">
        <div className="border-b border-slate-800 p-6">
          <h2 className="font-semibold text-white">
            Password Security
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Use your current password to authorize this
            change.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 p-6"
        >
          <div>
            <label
              htmlFor="current-password"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Current Password
            </label>

            <input
              id="current-password"
              type="password"
              value={form.current_password}
              onChange={(event) =>
                updateField(
                  "current_password",
                  event.target.value
                )
              }
              required
              autoComplete="current-password"
              placeholder="Enter current password"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="new-password"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              New Password
            </label>

            <input
              id="new-password"
              type="password"
              value={form.new_password}
              onChange={(event) =>
                updateField(
                  "new_password",
                  event.target.value
                )
              }
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="Enter new password"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500"
            />

            <p className="mt-2 text-xs text-slate-500">
              Minimum 8 characters.
            </p>
          </div>

          <div>
            <label
              htmlFor="confirm-password"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Confirm New Password
            </label>

            <input
              id="confirm-password"
              type="password"
              value={form.confirm_password}
              onChange={(event) =>
                updateField(
                  "confirm_password",
                  event.target.value
                )
              }
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="Confirm new password"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500"
            />
          </div>

          <div className="flex justify-end border-t border-slate-800 pt-6">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "Updating..."
                : "Change Password"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

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

    if (
      Array.isArray(value) &&
      typeof value[0] === "string"
    ) {
      return value[0];
    }
  }

  return null;
}