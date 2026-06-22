"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import VendorLayout from "@/components/layout/dashboards/VendorLayout";

const emptyForm = { code: "", description: "", type: "percentage", value: "", min_order_amount: "", usage_limit: "", expires_at: "", is_active: true };

export default function VendorCoupons() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });

  const { data, isLoading } = useQuery({
    queryKey: ["vendor-coupons"],
    queryFn: async () => (await api.get("/vendor/coupons")).data,
  });

  const createMutation = useMutation({
    mutationFn: (d: typeof form) => api.post("/vendor/coupons", d),
    onSuccess: () => { toast.success("Coupon created!"); qc.invalidateQueries({ queryKey: ["vendor-coupons"] }); setShowForm(false); setForm({ ...emptyForm }); },
    onError: () => toast.error("Failed to create coupon."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/vendor/coupons/${id}`),
    onSuccess: () => { toast.success("Coupon deleted."); qc.invalidateQueries({ queryKey: ["vendor-coupons"] }); },
  });

  const field = (key: keyof typeof form, label: string, type = "text", extra?: object) => (
    <div key={key}>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <input type={type} value={String(form[key])}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        className="w-full border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
        {...extra} />
    </div>
  );

  return (
    <VendorLayout title="Coupons">
      <div className="flex justify-end mb-6">
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90">
          <Plus className="w-4 h-4" /> New Coupon
        </button>
      </div>

      {showForm && (
        <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }}
          className="bg-card border rounded-2xl p-6 mb-6 grid grid-cols-2 gap-4">
          <div className="col-span-2 font-semibold text-sm">New Coupon</div>
          {field("code", "Code")}
          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              className="w-full border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30">
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed Amount ($)</option>
            </select>
          </div>
          {field("value", "Value", "number")}
          {field("min_order_amount", "Min Order ($)", "number")}
          {field("usage_limit", "Usage Limit", "number")}
          {field("expires_at", "Expires At", "date")}
          <div className="col-span-2 flex gap-3">
            <button type="submit" className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90">Create</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 bg-muted rounded-xl text-sm font-medium hover:bg-muted/80">Cancel</button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-14 bg-muted rounded-xl animate-pulse" />)}</div>
      ) : (
        <div className="bg-card border rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4 font-medium">Code</th>
                <th className="text-left p-4 font-medium">Discount</th>
                <th className="text-left p-4 font-medium">Used / Limit</th>
                <th className="text-left p-4 font-medium">Expires</th>
                <th className="text-left p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data?.data?.length === 0 && (
                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No coupons yet.</td></tr>
              )}
              {data?.data?.map((c: any) => (
                <tr key={c.id} className="hover:bg-muted/30">
                  <td className="p-4 font-mono font-semibold">{c.code}</td>
                  <td className="p-4">{c.type === "percentage" ? `${c.value}%` : `$${c.value}`}</td>
                  <td className="p-4">{c.usage_count ?? 0} / {c.usage_limit ?? "∞"}</td>
                  <td className="p-4 text-muted-foreground">{c.expires_at ? new Date(c.expires_at).toLocaleDateString() : "—"}</td>
                  <td className="p-4">
                    <button onClick={() => { if (confirm("Delete coupon?")) deleteMutation.mutate(c.id); }}
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
    </VendorLayout>
  );
}
