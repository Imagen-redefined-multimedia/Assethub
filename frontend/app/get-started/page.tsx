"use client";


import { FormEvent, useState } from "react";
import Link from "next/link";

import PricingCard from "@/app/components/Home/PricingCard";
import { pricingPackages } from "@/app/components/Home/PricingData";
import { apiJson } from "@/lib/api";

export default function GetStartedPage() {
  const [selectedPackage, setSelectedPackage] = useState("Business");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    fullName: "",
    companyName: "",
    email: "",
    phone: "",
    assets: "",
    users: "",
    requirements: "",
  });



  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
  e.preventDefault();

  setSubmitted(false);
  setError("");
  setSubmitting(true);

  try {
    await apiJson("/api/quote-requests/", {
      method: "POST",
      body: JSON.stringify({
        full_name: form.fullName,
        company_name: form.companyName,
        email: form.email,
        phone: form.phone,
        package: selectedPackage.toUpperCase(),
        number_of_assets: form.assets
          ? Number(form.assets)
          : null,
        number_of_users: form.users
          ? Number(form.users)
          : null,
        requirements: form.requirements,
      }),
      skipRefresh: true,
    });

    setSubmitted(true);

    setForm({
      fullName: "",
      companyName: "",
      email: "",
      phone: "",
      assets: "",
      users: "",
      requirements: "",
    });
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : "Something went wrong. Please try again."
    );
  } finally {
    setSubmitting(false);
  }
}
  return (
    <main className="min-h-screen bg-black text-white">
      {/* Header */}
      <section className="border-b border-white/10 px-6 py-16 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <Link
            href="/"
            className="text-sm text-gray-400 transition hover:text-[#55fdfe]"
          >
            ← Back to AssetHub
          </Link>

          <div className="mt-12 max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-[#55fdfe]">
              Request a Quote
            </p>

            <h1 className="mt-4 text-4xl font-bold md:text-5xl lg:text-6xl">
              Find the right AssetHub package for your business.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-400">
              Tell us about your organization, choose a package, and
              we'll review your requirements to prepare a suitable quote.
            </p>
          </div>
        </div>
      </section>

      {/* Package selection */}
      <section className="px-6 py-16 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-[#55fdfe]">
              01
            </p>

            <h2 className="mt-2 text-2xl font-bold md:text-3xl">
              Choose Your Package
            </h2>

            <p className="mt-3 text-gray-400">
              Select the package that best matches your organization's needs.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {pricingPackages.map((plan) => (
              <PricingCard
                key={plan.name}
                name={plan.name}
                description={plan.description}
                features={plan.features}
                popular={plan.popular}
                selectable
                selected={selectedPackage === plan.name}
                onSelect={() => setSelectedPackage(plan.name)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Form */}
      <section className="px-6 pb-24 lg:px-10">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1fr_320px]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-[#55fdfe]">
              02
            </p>

            <h2 className="mt-2 text-2xl font-bold md:text-3xl">
              Tell Us About Your Organization
            </h2>

            <form
              onSubmit={handleSubmit}
              className="mt-10 space-y-6"
            >
              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  label="Full Name"
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  placeholder="John Doe"
                  required
                />

                <FormField
                  label="Company Name"
                  name="companyName"
                  value={form.companyName}
                  onChange={handleChange}
                  placeholder="Your Company"
                  required
                />

                <FormField
                  label="Business Email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="john@company.com"
                  required
                />

                <FormField
                  label="Phone Number"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+266 ..."
                />

                <FormField
                  label="Number of Assets"
                  name="assets"
                  type="number"
                  value={form.assets}
                  onChange={handleChange}
                  placeholder="100"
                />

                <FormField
                  label="Number of Users"
                  name="users"
                  type="number"
                  value={form.users}
                  onChange={handleChange}
                  placeholder="10"
                />
              </div>

              <div>
                <label
                  htmlFor="requirements"
                  className="mb-2 block text-sm font-medium text-gray-300"
                >
                  Additional Requirements
                </label>

                <textarea
                  id="requirements"
                  name="requirements"
                  value={form.requirements}
                  onChange={handleChange}
                  rows={6}
                  placeholder="Tell us about any specific requirements your organization has..."
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-gray-600 focus:border-[#55fdfe]"
                />
              </div>

              <div className="rounded-xl border border-[#55fdfe]/20 bg-[#55fdfe]/5 p-4">
                <p className="text-sm text-gray-400">
                  Selected package
                </p>

                <p className="mt-1 font-semibold text-[#55fdfe]">
                  {selectedPackage}
                </p>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-[#55fdfe] px-6 py-4 font-semibold text-black transition hover:bg-[#55fdfe]/80 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Request a Quote"}
              </button>
              {error && (
                <div className="rounded-xl border border-red-400/20 bg-red-400/5 p-4 text-sm text-red-300">
                  {error}
                </div>
              )}

              {submitted && (
                <div className="rounded-xl border border-green-400/20 bg-green-400/5 p-4 text-sm text-green-300">
                  Your quote request has been submitted.
                </div>
              )}
            </form>
          </div>

          {/* What happens next */}
          <aside className="h-fit rounded-2xl border border-white/10 bg-white/5 p-6 lg:sticky lg:top-8">
            <p className="text-sm font-semibold uppercase tracking-widest text-[#55fdfe]">
              What happens next?
            </p>

            <div className="mt-6 space-y-6">
              <Step
                number="01"
                title="Submit your requirements"
                description="Tell us about your organization and select a package."
              />

              <Step
                number="02"
                title="We review your needs"
                description="We'll review the size and requirements of your organization."
              />

              <Step
                number="03"
                title="We contact you"
                description="Our team will discuss your requirements with you."
              />

              <Step
                number="04"
                title="Receive your quote"
                description="You'll receive a quote based on your requirements."
              />
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

type FormFieldProps = {
  label: string;
  name: string;
  value: string;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement>
  ) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
};

function FormField({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}: FormFieldProps) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-2 block text-sm font-medium text-gray-300"
      >
        {label}
      </label>

      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-gray-600 focus:border-[#55fdfe]"
      />
    </div>
  );
}

type StepProps = {
  number: string;
  title: string;
  description: string;
};

function Step({ number, title, description }: StepProps) {
  return (
    <div className="flex gap-4">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#55fdfe]/40 text-xs font-semibold text-[#55fdfe]">
        {number}
      </span>

      <div>
        <h3 className="font-semibold text-white">{title}</h3>

        <p className="mt-1 text-sm leading-6 text-gray-400">
          {description}
        </p>
      </div>
    </div>
  );
}