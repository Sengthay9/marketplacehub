"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight, LayoutDashboard, ShoppingBag, Package,
  Star, ShoppingCart, ChevronLeft, ChevronRight,
  Shield, RefreshCw, Headphones,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth.store";
import { useLangStore } from "@/store/lang.store";
import { useCart } from "@/hooks/useCart";
import { formatCurrency } from "@/lib/utils";
import type { Product } from "@/types";

const SLIDE_INTERVAL = 12000;

/* Trust badges below hero */
const TRUST_BADGES = [
  { Icon: Shield,      label: "Secure Payment",    labelKm: "ការទូទាត់មានសុវត្ថិភាព",  sub: "100% protected",    subKm: "ការពារ 100%" },
  { Icon: RefreshCw,   label: "Easy Returns",      labelKm: "ប្ដូរទំនិញងាយ",           sub: "7-day policy",      subKm: "គោលការ ៧ ថ្ងៃ" },
  { Icon: Headphones,  label: "24/7 Support",      labelKm: "គាំទ្រ 24/7",              sub: "Always here for you",subKm: "យើងនៅជាមួយអ្នក" },
];

/* ── Product hero carousel ── */
function HeroCarousel({ userName }: { userName?: string }) {
  const [index, setIndex]     = useState(0);
  const [visible, setVisible] = useState(true);
  const [animDir, setAnimDir] = useState<"l" | "r">("r");
  const [paused, setPaused]   = useState(false);
  const timerRef              = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { addItem }           = useCart();
  const { lang }              = useLangStore();
  const km = lang === "km";

  const { data: products } = useQuery({
    queryKey: ["hero-products"],
    queryFn: async () => {
      const { default: api } = await import("@/lib/axios");
      const res = await api.get("/products", { params: { per_page: 10, sort: "popular" } });
      const list = (res.data.data ?? res.data) as Product[];
      return [...list].sort(() => Math.random() - 0.5).slice(0, 8);
    },
    staleTime: 120_000,
  });

  const items = products ?? [];
  const total = items.length;

  const goTo = useCallback((next: number, dir: "l" | "r" = "r") => {
    if (!total) return;
    setAnimDir(dir);
    setVisible(false);
    setTimeout(() => { setIndex(((next % total) + total) % total); setVisible(true); }, 200);
  }, [total]);

  const nextSlide = useCallback(() => goTo(index + 1, "r"), [index, goTo]);

  useEffect(() => {
    if (paused || !total) return;
    timerRef.current = setTimeout(nextSlide, SLIDE_INTERVAL);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [index, paused, total, nextSlide]);

  if (!total) {
    return (
      <div className="w-full h-[460px] bg-gradient-hero animate-pulse flex items-center justify-center">
        <Package className="w-20 h-20 text-white/10" />
      </div>
    );
  }

  const product = items[index];
  const thumb   = product.images?.[0]?.image_url ?? product.images?.[0]?.url ?? null;
  const stars   = Math.round(product.rating ?? 0);
  const disc    = product.discount_price
    ? Math.round(((product.price - product.discount_price) / product.price) * 100)
    : 0;

  return (
    <section
      className="relative w-full overflow-hidden bg-gradient-hero text-white"
      style={{ minHeight: "460px" }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5"
        style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "32px 32px" }} />

      {/* Decorative circles */}
      <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white/5 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-[#FF6B00]/10 blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 md:px-10 py-10 md:py-14 flex flex-col md:flex-row items-center gap-8 min-h-[460px]">

        {/* Left: Content */}
        <div
          className="flex-1 z-10"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "none" : `translateX(${animDir === "r" ? "-24px" : "24px"})`,
            transition: "opacity 0.2s, transform 0.2s",
          }}
        >
          {userName && (
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 rounded-full px-3 py-1 text-xs font-medium mb-4">
              👋 {km ? `ស្វាគមន៍មកវិញ ${userName}` : `Welcome back, ${userName}`}
            </div>
          )}

          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {product.shop?.name && (
              <span className="text-white/60 text-sm font-medium">{product.shop.name}</span>
            )}
            {disc > 0 && (
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#FF6B00] text-white">
                -{disc}% {km ? "បញ្ចុះ" : "OFF"}
              </span>
            )}
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white/20 text-white">
              {km ? "ពេញនិយម" : "POPULAR"}
            </span>
          </div>

          <h1 className="font-inter text-3xl md:text-5xl font-black leading-tight mb-3 line-clamp-3">
            {product.name}
          </h1>

          <div className="flex items-center gap-2 mb-4">
            <div className="flex">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`w-4 h-4 ${i < stars ? "fill-yellow-400 text-yellow-400" : "text-white/20"}`} />
              ))}
            </div>
            {product.review_count > 0 && (
              <span className="text-white/60 text-sm">({product.review_count})</span>
            )}
          </div>

          <div className="flex items-baseline gap-3 mb-6">
            <span className="font-inter text-4xl font-black text-white">
              {formatCurrency(product.effective_price ?? product.price)}
            </span>
            {product.discount_price && (
              <span className="font-inter text-xl text-white/40 line-through">
                {formatCurrency(product.price)}
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => addItem({ productId: product.id })}
              className="flex items-center gap-2 px-6 py-3 bg-[#FF6B00] hover:bg-[#FF8C42] text-white rounded-xl font-bold text-sm transition shadow-orange"
            >
              <ShoppingCart className="w-4 h-4" />
              {km ? "បន្ថែមក្នុងរទេះ" : "Add to Cart"}
            </button>
            <Link
              href={`/products/${product.slug}`}
              className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur border border-white/20 text-white rounded-xl font-semibold text-sm transition"
            >
              {km ? "មើលលម្អិត" : "View Details"}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="flex gap-5 mt-6">
            <Link href="/products" className="text-white/50 hover:text-white text-xs flex items-center gap-1 transition">
              <Package className="w-3.5 h-3.5" />
              {km ? "ផលិតផលទាំងអស់" : "All Products"}
            </Link>
          </div>
        </div>

        {/* Right: Product image */}
        <div
          className="flex-1 flex items-center justify-center z-10"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "none" : `translateX(${animDir === "r" ? "24px" : "-24px"}) scale(0.96)`,
            transition: "opacity 0.2s, transform 0.2s",
          }}
        >
          <div className="relative w-60 h-60 md:w-[380px] md:h-[380px]">
            <div className="absolute inset-8 rounded-full bg-white/8 blur-2xl" />
            {thumb ? (
              <Image src={thumb} alt={product.name} fill className="object-contain drop-shadow-2xl" priority />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="w-28 h-28 text-white/20" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Slide counter */}
      <div className="absolute top-4 right-16 text-white/40 text-xs font-inter font-bold">
        {index + 1} / {total}
      </div>

      {/* Prev / Next */}
      <button onClick={() => goTo(index - 1, "l")}
        className="absolute left-3 top-1/2 -translate-y-1/2 z-20 p-2.5 bg-white/10 hover:bg-white/20 backdrop-blur border border-white/20 rounded-full transition">
        <ChevronLeft className="w-5 h-5 text-white" />
      </button>
      <button onClick={() => goTo(index + 1, "r")}
        className="absolute right-3 top-1/2 -translate-y-1/2 z-20 p-2.5 bg-white/10 hover:bg-white/20 backdrop-blur border border-white/20 rounded-full transition">
        <ChevronRight className="w-5 h-5 text-white" />
      </button>

      {/* Dot indicators */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
        {items.map((_, i) => (
          <button key={i} onClick={() => goTo(i, i > index ? "r" : "l")}
            className={`rounded-full transition-all duration-300 ${i === index ? "w-6 h-2 bg-[#FF6B00]" : "w-2 h-2 bg-white/30 hover:bg-white/60"}`} />
        ))}
      </div>

      {/* Progress bar */}
      {!paused && (
        <div className="absolute bottom-0 left-0 h-0.5 bg-white/10 w-full z-20">
          <div key={`${index}-p`} className="h-full bg-[#FF6B00]/70" style={{ animation: `slideProgress ${SLIDE_INTERVAL}ms linear forwards` }} />
        </div>
      )}
    </section>
  );
}

