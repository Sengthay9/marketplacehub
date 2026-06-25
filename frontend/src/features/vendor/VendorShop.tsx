"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Camera, ImagePlus, Store, Clock, Phone, MapPin,
  Star, Edit3, CheckCircle, XCircle, Loader2, Power,
} from "lucide-react";
import api from "@/lib/axios";
import VendorLayout from "@/components/layout/dashboards/VendorLayout";

type ShopForm = {
  name: string;
  description: string;
  contact_number: string;
  address: string;
  open_time: string;
  close_time: string;
};

const emptyForm: ShopForm = {
  name: "", description: "", contact_number: "", address: "", open_time: "", close_time: "",
};

export default function VendorShop() {
  const qc = useQueryClient();
  const [editing, setEditing]   = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm]         = useState<ShopForm>(emptyForm);
  const logoRef                 = useRef<HTMLInputElement>(null);
  const bannerRef               = useRef<HTMLInputElement>(null);

  const { data: shop, isLoading } = useQuery({
    queryKey: ["vendor-shop"],
    queryFn: async () => (await api.get("/vendor/shop")).data.shop,
  });

  const createMutation = useMutation({
    mutationFn: (data: ShopForm) => api.post("/vendor/shop", data),
    onSuccess: () => {
      toast.success("Shop created successfully.");
      qc.invalidateQueries({ queryKey: ["vendor-shop"] });
      setCreating(false);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Failed to create shop."),
  });

  const updateMutation = useMutation({
    mutationFn: (data: ShopForm) => api.put("/vendor/shop", data),
    onSuccess: () => {
      toast.success("Shop updated.");
      qc.invalidateQueries({ queryKey: ["vendor-shop"] });
      setEditing(false);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Failed to update shop."),
  });

  const toggleMutation = useMutation({
    mutationFn: () => api.post("/vendor/shop/toggle"),
    onSuccess: (res) => {
      toast.success(res.data.message);
      qc.invalidateQueries({ queryKey: ["vendor-shop"] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Failed to toggle shop."),
  });

  const uploadLogo = async (file: File) => {
    const fd = new FormData();
    fd.append("logo", file);
    try {
      await api.post("/vendor/shop/logo", fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Logo updated.");
      qc.invalidateQueries({ queryKey: ["vendor-shop"] });
    } catch { toast.error("Failed to upload logo."); }
  };

  const uploadBanner = async (file: File) => {
    const fd = new FormData();
    fd.append("banner", file);
    try {
      await api.post("/vendor/shop/banner", fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Banner updated.");
      qc.invalidateQueries({ queryKey: ["vendor-shop"] });
    } catch { toast.error("Failed to upload banner."); }
  };

  const startEdit = () => {
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

  const startCreate = () => { setForm(emptyForm); setCreating(true); };

  const adminStatus    = shop?.status;
  const isOpen         = shop?.is_open ?? false;
  const isRestricted   = ["suspended", "banned"].includes(adminStatus ?? "");
  const hasSchedule    = !!(shop?.open_time && shop?.close_time);

  const adminBadge = () => {
    if (adminStatus === "suspended") return { label: "Suspended", cls: "bg-orange-100 text-orange-700" };
    if (adminStatus === "banned")    return { label: "Banned",    cls: "bg-red-100 text-red-700" };
    return null;
  };

  if (isLoading) {
    return (
      <VendorLayout title="My Shop">
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}
        </div>
      </VendorLayout>
    );
  }

  if (!shop && !creating) {
    return (
      <VendorLayout title="My Shop">
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center">
            <Store className="w-10 h-10 text-muted-foreground/50" />
          </div>
          <h2 className="text-xl font-bold">You don't have a shop yet</h2>
          <p className="text-muted-foreground text-sm text-center max-w-xs">
            Create your shop to start selling.
          </p>
          <button onClick={startCreate}
            className="mt-2 px-8 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition">
            Create Shop
          </button>
        </div>
      </VendorLayout>
    );
  }

  if (creating || editing) {
    const isCreate  = creating;
    const isPending = isCreate ? createMutation.isPending : updateMutation.isPending;

    return (
      <VendorLayout title={isCreate ? "Create Shop" : "Edit Shop"}>
        <div className="max-w-xl">
          <h2 className="text-xl font-bold mb-6">{isCreate ? "Create Your Shop" : "Edit Shop"}</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              isCreate ? createMutation.mutate(form) : updateMutation.mutate(form);
            }}
            className="space-y-4 bg-card border rounded-2xl p-6"
          >
            <div>
              <label className="block text-sm font-semibold mb-1.5">Shop Name *</label>
              <input value={form.name} required
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Yumi Store"
                className="w-full border-2 rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1.5">Phone Number</label>
              <input value={form.contact_number}
                onChange={(e) => setForm((f) => ({ ...f, contact_number: e.target.value }))}
                placeholder="+855 12 345 678"
                className="w-full border-2 rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1.5">Shop Address</label>
              <input value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                placeholder="Phnom Penh, Cambodia"
                className="w-full border-2 rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1.5">Description</label>
              <textarea value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3} placeholder="What does your shop sell?"
                className="w-full border-2 rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold mb-1.5">Open Time</label>
                <input type="time" value={form.open_time}
                  onChange={(e) => setForm((f) => ({ ...f, open_time: e.target.value }))}
                  className="w-full border-2 rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5">Close Time</label>
                <input type="time" value={form.close_time}
                  onChange={(e) => setForm((f) => ({ ...f, close_time: e.target.value }))}
                  className="w-full border-2 rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={isPending}
                className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition disabled:opacity-50 flex items-center justify-center gap-2">
                {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                {isCreate ? "Create Shop" : "Save Changes"}
              </button>
              <button type="button" onClick={() => isCreate ? setCreating(false) : setEditing(false)}
                className="flex-1 py-2.5 border-2 rounded-xl text-sm font-medium hover:bg-muted transition">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </VendorLayout>
    );
  }

  const badge = adminBadge();
  const hasBadge = badge !== null;

  return (
    <VendorLayout title="My Shop">
      <div className="max-w-2xl space-y-4">

        <div className="bg-card border rounded-2xl overflow-hidden">

          {/* Banner */}
          <div className="relative h-52 bg-muted group cursor-pointer" onClick={() => bannerRef.current?.click()}>
            {shop?.banner
              ? <img src={shop.banner} alt="banner" className="w-full h-full object-cover" />
              : <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
                  <ImagePlus className="w-10 h-10" />
                  <span className="text-sm font-medium">Click to upload banner</span>
                </div>
            }
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition rounded-t-2xl">
              <span className="text-white text-sm font-semibold flex items-center gap-2 bg-black/40 px-4 py-2 rounded-xl">
                <Camera className="w-4 h-4" /> Change Banner
              </span>
            </div>
            <input ref={bannerRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => e.target.files?.[0] && uploadBanner(e.target.files[0])} />
          </div>

          {/* Logo + info */}
          <div className="px-6 pb-6">
            <div className="flex items-end gap-5 -mt-12 mb-4">
              <div className="relative group cursor-pointer shrink-0" onClick={() => logoRef.current?.click()}>
                <div className="w-24 h-24 rounded-2xl border-4 border-card bg-muted overflow-hidden shadow-lg">
                  {shop?.logo
                    ? <img src={shop.logo} alt="logo" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-muted-foreground">
                        <Store className="w-8 h-8" />
                        <span className="text-[10px]">Logo</span>
                      </div>
                  }
                </div>
                <div className="absolute inset-0 bg-black/50 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                  <Camera className="w-5 h-5 text-white" />
                </div>
                <input ref={logoRef} type="file" accept="image/*" className="hidden"
                  onChange={(e) => e.target.files?.[0] && uploadLogo(e.target.files[0])} />
              </div>

              <div className="flex-1 pt-10">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-bold">{shop.name}</h2>
                  {hasBadge && (
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${badge!.cls}`}>
                      {badge!.label}
                    </span>
                  )}
                  {!isRestricted && (
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 ${
                      isOpen ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                    }`}>
                      {isOpen
                        ? <><CheckCircle className="w-3 h-3" /> Open</>
                        : <><XCircle className="w-3 h-3" /> Closed</>
                      }
                    </span>
                  )}
                </div>
              </div>
            </div>

            {shop.description && (
              <p className="text-sm text-muted-foreground mb-4">{shop.description}</p>
            )}

            <div className="grid grid-cols-2 gap-y-2 gap-x-6 text-sm mb-5">
              {shop.contact_number && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Phone className="w-3.5 h-3.5 shrink-0" /><span>{shop.contact_number}</span>
                </div>
              )}
              {shop.address && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5 shrink-0" /><span>{shop.address}</span>
                </div>
              )}
              {(shop.open_time || shop.close_time) && (
                <div className="flex items-center gap-1.5 col-span-2">
                  <Clock className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                  <span className="text-muted-foreground">{shop.open_time || "—"} – {shop.close_time || "—"}</span>
                </div>
              )}
              {shop.rating != null && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400 shrink-0" />
                  <span>{Number(shop.rating).toFixed(1)} ({shop.review_count ?? 0} reviews)</span>
                </div>
              )}
            </div>

            {isRestricted && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                Your shop has been <strong>{adminStatus}</strong> by admin. Contact support.
              </div>
            )}

            {!isRestricted && hasSchedule && (
              <div className="mb-4 p-3 rounded-xl text-sm border bg-muted/40 border-border text-muted-foreground">
                <p className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  Schedule: {shop.open_time} – {shop.close_time}. Open/close is managed automatically.
                </p>
              </div>
            )}

            <div className="flex gap-3 flex-wrap">
              <button onClick={startEdit}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition">
                <Edit3 className="w-4 h-4" /> Edit Shop
              </button>

              {!isRestricted && (
                <button
                  onClick={() => toggleMutation.mutate()}
                  disabled={toggleMutation.isPending}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-50 ${
                    isOpen
                      ? "bg-red-100 text-red-700 hover:bg-red-200"
                      : "bg-green-100 text-green-700 hover:bg-green-200"
                  }`}
                >
                  {toggleMutation.isPending
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Power className="w-4 h-4" />
                  }
                  {isOpen ? "Close Shop" : "Open Shop"}
                </button>
              )}
            </div>
          </div>
        </div>

      </div>
    </VendorLayout>
  );
}
