
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type User = {
  username: string;
  first_name?: string;
  last_name?: string;
  role: "ADMIN" | "TECHNICIAN" | "CLIENT";
  company?: number | null;
  company_name?: string | null;
};

type SidebarProps = {
  user: User;
  onLogout: () => void;
};

type NavigationItem = {
  label: string;
  href: string;
  icon: string;
};

export default function Sidebar({
  user,
  onLogout,
}: SidebarProps) {
  const pathname = usePathname();

  const navigation = getNavigation(user.role);

  const displayName =
    user.first_name || user.last_name
      ? `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim()
      : user.username;

  return (
    <aside className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-800 bg-slate-950">

      {/* Brand */}
      <div className="flex h-20 items-center border-b border-slate-800 px-6">
        <div
          className="flex items-center gap-3"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 font-bold text-white shadow-lg shadow-blue-600/20">
            A
          </div>

          <div>
            <h1 className="text-lg font-bold text-white">
              AssetHub
            </h1>

            <p className="text-[11px] text-slate-500">
              Asset Management
            </p>
          </div>
        </div>
      </div>

      {/* User */}
      <div className="border-b border-slate-800 p-5">
        <div className="flex items-center gap-3">

          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-800 text-sm font-semibold text-blue-400">
            {displayName.charAt(0).toUpperCase()}
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">
              {displayName}
            </p>

            <p className="mt-0.5 text-xs font-medium text-blue-400">
              {user.role}
            </p>

            {user.company_name && (
              <p className="mt-1 truncate text-xs text-slate-500">
                {user.company_name}
              </p>
            )}
          </div>

        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-4 py-6">

        <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
          Workspace
        </p>

        <div className="space-y-1">
          {navigation.map((item) => {

            const isActive =
              item.href === "/home"
                ? pathname === "/home"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                  isActive
                    ? "bg-blue-600/10 text-blue-400"
                    : "text-slate-400 hover:bg-slate-900 hover:text-white"
                }`}
              >
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "bg-slate-900 text-slate-500"
                  }`}
                >
                  {item.icon}
                </span>

                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Bottom */}
      <div className="border-t border-slate-800 p-4">

        <Link
          href="/profile"
          className="mb-1 flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-400 transition hover:bg-slate-900 hover:text-white"
        >
          <span>⚙</span>
          Profile & Settings
        </Link>

        <button
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-400 transition hover:bg-red-950/30 hover:text-red-400"
        >
          <span>↪</span>
          Logout
        </button>

      </div>
    </aside>
  );
}

function getNavigation(
  role: User["role"]
): NavigationItem[] {

  switch (role) {

    case "ADMIN":
      return [
        {
          label: "Dashboard",
          href: "/home",
          icon: "⌂",
        },
        {
          label: "Companies",
          href: "/companies",
          icon: "▣",
        },
        {
          label: "Users",
          href: "/users",
          icon: "♙",
        },
        {
          label: "Assets",
          href: "/assets",
          icon: "◈",
        },
        {
          label: "Inspections",
          href: "/maintenance",
          icon: "🔧",
        },
        {
          label: "Work Orders",
          href: "/work-orders",
          icon: "▤",
        },
        {
          label: "Reports",
          href: "/reports",
          icon: "▥",
        },
        {
          label: "Rejected Reports",
          href: "/rejected-reports",
          icon: "⚠",
        },
      ];

    case "TECHNICIAN":
      return [

        {
          label: "QR Scanner",
          href: "/qr-scanner",
          icon: "▦",
        },
        
        {
          label: "Work Orders",
          href: "/work-orders",
          icon: "▤",
        },

        {
          label: "Inspections",
          href: "/maintenance",
          icon: "🔧",
        },
        
        
        {
          label: "Reports",
          href: "/reports",
          icon: "▥",
        },
      ];

    case "CLIENT":
      return [
        {
          label: "Dashboard",
          href: "/home",
          icon: "⌂",
        },
        {
          label: "Assets",
          href: "/assets",
          icon: "◈",
        },
        {
          label: "Work Orders",
          href: "/work-orders",
          icon: "▤",
        },
        {
          label: "Reports",
          href: "/reports",
          icon: "▥",
        },
      ];

    default:
      return [];
  }
}

