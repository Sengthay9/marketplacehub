import Link from "next/link";
import SiteLogo from "@/components/SiteLogo";
import { Facebook, Youtube, Instagram, MapPin, Phone, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#0F172A] text-white mt-20">
      {/* ── Top section ── */}
      <div className="max-w-7xl mx-auto px-4 pt-14 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">

          {/* Brand column */}
          <div className="md:col-span-4">
            <div className="mb-4">
              <SiteLogo size={40} darkBg />
            </div>
            <p className="text-sm text-white/60 leading-relaxed mb-5">
              Cambodia's leading multi-vendor marketplace. Browse from hundreds of verified vendors, buy with confidence, and sell your products to thousands of buyers across the country.
            </p>
            {/* Social */}
            <div className="flex items-center gap-3">
              {[
                { Icon: Facebook,  href: "#", label: "Facebook" },
                { Icon: Youtube,   href: "#", label: "YouTube" },
                { Icon: Instagram, href: "#", label: "Instagram" },
              ].map(({ Icon, href, label }) => (
                <Link key={label} href={href} aria-label={label}
                  className="w-9 h-9 bg-white/8 hover:bg-[#0D47A1] rounded-xl flex items-center justify-center transition">
                  <Icon className="w-4 h-4" />
                </Link>
              ))}
            </div>
          </div>

          {/* Shop links */}
          <div className="md:col-span-2">
            <h4 className="font-bold text-sm mb-4 text-white/90 uppercase tracking-wider">Shop</h4>
            <ul className="space-y-2.5 text-sm text-white/55">
              {[
                { label: "All Products",  href: "/products" },
                { label: "Categories",    href: "/categories" },
                { label: "All Shops",     href: "/shops" },
                { label: "Featured",      href: "/products?featured=true" },
                { label: "New Arrivals",  href: "/products?sort=newest" },
                { label: "Best Sellers",  href: "/products?sort=popular" },
              ].map(({ label, href }) => (
                <li key={label}><Link href={href} className="hover:text-white transition">{label}</Link></li>
              ))}
            </ul>
          </div>

          {/* Sell links */}
          <div className="md:col-span-2">
            <h4 className="font-bold text-sm mb-4 text-white/90 uppercase tracking-wider">Sell</h4>
            <ul className="space-y-2.5 text-sm text-white/55">
              {[
                { label: "Become a Vendor", href: "/vendor-register" },
                { label: "Vendor Sign In",  href: "/login" },
                { label: "Vendor Guide",    href: "/about" },
                { label: "Seller Center",   href: "/vendor/dashboard" },
              ].map(({ label, href }) => (
                <li key={label}><Link href={href} className="hover:text-white transition">{label}</Link></li>
              ))}
            </ul>
          </div>

          {/* Help links */}
          <div className="md:col-span-2">
            <h4 className="font-bold text-sm mb-4 text-white/90 uppercase tracking-wider">Help</h4>
            <ul className="space-y-2.5 text-sm text-white/55">
              {[
                { label: "Contact Us",   href: "/contact" },
                { label: "About Us",     href: "/about" },
                { label: "Track Order",  href: "/orders" },
                { label: "Returns",      href: "/contact" },
              ].map(({ label, href }) => (
                <li key={label}><Link href={href} className="hover:text-white transition">{label}</Link></li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="md:col-span-2">
            <h4 className="font-bold text-sm mb-4 text-white/90 uppercase tracking-wider">Contact</h4>
            <ul className="space-y-3 text-sm text-white/55">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-[#FF6B00]" />
                <span>Phnom Penh, Cambodia</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 shrink-0 text-[#FF6B00]" />
                <a href="tel:+85512345678" className="hover:text-white transition">+855 12 345 678</a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 shrink-0 text-[#FF6B00]" />
                <a href="mailto:hello@camcart.shop" className="hover:text-white transition">hello@camcart.shop</a>
              </li>
            </ul>

            {/* App badges placeholder */}
            <div className="mt-5 space-y-2">
              <div className="inline-flex items-center gap-2 bg-white/8 rounded-xl px-3 py-2 text-xs font-medium cursor-pointer hover:bg-white/12 transition">
                <span className="text-base">📱</span> Get the App
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Divider ── */}
      <div className="border-t border-white/8" />

      {/* ── Bottom bar ── */}
      <div className="max-w-7xl mx-auto px-4 py-5 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-white/40">
        <p>© {new Date().getFullYear()} CamCart. All rights reserved. Made with ❤️ for Cambodia.</p>
        <div className="flex items-center gap-5">
          <Link href="/about" className="hover:text-white transition">Privacy Policy</Link>
          <Link href="/about" className="hover:text-white transition">Terms of Service</Link>
          <Link href="/about" className="hover:text-white transition">Cookie Policy</Link>
        </div>
      </div>
    </footer>
  );
}
