type FeatureCardProps = {
  number: string;
  title: string;
  description: string;
};

export default function FeatureCard({
  number,
  title,
  description,
}: FeatureCardProps) {
  return (
    <div className="group rounded-2xl border border-white/10 bg-white/5 p-6 transition duration-300 hover:-translate-y-1 hover:border-[#55fdfe]/50 hover:bg-white/10">
      <span className="text-sm font-semibold text-[#55fdfe]">
        {number}
      </span>

      <h3 className="mt-4 text-xl font-semibold">
        {title}
      </h3>

      <p className="mt-3 leading-7 text-gray-400">
        {description}
      </p>
    </div>
  );
}