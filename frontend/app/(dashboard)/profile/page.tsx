"use client";

import { useEffect, useState, type FormEvent } from "react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type User = {
  id?: number;
  username: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  role: "ADMIN" | "TECHNICIAN" | "CLIENT";
  company?: number | null;
  company_name?: string | null;
};

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [showPasswordForm, setShowPasswordForm] = useState(false);

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [changingPassword, setChangingPassword] = useState(false);
    const [passwordSuccess, setPasswordSuccess] = useState("");
    const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    async function loadProfile() {
      const token = localStorage.getItem("access_token");

      if (!token) {
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/auth/me/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          return;
        }

        const data = await response.json();
        setUser(data);
      } catch (error) {
        console.error("Failed to load profile:", error);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  async function handleChangePassword(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();

  setChangingPassword(true);
  setPasswordSuccess("");
  setPasswordError("");

  const token = localStorage.getItem("access_token");

  if (!token) {
    setPasswordError("You are not authenticated.");
    setChangingPassword(false);
    return;
  }

  try {
    const response = await fetch(
      `${API_URL}/api/auth/change-password/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
          confirm_password: confirmPassword,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      const firstError =
        data?.current_password?.[0] ||
        data?.new_password?.[0] ||
        data?.confirm_password?.[0] ||
        data?.detail ||
        "Unable to change password.";

      setPasswordError(firstError);
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");

    setPasswordSuccess(
      data?.detail || "Password changed successfully."
    );
  } catch (error) {
    console.error("Failed to change password:", error);
    setPasswordError(
      "Something went wrong. Please try again."
    );
  } finally {
    setChangingPassword(false);
  }
}
  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-700 border-t-blue-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <p className="text-slate-400">
          Unable to load your profile.
        </p>
      </div>
    );
  }

  const displayName =
    user.first_name || user.last_name
      ? `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim()
      : user.username;

  const initials = displayName
    .split(" ")
    .map((name) => name.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      {/* Page heading */}
      <div>
        <p className="text-sm font-medium text-blue-400">
          ACCOUNT
        </p>

        <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">
          Profile & Settings
        </h1>

        <p className="mt-2 text-sm text-slate-400 sm:text-base">
          Manage your AssetHub account information and settings.
        </p>
      </div>

      {/* Profile header */}
      <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
        <div className="h-28 bg-gradient-to-r from-blue-950 via-slate-900 to-slate-950 sm:h-36" />

        <div className="px-5 pb-6 sm:px-8">
          <div className="-mt-12 flex flex-col gap-4 sm:-mt-14 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-4 border-slate-900 bg-slate-800 text-2xl font-bold text-blue-400 sm:h-28 sm:w-28 sm:text-3xl">
                {initials}
              </div>

              <div className="pb-1">
                <h2 className="text-xl font-bold text-white sm:text-2xl">
                  {displayName}
                </h2>

                <p className="mt-1 text-sm text-blue-400">
                  {user.role}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Account information */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-8">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-white">
            Account Information
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Your current AssetHub account details.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {/* Username */}
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">
              Username
            </p>

            <div className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3">
              <p className="truncate text-sm text-white">
                {user.username}
              </p>
            </div>
          </div>

          {/* Email */}
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">
              Email
            </p>

            <div className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3">
              <p className="truncate text-sm text-white">
                {user.email || "Not provided"}
              </p>
            </div>
          </div>

          {/* First name */}
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">
              First Name
            </p>

            <div className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3">
              <p className="truncate text-sm text-white">
                {user.first_name || "Not provided"}
              </p>
            </div>
          </div>

          {/* Last name */}
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">
              Last Name
            </p>

            <div className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3">
              <p className="truncate text-sm text-white">
                {user.last_name || "Not provided"}
              </p>
            </div>
          </div>

          {/* Role */}
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">
              Role
            </p>

            <div className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3">
              <span className="inline-flex rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400">
                {user.role}
              </span>
            </div>
          </div>

          {/* Company */}
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">
              Company
            </p>

            <div className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3">
              <p className="truncate text-sm text-white">
                {user.company_name || "Not assigned"}
              </p>
            </div>
          </div>
        </div>
      </section>

        {/* Security */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-8">
        <div>
            <h2 className="text-lg font-semibold text-white">
            Security
            </h2>

            <p className="mt-1 text-sm text-slate-500">
            Manage your account security.
            </p>
        </div>

        {!showPasswordForm ? (
            <div className="mt-6 flex flex-col gap-4 rounded-xl border border-slate-800 bg-slate-950 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <p className="font-medium text-white">
                Password
                </p>

                <p className="mt-1 text-sm text-slate-500">
                Change your AssetHub account password.
                </p>
            </div>

            <button
                type="button"
                onClick={() => {
                setShowPasswordForm(true);
                setPasswordSuccess("");
                setPasswordError("");
                }}
                className="w-full rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white sm:w-auto"
            >
                Change Password
            </button>
            </div>
        ) : (
            <form
            onSubmit={handleChangePassword}
            className="mt-6 space-y-5 rounded-xl border border-slate-800 bg-slate-950 p-4 sm:p-6"
            >
            {passwordSuccess && (
                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
                {passwordSuccess}
                </div>
            )}

            {passwordError && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {passwordError}
                </div>
            )}

            <div>
                <label
                htmlFor="current_password"
                className="mb-2 block text-sm font-medium text-slate-300"
                >
                Current Password
                </label>

                <input
                id="current_password"
                type="password"
                value={currentPassword}
                onChange={(event) =>
                    setCurrentPassword(event.target.value)
                }
                required
                autoComplete="current-password"
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="Enter your current password"
                />
            </div>

            <div>
                <label
                htmlFor="new_password"
                className="mb-2 block text-sm font-medium text-slate-300"
                >
                New Password
                </label>

                <input
                id="new_password"
                type="password"
                value={newPassword}
                onChange={(event) =>
                    setNewPassword(event.target.value)
                }
                required
                minLength={8}
                autoComplete="new-password"
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="Enter your new password"
                />

                <p className="mt-2 text-xs text-slate-500">
                Password must be at least 8 characters.
                </p>
            </div>

            <div>
                <label
                htmlFor="confirm_password"
                className="mb-2 block text-sm font-medium text-slate-300"
                >
                Confirm New Password
                </label>

                <input
                id="confirm_password"
                type="password"
                value={confirmPassword}
                onChange={(event) =>
                    setConfirmPassword(event.target.value)
                }
                required
                minLength={8}
                autoComplete="new-password"
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="Confirm your new password"
                />
            </div>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                type="button"
                onClick={() => {
                    setShowPasswordForm(false);
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                    setPasswordError("");
                    setPasswordSuccess("");
                }}
                disabled={changingPassword}
                className="w-full rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                Cancel
                </button>

                <button
                type="submit"
                disabled={changingPassword}
                className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                {changingPassword
                    ? "Changing Password..."
                    : "Update Password"}
                </button>
            </div>
            </form>
        )}
        </section>
    </div>
  );
}