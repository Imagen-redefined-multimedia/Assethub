
"use client";

interface MaintenanceFiltersProps {
  search: string;
  status: string;
  priority: string;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onPriorityChange: (value: string) => void;
}

export default function MaintenanceFilters({
  search,
  status,
  priority,
  onSearchChange,
  onStatusChange,
  onPriorityChange,
}: MaintenanceFiltersProps) {
  return (
    <div className="flex flex-col gap-3 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 p-5 md:flex-row">
      {/* Search */}
      <input
        type="search"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Search maintenance reports..."
        className="h-11 flex-1 rounded-xl border border-slate-700 bg-slate-950 px-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500"
      />

      {/* Status */}
      <select
        value={status}
        onChange={(event) => onStatusChange(event.target.value)}
        className="h-11 rounded-xl border border-slate-700 bg-slate-950 px-4 text-sm text-slate-300 outline-none transition focus:border-blue-500"
      >
        <option value="ALL">All statuses</option>
        <option value="PENDING">Pending</option>
        <option value="IN_PROGRESS">In Progress</option>
        <option value="COMPLETED">Completed</option>
      </select>

      {/* Priority */}
      <select
        value={priority}
        onChange={(event) => onPriorityChange(event.target.value)}
        className="h-11 rounded-xl border border-slate-700 bg-slate-950 px-4 text-sm text-slate-300 outline-none transition focus:border-blue-500"
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

