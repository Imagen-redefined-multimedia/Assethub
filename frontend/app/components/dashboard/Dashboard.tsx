
"use client";

import { ReactNode, useEffect, useState } from "react";
import Sidebar from "../navbar/Sidebar";
import Navbar from "../navbar/Navbar";



const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type User = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: "ADMIN" | "TECHNICIAN" | "CLIENT";
  is_active: boolean;
  company?: number | null;
  company_name?: string | null;
};

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    async function loadUser() {
      const token = localStorage.getItem("access_token");

      if (!token) {
        window.location.href = "/";
        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/api/auth/me/`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");

          window.location.href = "/";
          return;
        }

        const data = await response.json();

        setUser(data);
      } catch {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");

        window.location.href = "/";
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  function logout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");

    window.location.href = "/";
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-700 border-t-blue-500" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-950">

      <Sidebar
        user={user}
        onLogout={logout}
         isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
      />

      <div className="min-h-screen lg:ml-72">
        <div className="flex h-16 items-center border-b border-slate-800 bg-slate-950 px-4 lg:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-xl text-white transition hover:bg-slate-800"
            aria-label="Open navigation"
          >
            ☰
          </button>
        </div>

        <Navbar />

        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>

      </div>
    </div>
  );
}
