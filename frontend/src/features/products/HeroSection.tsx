"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight, LayoutDashboard, ShoppingBag, Package,
  Star, ShoppingCart, ChevronLeft, ChevronRight,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth.store";
import { useCart } from "@/hooks/useCart";
import { formatCurrency } from "@/lib/utils";
import type { Product } from "@/types";

const SLIDE_INTERVAL = 15000;

// Gradient palettes that rotate per slide
const PALETTES = [
  { bg: "from-slate-900 to-blue-950",     accent: "bg-blue-500/20",   badge: "bg-blue-500" },
  { bg: "from-emerald-950 to-teal-900",   accent: "bg-emerald-500/20",badge: "bg-emerald-500" },
  { bg: "from-violet-950 to-purple-900",  accent: "bg-violet-500/20", badge: "bg-violet-500" },
  { bg: "from-rose-950 to-pink-900",      accent: "bg-rose-500/20",   badge: "bg-rose-500" },
  { bg: "from-amber-950 to-orange-900",   accent: "bg-amber-500/20",  badge: "bg-amber-500" },
  { bg: "from-cyan-950 to-sky-900",       accent: "bg-cyan-500/20",   badge: "bg-cyan-500" },
];

// ─── Hero Carousel ───────────────────────────────────────────────────────────
function HeroCarousel({ userName }: { userName?: string }) {
  const [index, setIndex]         = useState(0);
  const [paused, setPaused]       = useState(false);
  const [animDir, setAnimDir]     = useState<"left" | "right">("right");
  const [visible, setVisible]     = useState(true);
  const timerRef                  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { addItem, isLoading: cartLoading } = useCart();

  const { data: products, isLoading } = useQuery({
    queryKey: ["hero-products"],
    queryFn: async () => {
      const { default: api } = await import("@/lib/axios");
      const res = await api.get("/products", { params: { per_page: 10, sort: "popular" } });
      const list = (res.data.data ?? res.data) as Product[];
      // Shuffle to randomise shop variety
      return [...list].sort(() => Math.random() - 0.5).slice(0, 8);
    },
    staleTime: 120_000,
  });

  const items = products ?? [];
  const total = items.length;

  const goTo = useCallback((next: number, dir: "left" | "right" = "right") => {
    if (total === 0) return;
    setAnimDir(dir);
    setVisible(false);
    setTimeout(() => {
      setIndex(((next % total) + total) % total);
      setVisible(true);
    }, 220);
  }, [total]);

  const prev = () => goTo(index - 1, "left");
  const next = useCallback(() => goTo(index + 1, "right"), [index, goTo]);

  // Auto-advance
  useEffect(() => {
    if (paused || total === 0) return;
    timerRef.current = setTimeout(next, SLIDE_INTERVAL);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [index, paused, total, next]);

  if (isLoading || total === 0) {
    return (
      <div className="w-full h-[420px] md:h-[520px] bg-slate-900 animate-pulse flex items-center justify-center">
        <Package className="w-16 h-16 text-white/10" />
      </div>
    );
  }

  const product  = items[index];
  const palette  = PALETTES[index % PALETTES.length];
  const thumb    = product.images?.[0]?.image_url ?? product.images?.[0]?.url ?? null;
  const stars    = Math.round(product.rating ?? 0);

  return (
    <section
      className={`relative w-full overflow-hidden bg-gradient-to-br ${palette.bg} text-white`}
      style={{ minHeight: "480px" }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Decorative blobs */}
      <div className={`absolute -top-24 -right-24 w-96 h-96 rounded-full blur-3xl opacity-30 ${palette.accent}`} />
      <div className={`absolute -bottom-24 -left-24 w-72 h-72 rounded-full blur-3xl opacity-20 ${palette.accent}`} />

      <div className="relative max-w-7xl mx-auto px-6 md:px-12 py-10 md:py-16 flex flex-col md:flex-row items-center gap-8 h-full">

        {/* ── Left: Text content ── */}
        <div
          className="flex-1 z-10 transition-all duration-300"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible
              ? "translateX(0)"
              : animDir === "right" ? "translateX(-32px)" : "translateX(32px)",
          }}
        >
          {/* Welcome tag */}
          {userName && (
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-3 py-1 text-xs font-medium mb-4">
              👋 Welcome back, {userName}
            </div>
          )}

          {/* Shop + badge */}
          <div className="flex items-center gap-2 mb-3">
            {product.shop?.name && (
              <span className="text-white/60 text-sm">{product.shop.name}</span>
            )}
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full text-white ${palette.badge}`}>
              POPULAR
            </span>
          </div>

          {/* Product name */}
          <h1 className="text-3xl md:text-5xl font-black leading-tight mb-3 line-clamp-3">
            {product.name}
          </h1>

          {/* Stars */}
          <div className="flex items-center gap-1.5 mb-4">
            <div className="flex">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`w-4 h-4 ${i < stars ? "fill-yellow-400 text-yellow-400" : "text-white/20"}`} />
              ))}
            </div>
            {product.review_count > 0 && (
              <span className="text-white/60 text-sm">({product.review_count} reviews)</span>
            )}
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3 mb-6">
            <span className="text-4xl font-black">
              {formatCurrency(product.effective_price ?? product.price)}
            </span>
            {product.discount_price && (
              <span className="text-white/40 text-lg line-through">
                {formatCurrency(product.price)}
              </span>
            )}
          </div>

          {/* CTA buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => addItem({ productId: product.id })}
              disabled={cartLoading}
              className="flex items-center gap-2 px-6 py-3 bg-white text-slate-900 rounded-full font-bold text-sm hover:bg-white/90 transition shadow-lg disabled:opacity-60"
            >
              <ShoppingCart className="w-4 h-4" /> Add to Cart
            </button>
            <Link
              href={`/products/${product.slug}`}
              className="flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full font-semibold text-sm hover:bg-white/20 transition"
            >
              View Details <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Quick links */}
          <div className="flex gap-4 mt-6">
            <Link href="/products" className="text-white/50 hover:text-white text-xs flex items-center gap-1 transition">
              <Package className="w-3.5 h-3.5" /> All Products
            </Link>
            <Link href="/orders" className="text-white/50 hover:text-white text-xs flex items-center gap-1 transition">
              My Orders <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* ── Right: Product image ── */}
        <div
          className="flex-1 flex items-center justify-center z-10 transition-all duration-300"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible
              ? "translateX(0) scale(1)"
              : animDir === "right" ? "translateX(32px) scale(0.95)" : "translateX(-32px) scale(0.95)",
          }}
        >
          <div className="relative w-64 h-64 md:w-96 md:h-96">
            {/* Glow behind image */}
            <div className={`absolute inset-8 rounded-full blur-2xl opacity-40 ${palette.accent}`} />
            {thumb ? (
              <Image
                src={thumb}
                alt={product.name}
                fill
                className="object-contain drop-shadow-2xl"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="w-32 h-32 text-white/20" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Prev / Next arrows ── */}
      <button
        onClick={prev}
        className="absolute left-3 top-1/2 -translate-y-1/2 z-20 p-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-full transition"
        aria-label="Previous"
      >
        <ChevronLeft className="w-5 h-5 text-white" />
      </button>
      <button
        onClick={next}
        className="absolute right-3 top-1/2 -translate-y-1/2 z-20 p-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-full transition"
        aria-label="Next"
      >
        <ChevronRight className="w-5 h-5 text-white" />
      </button>

      {/* ── Dot indicators ── */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
        {items.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i, i > index ? "right" : "left")}
            className={`rounded-full transition-all duration-300 ${
              i === index ? "w-6 h-2 bg-white" : "w-2 h-2 bg-white/30 hover:bg-white/60"
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>

      {/* ── Progress bar ── */}
      {!paused && (
        <div className="absolute bottom-0 left-0 h-0.5 bg-white/20 w-full z-20">
          <div
            key={`${index}-progress`}
            className="h-full bg-white/70"
            style={{
              animation: `slideProgress ${SLIDE_INTERVAL}ms linear forwards`,
            }}
          />
        </div>
      )}

      <style jsx>{`
        @keyframes slideProgress {
          from { width: 0%; }
          to   { width: 100%; }
        }
      `}</style>
    </section>
  );
}

