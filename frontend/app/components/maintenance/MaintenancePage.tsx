"use client";

import { useState } from "react";

import MaintenanceFilters from "@/app/components/maintenance/MaintenanceFilters";
import MaintenanceTable from "@/app/components/maintenance/MaintenanceTable";

export default function MaintenancePage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [priority, setPriority] = useState("ALL");

  return (
    <div className="space-y-6 p-6">
      <div>
        <p className="text-sm font-medium text-blue-400">
          MAINTENANCE
        </p>

        <h1 className="mt-1 text-3xl font-bold text-white">
          Maintenance
        </h1>

        <p className="mt-2 text-slate-400">
          View assigned maintenance tasks, monitor progress, and manage asset maintenance activity.
        </p>
      </div>

      <MaintenanceFilters
        search={search}
        status={status}
        priority={priority}
        onSearchChange={setSearch}
        onStatusChange={setStatus}
        onPriorityChange={setPriority}
      />

      <MaintenanceTable
        search={search}
        status={status}
        priority={priority}
      />
    </div>
  );
}