/* ── Admin / Vendor banners ── */
function AdminBanner({ name }: { name: string }) {
  return (
    <div className="bg-gradient-hero text-white py-5 px-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm text-white/60">Admin Portal</p>
          <p className="font-bold text-xl font-inter">Welcome back, {name}</p>
        </div>
        <Link href="/admin/dashboard"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-white text-[#0D47A1] rounded-xl font-bold text-sm hover:bg-white/90 transition shadow-lg">
          <LayoutDashboard className="w-4 h-4" /> Go to Dashboard
        </Link>
      </div>
    </div>
  );
}

function VendorBanner({ name }: { name: string }) {
  const { lang } = useLangStore();
  const km = lang === "km";
  return (
    <div className="bg-gradient-to-r from-[#0D47A1]/8 via-blue-50 to-indigo-50 dark:from-[#0D47A1]/15 dark:via-[#1E293B] dark:to-[#1E293B] py-5 px-4 border-b">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm text-muted-foreground">{km ? "ផ្ទាំងអ្នកលក់" : "Vendor Dashboard"}</p>
          <p className="font-bold text-xl font-inter">{km ? `ស្វាគមន៍ ${name}` : `Welcome back, ${name}`}</p>
        </div>
        <div className="flex gap-3">
          <Link href="/vendor/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0D47A1] hover:bg-[#1565C0] text-white rounded-xl font-bold text-sm transition shadow-brand">
            <LayoutDashboard className="w-4 h-4" /> {km ? "ផ្ទាំងរបស់ខ្ញុំ" : "My Dashboard"}
          </Link>
          <Link href="/products"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-card border rounded-xl font-semibold text-sm hover:bg-muted transition">
            <ShoppingBag className="w-4 h-4" /> {km ? "រុករក" : "Browse"}
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ── Trust badges bar ── */
function TrustBar() {
  const { lang } = useLangStore();
  const km = lang === "km";
  return (
    <div className="bg-white dark:bg-[#1E293B] border-b">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {TRUST_BADGES.map(({ Icon, label, labelKm, sub, subKm }) => (
            <div key={label} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#0D47A1]/8 dark:bg-[#0D47A1]/20 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-[#0D47A1]" />
              </div>
              <div>
                <p className="text-xs font-bold">{km ? labelKm : label}</p>
                <p className="text-[10px] text-muted-foreground">{km ? subKm : sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Guest hero ── */
function GuestHero() {
  const { lang } = useLangStore();
  const km = lang === "km";
  return (
    <section className="relative overflow-hidden bg-gradient-hero text-white">
      <div className="absolute inset-0 opacity-5"
        style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "32px 32px" }} />
      <div className="absolute -right-16 -top-16 w-72 h-72 rounded-full bg-white/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 w-80 h-40 bg-[#FF6B00]/10 blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 py-20 md:py-28">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            <span className="w-2 h-2 bg-[#FF6B00] rounded-full animate-pulse" />
            {km ? "ផលិតផលជាង 10,000 ពីហាងដែលបានផ្ទៀងផ្ទាត់" : "10,000+ products from verified shops"}
          </div>
          <h1 className="font-inter text-4xl md:text-6xl font-black leading-tight mb-6">
            {km ? (
              <>
                ស្វែងរកផលិតផល<br />
                <span className="text-[#FF6B00]">ល្អបំផុត</span><br />
                នៅកម្ពុជា
              </>
            ) : (
              <>
                Discover Amazing<br />
                <span className="text-[#FF6B00]">Products</span> From<br />
                Top Vendors
              </>
            )}
          </h1>
          <p className="text-lg text-white/70 mb-8 max-w-lg leading-relaxed">
            {km
              ? "ទិញពីហាងដែលបានផ្ទៀងផ្ទាត់រាប់រយ។ ទទួលបានការដោះស្រាយល្អបំផុត តាមដានការបញ្ជាទិញ និងលក់ជាមួយភាពជឿជាក់។"
              : "Shop from hundreds of verified stores. Get the best deals, track your orders in real-time, and sell with confidence."}
          </p>
          <div className="flex flex-wrap gap-4 mb-12">
            <Link href="/products"
              className="px-8 py-3.5 bg-[#FF6B00] hover:bg-[#FF8C42] text-white rounded-xl font-bold transition shadow-orange">
              {km ? "ទិញឥឡូវ" : "Shop Now"}
            </Link>
            <Link href="/vendor-register"
              className="flex items-center gap-2 px-8 py-3.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl font-semibold transition">
              {km ? "ចាប់ផ្ដើមលក់" : "Start Selling"}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="flex gap-8">
            {[
              { label: km ? "ហាងសកម្ម" : "Active Shops",  value: "500+" },
              { label: km ? "ផលិតផល" : "Products",         value: "10K+" },
              { label: km ? "អ្នកទិញ" : "Happy Buyers",    value: "25K+" },
            ].map((s) => (
              <div key={s.label}>
                <div className="font-inter text-3xl font-black text-[#FF6B00]">{s.value}</div>
                <div className="text-sm text-white/60 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Main export ── */
export default function HeroSection() {
  const { isAuthenticated, user } = useAuthStore();

  if (isAuthenticated && user) {
    if (user.role === "admin")  return <AdminBanner name={user.name} />;
    if (user.role === "vendor") return <VendorBanner name={user.name} />;
    return <HeroCarousel userName={user.name} />;
  }

  return <GuestHero />;
}
