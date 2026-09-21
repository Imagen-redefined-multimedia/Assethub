"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiJson } from "@/lib/api";

type QuoteRequest = {
  id: number;
  full_name: string;
  company_name: string;
  email: string;
  phone: string;
  package: string;
  package_display: string;
  number_of_assets: number | null;
  number_of_users: number | null;
  requirements: string;
  status: string;
  status_display: string;
  created_at: string;
  updated_at: string;
};

const statuses = [
  "NEW",
  "CONTACTED",
  "QUOTED",
  "ACCEPTED",
  "DECLINED",
];

export default function QuoteDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const id = params.id;

  const [quote, setQuote] = useState<QuoteRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (id) {
      loadQuote();
    }
  }, [id]);

  async function loadQuote() {
    try {
      setLoading(true);
      setError("");

      const data = await apiJson<QuoteRequest>(
        `/api/quote-requests/admin/${id}/`
      );

      setQuote(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load quote request."
      );
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(status: string) {
    if (!quote) return;

    try {
      setUpdating(true);
      setError("");

      const updated = await apiJson<QuoteRequest>(
        `/api/quote-requests/admin/${quote.id}/`,
        {
          method: "PATCH",
          body: JSON.stringify({ status }),
        }
      );

      setQuote(updated);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update quote status."
      );
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return (
      <main className="p-6 lg:p-10">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
            <p className="text-gray-400">
              Loading quote request...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!quote) {
    return (
      <main className="p-6 lg:p-10">
        <div className="mx-auto max-w-5xl">
          <button
            onClick={() => router.push("/quotes")}
            className="mb-6 text-sm text-[#55fdfe] hover:underline"
          >
            ← Back to quotes
          </button>

          <div className="rounded-2xl border border-red-400/20 bg-red-400/5 p-8">
            <h1 className="text-lg font-semibold text-white">
              Quote request not found
            </h1>

            <p className="mt-2 text-sm text-red-300">
              {error || "This quote request could not be found."}
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="p-6 lg:p-10">
      <div className="mx-auto max-w-5xl">
        {/* Back */}
        <button
          onClick={() => router.push("/quotes")}
          className="mb-6 text-sm text-gray-400 transition hover:text-[#55fdfe]"
        >
          ← Back to quote requests
        </button>

        {/* Header */}
        <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-[#55fdfe]">
              Sales
            </p>

            <h1 className="mt-2 text-3xl font-bold text-white md:text-4xl">
              {quote.company_name}
            </h1>

            <p className="mt-2 text-gray-400">
              Quote request #{quote.id}
            </p>
          </div>

          <select
            value={quote.status}
            disabled={updating}
            onChange={(e) => updateStatus(e.target.value)}
            className="rounded-lg border border-white/10 bg-black px-4 py-2.5 text-sm text-white outline-none transition focus:border-[#55fdfe] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {statuses.map((status) => (
              <option key={status} value={status}>
                {formatStatus(status)}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-400/20 bg-red-400/5 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Customer */}
          <section className="rounded-2xl border border-white/10 bg-white/5 p-6 lg:col-span-2">
            <h2 className="text-lg font-semibold text-white">
              Customer Information
            </h2>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <InfoItem
                label="Full Name"
                value={quote.full_name}
              />

              <InfoItem
                label="Company"
                value={quote.company_name}
              />

              <InfoItem
                label="Email"
                value={quote.email}
              />

              <InfoItem
                label="Phone"
                value={quote.phone || "Not provided"}
              />
            </div>
          </section>

          {/* Package */}
          <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-lg font-semibold text-white">
              Package
            </h2>

            <div className="mt-5">
              <span className="inline-flex rounded-full border border-[#55fdfe]/20 bg-[#55fdfe]/5 px-3 py-1 text-sm text-[#55fdfe]">
                {quote.package_display}
              </span>
            </div>

            <div className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Status
              </p>

              <p className="mt-2 text-sm text-white">
                {quote.status_display}
              </p>
            </div>
          </section>

          {/* Scope */}
          <section className="rounded-2xl border border-white/10 bg-white/5 p-6 lg:col-span-2">
            <h2 className="text-lg font-semibold text-white">
              Project Scope
            </h2>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <InfoItem
                label="Number of Assets"
                value={
                  quote.number_of_assets !== null
                    ? String(quote.number_of_assets)
                    : "Not provided"
                }
              />

              <InfoItem
                label="Number of Users"
                value={
                  quote.number_of_users !== null
                    ? String(quote.number_of_users)
                    : "Not provided"
                }
              />
            </div>
          </section>

          {/* Dates */}
          <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-lg font-semibold text-white">
              Request Timeline
            </h2>

            <div className="mt-6 space-y-5">
              <InfoItem
                label="Submitted"
                value={formatDateTime(quote.created_at)}
              />

              <InfoItem
                label="Last Updated"
                value={formatDateTime(quote.updated_at)}
              />
            </div>
          </section>

          {/* Requirements */}
          <section className="rounded-2xl border border-white/10 bg-white/5 p-6 lg:col-span-3">
            <h2 className="text-lg font-semibold text-white">
              Customer Requirements
            </h2>

            <div className="mt-5 rounded-xl border border-white/5 bg-black/20 p-5">
              {quote.requirements ? (
                <p className="whitespace-pre-wrap text-sm leading-7 text-gray-300">
                  {quote.requirements}
                </p>
              ) : (
                <p className="text-sm text-gray-500">
                  No additional requirements were provided.
                </p>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
        {label}
      </p>

      <p className="mt-2 text-sm text-gray-300">
        {value}
      </p>
    </div>
  );
}

function formatStatus(status: string) {
  return status
    .toLowerCase()
    .replace("_", " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

function formatDateTime(date: string) {
  return new Date(date).toLocaleString("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}