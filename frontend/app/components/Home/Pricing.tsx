import PricingCard from "./PricingCard";
import { pricingPackages } from "./PricingData";

export default function Pricing() {
  return (
    <section
      id="pricing"
      className="scroll-mt-20 px-6 py-24 lg:px-10"
    >
      <div className="mx-auto max-w-4xl text-center">
        <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-[#55fdfe]">
          Pricing
        </p>

        <h2 className="text-3xl font-bold md:text-4xl lg:text-5xl">
          Plans That Scale With Your Business
        </h2>

        <p className="mx-auto mt-5 max-w-2xl text-lg text-gray-400">
          Choose the AssetHub package that fits your organization.
          Final pricing is based on your requirements.
        </p>
      </div>

      <div className="mx-auto mt-16 grid max-w-6xl gap-6 md:grid-cols-2 lg:grid-cols-3">
        {pricingPackages.map((plan) => (
          <PricingCard
            key={plan.name}
            name={plan.name}
            description={plan.description}
            features={plan.features}
            popular={plan.popular}
          />
        ))}
      </div>
    </section>
  );
}