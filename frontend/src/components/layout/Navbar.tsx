"use client";

import Link from "next/link";
import Image from "next/image";
import SiteLogo from "@/components/SiteLogo";
import {
  ShoppingCart, Bell, Search, Menu, User, LogOut,
  LayoutDashboard, Store, Heart, MessageSquare,
  Sun, Moon, Monitor, ChevronDown, X, Package,
  Zap, Shirt, Home, Dumbbell, BookOpen, Sparkles,
  Smartphone, Car, ChevronRight, Globe,
} from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { useCartStore } from "@/store/cart.store";
import { useNotificationStore } from "@/store/notification.store";
import { useLangStore } from "@/store/lang.store";
import { useAuth } from "@/hooks/useAuth";
import { useState, useRef, useEffect } from "react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import type { Lang } from "@/lib/i18n";

/* ── Mega menu categories ── */
const MEGA_CATEGORIES = [
  { label: "Electronics",      labelKm: "អេឡិចត្រូនិច",    icon: Zap,         slug: "electronics",    color: "text-blue-600 bg-blue-50 dark:bg-blue-950 dark:text-blue-300" },
  { label: "Fashion",          labelKm: "សម្លៀកបំពាក់",    icon: Shirt,       slug: "fashion",        color: "text-pink-600 bg-pink-50 dark:bg-pink-950 dark:text-pink-300" },
  { label: "Home & Living",    labelKm: "ផ្ទះ & ការរស់នៅ",  icon: Home,        slug: "home-living",    color: "text-green-600 bg-green-50 dark:bg-green-950 dark:text-green-300" },
  { label: "Sports",           labelKm: "កីឡា",             icon: Dumbbell,    slug: "sports",         color: "text-orange-600 bg-orange-50 dark:bg-orange-950 dark:text-orange-300" },
  { label: "Books",            labelKm: "សៀវភៅ",            icon: BookOpen,    slug: "books",          color: "text-amber-600 bg-amber-50 dark:bg-amber-950 dark:text-amber-300" },
  { label: "Beauty & Health",  labelKm: "សម្ផស្ស & សុខភាព", icon: Sparkles,    slug: "beauty-health",  color: "text-rose-600 bg-rose-50 dark:bg-rose-950 dark:text-rose-300" },
  { label: "Smartphones",      labelKm: "ទូរស័ព្ទ",          icon: Smartphone,  slug: "smartphones",    color: "text-sky-600 bg-sky-50 dark:bg-sky-950 dark:text-sky-300" },
  { label: "Automotive",       labelKm: "យានយន្ត",           icon: Car,         slug: "automotive",     color: "text-gray-600 bg-gray-50 dark:bg-gray-900 dark:text-gray-300" },
];

/* ── Theme cycle ── */
const THEMES = [
  { value: "light",  Icon: Sun,     label: "Light" },
  { value: "dark",   Icon: Moon,    label: "Dark" },
  { value: "system", Icon: Monitor, label: "System" },
] as const;

