"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Users, Store, Package, Tag, Mail, Settings, List, LogOut, Wallet } from "lucide-react";
import SiteLogo from "@/components/SiteLogo";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/auth.store";
import { useT } from "@/hooks/useT";
import { cn } from "@/lib/utils";

const navDefs = [
  { href: "/admin/dashboard",  labelKey: "nav_dashboard"  as const, icon: LayoutDashboard, badgeKey: null },
  { href: "/admin/payouts",    labelKey: "nav_payouts"    as const, icon: Wallet,          badgeKey: "pending_payouts" },
  { href: "/admin/vendors",    labelKey: "nav_vendors"    as const, icon: Store,           badgeKey: "pending_vendors" },
  { href: "/admin/users",      labelKey: "nav_users"      as const, icon: Users,           badgeKey: null },
  { href: "/admin/products",   labelKey: "nav_products"   as const, icon: Package,         badgeKey: null },
  { href: "/admin/categories", labelKey: "nav_categories" as const, icon: List,            badgeKey: null },
  { href: "/admin/coupons",    labelKey: "nav_coupons"    as const, icon: Tag,             badgeKey: null },
  { href: "/admin/reports",    labelKey: "nav_mail"       as const, icon: Mail,            badgeKey: null },
  { href: "/admin/settings",   labelKey: "nav_settings"   as const, icon: Settings,        badgeKey: null },
];

interface Props { children: React.ReactNode; title?: string; }

export default function AdminLayout({ children, title }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const { clearAuth, user, isAuthenticated, _hasHydrated } = useAuthStore();
  const T = useT();

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!isAuthenticated) { router.replace("/login"); return; }
    if (user?.role !== "admin") {
      router.replace(user?.role === "vendor" ? "/vendor/dashboard" : "/");
    }
  }, [_hasHydrated, isAuthenticated, user?.role, router]);

  const { data: badges } = useQuery<{ pending_vendors: number; pending_payouts: number }>({
    queryKey: ["admin-badges"],
    queryFn: async () => (await api.get("/admin/analytics/badges")).data,
    refetchInterval: 30_000,
    enabled: isAuthenticated && user?.role === "admin",
  });

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
      <aside className="w-52 shrink-0 border-r bg-slate-900 dark:bg-slate-950 text-white hidden md:flex flex-col h-full">
        <div className="p-5 border-b border-white/10 shrink-0">
          <Link href="/">
            <SiteLogo size={36} textClassName="text-lg" />
          </Link>
          <p className="text-xs text-white/40 mt-1">{T("nav_admin_portal")}</p>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navDefs.map((item) => {
            const hasBadge = item.badgeKey
              ? (badges?.[item.badgeKey as keyof typeof badges] ?? 0) > 0
              : false;
            return (
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
                <div className="relative shrink-0">
                  <item.icon className="w-4 h-4" />
                  {hasBadge && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
                  )}
                </div>
                {T(item.labelKey)}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-white/10 shrink-0">
          <button
            onClick={() => logoutMutation.mutate()}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-white/10 transition"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {T("nav_sign_out")}
          </button>
        </div>
      </aside>
      <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden">
        {title && (
          <header className="border-b px-6 py-4 bg-background shrink-0">
            <h1 className="font-bold text-xl">{title}</h1>
          </header>
        )}
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  );
}
