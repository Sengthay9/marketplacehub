"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Users, Store, Package, Tag, Mail, Settings, List, LogOut, BarChart3 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/auth.store";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin/dashboard",   label: "Dashboard",   icon: LayoutDashboard },
  { href: "/admin/users",       label: "Users",        icon: Users },
  { href: "/admin/vendors",     label: "Vendors",      icon: Store },
  { href: "/admin/products",    label: "Products",     icon: Package },
  { href: "/admin/categories",  label: "Categories",   icon: List },
  { href: "/admin/coupons",     label: "Coupons",      icon: Tag },
  { href: "/admin/analytics",   label: "Analytics",    icon: BarChart3 },
  { href: "/admin/reports",     label: "Mail",         icon: Mail },
  { href: "/admin/settings",    label: "Settings",     icon: Settings },
];

interface Props { children: React.ReactNode; title?: string }

export default function AdminLayout({ children, title }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const { clearAuth, user, isAuthenticated, _hasHydrated } = useAuthStore();

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!isAuthenticated) { router.replace("/login"); return; }
    if (user?.role !== "admin") {
      router.replace(user?.role === "vendor" ? "/vendor/dashboard" : "/");
    }
  }, [_hasHydrated, isAuthenticated, user?.role, router]);

  const logoutMutation = useMutation({
    mutationFn: () => api.post("/auth/logout"),
    onSuccess: () => {
      clearAuth();
      toast.success("Signed out.");
      router.push("/login");
    },
  });

  return (
    <div className="h-screen flex overflow-hidden">
      <aside className="w-60 shrink-0 border-r bg-slate-900 dark:bg-slate-950 text-white hidden md:flex flex-col h-full">
        <div className="p-5 border-b border-white/10 shrink-0">
          <Link href="/" className="text-lg font-black">
            🛍️ MarketplaceHub
          </Link>
          <p className="text-xs text-white/40 mt-1">Admin Portal</p>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition",
                pathname === item.href || pathname.startsWith(item.href + "/")
                  ? "bg-white/15 text-white"
                  : "text-white/60 hover:bg-white/10 hover:text-white"
              )}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-white/10 shrink-0">
          <button
            onClick={() => logoutMutation.mutate()}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-white/10 transition"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            Sign Out
          </button>
        </div>
      </aside>
      <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden">
        <header className="border-b px-6 py-4 bg-background shrink-0">
          <h1 className="font-bold text-xl">{title}</h1>
        </header>
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
}
