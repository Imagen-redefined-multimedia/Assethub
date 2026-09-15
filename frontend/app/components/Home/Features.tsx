import FeatureCard from "./FeatureCards";


const features = [
  {
    number: "01",
    title: "Asset Management",
    description:
      "Keep a complete digital record of your assets, including ownership, serial numbers, status, and important asset information.",
  },
  {
    number: "02",
    title: "QR Code Tracking",
    description:
      "Give every asset a unique QR code for fast identification and instant access to asset information.",
  },
  {
    number: "03",
    title: "Maintenance Management",
    description:
      "Schedule, track, and manage maintenance activities before small issues become costly problems.",
  },
  {
    number: "04",
    title: "Work Orders",
    description:
      "Create and manage work orders so technicians know what needs to be done, when it needs to be done, and why.",
  },
  {
    number: "05",
    title: "Maintenance Reports",
    description:
      "Capture completed work, issues, solutions, priorities, and supporting images in structured maintenance reports.",
  },
  {
    number: "06",
    title: "Role-Based Access",
    description:
      "Give administrators, technicians, and clients access to the information and tools they need.",
  },
];

export default function Features() {
  return (
    <section id="features" className="px-6 py-24 lg:px-10">
      {/* Section Header */}
      <div className="mx-auto max-w-4xl text-center">
        <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-[#55fdfe]">
          Powerful Features
        </p>

        <h2 className="text-3xl font-bold md:text-4xl lg:text-5xl">
          Everything You Need to Manage Your Assets
        </h2>

        <p className="mx-auto mt-5 max-w-2xl text-lg text-gray-400">
          AssetHub brings asset tracking, maintenance, and operational
          visibility together in one centralized platform.
        </p>
      </div>

      {/* Feature Cards */}
      <div className="mx-auto mt-16 grid max-w-6xl gap-6 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <FeatureCard
            key={feature.number}
            number={feature.number}
            title={feature.title}
            description={feature.description}
          />
        ))}
      </div>
    </section>
  );
}