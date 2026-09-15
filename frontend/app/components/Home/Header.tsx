
import Link from "next/link";
import VideoPlay from "./Video";

export default function Header() {
  return (
    <header className="relative flex min-h-screen items-center justify-center overflow-hidden">

      {/* Background Video */}
      <div className="absolute inset-0 z-0">
        <VideoPlay />
      </div>

      {/* Dark Overlay */}
      <div className="absolute inset-0 z-10 bg-black/50" />

      {/* Hero Content */}
      <div className="relative z-20 flex flex-col items-center justify-center gap-6 px-6 py-20 text-white">

        <h1 className="text-center text-3xl font-bold md:text-4xl lg:text-6xl">
          Know Every Asset.
          <span className="block">
            Control Every Operation.
          </span>
        </h1>

        <p className="max-w-2xl text-center text-lg font-medium md:text-xl">
          Track. Maintain. Manage.
          <span className="block">
            AssetHub gives your team complete visibility and control over your assets.
          </span>
        </p>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/get-started"
            className="rounded-md bg-[#55fdfe] px-6 py-3 font-bold text-black transition hover:bg-white"
          >
            Get Started
          </Link>

          <Link
            href="/login"
            className="rounded-md border border-white px-6 py-3 font-semibold text-white transition hover:bg-white hover:text-black"
          >
            Login
          </Link>
        </div>

      </div>
    </header>
  );
}

