"use client";

type PricingCardProps = {
  name: string;
  description: string;
  features: string[];
  popular?: boolean;
  selected?: boolean;
  selectable?: boolean;
  onSelect?: () => void;
};

export default function PricingCard({
  name,
  description,
  features,
  popular = false,
  selected = false,
  selectable = false,
  onSelect,
}: PricingCardProps) {
  const cardClasses = selected
    ? "border-[#55fdfe] bg-[#55fdfe]/10 shadow-[0_0_30px_rgba(85,253,254,0.08)]"
    : popular
      ? "border-[#55fdfe]/50 bg-[#55fdfe]/5"
      : "border-white/10 bg-white/5 hover:border-[#55fdfe]/40";

  return (
    <article
      onClick={selectable ? onSelect : undefined}
      className={`relative rounded-2xl border p-8 transition-all duration-300 hover:-translate-y-1 ${cardClasses} ${
        selectable ? "cursor-pointer" : ""
      }`}
    >
      {popular && (
        <span className="absolute right-6 top-6 rounded-full bg-[#55fdfe] px-3 py-1 text-xs font-semibold text-black">
          Popular
        </span>
      )}

      {selected && (
        <span className="absolute right-6 top-6 flex h-7 w-7 items-center justify-center rounded-full bg-[#55fdfe] text-sm font-bold text-black">
          ✓
        </span>
      )}

      <p className="text-sm font-semibold uppercase tracking-widest text-[#55fdfe]">
        {name}
      </p>

      <p className="mt-4 min-h-[56px] leading-7 text-gray-400">
        {description}
      </p>

      <div className="my-8 h-px bg-white/10" />

      <ul className="space-y-4">
        {features.map((feature) => (
          <li
            key={feature}
            className="flex items-start gap-3 text-sm text-gray-300"
          >
            <span className="text-[#55fdfe]">✓</span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      {selectable && (
        <div
          className={`mt-8 w-full rounded-lg border px-5 py-3 text-center font-medium transition ${
            selected
              ? "border-[#55fdfe] bg-[#55fdfe] text-black"
              : "border-white/20 text-white hover:border-[#55fdfe] hover:bg-[#55fdfe] hover:text-black"
          }`}
        >
          {selected ? "Selected" : "Select Package"}
        </div>
      )}
    </article>
  );
}