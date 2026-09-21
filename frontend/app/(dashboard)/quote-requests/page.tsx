"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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

export default function QuoteRequestsPage() {
  const [quotes, setQuotes] = useState<QuoteRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const router = useRouter();

  useEffect(() => {
    loadQuotes();
  }, []);

  async function loadQuotes() {
    try {
      setLoading(true);
      setError("");

      const data = await apiJson<QuoteRequest[]>(
        "/api/quote-requests/admin/"
      );

      setQuotes(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load quote requests."
      );
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: number, status: string) {
    try {
      setError("");

      const updated = await apiJson<QuoteRequest>(
        `/api/quote-requests/admin/${id}/`,
        {
          method: "PATCH",
          body: JSON.stringify({ status }),
        }
      );

      setQuotes((current) =>
        current.map((quote) =>
          quote.id === id ? updated : quote
        )
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update quote status."
      );
    }
  }

  if (loading) {
    return (
      <main className="p-6 lg:p-10">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
          <p className="text-gray-400">
            Loading quote requests...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="p-6 lg:p-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-[#55fdfe]">
            Sales
          </p>

          <h1 className="mt-2 text-3xl font-bold text-white md:text-4xl">
            Quote Requests
          </h1>

          <p className="mt-3 text-gray-400">
            Review incoming customer quote requests and manage
            their status.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-400/20 bg-red-400/5 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {quotes.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center">
            <h2 className="text-lg font-semibold text-white">
              No quote requests
            </h2>

            <p className="mt-2 text-gray-400">
              New quote requests will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px]">
                <thead>
                  <tr className="border-b border-white/10 text-left">
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Customer
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Package
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Scope
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Status
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Submitted
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {quotes.map((quote) => (
                    <tr
                        key={quote.id}
                        onClick={() =>
                          router.push(`/quotes/${quote.id}`)
                        }
                        className="cursor-pointer border-b border-white/5 transition hover:bg-white/[0.03] last:border-b-0"
                      >
                      <td className="px-6 py-5">
                        <p className="font-medium text-white">
                          {quote.company_name}
                        </p>

                        <p className="mt-1 text-sm text-gray-400">
                          {quote.full_name}
                        </p>

                        <p className="mt-1 text-sm text-gray-500">
                          {quote.email}
                        </p>

                        {quote.phone && (
                          <p className="text-sm text-gray-500">
                            {quote.phone}
                          </p>
                        )}
                      </td>

                      <td className="px-6 py-5">
                        <span className="rounded-full border border-[#55fdfe]/20 bg-[#55fdfe]/5 px-3 py-1 text-sm text-[#55fdfe]">
                          {quote.package_display}
                        </span>
                      </td>

                      <td className="px-6 py-5">
                        <p className="text-sm text-gray-300">
                          {quote.number_of_assets ?? "—"} assets
                        </p>

                        <p className="mt-1 text-sm text-gray-500">
                          {quote.number_of_users ?? "—"} users
                        </p>
                      </td>

                      <td className="px-6 py-5">
                       <select
                            value={quote.status}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => {
                              e.stopPropagation();
                              updateStatus(quote.id, e.target.value);
                            }}
                            className="rounded-lg border border-white/10 bg-black px-3 py-2 text-sm text-white outline-none focus:border-[#55fdfe]"
                          >       
                          {statuses.map((status) => (
                            <option
                              key={status}
                              value={status}
                            >
                              {formatStatus(status)}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="px-6 py-5 text-sm text-gray-400">
                        {formatDate(quote.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
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

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}