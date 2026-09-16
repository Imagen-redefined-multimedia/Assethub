export type PricingPackage = {
  name: string;
  description: string;
  features: string[];
  popular?: boolean;
};

export const pricingPackages: PricingPackage[] = [
  {
    name: "Essential",
    description: "Essential asset management for small teams.",
    features: [
      "Asset Registration",
      "Schedule inspections",
      "QR Code Tracking",
      "Condition Reporting",
      "Basic maintenance tracking",
    ],
  },
  {
    name: "Professional",
    description:
      "Complete asset and maintenance management for growing organizations.",
    popular: true,
    features: [
      "Everything in Essential",
      "Maintenance schedules",
      "Work orders",
      "Maintenance reports",
      "Asset condition history",
    ],
  },
  {
    name: "Enterprise",
    description:
      "A flexible solution for organizations with advanced requirements.",
    features: [
      "Everything in Professional",
      "Multi-site asset management",
      "Advanced Reporting",
      "Custom workflows",
      "SLA management",
      "Lifecycle planning"
    ],
  },
];