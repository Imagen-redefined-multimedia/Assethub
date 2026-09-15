export default function Solutions() {
  return (
    <section
      id="solutions"
      className="scroll-mt-20 px-6 py-24 lg:px-10"
    >
      {/* Section Header */}
      <div className="mx-auto max-w-4xl text-center">
        <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-[#55fdfe]">
          Solutions
        </p>

        <h2 className="text-3xl font-bold md:text-4xl lg:text-5xl">
          Built for Every Team That Depends on Their Assets
        </h2>

        <p className="mx-auto mt-5 max-w-2xl text-lg text-gray-400">
          AssetHub connects administrators, technicians, and clients on one
          platform, giving everyone the tools and information they need.
        </p>
      </div>

      {/* Solutions */}
      <div className="mx-auto mt-16 grid max-w-6xl gap-6 md:grid-cols-2 lg:grid-cols-3">
        
        {/* Administrators */}
        <article className="rounded-2xl border border-white/10 bg-white/5 p-8 transition-all duration-300 hover:-translate-y-1 hover:border-[#55fdfe]/50 hover:bg-white/10">
          <span className="text-sm font-semibold text-[#55fdfe]">
            FOR ADMINISTRATORS
          </span>

          <h3 className="mt-4 text-2xl font-semibold text-white">
            Take Control
          </h3>

          <p className="mt-4 leading-7 text-gray-400">
            Manage your entire asset operation from one centralized platform.
            Control assets, users, roles, and maintenance activities.
          </p>

          <ul className="mt-6 space-y-3 text-sm text-gray-300">
            <li>✓ Manage assets</li>
            <li>✓ Manage users and roles</li>
            <li>✓ Track maintenance</li>
            <li>✓ Monitor operations</li>
          </ul>
        </article>

        {/* Technicians */}
        <article className="rounded-2xl border border-white/10 bg-white/5 p-8 transition-all duration-300 hover:-translate-y-1 hover:border-[#55fdfe]/50 hover:bg-white/10">
          <span className="text-sm font-semibold text-[#55fdfe]">
            FOR TECHNICIANS
          </span>

          <h3 className="mt-4 text-2xl font-semibold text-white">
            Work Smarter
          </h3>

          <p className="mt-4 leading-7 text-gray-400">
            Give technicians the information they need in the field. Scan
            assets, access maintenance information, complete work, and submit
            reports.
          </p>

          <ul className="mt-6 space-y-3 text-sm text-gray-300">
            <li>✓ Scan asset QR codes</li>
            <li>✓ Manage maintenance</li>
            <li>✓ Complete work orders</li>
            <li>✓ Submit maintenance reports</li>
          </ul>
        </article>

        {/* Clients */}
        <article className="rounded-2xl border border-white/10 bg-white/5 p-8 transition-all duration-300 hover:-translate-y-1 hover:border-[#55fdfe]/50 hover:bg-white/10">
          <span className="text-sm font-semibold text-[#55fdfe]">
            FOR CLIENTS
          </span>

          <h3 className="mt-4 text-2xl font-semibold text-white">
            Stay Informed
          </h3>

          <p className="mt-4 leading-7 text-gray-400">
            Keep visibility over your assets and maintenance activities.
            Follow work progress and review completed maintenance reports.
          </p>

          <ul className="mt-6 space-y-3 text-sm text-gray-300">
            <li>✓ View your assets</li>
            <li>✓ Track maintenance</li>
            <li>✓ Review work orders</li>
            <li>✓ Access maintenance reports</li>
          </ul>
        </article>

      </div>
    </section>
  );
}