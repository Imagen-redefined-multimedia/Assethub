type StatusRowProps = {
  label: string;
  value: number;
  status: "danger" | "warning" | "success" | "info";
};

export default function StatusRow({
  label,
  value,
  status,
}: StatusRowProps) {
  const styles = {
    danger: "bg-red-500/10 text-red-400",
    warning: "bg-yellow-500/10 text-yellow-400",
    success: "bg-emerald-500/10 text-emerald-400",
    info: "bg-blue-500/10 text-blue-400",
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span
          className={`h-2 w-2 rounded-full ${styles[status]}`}
        />

        <span className="text-sm text-slate-300">
          {label}
        </span>
      </div>

      <span
        className={`rounded-lg px-3 py-1 text-sm font-semibold ${styles[status]}`}
      >
        {value}
      </span>
    </div>
  );
}