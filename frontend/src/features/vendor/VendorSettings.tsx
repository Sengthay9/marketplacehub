"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/auth.store";
import VendorLayout from "@/components/layout/dashboards/VendorLayout";
import VendorPaymentQr from "./VendorPaymentQr";

export default function VendorSettings() {
  const router = useRouter();
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const qc = useQueryClient();

  const { data: me } = useQuery({
    queryKey: ["vendor-me"],
    queryFn: async () => (await api.get("/auth/me")).data.user,
  });

  const [profileForm, setProfileForm] = useState({ name: "", phone: "" });
  const [pwForm, setPwForm] = useState({ current_password: "", password: "", password_confirmation: "" });
  const [editingProfile, setEditingProfile] = useState(false);

  const updateProfileMutation = useMutation({
    mutationFn: (d: typeof profileForm) => api.put("/me/profile", d),
    onSuccess: () => {
      toast.success("Profile updated!");
      setEditingProfile(false);
      qc.invalidateQueries({ queryKey: ["vendor-me"] });
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
      router.push("/login");
    },
  });

  return (
    <VendorLayout title="Settings">
      <div className="max-w-3xl space-y-10">

        {/* Payment QR Codes */}
        <div className="bg-card border rounded-2xl p-6">
          <VendorPaymentQr />
        </div>

        {/* Profile */}
        <div className="bg-card border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Profile</h2>
            {!editingProfile && (
              <button onClick={() => { setProfileForm({ name: me?.name ?? "", phone: me?.phone ?? "" }); setEditingProfile(true); }}
                className="text-sm text-primary hover:underline">Edit</button>
            )}
          </div>
          {editingProfile ? (
            <form onSubmit={(e) => { e.preventDefault(); updateProfileMutation.mutate(profileForm); }} className="space-y-3">
              {([["name", "Name", "text"], ["phone", "Phone", "tel"]] as const).map(([key, label, type]) => (
                <div key={key}>
                  <label className="block text-sm font-medium mb-1">{label}</label>
                  <input type={type} value={profileForm[key as keyof typeof profileForm]}
                    onChange={(e) => setProfileForm((f) => ({ ...f, [key]: e.target.value }))}
                    className="w-full border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
              ))}
              <div className="flex gap-3 pt-1">
                <button type="submit" className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90">Save</button>
                <button type="button" onClick={() => setEditingProfile(false)} className="px-5 py-2.5 bg-muted rounded-xl text-sm font-medium hover:bg-muted/80">Cancel</button>
              </div>
            </form>
          ) : (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="font-medium">{me?.name ?? "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span className="font-medium">{me?.email ?? "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span className="font-medium">{me?.phone || "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Role</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 capitalize">{me?.role}</span>
              </div>
            </div>
          )}
        </div>

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
                <input type="password" value={pwForm[key as keyof typeof pwForm]}
                  onChange={(e) => setPwForm((f) => ({ ...f, [key]: e.target.value }))}
                  className="w-full border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
            ))}
            <button type="submit" className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 mt-1">
              Update Password
            </button>
          </form>
        </div>

        {/* Sign Out */}
        <div className="bg-card border rounded-2xl p-6">
          <h2 className="font-semibold mb-2">Session</h2>
          <p className="text-sm text-muted-foreground mb-4">Signed in as <span className="font-medium">{me?.email}</span></p>
          <button onClick={() => logoutMutation.mutate()}
            className="px-5 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition">
            Sign Out
          </button>
        </div>

      </div>
    </VendorLayout>
  );
}
