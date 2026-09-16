export default function Pricing() {
  return (
    <section
      id="pricing"
      className="scroll-mt-20 px-6 py-24 lg:px-10"
    >
      {/* Header */}
      <div className="mx-auto max-w-4xl text-center">
        <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-[#55fdfe]">
          Pricing
        </p>

        <h2 className="text-3xl font-bold md:text-4xl lg:text-5xl">
          Plans That Scale With Your Business
        </h2>

        <p className="mx-auto mt-5 max-w-2xl text-lg text-gray-400">
          Choose a plan that fits your organization and get the tools you
          need to manage your assets and maintenance.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="mx-auto mt-16 grid max-w-6xl gap-6 md:grid-cols-3">

        {/* Starter */}
        <article className="rounded-2xl border border-white/10 bg-white/5 p-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-gray-400">
            Starter
          </p>

          <h3 className="mt-4 text-3xl font-bold text-white">
            For Small Teams
          </h3>

          <p className="mt-4 leading-7 text-gray-400">
            Essential tools for organizations starting to centralize their
            asset management.
          </p>

          <ul className="mt-8 space-y-4 text-sm text-gray-300">
            <li>✓ Asset management</li>
            <li>✓ QR code tracking</li>
            <li>✓ Basic maintenance management</li>
            <li>✓ User management</li>
          </ul>

          <button className="mt-8 w-full rounded-md border border-white px-5 py-3 font-semibold transition hover:border-[#55fdfe] hover:bg-[#55fdfe] hover:text-black">
            Get Started
          </button>
        </article>

        {/* Business */}
        <article className="relative rounded-2xl border border-[#55fdfe]/50 bg-white/10 p-8">
          <span className="absolute right-6 top-6 rounded-full bg-[#55fdfe] px-3 py-1 text-xs font-bold text-black">
            Popular
          </span>

          <p className="text-sm font-semibold uppercase tracking-wider text-[#55fdfe]">
            Business
          </p>

          <h3 className="mt-4 text-3xl font-bold text-white">
            For Growing Teams
          </h3>

          <p className="mt-4 leading-7 text-gray-400">
            Advanced tools for organizations managing multiple assets,
            technicians, and maintenance operations.
          </p>

          <ul className="mt-8 space-y-4 text-sm text-gray-300">
            <li>✓ Everything in Starter</li>
            <li>✓ Work order management</li>
            <li>✓ Maintenance reports</li>
            <li>✓ Maintenance schedules</li>
            <li>✓ Advanced asset tracking</li>
          </ul>

          <button className="mt-8 w-full rounded-md bg-[#55fdfe] px-5 py-3 font-semibold text-black transition hover:bg-white">
            Get Started
          </button>
        </article>

        {/* Enterprise */}
        <article className="rounded-2xl border border-white/10 bg-white/5 p-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-gray-400">
            Enterprise
          </p>

          <h3 className="mt-4 text-3xl font-bold text-white">
            For Large Organizations
          </h3>

          <p className="mt-4 leading-7 text-gray-400">
            Flexible asset management for organizations with larger
            operations and specialized requirements.
          </p>

          <ul className="mt-8 space-y-4 text-sm text-gray-300">
            <li>✓ Everything in Business</li>
            <li>✓ Advanced reporting</li>
            <li>✓ Dedicated support</li>
             <li>✓ Maintenance reports</li>
            <li>✓ Maintenance schedules</li>
            <li>✓ Advanced asset tracking</li>
          </ul>

          <button className="mt-8 w-full rounded-md border border-white px-5 py-3 font-semibold transition hover:border-[#55fdfe] hover:bg-[#55fdfe] hover:text-black">
            Contact Us
          </button>
        </article>

      </div>
    </section>
  );
}