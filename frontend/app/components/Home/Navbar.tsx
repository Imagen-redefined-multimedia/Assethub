"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { GiHamburgerMenu } from "react-icons/gi";
import { IoClose } from "react-icons/io5";
import { usePathname } from "next/navigation";

const navLinks = [
  { name: "Home", href: "/" },
  { name: "Features", href: "#features" },
  { name: "Pricing", href: "#pricing" },
  { name: "Solutions", href: "#solutions" },
  { name: "About", href: "#about" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <nav className="absolute top-0 left-0 z-50 w-full">
      <div className="flex h-20 w-full items-center justify-between px-6 lg:px-10">

        {/* Logo */}
        <Link href="/" onClick={closeMenu}>
          <Image
            src="/logoName-04.svg"
            alt="AssetHub"
            width={150}
            height={50}
            priority
          />
        </Link>

        {/* Desktop Navigation */}
        <ul className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <li key={link.name}>
              <Link
                href={link.href}
                className={`transition ${
                  pathname === link.href
                    ? "text-[#55fdfe]"
                    : "hover:text-[#55fdfe]"
                }`}
              >
                {link.name}
              </Link>
            </li>
          ))}
        </ul>

        {/* Desktop CTA */}
        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/get-started"
            className="rounded-md border border-white px-4 py-2 transition hover:border-[#55fdfe] hover:bg-[#55fdfe] hover:text-black"
          >
            Get Started
          </Link>

          <Link
            href="/login"
            className="rounded-md bg-[#55fdfe] px-4 py-2 text-black transition hover:bg-white"
          >
            Log In
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          className="rounded-md border border-white p-2 transition hover:border-[#55fdfe] hover:bg-[#55fdfe] hover:text-black md:hidden"
        >
          {menuOpen ? (
            <IoClose size={24} />
          ) : (
            <GiHamburgerMenu size={24} />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="absolute left-0 top-20 z-50 w-full border-t border-white/10 bg-black px-6 py-6 md:hidden">
          <ul className="flex flex-col gap-5">
            {navLinks.map((link) => (
              <li key={link.name}>
                <Link
                  href={link.href}
                  onClick={closeMenu}
                  className={`block transition ${
                    pathname === link.href
                      ? "text-[#55fdfe]"
                      : "hover:text-[#55fdfe]"
                  }`}
                >
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>

          {/* Mobile CTA */}
          <div className="mt-6 flex flex-col gap-3">
            <Link
              href="#demo"
              onClick={closeMenu}
              className="rounded-md border border-white px-4 py-2 text-center transition hover:border-[#55fdfe] hover:bg-[#55fdfe] hover:text-black"
            >
              Request a Demo
            </Link>

            <Link
              href="/login"
              onClick={closeMenu}
              className="rounded-md bg-[#55fdfe] px-4 py-2 text-center text-black transition hover:bg-white"
            >
              Log In
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}