"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../components/navbar/Sidebar";
import Navbar from "../components/navbar/Navbar";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type User = {
  username: string;
  first_name?: string;
  last_name?: string;
  role: "ADMIN" | "TECHNICIAN" | "CLIENT";
  company?: number | null;
  company_name?: string | null;
};

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const token = localStorage.getItem("access_token");

      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/auth/me/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          router.replace("/login");
          return;
        }

        const data = await response.json();
        setUser(data);
      } catch {
        router.replace("/login");
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, [router]);

  function handleLogout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");

    router.replace("/login");
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
    <div className="min-h-screen bg-slate-950 text-white">
      <Sidebar user={user} onLogout={handleLogout} />

      <div className="ml-72 min-h-screen">
        <Navbar />

        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  );
}