// ─── Admin / Vendor banners ───────────────────────────────────────────────────
function AdminBanner({ name }: { name: string }) {
  return (
    <div className="bg-slate-900 text-white py-5 px-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm text-white/50">Admin Portal</p>
          <p className="font-bold text-lg">Welcome back, {name}</p>
        </div>
        <Link href="/admin/dashboard"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-slate-900 rounded-full font-semibold text-sm hover:bg-white/90 transition">
          <LayoutDashboard className="w-4 h-4" /> Go to Dashboard
        </Link>
      </div>
    </div>
  );
}

function VendorBanner({ name }: { name: string }) {
  return (
    <div className="bg-gradient-to-r from-primary/10 via-blue-50 to-indigo-50 dark:from-primary/10 dark:via-slate-900 dark:to-slate-900 py-5 px-4 border-b">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm text-muted-foreground">Vendor Dashboard</p>
          <p className="font-bold text-lg">Welcome back, {name}</p>
        </div>
        <div className="flex gap-3">
          <Link href="/vendor/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-full font-semibold text-sm hover:bg-primary/90 transition">
            <LayoutDashboard className="w-4 h-4" /> My Dashboard
          </Link>
          <Link href="/products"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-800 border rounded-full font-semibold text-sm hover:bg-muted transition">
            <ShoppingBag className="w-4 h-4" /> Browse
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function HeroSection() {
  const { isAuthenticated, user } = useAuthStore();

  if (isAuthenticated && user) {
    if (user.role === "admin")  return <AdminBanner  name={user.name} />;
    if (user.role === "vendor") return <VendorBanner name={user.name} />;
    // Customer: full carousel with welcome
    return <HeroCarousel userName={user.name} />;
  }

  // Guest: original hero with Shop Now + Start Selling
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-blue-50 to-indigo-50 dark:from-primary/5 dark:via-slate-900 dark:to-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-20 md:py-28">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            10,000+ products from verified shops
          </div>
          <h1 className="text-4xl md:text-6xl font-black leading-tight mb-6">
            Discover Amazing<br />
            <span className="text-primary">Products</span> From<br />
            Top Vendors
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-lg">
            Shop from hundreds of verified stores. Get the best deals, track your orders in real-time, and sell with confidence.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/products"
              className="px-8 py-3 bg-primary text-white rounded-full font-semibold hover:bg-primary/90 transition shadow-lg shadow-primary/20">
              Shop Now
            </Link>
            <Link href="/vendor-register"
              className="px-8 py-3 bg-white dark:bg-slate-800 border rounded-full font-semibold hover:bg-muted transition">
              Start Selling <ArrowRight className="inline w-4 h-4" />
            </Link>
          </div>
          <div className="flex gap-8 mt-12">
            {[
              { label: "Active Shops", value: "500+" },
              { label: "Products",     value: "10K+" },
              { label: "Happy Buyers", value: "25K+" },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-2xl font-black text-primary">{s.value}</div>
                <div className="text-sm text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="absolute -right-20 -top-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute -right-10 top-1/2 w-64 h-64 bg-indigo-500/5 rounded-full blur-2xl" />
    </section>
  );
}
