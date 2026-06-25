"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Pencil, X, Tag, Store } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { formatCurrency } from "@/lib/utils";
import type { Coupon, PaginatedResponse } from "@/types";
import VendorLayout from "@/components/layout/dashboards/VendorLayout";

const empty = {
  code: "",
  type: "percentage" as "percentage" | "fixed",
  value: 0,
  min_order_amount: 0,
  usage_limit: "" as number | "",
  usage_limit_per_user: "" as number | "",
  new_customers_only: false,
  expires_at: "",
  no_expiry: true,
  is_active: true,
};

function CouponForm({
  initial, onSubmit, onCancel, isPending, title,
}: {
  initial: typeof empty;
  onSubmit: (f: typeof empty) => void;
  onCancel: () => void;
  isPending: boolean;
  title: string;
}) {
  const [form, setForm] = useState(initial);
  const num = (key: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [key]: e.target.value === "" ? "" : +e.target.value }));

  return (
    <div className="bg-card border rounded-2xl p-5 mb-6">
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-semibold text-sm">{title}</h3>
        <button onClick={onCancel} className="p-1 hover:bg-muted rounded-lg">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Shop-only notice */}
      <div className="flex items-center gap-2 text-xs text-blue-700 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 mb-4">
        <Store className="w-3.5 h-3.5 shrink-0" />
        This coupon will only work for orders placed in your shop.
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium mb-1 block">Code</label>
          <input
            value={form.code}
            onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
            className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring font-mono"
            placeholder="SHOP20"
          />
        </div>
        <div>
          <label className="text-xs font-medium mb-1 block">Type</label>
          <select
            value={form.type}
            onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as "percentage" | "fixed" }))}
            className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="percentage">Percentage (%)</option>
            <option value="fixed">Fixed ($)</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-medium mb-1 block">
            {form.type === "percentage" ? "Discount (%)" : "Discount ($)"}
          </label>
          <input
            type="number" min={0} value={form.value}
            onChange={(e) => setForm((p) => ({ ...p, value: +e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label className="text-xs font-medium mb-1 block">Min Order Amount ($)</label>
          <input
            type="number" min={0} value={form.min_order_amount}
            onChange={(e) => setForm((p) => ({ ...p, min_order_amount: +e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label className="text-xs font-medium mb-1 block">
            Total Usage Limit <span className="text-muted-foreground font-normal">(blank = unlimited)</span>
          </label>
          <input
            type="number" min={1} value={form.usage_limit}
            onChange={num("usage_limit")}
            className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="∞"
          />
        </div>
        <div>
          <label className="text-xs font-medium mb-1 block">
            Per Customer Limit <span className="text-muted-foreground font-normal">(blank = 1)</span>
          </label>
          <input
            type="number" min={1} value={form.usage_limit_per_user}
            onChange={num("usage_limit_per_user")}
            className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="1"
          />
        </div>
        <div className="col-span-2">
          <label className="text-xs font-medium mb-2 block">Expiry Date</label>
          <label className="flex items-center gap-2 mb-2 cursor-pointer select-none">
            <input
              type="checkbox" checked={form.no_expiry}
              onChange={(e) => setForm((p) => ({ ...p, no_expiry: e.target.checked, expires_at: e.target.checked ? "" : p.expires_at }))}
              className="w-4 h-4 rounded"
            />
            <span className="text-sm">Forever (no expiry)</span>
          </label>
          {!form.no_expiry && (
            <input
              type="date" value={form.expires_at}
              onChange={(e) => setForm((p) => ({ ...p, expires_at: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          )}
        </div>
        <div className="col-span-2">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox" checked={form.new_customers_only}
              onChange={(e) => setForm((p) => ({ ...p, new_customers_only: e.target.checked }))}
              className="w-4 h-4 rounded"
            />
            <div>
              <span className="text-sm font-medium">New customers only</span>
              <p className="text-xs text-muted-foreground">Only customers who have never placed an order can use this coupon</p>
            </div>
          </label>
        </div>
      </div>

      <div className="flex gap-2 mt-5">
        <button
          onClick={() => onSubmit(form)} disabled={isPending}
          className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 disabled:opacity-60"
        >
          {isPending ? "Saving…" : title}
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-muted rounded-xl text-sm font-medium hover:bg-muted/80"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function VendorCoupons() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing]       = useState<Coupon | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["vendor-coupons"],
    queryFn: async () => (await api.get("/vendor/coupons")).data as PaginatedResponse<Coupon>,
  });

  const createMutation = useMutation({
    mutationFn: ({ no_expiry: _, ...payload }: typeof empty) => api.post("/vendor/coupons", payload),
    onSuccess: () => {
      toast.success("Coupon created!");
      qc.invalidateQueries({ queryKey: ["vendor-coupons"] });
      setShowCreate(false);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? "Failed to create coupon."),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload: { no_expiry: _, ...rest } }: { id: number; payload: typeof empty }) =>
      api.put(`/vendor/coupons/${id}`, rest),
    onSuccess: () => {
      toast.success("Coupon updated!");
      qc.invalidateQueries({ queryKey: ["vendor-coupons"] });
      setEditing(null);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? "Failed to update coupon."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/vendor/coupons/${id}`),
    onSuccess: () => { toast.success("Coupon deleted."); qc.invalidateQueries({ queryKey: ["vendor-coupons"] }); },
  });

  const toEditForm = (c: Coupon): typeof empty => ({
    code: c.code,
    type: c.type,
    value: Number(c.value),
    min_order_amount: Number(c.min_order_amount),
    usage_limit: c.usage_limit ?? "",
    usage_limit_per_user: c.usage_limit_per_user ?? "",
    new_customers_only: c.new_customers_only,
    expires_at: c.expires_at ? c.expires_at.slice(0, 10) : "",
    no_expiry: !c.expires_at,
    is_active: c.is_active,
  });

  return (
    <VendorLayout title="Coupons">
      <div className="flex justify-end mb-6">
        <button
          onClick={() => { setShowCreate(true); setEditing(null); }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" /> New Coupon
        </button>
      </div>

      {showCreate && !editing && (
        <CouponForm
          title="Create Coupon"
          initial={empty}
          isPending={createMutation.isPending}
          onSubmit={(f) => createMutation.mutate(f)}
          onCancel={() => setShowCreate(false)}
        />
      )}

      {editing && (
        <CouponForm
          title="Edit Coupon"
          initial={toEditForm(editing)}
          isPending={updateMutation.isPending}
          onSubmit={(f) => updateMutation.mutate({ id: editing.id, payload: f })}
          onCancel={() => setEditing(null)}
        />
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="bg-card border rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground">Code</th>
                <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground">Discount</th>
                <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground">Min/Order</th>
                <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground">Usage</th>
                <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground">Min/Use</th>
                <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground">Expires</th>
                <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {!data?.data?.length ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <Tag className="w-10 h-10 mx-auto mb-3 opacity-20" />
                    <p className="font-medium text-muted-foreground">No coupons yet.</p>
                    <p className="text-sm text-muted-foreground mt-1">Create a coupon to offer discounts in your shop.</p>
                  </td>
                </tr>
              ) : data.data.map((coupon) => (
                <tr key={coupon.id} className="hover:bg-muted/30">
                  <td className="px-5 py-4">
                    <span className="font-mono font-bold text-primary tracking-wide">{coupon.code}</span>
                    <span className="ml-2 px-1.5 py-0.5 text-[10px] font-semibold bg-violet-100 text-violet-700 rounded-full inline-flex items-center gap-0.5">
                      <Store className="w-2.5 h-2.5" /> Shop Only
                    </span>
                    {coupon.new_customers_only && (
                      <span className="ml-1 px-1.5 py-0.5 text-[10px] font-semibold bg-blue-100 text-blue-700 rounded-full">New customers</span>
                    )}
                  </td>
                  <td className="px-5 py-4 font-semibold text-emerald-600">
                    {coupon.type === "percentage"
                      ? `${coupon.value}%`
                      : formatCurrency(Number(coupon.value))
                    }
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">
                    {Number(coupon.min_order_amount) > 0
                      ? formatCurrency(Number(coupon.min_order_amount))
                      : <span className="text-muted-foreground/50">—</span>
                    }
                  </td>
                  <td className="px-5 py-4">
                    <span className={coupon.usage_limit && coupon.used_count >= coupon.usage_limit ? "text-red-500 font-medium" : ""}>
                      {coupon.used_count}
                    </span>
                    <span className="text-muted-foreground"> / {coupon.usage_limit ?? "∞"}</span>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">
                    {coupon.usage_limit_per_user ?? 1}x
                  </td>
                  <td className="px-5 py-4 text-muted-foreground text-xs">
                    {coupon.expires_at
                      ? (() => {
                          const d = new Date(coupon.expires_at);
                          const expired = d < new Date();
                          return (
                            <span className={expired ? "text-red-500" : ""}>
                              {d.toLocaleDateString()}{expired ? " (expired)" : ""}
                            </span>
                          );
                        })()
                      : "Forever"
                    }
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { setEditing(coupon); setShowCreate(false); }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-lg text-xs font-medium transition"
                      >
                        <Pencil className="w-3 h-3" /> Edit
                      </button>
                      <button
                        onClick={() => { if (confirm("Delete this coupon?")) deleteMutation.mutate(coupon.id); }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg text-xs font-medium transition"
                      >
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </VendorLayout>
  );
}
