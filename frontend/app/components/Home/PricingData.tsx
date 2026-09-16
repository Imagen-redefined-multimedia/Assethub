export type PricingPackage = {
  name: string;
  description: string;
  features: string[];
  popular?: boolean;
};

export const pricingPackages: PricingPackage[] = [
  {
    name: "Starter",
    description: "Essential asset management for small teams.",
    features: [
      "Asset Management",
      "QR Code Tracking",
      "Basic Maintenance Management",
      "User Management",
    ],
  },
  {
    name: "Business",
    description:
      "Complete asset and maintenance management for growing organizations.",
    popular: true,
    features: [
      "Everything in Starter",
      "Work Orders",
      "Maintenance Reports",
      "Maintenance Schedules",
      "Advanced Asset Tracking",
    ],
  },
  {
    name: "Enterprise",
    description:
      "A flexible solution for organizations with advanced requirements.",
    features: [
      "Everything in Business",
      "Custom Workflows",
      "Advanced Reporting",
      "Custom Integrations",
      "Dedicated Support",
    ],
  },
];