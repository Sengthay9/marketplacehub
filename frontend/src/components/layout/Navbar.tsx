"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, Bell, Search, Menu, User, LogOut, LayoutDashboard, Store, Heart } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { useCartStore } from "@/store/cart.store";
import { useNotificationStore } from "@/store/notification.store";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const { user, isAuthenticated } = useAuthStore();
  const { itemCount, openCart } = useCartStore();
  const { unreadCount } = useNotificationStore();
  const { logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const dashboardLink = user?.role === "admin"
    ? "/admin/dashboard"
    : user?.role === "vendor"
    ? "/vendor/dashboard"
    : "/account";

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">

        {/* Logo */}
        <Link href="/" className="text-xl font-black text-primary shrink-0">
          🛍️ CamCart
        </Link>

        {/* Search */}
        <form
          onSubmit={(e) => { e.preventDefault(); window.location.href = `/products?q=${searchQuery}`; }}
          className="flex-1 max-w-xl hidden md:flex items-center gap-2 bg-muted rounded-full px-4 py-2"
        >
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products, shops..."
            className="flex-1 bg-transparent text-sm focus:outline-none"
          />
        </form>

        {/* Nav Actions */}
        <div className="ml-auto flex items-center gap-2">

          {/* Cart */}
          {isAuthenticated && user?.role === "customer" && (
            <button
              onClick={openCart}
              className="relative p-2 hover:bg-muted rounded-full"
              aria-label="Cart"
            >
              <ShoppingCart className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-[18px] h-[18px] bg-destructive text-white text-[10px] font-bold rounded-full flex items-center justify-center min-w-[18px]">
                  {itemCount}
                </span>
              )}
            </button>
          )}

          {/* Favorites */}
          {isAuthenticated && user?.role === "customer" && (
            <Link href="/wishlist" className="p-2 hover:bg-muted rounded-full" aria-label="Favorites">
              <Heart className="w-5 h-5" />
            </Link>
          )}

          {/* Notifications */}
          {isAuthenticated && (
            <Link href="/notifications" className="relative p-2 hover:bg-muted rounded-full">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-[18px] h-[18px] bg-destructive text-white text-[10px] font-bold rounded-full flex items-center justify-center min-w-[18px]">
                  {unreadCount}
                </span>
              )}
            </Link>
          )}

          {/* User menu */}
          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 p-1.5 rounded-full hover:bg-muted"
              >
                {user?.avatar ? (
                  <Image
                    src={user.avatar}
                    alt={user.name ?? ""}
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-full object-cover border"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                )}
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-card border rounded-xl shadow-lg overflow-hidden z-50">
                  <div className="px-4 py-3 border-b">
                    <p className="font-semibold text-sm">{user?.name}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                  <nav className="p-1">
                    <Link href={dashboardLink} onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted rounded-lg">
                      <LayoutDashboard className="w-4 h-4" /> Dashboard
                    </Link>
                    <button onClick={() => { logout(); setMenuOpen(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-lg">
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </nav>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login" className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-lg">
                Sign In
              </Link>
              <Link href="/register" className="px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
                Get Started
              </Link>
            </div>
          )}

          {/* Mobile menu */}
          <button className="md:hidden p-2 hover:bg-muted rounded-full">
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Category nav */}
      <nav className="border-t bg-background hidden md:block">
        <div className="max-w-7xl mx-auto px-4 h-10 flex items-center gap-6 text-sm">
          {["Electronics", "Fashion", "Home & Living", "Sports", "Books", "Beauty"].map((cat) => (
            <Link
              key={cat}
              href={`/categories/${cat.toLowerCase().replace(/ & /g, "-").replace(/ /g, "-")}`}
              className="text-muted-foreground hover:text-foreground transition"
            >
              {cat}
            </Link>
          ))}
          <Link href="/shops" className="ml-auto text-primary font-medium flex items-center gap-1">
            All Shops <Store className="w-3.5 h-3.5" />
          </Link>
        </div>
      </nav>
    </header>
  );
}
