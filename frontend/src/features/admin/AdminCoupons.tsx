"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { formatCurrency } from "@/lib/utils";
import AdminLayout from "@/components/layout/dashboards/AdminLayout";
import type { Coupon, PaginatedResponse } from "@/types";

const empty = { code: "", type: "percentage" as const, value: 0, min_order_amount: 0, expires_at: "" };

export default function AdminCoupons() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-coupons"],
    queryFn: async () => {
      const res = await api.get("/admin/coupons");
      return res.data as PaginatedResponse<Coupon>;
    },
  });

  const createMutation = useMutation({
    mutationFn: (payload: typeof form) => api.post("/admin/coupons", payload),
    onSuccess: () => {
      toast.success("Coupon created!");
      qc.invalidateQueries({ queryKey: ["admin-coupons"] });
      setForm(empty); setShowForm(false);
    },
    onError: () => toast.error("Failed to create coupon."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/coupons/${id}`),
    onSuccess: () => { toast.success("Coupon deleted."); qc.invalidateQueries({ queryKey: ["admin-coupons"] }); },
  });

  return (
    <AdminLayout title="Coupons">
      <div className="flex justify-between items-center mb-6">
        <p className="text-sm text-muted-foreground">{data?.total ?? 0} coupons</p>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90">
          <Plus className="w-4 h-4" /> New Coupon
        </button>
      </div>

      {showForm && (
        <div className="bg-card border rounded-2xl p-5 mb-6 space-y-4">
          <h3 className="font-semibold">New Coupon</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium mb-1 block">Code</label>
              <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="SUMMER20" />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as "percentage" | "fixed" })}
                className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed ($)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Value</label>
              <input type="number" value={form.value} onChange={(e) => setForm({ ...form, value: +e.target.value })}
                className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Min Order Amount</label>
              <input type="number" value={form.min_order_amount} onChange={(e) => setForm({ ...form, min_order_amount: +e.target.value })}
                className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Expires At</label>
              <input type="date" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => createMutation.mutate(form)}
              className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90">
              Create
            </button>
            <button onClick={() => { setShowForm(false); setForm(empty); }}
              className="px-4 py-2 bg-muted rounded-xl text-sm font-medium hover:bg-muted/80">
              Cancel
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="bg-card border rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4 font-medium">Code</th>
                <th className="text-left p-4 font-medium">Discount</th>
                <th className="text-left p-4 font-medium">Min Order</th>
                <th className="text-left p-4 font-medium">Used</th>
                <th className="text-left p-4 font-medium">Expires</th>
                <th className="text-left p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data?.data.map((coupon) => (
                <tr key={coupon.id} className="hover:bg-muted/30">
                  <td className="p-4 font-mono font-bold text-primary">{coupon.code}</td>
                  <td className="p-4">
                    {coupon.type === "percentage" ? `${coupon.value}%` : formatCurrency(coupon.value)}
                  </td>
                  <td className="p-4">{formatCurrency(coupon.min_order_amount)}</td>
                  <td className="p-4">{coupon.used_count}</td>
                  <td className="p-4 text-muted-foreground text-xs">
                    {coupon.expires_at ? new Date(coupon.expires_at).toLocaleDateString() : "—"}
                  </td>
                  <td className="p-4">
                    <button onClick={() => { if (confirm("Delete this coupon?")) deleteMutation.mutate(coupon.id); }}
                      className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-medium hover:bg-red-200">
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}
