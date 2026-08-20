
"use client";

import { useState, type SubmitEvent } from "react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/api/auth/token/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Invalid username or password."
        );
      }

      if (!data.access || !data.refresh) {
        throw new Error("Login succeeded, but no JWT tokens were returned.");
      }

      // Store JWT tokens
      localStorage.setItem("access_token", data.access);
      localStorage.setItem("refresh_token", data.refresh);

      // Redirect to dashboard
      window.location.href = "/home";
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to connect to the server."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white">
            AssetHub
          </h1>

          <p className="mt-2 text-slate-400">
            Asset & Maintenance Management
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">

          <h2 className="text-2xl font-semibold text-white">
            Sign in
          </h2>

          <p className="mt-2 text-sm text-slate-400">
            Enter your AssetHub credentials.
          </p>

          <form
            onSubmit={handleLogin}
            className="mt-6 space-y-5"
          >

            {/* Username */}
            <div>
              <label
                htmlFor="username"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Username
              </label>

              <input
                id="username"
                name="username"
                type="text"
                value={username}
                onChange={(event) =>
                  setUsername(event.target.value)
                }
                required
                autoComplete="username"
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="Enter username"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Password
              </label>

              <input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                required
                autoComplete="current-password"
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="Enter password"
              />
            </div>

            {/* Error */}
            {error && (
              <div
                role="alert"
                className="rounded-lg border border-red-800 bg-red-950/50 px-4 py-3 text-sm text-red-300"
              >
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>

          </form>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          AssetHub Management System
        </p>

      </div>
    </main>
  );
}

