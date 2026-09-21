import Link from "next/link";

import type { QuoteRequest } from "@/types/dashboard";

type QuotesSectionProps = {
  quotes: QuoteRequest[];
};

export default function QuotesSection({
  quotes,
}: QuotesSectionProps) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-800 p-6">
        <div>
          <h2 className="text-lg font-semibold text-white">
            Recent Quote Requests
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Latest requests submitted through AssetHub
          </p>
        </div>

        <Link
          href="/quotes"
          className="text-sm font-medium text-blue-400 hover:text-blue-300"
        >
          View all
        </Link>
      </div>

      {quotes.length === 0 ? (
        <div className="p-8 text-center text-sm text-slate-500">
          No quote requests available.
        </div>
      ) : (
        <div className="divide-y divide-slate-800">
          {quotes.slice(0, 5).map((quote) => (
            <Link
              key={quote.id}
              href={`/quotes/${quote.id}`}
              className="flex items-center justify-between gap-4 p-5 transition hover:bg-white/[0.03]"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-white">
                  {quote.company_name}
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  {quote.full_name} · {quote.package_display}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-3">
                <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-400">
                  {quote.status_display}
                </span>

                <span className="hidden text-xs text-slate-500 sm:block">
                  {new Date(
                    quote.created_at
                  ).toLocaleDateString()}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}