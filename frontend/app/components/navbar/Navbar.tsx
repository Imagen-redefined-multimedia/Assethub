"use client";

import { usePathname } from "next/navigation";

const pageNames: Record<string, string> = {
  "/home": "Dashboard",
  "/companies": "Companies",
  "/users": "Users",
  "/assets": "Assets",
  "/maintenance": "Maintenance",
  "/work-orders": "Work Orders",
  "/reports": "Reports",
  "/qr-scanner": "QR Scanner",
  "/profile": "Profile & Settings",
  "/schedules": "Maintenance Schedules",
  "/rejected-reports": "Rejected Reports",
};

export default function Navbar() {
  const pathname = usePathname();

  const pageName =
    Object.entries(pageNames)
      .sort(([a], [b]) => b.length - a.length)
      .find(([path]) => pathname.startsWith(path))?.[1] ??
    "AssetHub";

  return (
    <header className="sticky top-0 z-30 flex min-h-16 items-center border-b border-slate-800 bg-slate-950/95 px-4 py-3 backdrop-blur sm:px-6 lg:min-h-20 lg:px-8 lg:py-0">
      <div className="min-w-0">
        <p className="text-[10px] font-medium uppercase tracking-widest text-slate-600 sm:text-xs">
          AssetHub
        </p>

        <h2 className="mt-0.5 truncate text-lg font-semibold text-white sm:mt-1 sm:text-xl">
          {pageName}
        </h2>
      </div>
    </header>
  );
}