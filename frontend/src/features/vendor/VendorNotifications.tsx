"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Bell, AlertTriangle, ShieldOff, Ban, CheckCircle, Info,
  CheckCheck, PackageX, PackageMinus, PackageSearch, Hammer, Wallet,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import api from "@/lib/axios";
import VendorLayout from "@/components/layout/dashboards/VendorLayout";

/* ── icon, background & icon-bubble colour by notification type ── */
const TYPE_CONFIG: Record<string, { icon: React.ReactNode; cardBg: string; bubbleBg: string; label: string }> = {
  // ── Admin actions ──
  vendor_warned:     { icon: <AlertTriangle className="w-4 h-4 text-yellow-600" />, cardBg: "bg-yellow-50 border-yellow-200",  bubbleBg: "bg-yellow-100",  label: "Warning" },
  shop_warned:       { icon: <AlertTriangle className="w-4 h-4 text-yellow-600" />, cardBg: "bg-yellow-50 border-yellow-200",  bubbleBg: "bg-yellow-100",  label: "Warning" },
  product_warned:    { icon: <AlertTriangle className="w-4 h-4 text-yellow-600" />, cardBg: "bg-yellow-50 border-yellow-200",  bubbleBg: "bg-yellow-100",  label: "Warning" },
  vendor_suspended:  { icon: <ShieldOff    className="w-4 h-4 text-orange-600" />, cardBg: "bg-orange-50 border-orange-200",  bubbleBg: "bg-orange-100",  label: "Suspended" },
  shop_suspended:    { icon: <ShieldOff    className="w-4 h-4 text-orange-600" />, cardBg: "bg-orange-50 border-orange-200",  bubbleBg: "bg-orange-100",  label: "Suspended" },
  product_suspended: { icon: <ShieldOff    className="w-4 h-4 text-orange-600" />, cardBg: "bg-orange-50 border-orange-200",  bubbleBg: "bg-orange-100",  label: "Suspended" },
  vendor_banned:     { icon: <Ban          className="w-4 h-4 text-red-600"    />, cardBg: "bg-red-50 border-red-200",        bubbleBg: "bg-red-100",     label: "Banned" },
  shop_banned:       { icon: <Ban          className="w-4 h-4 text-red-600"    />, cardBg: "bg-red-50 border-red-200",        bubbleBg: "bg-red-100",     label: "Banned" },
  product_banned:    { icon: <Ban          className="w-4 h-4 text-red-600"    />, cardBg: "bg-red-50 border-red-200",        bubbleBg: "bg-red-100",     label: "Banned" },
  shop_approved:     { icon: <CheckCircle  className="w-4 h-4 text-green-600"  />, cardBg: "bg-green-50 border-green-200",    bubbleBg: "bg-green-100",   label: "Approved" },
  shop_restored:     { icon: <CheckCircle  className="w-4 h-4 text-green-600"  />, cardBg: "bg-green-50 border-green-200",    bubbleBg: "bg-green-100",   label: "Restored" },
  vendor_restored:   { icon: <CheckCircle  className="w-4 h-4 text-green-600"  />, cardBg: "bg-green-50 border-green-200",    bubbleBg: "bg-green-100",   label: "Restored" },
  product_restored:  { icon: <CheckCircle  className="w-4 h-4 text-green-600"  />, cardBg: "bg-green-50 border-green-200",    bubbleBg: "bg-green-100",   label: "Restored" },
  // ── Payout ──
  payout_completed: { icon: <Wallet className="w-4 h-4 text-green-600" />, cardBg: "bg-green-50 border-green-200", bubbleBg: "bg-green-100", label: "Payout" },
  // ── Customer order complaints ──
  order_complaint_not_received:   { icon: <PackageX      className="w-4 h-4 text-red-600"    />, cardBg: "bg-red-50 border-red-200",        bubbleBg: "bg-red-100",     label: "Not Received" },
  order_complaint_missing_item:   { icon: <PackageMinus  className="w-4 h-4 text-orange-600" />, cardBg: "bg-orange-50 border-orange-200",  bubbleBg: "bg-orange-100",  label: "Missing Items" },
  order_complaint_wrong_order:    { icon: <PackageSearch className="w-4 h-4 text-yellow-600" />, cardBg: "bg-yellow-50 border-yellow-200",  bubbleBg: "bg-yellow-100",  label: "Wrong Order" },
  order_complaint_broken_product: { icon: <Hammer        className="w-4 h-4 text-red-600"    />, cardBg: "bg-red-50 border-red-200",        bubbleBg: "bg-red-100",     label: "Damaged" },
};

const ADMIN_TYPES = new Set([
  "vendor_warned","shop_warned","product_warned",
  "vendor_suspended","shop_suspended","product_suspended",
  "vendor_banned","shop_banned","product_banned",
  "shop_approved","shop_restored","vendor_restored","product_restored",
  "payout_completed",
]);

const COMPLAINT_TYPES = new Set([
  "order_complaint_not_received","order_complaint_missing_item",
  "order_complaint_wrong_order","order_complaint_broken_product",
]);