export default function Navbar() {
  const { user, isAuthenticated } = useAuthStore();
  const { itemCount, openCart }   = useCartStore();
  const { unreadCount }           = useNotificationStore();
  const { logout }                = useAuth();
  const { theme, setTheme }       = useTheme();
  const { lang, setLang }         = useLangStore();
  const km = lang === "km";

  const [menuOpen, setMenuOpen]   = useState(false);
  const [megaOpen, setMegaOpen]   = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const megaRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const megaCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMegaEnter = () => {
    if (megaCloseTimer.current) clearTimeout(megaCloseTimer.current);
    setMegaOpen(true);
  };
  const handleMegaLeave = () => {
    megaCloseTimer.current = setTimeout(() => setMegaOpen(false), 120);
  };

  const dashboardLink = user?.role === "admin" ? "/admin/dashboard"
                      : user?.role === "vendor" ? "/vendor/dashboard"
                      : "/account";

  const cycleTheme = () => {
    const idx = THEMES.findIndex((t) => t.value === theme);
    const next = THEMES[(idx + 1) % THEMES.length];
    setTheme(next.value);
  };

  const ThemeIcon = THEMES.find((t) => t.value === theme)?.Icon ?? Sun;

  /* Close mega on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (megaRef.current && !megaRef.current.contains(e.target as Node)) setMegaOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* ── Top bar ── */}
      <div className="bg-[#0D47A1] dark:bg-[#0a3a8a] text-white text-xs">
        <div className="max-w-7xl mx-auto px-4 h-8 flex items-center justify-between">
          <span className="hidden md:block opacity-80">
            {km ? "ទីផ្សារអនឡាញលេខ១របស់កម្ពុជា" : "Cambodia's #1 Online Marketplace"}
          </span>
          <div className="flex items-center gap-4 ml-auto">
            <Link href="/vendor-register" className="opacity-80 hover:opacity-100 transition">
              {km ? "លក់ជាមួយយើង" : "Sell on CamCart"}
            </Link>
            <span className="opacity-30">|</span>
            <Link href="/about" className="opacity-80 hover:opacity-100 transition">
              {km ? "អំពីយើង" : "About"}
            </Link>
            <span className="opacity-30">|</span>
            <Link href="/contact" className="opacity-80 hover:opacity-100 transition">
              {km ? "ទំនាក់ទំនង" : "Contact"}
            </Link>
          </div>
        </div>
      </div>

      {/* ── Main navbar ── */}
      <div className="bg-white dark:bg-[#0F172A] shadow-nav border-b border-border">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-3">

          {/* Logo */}
          <Link href="/" className="shrink-0 mr-2">
            <SiteLogo size={38} />
          </Link>

          {/* Search */}
          <form
            onSubmit={(e) => { e.preventDefault(); if (searchQuery.trim()) window.location.href = `/products?q=${encodeURIComponent(searchQuery)}`; }}
            className="flex-1 max-w-2xl hidden md:flex items-center gap-2 bg-[#F8FAFC] dark:bg-[#1E293B] border border-border rounded-xl px-4 py-2.5 focus-within:ring-2 focus-within:ring-[#0D47A1] focus-within:border-[#0D47A1] transition"
          >
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              ref={searchRef}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={km ? "ស្វែងរកផលិតផល, ហាង..." : "Search products, shops..."}
              className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground"
            />
            {searchQuery && (
              <button type="button" onClick={() => setSearchQuery("")} className="text-muted-foreground hover:text-foreground">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="submit"
              className="px-3 py-1 bg-[#0D47A1] hover:bg-[#1565C0] text-white text-xs font-semibold rounded-lg transition"
            >
              {km ? "ស្វែងរក" : "Search"}
            </button>
          </form>

          {/* Right actions */}
          <div className="ml-auto flex items-center gap-1">

            {/* Language toggle */}
            <button
              onClick={() => setLang(lang === "en" ? "km" : ("en" as Lang))}
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition"
              title="Switch language"
            >
              <Globe className="w-3.5 h-3.5" />
              {lang === "en" ? "EN" : "ខ្មែរ"}
            </button>

            {/* Theme toggle */}
            <button
              onClick={cycleTheme}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition"
              title={`Theme: ${theme}`}
            >
              <ThemeIcon className="w-4.5 h-4.5 w-[18px] h-[18px]" />
            </button>

            {/* Cart */}
            {(isAuthenticated && user?.role === "customer") || !isAuthenticated ? (
              <button
                onClick={isAuthenticated ? openCart : () => window.location.href = "/login"}
                className="relative p-2 hover:bg-muted rounded-full transition"
                aria-label="Cart"
              >
                <ShoppingCart className="w-5 h-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-[#FF6B00] text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                    {itemCount > 99 ? "99+" : itemCount}
                  </span>
                )}
              </button>
            ) : null}

            {/* Wishlist */}
            {isAuthenticated && user?.role === "customer" && (
              <Link href="/wishlist" className="p-2 hover:bg-muted rounded-full transition" aria-label="Wishlist">
                <Heart className="w-5 h-5" />
              </Link>
            )}

            {/* Notifications */}
            {isAuthenticated && (
              <Link href="/notifications" className="relative p-2 hover:bg-muted rounded-full transition">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-destructive text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>
            )}

            {/* User menu */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-muted transition"
                >
                  {user?.avatar ? (
                    <Image src={user.avatar} alt={user.name ?? ""} width={30} height={30} className="w-8 h-8 rounded-full object-cover border-2 border-primary/20" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[#0D47A1]/10 flex items-center justify-center border-2 border-[#0D47A1]/20">
                      <User className="w-4 h-4 text-[#0D47A1]" />
                    </div>
                  )}
                  <div className="hidden md:block text-left">
                    <p className="text-xs font-semibold leading-none">{user?.name?.split(" ")[0]}</p>
                    <p className="text-[10px] text-muted-foreground capitalize">{user?.role}</p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground hidden md:block" />
                </button>

                {menuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-card border rounded-2xl shadow-card-hover overflow-hidden z-50 animate-fade-in-up">
                    <div className="px-4 py-3 bg-[#0D47A1] text-white rounded-t-2xl">
                      <p className="font-bold text-sm">{user?.name}</p>
                      <p className="text-xs opacity-70">{user?.email}</p>
                    </div>
                    <nav className="p-2">
                      <Link href={dashboardLink} onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-muted rounded-xl transition">
                        <LayoutDashboard className="w-4 h-4 text-primary" /> {km ? "ផ្ទាំងគ្រប់គ្រង" : "Dashboard"}
                      </Link>
                      {user?.role === "customer" && (
                        <Link href="/support" onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-muted rounded-xl transition">
                          <MessageSquare className="w-4 h-4 text-muted-foreground" /> {km ? "ជំនួយ" : "Support"}
                        </Link>
                      )}
                      <button onClick={() => { logout(); setMenuOpen(false); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-destructive hover:bg-destructive/10 rounded-xl transition">
                        <LogOut className="w-4 h-4" /> {km ? "ចាកចេញ" : "Sign Out"}
                      </button>
                    </nav>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login"
                  className="hidden md:block px-4 py-2 text-sm font-semibold text-[#0D47A1] dark:text-white hover:bg-muted rounded-xl transition">
                  {km ? "ចូល" : "Sign In"}
                </Link>
                <Link href="/register"
                  className="px-4 py-2 text-sm font-bold bg-[#0D47A1] hover:bg-[#1565C0] text-white rounded-xl transition shadow-brand">
                  {km ? "ចាប់ផ្ដើម" : "Get Started"}
                </Link>
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 hover:bg-muted rounded-full transition ml-1"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Category bar with mega menu ── */}
      <div
        ref={megaRef}
        className="hidden md:block bg-white dark:bg-[#0F172A] border-b border-border relative"
        onMouseEnter={handleMegaEnter}
        onMouseLeave={handleMegaLeave}
      >
        <div className="max-w-7xl mx-auto px-4 h-10 flex items-center gap-1">

          {/* All Categories mega trigger */}
          <button
            onClick={() => setMegaOpen(!megaOpen)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-lg transition",
              megaOpen
                ? "bg-[#0D47A1] text-white"
                : "text-foreground hover:bg-muted"
            )}
          >
            <Menu className="w-4 h-4" />
            {km ? "ប្រភេទទាំងអស់" : "All Categories"}
            <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", megaOpen && "rotate-180")} />
          </button>

          <div className="w-px h-5 bg-border mx-1" />

          {/* Quick category links */}
          {["Electronics", "Fashion", "Home & Living", "Sports", "Beauty & Health"].map((cat) => (
            <Link
              key={cat}
              href={`/categories/${cat.toLowerCase().replace(/ & /g, "-").replace(/ /g, "-")}`}
              className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition whitespace-nowrap"
            >
              {km ? MEGA_CATEGORIES.find(c => c.label === cat)?.labelKm ?? cat : cat}
            </Link>
          ))}

          <Link href="/shops" className="ml-auto flex items-center gap-1.5 text-sm font-semibold text-[#0D47A1] dark:text-blue-400 hover:underline transition">
            <Store className="w-4 h-4" />
            {km ? "ហាងទាំងអស់" : "All Shops"}
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* ── Mega menu dropdown ── */}
        {megaOpen && (
          <div
            onMouseEnter={handleMegaEnter}
            onMouseLeave={handleMegaLeave}
            className="absolute top-full left-0 right-0 bg-card border-b border-border shadow-card-hover z-40 animate-fade-in-up"
          >
            <div className="max-w-7xl mx-auto px-4 py-6">
              <div className="grid grid-cols-4 gap-3">
                {MEGA_CATEGORIES.map((cat) => (
                  <Link
                    key={cat.slug}
                    href={`/categories/${cat.slug}`}
                    onClick={() => setMegaOpen(false)}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition group"
                  >
                    <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", cat.color)}>
                      <cat.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold group-hover:text-primary transition">
                        {km ? cat.labelKm : cat.label}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{km ? cat.label : cat.labelKm}</p>
                    </div>
                  </Link>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t flex items-center gap-4">
                <Link href="/categories" onClick={() => setMegaOpen(false)}
                  className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
                  <Package className="w-4 h-4" />
                  {km ? "មើលប្រភេទទាំងអស់" : "View All Categories"}
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
                <Link href="/products?featured=true" onClick={() => setMegaOpen(false)}
                  className="flex items-center gap-1.5 text-sm font-semibold text-[#FF6B00] hover:underline">
                  <Sparkles className="w-4 h-4" />
                  {km ? "ផលិតផលពិសេស" : "Featured Products"}
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Mobile menu drawer ── */}
      {mobileOpen && (
        <div className="md:hidden bg-card border-b shadow-card-hover animate-fade-in-up">
          {/* Mobile search */}
          <form
            onSubmit={(e) => { e.preventDefault(); if (searchQuery.trim()) { window.location.href = `/products?q=${encodeURIComponent(searchQuery)}`; setMobileOpen(false); }}}
            className="flex items-center gap-2 m-3 bg-muted rounded-xl px-3 py-2.5"
          >
            <Search className="w-4 h-4 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={km ? "ស្វែងរក..." : "Search..."}
              className="flex-1 bg-transparent text-sm focus:outline-none"
            />
          </form>

          <nav className="px-3 pb-3 space-y-1">
            {/* Auth links */}
            {!isAuthenticated && (
              <div className="flex gap-2 mb-2">
                <Link href="/login" onClick={() => setMobileOpen(false)}
                  className="flex-1 text-center py-2.5 text-sm font-semibold border rounded-xl hover:bg-muted transition">
                  {km ? "ចូល" : "Sign In"}
                </Link>
                <Link href="/register" onClick={() => setMobileOpen(false)}
                  className="flex-1 text-center py-2.5 text-sm font-bold bg-[#0D47A1] text-white rounded-xl hover:bg-[#1565C0] transition">
                  {km ? "ចុះឈ្មោះ" : "Register"}
                </Link>
              </div>
            )}

            {/* Categories */}
            <p className="text-xs font-bold text-muted-foreground px-2 pt-1 pb-1 uppercase tracking-wider">
              {km ? "ប្រភេទ" : "Categories"}
            </p>
            {MEGA_CATEGORIES.map((cat) => (
              <Link key={cat.slug} href={`/categories/${cat.slug}`} onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition text-sm">
                <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0", cat.color)}>
                  <cat.icon className="w-4 h-4" />
                </div>
                {km ? cat.labelKm : cat.label}
              </Link>
            ))}

            <div className="border-t my-2" />

            {/* Language + Theme */}
            <div className="flex items-center gap-2 px-2">
              <button onClick={() => setLang(lang === "en" ? "km" : ("en" as Lang))}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold border rounded-xl hover:bg-muted transition">
                <Globe className="w-4 h-4" />
                {lang === "en" ? "ខ្មែរ" : "English"}
              </button>
              <button onClick={cycleTheme}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold border rounded-xl hover:bg-muted transition">
                <ThemeIcon className="w-4 h-4" />
                {theme === "light" ? (km ? "ភ្លឺ" : "Light") : theme === "dark" ? (km ? "ងងឹត" : "Dark") : (km ? "ប្រព័ន្ធ" : "System")}
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
