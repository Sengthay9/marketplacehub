"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { User, Package, Settings, LogOut, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/auth.store";
import { formatCurrency, formatDate, getOrderStatusColor } from "@/lib/utils";

type Tab = "profile" | "orders" | "settings";

export default function CustomerAccount() {
  const router = useRouter();
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("profile");
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: "", phone: "" });
  const [pwForm, setPwForm] = useState({ current_password: "", password: "", password_confirmation: "" });

  const { data: me } = useQuery({
    queryKey: ["customer-me"],
    queryFn: async () => (await api.get("/auth/me")).data.user,
  });

  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ["customer-orders"],
    queryFn: async () => (await api.get("/customer/orders")).data.data,
    enabled: tab === "orders",
  });

  const updateProfileMutation = useMutation({
    mutationFn: (d: typeof profileForm) => api.put("/me/profile", d),
    onSuccess: () => {
      toast.success("Profile updated!");
      setEditingProfile(false);
      qc.invalidateQueries({ queryKey: ["customer-me"] });
    },
    onError: () => toast.error("Failed to update profile."),
  });

  const changePwMutation = useMutation({
    mutationFn: (d: typeof pwForm) => api.put("/me/profile", d),
    onSuccess: () => {
      toast.success("Password changed!");
      setPwForm({ current_password: "", password: "", password_confirmation: "" });
    },
    onError: () => toast.error("Incorrect current password or validation failed."),
  });

  const logoutMutation = useMutation({
    mutationFn: () => api.post("/auth/logout"),
    onSuccess: () => {
      clearAuth();
      toast.success("Signed out.");
      router.push("/login");
    },
  });

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: "profile", label: "Profile", icon: User },
    { key: "orders",  label: "My Orders", icon: Package },
    { key: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border">
          {me?.avatar
            ? <Image src={me.avatar} alt={me.name} width={64} height={64} className="object-cover w-full h-full" />
            : <User className="w-8 h-8 text-primary/60" />
          }
        </div>
        <div>
          <h1 className="text-2xl font-bold">{me?.name ?? "My Account"}</h1>
          <p className="text-muted-foreground text-sm">{me?.email}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b mb-8">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition -mb-px ${
              tab === key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Profile tab */}
      {tab === "profile" && (
        <div className="bg-card border rounded-2xl p-6 max-w-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Personal Info</h2>
            {!editingProfile && (
              <button
                onClick={() => { setProfileForm({ name: me?.name ?? "", phone: me?.phone ?? "" }); setEditingProfile(true); }}
                className="text-sm text-primary hover:underline"
              >
                Edit
              </button>
            )}
          </div>
          {editingProfile ? (
            <form onSubmit={(e) => { e.preventDefault(); updateProfileMutation.mutate(profileForm); }} className="space-y-3">
              {([ ["name", "Full Name", "text"], ["phone", "Phone", "tel"] ] as const).map(([key, label, type]) => (
                <div key={key}>
                  <label className="block text-sm font-medium mb-1">{label}</label>
                  <input
                    type={type}
                    value={profileForm[key as keyof typeof profileForm]}
                    onChange={(e) => setProfileForm((f) => ({ ...f, [key]: e.target.value }))}
                    className="w-full border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              ))}
              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={updateProfileMutation.isPending}
                  className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
                  Save
                </button>
                <button type="button" onClick={() => setEditingProfile(false)}
                  className="px-5 py-2.5 bg-muted rounded-xl text-sm font-medium hover:bg-muted/80">
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-1 border-b">
                <span className="text-muted-foreground">Name</span>
                <span className="font-medium">{me?.name ?? "—"}</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-muted-foreground">Email</span>
                <span className="font-medium">{me?.email ?? "—"}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Phone</span>
                <span className="font-medium">{me?.phone || "—"}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Orders tab */}
      {tab === "orders" && (
        <div className="space-y-3">
          {ordersLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 bg-muted rounded-2xl animate-pulse" />
            ))
          ) : !orders?.length ? (
            <div className="text-center py-20 text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No orders yet.</p>
              <Link href="/products" className="mt-3 inline-block text-sm text-primary hover:underline">Start shopping</Link>
            </div>
          ) : (
            orders.map((order: any) => (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="flex items-center justify-between bg-card border rounded-2xl p-5 hover:shadow-sm transition"
              >
                <div>
                  <p className="font-semibold text-sm">{order.order_number}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{formatDate(order.created_at)} · {order.items_count} item(s)</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${getOrderStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                  <span className="font-bold text-sm">{formatCurrency(order.total)}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </Link>
            ))
          )}
        </div>
      )}

      {/* Settings tab */}
      {tab === "settings" && (
        <div className="space-y-6 max-w-lg">
          {/* Change Password */}
          <div className="bg-card border rounded-2xl p-6">
            <h2 className="font-semibold mb-4">Change Password</h2>
            <form onSubmit={(e) => { e.preventDefault(); changePwMutation.mutate(pwForm); }} className="space-y-3">
              {([
                ["current_password", "Current Password"],
                ["password", "New Password"],
                ["password_confirmation", "Confirm New Password"],
              ] as const).map(([key, label]) => (
                <div key={key}>
                  <label className="block text-sm font-medium mb-1">{label}</label>
                  <input
                    type="password"
                    value={pwForm[key as keyof typeof pwForm]}
                    onChange={(e) => setPwForm((f) => ({ ...f, [key]: e.target.value }))}
                    className="w-full border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              ))}
              <button
                type="submit"
                disabled={changePwMutation.isPending}
                className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
              >
                {changePwMutation.isPending ? "Updating…" : "Update Password"}
              </button>
            </form>
          </div>

          {/* Sign Out */}
          <div className="bg-card border rounded-2xl p-6">
            <h2 className="font-semibold mb-1">Session</h2>
            <p className="text-sm text-muted-foreground mb-4">Signed in as <span className="font-medium">{me?.email}</span></p>
            <button
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
              className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition disabled:opacity-50"
            >
              <LogOut className="w-4 h-4" />
              {logoutMutation.isPending ? "Signing out…" : "Sign Out"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
