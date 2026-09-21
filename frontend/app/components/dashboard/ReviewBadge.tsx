type ReviewBadgeProps = {
  status: string;
};

export default function ReviewBadge({
  status,
}: ReviewBadgeProps) {
  const styles: Record<string, string> = {
    PENDING: "bg-yellow-500/10 text-yellow-400",
    ACCEPTED: "bg-emerald-500/10 text-emerald-400",
    REJECTED: "bg-red-500/10 text-red-400",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium ${
        styles[status] ??
        "bg-slate-800 text-slate-400"
      }`}
    >
      {status}
    </span>
  );
}