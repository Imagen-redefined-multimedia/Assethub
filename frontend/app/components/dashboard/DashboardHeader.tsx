type DashboardHeaderProps = {
  label: string;
  title: string;
  description: string;
};

export default function DashboardHeader({
  label,
  title,
  description,
}: DashboardHeaderProps) {
  return (
    <div>
      <p className="text-sm font-medium text-blue-400">
        {label}
      </p>

      <h1 className="mt-1 text-3xl font-bold text-white">
        {title}
      </h1>

      <p className="mt-2 text-slate-400">
        {description}
      </p>
    </div>
  );
}