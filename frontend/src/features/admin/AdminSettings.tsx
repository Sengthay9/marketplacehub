"use client";

import AdminLayout from "@/components/layout/dashboards/AdminLayout";
import { useAuthStore } from "@/store/auth.store";
import { Settings, Shield, Bell, Globe } from "lucide-react";

export default function AdminSettings() {
  const { user } = useAuthStore();

  return (
    <AdminLayout title="Settings">
      <div className="max-w-2xl space-y-6">
        {/* Profile */}
        <div className="bg-card border rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center">
              <Settings className="w-4 h-4 text-primary" />
            </div>
            <h3 className="font-bold">Admin Profile</h3>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Name</span>
              <span className="font-medium">{user?.name}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium">{user?.email}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">Role</span>
              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium capitalize">{user?.role}</span>
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="bg-card border rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-green-50 rounded-xl flex items-center justify-center">
              <Shield className="w-4 h-4 text-green-600" />
            </div>
            <h3 className="font-bold">Security</h3>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center py-2 border-b">
              <div>
                <p className="font-medium">Email Verified</p>
                <p className="text-xs text-muted-foreground">Account verification status</p>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                user?.email_verified ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
              }`}>
                {user?.email_verified ? "Verified" : "Unverified"}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <div>
                <p className="font-medium">Two-Factor Authentication</p>
                <p className="text-xs text-muted-foreground">Additional login security</p>
              </div>
              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">Not configured</span>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-card border rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center">
              <Bell className="w-4 h-4 text-blue-600" />
            </div>
            <h3 className="font-bold">Notifications</h3>
          </div>
          <div className="space-y-3 text-sm">
            {[
              { label: "New vendor registrations", desc: "Alert when a new shop is pending approval" },
              { label: "New product submissions", desc: "Alert when products need review" },
              { label: "Platform reports", desc: "Weekly summary reports" },
            ].map((item) => (
              <div key={item.label} className="flex justify-between items-center py-2 border-b last:border-0">
                <div>
                  <p className="font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <button className="w-10 h-6 bg-primary rounded-full relative">
                  <span className="w-4 h-4 bg-white rounded-full absolute right-1 top-1 shadow" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Platform */}
        <div className="bg-card border rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-orange-50 rounded-xl flex items-center justify-center">
              <Globe className="w-4 h-4 text-orange-600" />
            </div>
            <h3 className="font-bold">Platform Info</h3>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Platform</span>
              <span className="font-medium">MarketplaceHub</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Backend</span>
              <span className="font-medium">Laravel 12</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">Frontend</span>
              <span className="font-medium">Next.js 15</span>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
