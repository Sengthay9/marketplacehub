"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Camera, ImagePlus, Store } from "lucide-react";
import api from "@/lib/axios";
import VendorLayout from "@/components/layout/dashboards/VendorLayout";

export default function VendorShop() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", contact_number: "", address: "", open_time: "", close_time: "" });
  const logoRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);

  const { data: shop, isLoading } = useQuery({
    queryKey: ["vendor-shop"],
    queryFn: async () => (await api.get("/vendor/shop")).data.shop,
  });

  const updateMutation = useMutation({
    mutationFn: (data: typeof form) => api.put("/vendor/shop", data),
    onSuccess: () => { toast.success("Shop updated!"); qc.invalidateQueries({ queryKey: ["vendor-shop"] }); setEditing(false); },
    onError: () => toast.error("Failed to update shop."),
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => api.post("/vendor/shop", data),
    onSuccess: () => { toast.success("Shop created!"); qc.invalidateQueries({ queryKey: ["vendor-shop"] }); setEditing(false); },
    onError: () => toast.error("Failed to create shop."),
  });

  const toggleMutation = useMutation({
    mutationFn: () => api.post("/vendor/shop/toggle"),
    onSuccess: (res) => { toast.success(res.data.message); qc.invalidateQueries({ queryKey: ["vendor-shop"] }); },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Failed to toggle shop."),
  });

  const uploadLogo = async (file: File) => {
    const fd = new FormData(); fd.append("logo", file);
    try {
      await api.post("/vendor/shop/logo", fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Logo updated.");
      qc.invalidateQueries({ queryKey: ["vendor-shop"] });
    } catch { toast.error("Failed to upload logo."); }
  };

  const uploadBanner = async (file: File) => {
    const fd = new FormData(); fd.append("banner", file);
    try {
      await api.post("/vendor/shop/banner", fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Banner updated.");
      qc.invalidateQueries({ queryKey: ["vendor-shop"] });
    } catch { toast.error("Failed to upload banner."); }
  };

  const handleEdit = () => {
    setForm({
      name:           shop?.name ?? "",
      description:    shop?.description ?? "",
      contact_number: shop?.contact_number ?? "",
      address:        shop?.address ?? "",
      open_time:      shop?.open_time ?? "",
      close_time:     shop?.close_time ?? "",
    });
    setEditing(true);
  };

  const statusColor = (s: string) =>
    s === "approved" ? "bg-green-100 text-green-700" :
    s === "closed"   ? "bg-gray-100 text-gray-600" :
    s === "suspended"? "bg-orange-100 text-orange-700" :
    "bg-red-100 text-red-700";

  const statusLabel = (s: string) =>
    s === "approved" ? "Open" : s === "closed" ? "Closed" : s;

  if (isLoading) return (
    <VendorLayout title="My Shop">
      <div className="space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}</div>
    </VendorLayout>
  );

  if (!shop && !editing) return (
    <VendorLayout title="My Shop">
      <div className="text-center py-20">
        <Store className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground mb-4">You don't have a shop yet.</p>
        <button onClick={() => { setForm({ name: "", description: "", contact_number: "", address: "", open_time: "", close_time: "" }); setEditing(true); }}
          className="px-6 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary/90">
          Create Your Shop
        </button>
      </div>
    </VendorLayout>
  );

  if (editing) return (
    <VendorLayout title="My Shop">
      <form onSubmit={(e) => { e.preventDefault(); shop ? updateMutation.mutate(form) : createMutation.mutate(form); }} className="max-w-lg space-y-4">
        <h2 className="font-bold text-lg">{shop ? "Edit Shop" : "Create Shop"}</h2>
        {[
          { label: "Shop Name *", key: "name", placeholder: "My Awesome Store" },
          { label: "Phone", key: "contact_number", placeholder: "+855 12 345 678" },
          { label: "Address", key: "address", placeholder: "Phnom Penh, Cambodia" },
        ].map(({ label, key, placeholder }) => (
          <div key={key}>
            <label className="block text-sm font-medium mb-1">{label}</label>
            <input value={form[key as keyof typeof form]}
              onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              placeholder={placeholder} required={key === "name"}
              className="w-full border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
        ))}
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={3} placeholder="What does your shop sell?"
            className="w-full border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Open Time</label>
            <input type="time" value={form.open_time} onChange={(e) => setForm((f) => ({ ...f, open_time: e.target.value }))}
              className="w-full border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Close Time</label>
            <input type="time" value={form.close_time} onChange={(e) => setForm((f) => ({ ...f, close_time: e.target.value }))}
              className="w-full border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
        </div>
        <div className="flex gap-3 pt-1">
          <button type="submit" className="px-6 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary/90">
            {shop ? "Save Changes" : "Create Shop"}
          </button>
          <button type="button" onClick={() => setEditing(false)} className="px-6 py-2.5 bg-muted rounded-xl font-medium hover:bg-muted/80">
            Cancel
          </button>
        </div>
      </form>
    </VendorLayout>
  );

  const isAdminRestricted = ["suspended", "banned"].includes(shop?.status);

  return (
    <VendorLayout title="My Shop">
      <div className="max-w-2xl space-y-6">

        {/* Shop card with banner + logo */}
        <div className="bg-card border rounded-2xl overflow-hidden">
          {/* Banner */}
          <div className="relative h-36 bg-muted group cursor-pointer" onClick={() => bannerRef.current?.click()}>
            {shop?.banner
              ? <img src={shop.banner} alt="banner" className="w-full h-full object-cover"
                  onError={(e) => { e.currentTarget.style.display = "none"; }} />
              : <div className="w-full h-full flex items-center justify-center text-muted-foreground"><ImagePlus className="w-8 h-8" /></div>
            }
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
              <span className="text-white text-sm font-medium flex items-center gap-2"><Camera className="w-4 h-4" /> Change Banner</span>
            </div>
            <input ref={bannerRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadBanner(e.target.files[0])} />
          </div>

          {/* Logo + info */}
          <div className="px-6 pb-6">
            <div className="flex items-end gap-4 -mt-8 mb-4">
              {/* Logo */}
              <div className="relative group cursor-pointer flex-shrink-0" onClick={() => logoRef.current?.click()}>
                <div className="w-16 h-16 rounded-xl border-4 border-card bg-muted overflow-hidden">
                  {shop?.logo
                    ? <img src={shop.logo} alt="logo" className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          e.currentTarget.nextElementSibling?.classList.remove("hidden");
                        }} />
                    : null
                  }
                  <div className={`w-full h-full flex items-center justify-center text-muted-foreground ${shop?.logo ? "hidden" : ""}`}>
                    <Store className="w-6 h-6" />
                  </div>
                </div>
                <div className="absolute inset-0 bg-black/50 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                  <Camera className="w-4 h-4 text-white" />
                </div>
                <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadLogo(e.target.files[0])} />
              </div>

              <div className="flex-1 pt-10">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-bold">{shop.name}</h2>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${statusColor(shop.status)}`}>
                    {statusLabel(shop.status)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">/{shop.slug}</p>
              </div>
            </div>

            {shop.description && <p className="text-sm text-muted-foreground mb-4">{shop.description}</p>}

            <div className="grid grid-cols-2 gap-3 text-sm mb-4">
              <div><span className="text-muted-foreground">Phone: </span>{shop.contact_number || "—"}</div>
              <div><span className="text-muted-foreground">Address: </span>{shop.address || "—"}</div>
              <div><span className="text-muted-foreground">Rating: </span>⭐ {shop.rating != null ? Number(shop.rating).toFixed(1) : "—"}</div>
              <div>
                <span className="text-muted-foreground">Hours: </span>
                {shop.open_time && shop.close_time ? `${shop.open_time} – ${shop.close_time}` : "—"}
              </div>
            </div>

            <div className="flex gap-3 flex-wrap">
              <button onClick={handleEdit}
                className="px-5 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90">
                Edit Shop
              </button>
              {!isAdminRestricted && (
                <button onClick={() => toggleMutation.mutate()} disabled={toggleMutation.isPending}
                  className={`px-5 py-2 rounded-xl text-sm font-medium transition ${
                    shop.status === "approved"
                      ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      : "bg-green-100 text-green-700 hover:bg-green-200"
                  }`}>
                  {shop.status === "approved" ? "Close Shop" : "Open Shop"}
                </button>
              )}
            </div>
          </div>
        </div>

      </div>
    </VendorLayout>
  );
}
