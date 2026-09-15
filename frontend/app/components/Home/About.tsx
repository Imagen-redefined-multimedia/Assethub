export default function About() {
  return (
    <section
      id="about"
      className="scroll-mt-20 px-6 py-24 lg:px-10"
    >
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
        
        {/* Content */}
        <div>
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-[#55fdfe]">
            About AssetHub
          </p>

          <h2 className="text-3xl font-bold md:text-4xl lg:text-5xl">
            Simplifying the Way Businesses Manage Their Assets
          </h2>

          <p className="mt-6 text-lg leading-8 text-gray-400">
            AssetHub is a centralized asset management platform designed
            to help organizations track, maintain, and manage their assets
            more efficiently.
          </p>

          <p className="mt-4 text-lg leading-8 text-gray-400">
            From asset registration and QR code tracking to maintenance,
            work orders, and reports, AssetHub brings the entire asset
            lifecycle into one platform.
          </p>
        </div>

        {/* Highlights */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h3 className="text-xl font-semibold text-white">
              Centralized Management
            </h3>

            <p className="mt-2 leading-7 text-gray-400">
              Keep your asset information organized and accessible from
              one platform.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h3 className="text-xl font-semibold text-white">
              Smarter Maintenance
            </h3>

            <p className="mt-2 leading-7 text-gray-400">
              Keep maintenance activities organized and reduce the risk
              of missed or delayed work.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h3 className="text-xl font-semibold text-white">
              Better Visibility
            </h3>

            <p className="mt-2 leading-7 text-gray-400">
              Give administrators, technicians, and clients access to
              the information they need.
            </p>
          </div>
        </div>

      </div>
    </section>
  );
}