"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Package, Boxes, Tag, Star, Store, Settings, LogOut, Bell, MessageSquare, Wallet } from "lucide-react";
import SiteLogo from "@/components/SiteLogo";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/auth.store";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/vendor/dashboard",      label: "Dashboard",      icon: LayoutDashboard },
  { href: "/vendor/payouts",        label: "Orders & Payouts", icon: Wallet },
  { href: "/vendor/shop",           label: "My Shop",         icon: Store },
  { href: "/vendor/products",       label: "Products",        icon: Package },
  { href: "/vendor/inventory",      label: "Inventory",       icon: Boxes },
  { href: "/vendor/coupons",        label: "Coupons",         icon: Tag },
  { href: "/vendor/reviews",        label: "Reviews",         icon: Star },
  { href: "/vendor/notifications",  label: "Notifications",   icon: Bell },
  { href: "/vendor/support",        label: "Contact Admin",   icon: MessageSquare },
  { href: "/vendor/settings",       label: "Settings",        icon: Settings },
];

interface Props { children: React.ReactNode; title?: string }

export default function VendorLayout({ children, title }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const { clearAuth, user, isAuthenticated, _hasHydrated } = useAuthStore();

  const { data: notifData } = useQuery({
    queryKey: ["vendor-notification-count"],
    queryFn: async () => (await api.get("/notifications")).data,
    refetchInterval: 30000,
    enabled: isAuthenticated && user?.role === "vendor",
  });
  const unreadCount = notifData?.unread_count ?? 0;

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!isAuthenticated) { router.replace("/login"); return; }
    if (user?.role !== "vendor") {
      router.replace(user?.role === "admin" ? "/admin/dashboard" : "/");
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
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-60 fixed top-0 left-0 h-screen border-r bg-card hidden md:flex flex-col z-20">
        <div className="p-5 border-b">
          <Link href="/">
            <SiteLogo size={36} textClassName="text-lg text-primary" />
          </Link>
          <p className="text-xs text-muted-foreground mt-1">Vendor Portal</p>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isNotif = item.href === "/vendor/notifications";
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition",
                  pathname === item.href || pathname.startsWith(item.href + "/")
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                <span className="flex-1">{item.label}</span>
                {isNotif && unreadCount > 0 && (
                  <span className="min-w-[20px] h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sign out at bottom */}
        <div className="p-3 border-t">
          <button
            onClick={() => logoutMutation.mutate()}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0 md:ml-60">
        <header className="border-b px-6 py-4 bg-background sticky top-0 z-10 flex items-center justify-between">
          <h1 className="font-bold text-xl">{title}</h1>
          {/* Mobile sign out */}
          <button
            onClick={() => logoutMutation.mutate()}
            className="md:hidden flex items-center gap-2 text-sm text-red-600 font-medium"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </header>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
