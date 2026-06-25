"use client";

import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth.store";
import { useLangStore } from "@/store/lang.store";
import { useT } from "@/hooks/useT";
import { Settings, Globe, User, Lock, Sun, Moon, Monitor, Languages } from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import api from "@/lib/axios";
import type { Lang } from "@/lib/i18n";
import AdminBankAccount from "./AdminBankAccount";
import AdminWebsiteSettings from "./AdminWebsiteSettings";

export default function AdminSettings() {
  const { user, updateUser } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const { lang, setLang } = useLangStore();
  const T = useT();

  // ── Section 1: profile fields ──
  const [profile, setProfile] = useState({ name: "", email: "" });

  useEffect(() => {
    if (user) setProfile({ name: user.name ?? "", email: user.email ?? "" });
  }, [user?.id]);

  const fp = (key: keyof typeof profile) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setProfile((p) => ({ ...p, [key]: e.target.value }));

  const profileMutation = useMutation({
    mutationFn: () => api.put("/me/profile", profile),
    onSuccess: (res) => {
      updateUser(res.data.user);
      toast.success("Profile updated!");
    },
    onError: (e: any) => {
      const errs = e?.response?.data?.errors;
      const first = errs ? Object.values(errs).flat()[0] : null;
      toast.error((first as string) ?? "Failed to update profile.");
    },
  });

  // ── Section 2: password fields ──
  const [pwd, setPwd] = useState({ current_password: "", password: "", password_confirmation: "" });

  const fw = (key: keyof typeof pwd) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setPwd((p) => ({ ...p, [key]: e.target.value }));

  const passwordMutation = useMutation({
    mutationFn: () => api.put("/me/profile", pwd),
    onSuccess: () => {
      toast.success("Password changed!");
      setPwd({ current_password: "", password: "", password_confirmation: "" });
    },
    onError: (e: any) => {
      const errs = e?.response?.data?.errors;
      const first = errs ? Object.values(errs).flat()[0] : null;
      toast.error((first as string) ?? "Failed to change password.");
    },
  });

  const forgotMutation = useMutation({
    mutationFn: () => api.post("/auth/forgot-password", { email: user?.email }),
    onSuccess: () => toast.success(`Reset link sent to ${user?.email}`),
    onError: () => toast.error("Failed to send reset link."),
  });

  return (
    <>
      <div className="max-w-2xl space-y-6">
        {/* Admin Profile */}
        <div className="bg-card border rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center">
              <Settings className="w-4 h-4 text-primary" />
            </div>
            <h3 className="font-bold">{T("set_admin_profile")}</h3>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">{T("profile_name")}</span>
              <span className="font-medium">{user?.name}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">{T("profile_username")}</span>
              <span className="font-medium">{user?.username}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">{T("profile_gmail")}</span>
              <span className="font-medium">{user?.email}</span>
            </div>
          </div>
        </div>

        {/* Website */}
        <AdminWebsiteSettings />

        {/* Bakong Account */}
        <AdminBankAccount className="space-y-6" />

        {/* Appearance */}
        <div className="bg-card border rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 bg-purple-50 rounded-xl flex items-center justify-center">
              <Sun className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <h3 className="font-bold">{T("set_appearance")}</h3>
              <p className="text-xs text-muted-foreground">{T("set_appearance_sub")}</p>
            </div>
          </div>

          {/* Theme */}
          <div className="mb-5">
            <p className="text-xs font-medium mb-3">{T("set_theme")}</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "light",  labelKey: "set_theme_light"  as const, Icon: Sun },
                { value: "dark",   labelKey: "set_theme_dark"   as const, Icon: Moon },
                { value: "system", labelKey: "set_theme_system" as const, Icon: Monitor },
              ].map(({ value, labelKey, Icon }) => (
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
                  {T(labelKey)}
                </button>
              ))}
            </div>
          </div>

          {/* Language */}
          <div>
            <p className="text-xs font-medium mb-3">{T("set_language")}</p>
            <div className="relative">
              <Languages className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value as Lang)}
                className="w-full pl-9 pr-4 py-2 text-sm border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-ring appearance-none"
              >
                <option value="en">English</option>
                <option value="km">ភាសាខ្មែរ (Khmer)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Edit Profile */}
        <div className="bg-card border rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 bg-green-50 rounded-xl flex items-center justify-center">
              <User className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <h3 className="font-bold">{T("set_edit_profile")}</h3>
              <p className="text-xs text-muted-foreground">{T("set_edit_profile_sub")}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium mb-1 block">{T("set_name")}</label>
              <input value={profile.name} onChange={fp("name")}
                className="w-full px-3 py-2 text-sm border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">{T("set_username")}</label>
              <input type="email" value={profile.email} onChange={fp("email")}
                className="w-full px-3 py-2 text-sm border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium mb-1 block">
                {T("set_gmail")} <span className="text-muted-foreground font-normal">{T("set_gmail_note")}</span>
              </label>
              <input
                value="saingsengthay87@gmail.com"
                readOnly
                className="w-full px-3 py-2 text-sm border rounded-xl bg-muted text-muted-foreground cursor-not-allowed" />
            </div>
          </div>
          <button
            onClick={() => profileMutation.mutate()}
            disabled={profileMutation.isPending}
            className="mt-5 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 disabled:opacity-60">
            {profileMutation.isPending ? T("set_saving") : T("set_save_profile")}
          </button>
        </div>

        {/* Change Password */}
        <div className="bg-card border rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center">
              <Lock className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold">{T("set_change_password")}</h3>
              <p className="text-xs text-muted-foreground">{T("set_change_pwd_sub")}</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium mb-1 block">{T("set_current_pwd")}</label>
              <input type="password" value={pwd.current_password} onChange={fw("current_password")}
                className="w-full px-3 py-2 text-sm border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium mb-1 block">{T("set_new_pwd")}</label>
                <input type="password" value={pwd.password} onChange={fw("password")}
                  placeholder={T("set_new_pwd_ph")}
                  className="w-full px-3 py-2 text-sm border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">{T("set_confirm_pwd")}</label>
                <input type="password" value={pwd.password_confirmation} onChange={fw("password_confirmation")}
                  className="w-full px-3 py-2 text-sm border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-5">
            <button
              onClick={() => passwordMutation.mutate()}
              disabled={passwordMutation.isPending || !pwd.current_password || !pwd.password}
              className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 disabled:opacity-60">
              {passwordMutation.isPending ? T("set_saving") : T("set_change_password")}
            </button>
            <button
              onClick={() => forgotMutation.mutate()}
              disabled={forgotMutation.isPending}
              className="text-sm text-primary hover:underline disabled:opacity-60">
              {forgotMutation.isPending ? T("set_sending") : T("set_forgot_pwd")}
            </button>
          </div>
        </div>

        {/* Platform */}
        <div className="bg-card border rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-orange-50 rounded-xl flex items-center justify-center">
              <Globe className="w-4 h-4 text-orange-600" />
            </div>
            <h3 className="font-bold">{T("set_platform")}</h3>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">{T("set_platform_name")}</span>
              <span className="font-medium">CamCart</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">{T("set_backend")}</span>
              <span className="font-medium">Laravel 12</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">{T("set_frontend")}</span>
              <span className="font-medium">Next.js 15</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
