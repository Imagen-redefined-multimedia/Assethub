export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black px-6 py-12 lg:px-10">
      <div className="mx-auto max-w-6xl">
        {/* Main Footer */}
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <h2 className="text-2xl font-bold text-white">
              Asset<span className="text-[#55fdfe]">Hub</span>
            </h2>

            <p className="mt-4 max-w-xs leading-7 text-gray-400">
              Manage your assets, simplify maintenance, and keep your
              operations connected.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="font-semibold text-white">
              Product
            </h3>

            <ul className="mt-4 space-y-3 text-gray-400">
              <li>
                <a
                  href="#features"
                  className="transition hover:text-[#55fdfe]"
                >
                  Features
                </a>
              </li>

              <li>
                <a
                  href="#solutions"
                  className="transition hover:text-[#55fdfe]"
                >
                  Solutions
                </a>
              </li>

              <li>
                <a
                  href="#pricing"
                  className="transition hover:text-[#55fdfe]"
                >
                  Pricing
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold text-white">
              Company
            </h3>

            <ul className="mt-4 space-y-3 text-gray-400">
              <li>
                <a
                  href="#about"
                  className="transition hover:text-[#55fdfe]"
                >
                  About
                </a>
              </li>

              <li>
                <a
                  href="/get-started"
                  className="transition hover:text-[#55fdfe]"
                >
                  Request a Quote
                </a>
              </li>

              <li>
                <a
                  href="/login"
                  className="transition hover:text-[#55fdfe]"
                >
                  Log In
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-white">
              Get Started
            </h3>

            <p className="mt-4 leading-7 text-gray-400">
              Ready to take control of your assets?
            </p>

            <a
              href="#demo"
              className="mt-5 inline-block rounded-md bg-[#55fdfe] px-5 py-3 font-semibold text-black transition hover:bg-white"
            >
              Request a Demo
            </a>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-6 text-sm text-gray-500 md:flex-row md:items-center md:justify-between">
          <p>
            © 2026 Imagen Redifined Multimedia. All rights reserved.
          </p>

          <div className="flex gap-6">
            <a
              href="/privacy"
              className="transition hover:text-white"
            >
              Privacy Policy
            </a>

            <a
              href="/terms"
              className="transition hover:text-white"
            >
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}