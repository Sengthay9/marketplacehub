"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import Link from "next/link";
import {
  Settings, Sun, Moon, Monitor, Languages,
  CreditCard, Lock, KeyRound,
} from "lucide-react";
import api from "@/lib/axios";
import type { Lang } from "@/lib/i18n";
import { useLangStore } from "@/store/lang.store";
import { useAuthStore } from "@/store/auth.store";
import VendorLayout from "@/components/layout/dashboards/VendorLayout";

export default function VendorSettings() {
  const { theme, setTheme } = useTheme();
  const { lang, setLang }   = useLangStore();
  const { user }            = useAuthStore();

  /* ── Profile data ── */
  const { data: me } = useQuery({
    queryKey: ["vendor-me"],
    queryFn: async () => (await api.get("/auth/me")).data.user,
  });

  /* ── Change password ── */
  const [pwForm, setPwForm] = useState({
    current_password: "", password: "", password_confirmation: "",
  });

  const changePwMutation = useMutation({
    mutationFn: (d: typeof pwForm) => api.put("/me/profile", d),
    onSuccess: () => {
      toast.success("Password changed!");
      setPwForm({ current_password: "", password: "", password_confirmation: "" });
    },
    onError: (e: any) => {
      const errs  = e?.response?.data?.errors;
      const first = errs ? Object.values(errs).flat()[0] : null;
      toast.error((first as string) ?? "Incorrect current password or validation failed.");
    },
  });

  /* ── Forgot password ── */
  const forgotMutation = useMutation({
    mutationFn: () => api.post("/auth/forgot-password", { email: me?.email ?? user?.email }),
    onSuccess: () => toast.success(`Password reset link sent to ${me?.email ?? user?.email}`),
    onError: () => toast.error("Failed to send reset link."),
  });

  return (
    <VendorLayout title="Settings">
      <div className="max-w-2xl space-y-6">

        {/* ── Vendor Profile ── */}
        <div className="bg-card border rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center">
              <Settings className="w-4 h-4 text-primary" />
            </div>
            <h3 className="font-bold">Vendor Profile</h3>
          </div>

          <div className="space-y-0 text-sm">
            {[
              { label: "Name",     value: me?.name     ?? "—" },
              { label: "Username", value: me?.username ?? "—" },
              { label: "Phone",    value: me?.phone    || "—" },
              { label: "Gmail",    value: me?.email    ?? "—" },
            ].map(({ label, value }, i, arr) => (
              <div
                key={label}
                className={`flex justify-between py-2.5 ${i < arr.length - 1 ? "border-b" : ""}`}
              >
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Appearance: theme + language ── */}
        <div className="bg-card border rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 bg-purple-50 rounded-xl flex items-center justify-center">
              <Sun className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <h3 className="font-bold">Appearance</h3>
              <p className="text-xs text-muted-foreground">Theme and display language</p>
            </div>
          </div>

          {/* Theme */}
          <div className="mb-5">
            <p className="text-xs font-medium mb-3">Theme</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "light",  label: "Light",  Icon: Sun     },
                { value: "dark",   label: "Dark",   Icon: Moon    },
                { value: "system", label: "System", Icon: Monitor },
              ].map(({ value, label, Icon }) => (
                <button
                  key={value}
                  onClick={() => setTheme(value)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 text-sm font-medium transition ${
                    theme === value
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border text-muted-foreground hover:border-muted-foreground"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Language */}
          <div>
            <p className="text-xs font-medium mb-3">Language</p>
            <div className="relative">
              <Languages className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value as Lang)}
                className="w-full pl-9 pr-4 py-2.5 text-sm border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-ring appearance-none"
              >
                <option value="en">English</option>
                <option value="km">ភាសាខ្មែរ (Khmer)</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── Payment ── */}
        <div className="bg-card border rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-bold">Payment</h3>
                <p className="text-sm text-muted-foreground">Manage your Bakong payout account &amp; KHQR</p>
              </div>
            </div>
            <Link
              href="/vendor/payment"
              className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition"
            >
              Manage
            </Link>
          </div>
        </div>

        {/* ── Change Password + Forgot Password ── */}
        <div className="bg-card border rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 bg-orange-50 rounded-xl flex items-center justify-center">
              <Lock className="w-4 h-4 text-orange-600" />
            </div>
            <div>
              <h3 className="font-bold">Change Password</h3>
              <p className="text-xs text-muted-foreground">Update your account password</p>
            </div>
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); changePwMutation.mutate(pwForm); }}
            className="space-y-3"
          >
            {([
              ["current_password",      "Current Password"],
              ["password",              "New Password"],
              ["password_confirmation", "Confirm New Password"],
            ] as const).map(([key, label]) => (
              <div key={key}>
                <label className="block text-sm font-medium mb-1">{label}</label>
                <input
                  type="password"
                  value={pwForm[key]}
                  onChange={(e) => setPwForm((f) => ({ ...f, [key]: e.target.value }))}
                  className="w-full border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            ))}

            <div className="flex items-center gap-4 pt-1">
              <button
                type="submit"
                disabled={changePwMutation.isPending}
                className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 disabled:opacity-60"
              >
                Update Password
              </button>

              <button
                type="button"
                onClick={() => forgotMutation.mutate()}
                disabled={forgotMutation.isPending}
                className="flex items-center gap-1.5 text-sm text-primary hover:underline disabled:opacity-60"
              >
                <KeyRound className="w-3.5 h-3.5" />
                {forgotMutation.isPending ? "Sending…" : "Forgot password?"}
              </button>
            </div>
          </form>
        </div>

      </div>
    </VendorLayout>
  );
}