type Filter = "all" | "unread" | "admin" | "customer";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all",      label: "All" },
  { value: "unread",   label: "Unread" },
  { value: "admin",    label: "Admin Actions" },
  { value: "customer", label: "Customer Reports" },
];

function getConfig(type: string) {
  return TYPE_CONFIG[type] ?? {
    icon: <Info className="w-4 h-4 text-muted-foreground" />,
    cardBg: "bg-blue-50 border-blue-200",
    bubbleBg: "bg-blue-100",
    label: "Notice",
  };
}

export default function VendorNotifications() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<Filter>("all");

  const { data, isLoading } = useQuery({
    queryKey: ["vendor-notifications"],
    queryFn: async () => (await api.get("/notifications")).data,
  });

  const markRead = useMutation({
    mutationFn: (id: number) => api.post(`/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vendor-notifications"] }),
  });

  const markAllRead = useMutation({
    mutationFn: () => api.post("/notifications/read-all"),
    onSuccess: () => {
      toast.success("All notifications marked as read.");
      qc.invalidateQueries({ queryKey: ["vendor-notifications"] });
    },
  });

  const all: any[]  = data?.notifications?.data ?? [];
  const unreadCount = data?.unread_count ?? 0;

  const filtered = all.filter((n) => {
    if (filter === "unread")   return !n.read_at;
    if (filter === "admin")    return ADMIN_TYPES.has(n.type);
    if (filter === "customer") return COMPLAINT_TYPES.has(n.type);
    return true;
  });

  const countFor = (f: Filter) => {
    if (f === "all")      return all.length;
    if (f === "unread")   return all.filter((n) => !n.read_at).length;
    if (f === "admin")    return all.filter((n) => ADMIN_TYPES.has(n.type)).length;
    if (f === "customer") return all.filter((n) => COMPLAINT_TYPES.has(n.type)).length;
    return 0;
  };

  return (
    <VendorLayout title="Notifications">
      {/* Filter tabs + mark-all */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map(({ value, label }) => {
            const count = countFor(value);
            return (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={`px-3 py-1.5 rounded-xl text-sm font-medium transition flex items-center gap-1.5 ${
                  filter === value ? "bg-primary text-white" : "bg-muted hover:bg-muted/80"
                }`}
              >
                {label}
                {count > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                    filter === value ? "bg-white/20 text-white" : "bg-background text-muted-foreground"
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {unreadCount > 0 && (
          <button
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
            className="flex items-center gap-1.5 text-sm text-primary font-medium hover:underline disabled:opacity-60"
          >
            <CheckCheck className="w-4 h-4" /> Mark all as read
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-muted rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="border rounded-2xl flex flex-col items-center justify-center gap-3 py-24 text-center">
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
            <Bell className="w-7 h-7 text-muted-foreground" />
          </div>
          <p className="font-semibold">
            {filter === "unread"   ? "No unread notifications" :
             filter === "admin"    ? "No admin actions" :
             filter === "customer" ? "No customer reports" :
             "No notifications yet"}
          </p>
          <p className="text-sm text-muted-foreground">
            {filter === "customer"
              ? "Customer order complaints will appear here."
              : "Important updates about your shop will appear here."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((n: any) => {
            const cfg          = getConfig(n.type);
            const isComplaint  = COMPLAINT_TYPES.has(n.type);
            const orderNum     = n.data?.order_number;
            const customerName = n.data?.customer_name;

            return (
              <div
                key={n.id}
                onClick={() => !n.read_at && markRead.mutate(n.id)}
                className={`border rounded-2xl p-5 transition ${
                  n.read_at ? "bg-card border-border" : cfg.cardBg
                } ${!n.read_at ? "cursor-pointer hover:brightness-[0.97]" : ""}`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon bubble */}
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                    n.read_at ? "bg-muted" : cfg.bubbleBg
                  }`}>
                    {cfg.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={`text-sm font-semibold leading-snug ${n.read_at ? "text-muted-foreground" : ""}`}>
                          {n.title}
                        </p>
                        {/* Category badge */}
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                          isComplaint
                            ? "bg-orange-100 text-orange-700"
                            : "bg-blue-100 text-blue-700"
                        }`}>
                          {isComplaint ? "Customer Report" : "Admin"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <p className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                        </p>
                        {!n.read_at && (
                          <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                        )}
                      </div>
                    </div>

                    {/* Order context for complaints */}
                    {isComplaint && (orderNum || customerName) && (
                      <div className="flex items-center gap-3 mb-1.5 text-xs text-muted-foreground">
                        {customerName && <span className="font-medium text-foreground/70">{customerName}</span>}
                        {orderNum && (
                          <span className="font-mono bg-muted px-1.5 py-0.5 rounded">{orderNum}</span>
                        )}
                      </div>
                    )}

                    <p className={`text-sm leading-relaxed ${n.read_at ? "text-muted-foreground/70" : "text-foreground/80"}`}>
                      {n.message}
                    </p>

                    {!n.read_at && (
                      <p className="text-xs text-muted-foreground mt-2">Click to mark as read</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </VendorLayout>
  );
}
