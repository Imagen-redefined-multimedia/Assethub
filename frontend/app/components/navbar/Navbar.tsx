
"use client";

import { usePathname } from "next/navigation";

type User = {
  username: string;
  first_name?: string;
  last_name?: string;
  role: "ADMIN" | "TECHNICIAN" | "CLIENT";
  company?: number | null;
  company_name?: string | null;
};

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
};

export default function Topbar() {
  const pathname = usePathname();

  const pageName =
    Object.entries(pageNames)
      .sort(([a], [b]) => b.length - a.length)
      .find(([path]) => pathname.startsWith(path))?.[1] ??
    "AssetHub";

  return (
    <header className="sticky top-0 z-40 flex h-20 items-center border-b border-slate-800 bg-slate-950/95 px-8 backdrop-blur">

      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-slate-600">
          AssetHub
        </p>

        <h2 className="mt-1 text-xl font-semibold text-white">
          {pageName}
        </h2>
      </div>

    </header>
  );
}

