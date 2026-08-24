
"use client";

import { useState } from "react";

export default function MaintenanceFilters() {
  const [status, setStatus] = useState("ALL");
  const [priority, setPriority] = useState("ALL");

  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-white p-4 md:flex-row">
      <input
        type="search"
        placeholder="Search maintenance reports..."
        className="h-10 flex-1 rounded-md border px-3 text-sm outline-none focus:ring-2"
      />

      <select
        value={status}
        onChange={(event) => setStatus(event.target.value)}
        className="h-10 rounded-md border px-3 text-sm"
      >
        <option value="ALL">All statuses</option>
        <option value="PENDING">Pending</option>
        <option value="APPROVED">Approved</option>
        <option value="REJECTED">Rejected</option>
        <option value="COMPLETED">Completed</option>
      </select>

      <select
        value={priority}
        onChange={(event) => setPriority(event.target.value)}
        className="h-10 rounded-md border px-3 text-sm"
      >
        <option value="ALL">All priorities</option>
        <option value="LOW">Low</option>
        <option value="MEDIUM">Medium</option>
        <option value="HIGH">High</option>
        <option value="CRITICAL">Critical</option>
      </select>
    </div>
  );
}


