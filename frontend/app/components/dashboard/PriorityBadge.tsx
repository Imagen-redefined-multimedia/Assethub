type PriorityBadgeProps = {
  priority: string;
};

export default function PriorityBadge({
  priority,
}: PriorityBadgeProps) {
  const styles: Record<string, string> = {
    LOW: "bg-slate-800 text-slate-400",
    MEDIUM: "bg-yellow-500/10 text-yellow-400",
    HIGH: "bg-orange-500/10 text-orange-400",
    CRITICAL: "bg-red-500/10 text-red-400",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium ${
        styles[priority] ?? styles.MEDIUM
      }`}
    >
      {priority}
    </span>
  );
}