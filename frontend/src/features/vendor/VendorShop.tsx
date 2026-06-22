"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/axios";
import VendorLayout from "@/components/layout/dashboards/VendorLayout";

export default function VendorShop() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);

  const { data: shop, isLoading } = useQuery({
    queryKey: ["vendor-shop"],
    queryFn: async () => {
      const res = await api.get("/vendor/shop");
      return res.data.shop;
    },
  });

  const [form, setForm] = useState({ name: "", description: "", phone: "", address: "" });

  const updateMutation = useMutation({
    mutationFn: (data: typeof form) => api.put("/vendor/shop", data),
    onSuccess: () => {
      toast.success("Shop updated!");
      qc.invalidateQueries({ queryKey: ["vendor-shop"] });
      setEditing(false);
    },
    onError: () => toast.error("Failed to update shop."),
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => api.post("/vendor/shop", data),
    onSuccess: () => {
      toast.success("Shop created!");
      qc.invalidateQueries({ queryKey: ["vendor-shop"] });
      setEditing(false);
    },
    onError: () => toast.error("Failed to create shop."),
  });

  const handleEdit = () => {
    setForm({
      name: shop?.name ?? "",
      description: shop?.description ?? "",
      phone: shop?.phone ?? "",
      address: shop?.address ?? "",
    });
    setEditing(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (shop) updateMutation.mutate(form);
    else createMutation.mutate(form);
  };

  return (
    <VendorLayout title="My Shop">
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}
        </div>
      ) : !shop && !editing ? (
        <div className="text-center py-20">
          <p className="text-muted-foreground mb-4">You don't have a shop yet.</p>
          <button onClick={() => { setForm({ name: "", description: "", phone: "", address: "" }); setEditing(true); }}
            className="px-6 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary/90">
            Create Your Shop
          </button>
        </div>
      ) : editing ? (
        <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
          {[
            { label: "Shop Name", key: "name", placeholder: "My Awesome Store" },
            { label: "Phone", key: "phone", placeholder: "+855 12 345 678" },
            { label: "Address", key: "address", placeholder: "Phnom Penh, Cambodia" },
          ].map(({ label, key, placeholder }) => (
            <div key={key}>
              <label className="block text-sm font-medium mb-1">{label}</label>
              <input value={form[key as keyof typeof form]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder}
                className="w-full border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={4} placeholder="What does your shop sell?"
              className="w-full border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
          </div>
          <div className="flex gap-3">
            <button type="submit" className="px-6 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary/90">
              {shop ? "Save Changes" : "Create Shop"}
            </button>
            <button type="button" onClick={() => setEditing(false)} className="px-6 py-2.5 bg-muted rounded-xl font-medium hover:bg-muted/80">
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="max-w-2xl space-y-6">
          <div className="bg-card border rounded-2xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold">{shop.name}</h2>
                <p className="text-sm text-muted-foreground">/{shop.slug}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                shop.status === "approved" ? "bg-green-100 text-green-700" :
                shop.status === "pending"  ? "bg-yellow-100 text-yellow-700" :
                "bg-red-100 text-red-700"}`}>
                {shop.status}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">{shop.description || "No description."}</p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-muted-foreground">Phone:</span> {shop.phone || "—"}</div>
              <div><span className="text-muted-foreground">Address:</span> {shop.address || "—"}</div>
              <div><span className="text-muted-foreground">Rating:</span> ⭐ {shop.rating != null ? Number(shop.rating).toFixed(1) : "—"}</div>
              <div><span className="text-muted-foreground">Products:</span> {shop.products_count ?? 0}</div>
            </div>
          </div>
          <button onClick={handleEdit} className="px-6 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary/90">
            Edit Shop
          </button>
        </div>
      )}
    </VendorLayout>
  );
}
