"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  User, Package, Settings, LogOut, ChevronRight, ChevronLeft,
  MapPin, Plus, Trash2, Star, Pencil, X, Check, CreditCard,
} from "lucide-react";
import CardInput, { type CardData } from "@/features/checkout/CardInput";
import { toast } from "sonner";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/auth.store";
import { formatCurrency, formatDate, getOrderStatusColor } from "@/lib/utils";
import type { Address } from "@/types";

// Load map only on client — it uses window/document
const AddressMapPicker = dynamic(() => import("./AddressMapPicker"), { ssr: false });

type Tab = "profile" | "orders" | "addresses" | "payment" | "settings";

interface AddressForm {
  label: string;
  recipient_name: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  postal_code: string;
  latitude?: number;
  longitude?: number;
}

const EMPTY_FORM: AddressForm = {
  label: "Home", recipient_name: "", phone: "",
  street: "", city: "", state: "", postal_code: "",
};

export default function CustomerAccount() {
  const router = useRouter();
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("profile");

  // Profile
  const [editingProfile, setEditingProfile]   = useState(false);
  const [profileForm, setProfileForm]         = useState({ name: "", phone: "" });
  const [pwForm, setPwForm]                   = useState({ current_password: "", password: "", password_confirmation: "" });

  // Payment methods
  const EMPTY_CARD: CardData = { number: "", holder: "", expiryMonth: "", expiryYear: "", cvv: "" };
  const [cardData, setCardData]               = useState<CardData>(EMPTY_CARD);
  const [cardErrors, setCardErrors]           = useState<Partial<Record<keyof CardData, string>>>({});
  const [showCardForm, setShowCardForm]       = useState(false);

  // Addresses
  const [showAddrForm, setShowAddrForm]       = useState(false);
  const [editingAddr, setEditingAddr]         = useState<Address | null>(null);
  const [addrForm, setAddrForm]               = useState<AddressForm>(EMPTY_FORM);

  const { data: me } = useQuery({
    queryKey: ["customer-me"],
    queryFn: async () => (await api.get("/auth/me")).data.user,
  });

  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ["customer-orders"],
    queryFn: async () => (await api.get("/customer/orders")).data.data,
    enabled: tab === "orders",
  });

  const { data: savedCards } = useQuery({
    queryKey: ["saved-cards"],
    queryFn: async () => (await api.get("/customer/cards")).data.data as any[],
    enabled: tab === "payment",
  });

  const saveCardMutation = useMutation({
    mutationFn: (d: CardData & { set_default: boolean }) =>
      api.post("/customer/cards", {
        card_number:      d.number.replace(/\s/g, ""),
        card_holder_name: d.holder,
        expiry_month:     d.expiryMonth,
        expiry_year:      d.expiryYear,
        set_default:      d.set_default,
      }),
    onSuccess: () => {
      toast.success("Card saved.");
      qc.invalidateQueries({ queryKey: ["saved-cards"] });
      setShowCardForm(false);
      setCardData(EMPTY_CARD);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Failed to save card."),
  });

  const deleteCardMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/customer/cards/${id}`),
    onSuccess: () => { toast.success("Card removed."); qc.invalidateQueries({ queryKey: ["saved-cards"] }); },
  });

  const setDefaultCardMutation = useMutation({
    mutationFn: (id: number) => api.post(`/customer/cards/${id}/default`),
    onSuccess: () => { toast.success("Default card updated."); qc.invalidateQueries({ queryKey: ["saved-cards"] }); },
  });

  const handleSaveCard = () => {
    const errs: Partial<Record<keyof CardData, string>> = {};
    if (cardData.number.replace(/\s/g, "").length < 13) errs.number = "Enter a valid card number.";
    if (!cardData.holder.trim())                         errs.holder = "Enter the cardholder name.";
    if (!cardData.expiryMonth || !cardData.expiryYear)   errs.expiryMonth = "Enter expiry date.";
    if (cardData.cvv.length < 3)                         errs.cvv = "Enter CVV.";
    setCardErrors(errs);
    if (Object.keys(errs).length > 0) return;
    saveCardMutation.mutate({ ...cardData, set_default: !savedCards?.length });
  };

  const { data: addresses } = useQuery({
    queryKey: ["addresses"],
    queryFn: async () => (await api.get("/customer/addresses")).data.data as Address[],
    enabled: tab === "addresses",
  });

  // Profile mutations
  const updateProfileMutation = useMutation({
    mutationFn: (d: typeof profileForm) => api.put("/me/profile", d),
    onSuccess: () => { toast.success("Profile updated!"); setEditingProfile(false); qc.invalidateQueries({ queryKey: ["customer-me"] }); },
    onError: () => toast.error("Failed to update profile."),
  });

  const changePwMutation = useMutation({
    mutationFn: (d: typeof pwForm) => api.put("/me/profile", d),
    onSuccess: () => { toast.success("Password changed!"); setPwForm({ current_password: "", password: "", password_confirmation: "" }); },
    onError: () => toast.error("Incorrect current password or validation failed."),
  });

  const logoutMutation = useMutation({
    mutationFn: () => api.post("/auth/logout"),
    onSuccess: () => { clearAuth(); toast.success("Signed out."); router.push("/login"); },
  });

  // Address mutations
  const saveAddrMutation = useMutation({
    mutationFn: (data: AddressForm) =>
      editingAddr
        ? api.put(`/customer/addresses/${editingAddr.id}`, data)
        : api.post("/customer/addresses", data),
    onSuccess: () => {
      toast.success(editingAddr ? "Address updated." : "Address saved.");
      qc.invalidateQueries({ queryKey: ["addresses"] });
      setShowAddrForm(false);
      setEditingAddr(null);
      setAddrForm(EMPTY_FORM);
    },
    onError: () => toast.error("Failed to save address."),
  });

  const deleteAddrMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/customer/addresses/${id}`),
    onSuccess: () => { toast.success("Address removed."); qc.invalidateQueries({ queryKey: ["addresses"] }); },
    onError: () => toast.error("Failed to delete address."),
  });

  const setDefaultMutation = useMutation({
    mutationFn: (id: number) => api.post(`/customer/addresses/${id}/default`),
    onSuccess: () => { toast.success("Default address updated."); qc.invalidateQueries({ queryKey: ["addresses"] }); },
    onError: () => toast.error("Failed to update default."),
  });

  const openAddForm = () => {
    setEditingAddr(null);
    setAddrForm(EMPTY_FORM);
    setShowAddrForm(true);
  };

  const openEditForm = (addr: Address) => {
    setEditingAddr(addr);
    setAddrForm({
      label: addr.label,
      recipient_name: addr.recipient_name,
      phone: addr.phone,
      street: addr.street,
      city: addr.city,
      state: addr.state ?? "",
      postal_code: addr.postal_code,
      latitude: (addr as any).latitude,
      longitude: (addr as any).longitude,
    });
    setShowAddrForm(true);
  };

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: "profile",   label: "Profile",   icon: User },
    { key: "orders",    label: "My Orders", icon: Package },
    { key: "addresses", label: "Addresses", icon: MapPin },
    { key: "payment",   label: "Payments", icon: CreditCard },
    { key: "settings",  label: "Settings",  icon: Settings },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Back */}
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-5 transition">
        <ChevronLeft className="w-4 h-4" /> Back to Home
      </Link>

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border">
          {me?.avatar
            ? <Image src={me.avatar} alt={me.name} width={64} height={64} className="object-cover w-full h-full" />
            : <User className="w-8 h-8 text-primary/60" />}
        </div>
        <div>
          <h1 className="text-2xl font-bold">{me?.name ?? "My Account"}</h1>
          <p className="text-muted-foreground text-sm">{me?.email}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b mb-8 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition -mb-px whitespace-nowrap ${
              tab === key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      {/* ── Profile tab ── */}
      {tab === "profile" && (
        <div className="bg-card border rounded-2xl p-6 max-w-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Personal Info</h2>
            {!editingProfile && (
              <button onClick={() => { setProfileForm({ name: me?.name ?? "", phone: me?.phone ?? "" }); setEditingProfile(true); }}
                className="text-sm text-primary hover:underline">Edit</button>
            )}
          </div>
          {editingProfile ? (
            <form onSubmit={(e) => { e.preventDefault(); updateProfileMutation.mutate(profileForm); }} className="space-y-3">
              {([["name", "Full Name", "text"], ["phone", "Phone", "tel"]] as const).map(([key, label, type]) => (
                <div key={key}>
                  <label className="block text-sm font-medium mb-1">{label}</label>
                  <input type={type} value={profileForm[key as keyof typeof profileForm]}
                    onChange={(e) => setProfileForm((f) => ({ ...f, [key]: e.target.value }))}
                    className="w-full border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
              ))}
              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={updateProfileMutation.isPending}
                  className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 disabled:opacity-50">Save</button>
                <button type="button" onClick={() => setEditingProfile(false)}
                  className="px-5 py-2.5 bg-muted rounded-xl text-sm font-medium hover:bg-muted/80">Cancel</button>
              </div>
            </form>
          ) : (
            <div className="space-y-3 text-sm">
              {[["Name", me?.name], ["Email", me?.email], ["Phone", me?.phone || "—"]].map(([label, val]) => (
                <div key={label} className="flex justify-between py-1 border-b last:border-0">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium">{val ?? "—"}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Orders tab ── */}
      {tab === "orders" && (
        <div className="space-y-3">
          {ordersLoading ? (
            Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 bg-muted rounded-2xl animate-pulse" />)
          ) : !orders?.length ? (
            <div className="text-center py-20 text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No orders yet.</p>
              <Link href="/products" className="mt-3 inline-block text-sm text-primary hover:underline">Start shopping</Link>
            </div>
          ) : (
            orders.map((order: any) => (
              <Link key={order.id} href={`/orders/${order.id}`}
                className="flex items-center justify-between bg-card border rounded-2xl p-5 hover:shadow-sm transition">
                <div>
                  <p className="font-semibold text-sm">{order.order_number}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{formatDate(order.created_at)} · {order.items_count} item(s)</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${getOrderStatusColor(order.status)}`}>{order.status}</span>
                  <span className="font-bold text-sm">{formatCurrency(order.total)}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </Link>
            ))
          )}
        </div>
      )}

      {/* ── Addresses tab ── */}
      {tab === "addresses" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Delivery Addresses</h2>
            {!showAddrForm && (
              <button onClick={openAddForm}
                className="flex items-center gap-1.5 text-sm px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition">
                <Plus className="w-4 h-4" /> Add Address
              </button>
            )}
          </div>

          {/* Add / Edit form */}
          {showAddrForm && (
            <div className="bg-card border rounded-2xl p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{editingAddr ? "Edit Address" : "New Address"}</h3>
                <button onClick={() => { setShowAddrForm(false); setEditingAddr(null); setAddrForm(EMPTY_FORM); }}
                  className="p-1.5 rounded-lg hover:bg-muted">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Map picker */}
              <AddressMapPicker
                initialLat={addrForm.latitude}
                initialLng={addrForm.longitude}
                onPick={(loc) => setAddrForm((f) => ({
                  ...f,
                  latitude:    loc.lat,
                  longitude:   loc.lng,
                  street:      loc.street  || f.street,
                  city:        loc.city    || f.city,
                  state:       loc.state   || f.state,
                  postal_code: loc.postal_code || f.postal_code,
                }))}
              />

              {/* Fields */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Label</label>
                  <select value={addrForm.label} onChange={(e) => setAddrForm((f) => ({ ...f, label: e.target.value }))}
                    className="w-full border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30">
                    {["Home", "Work", "Other"].map((l) => <option key={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <input type="tel" value={addrForm.phone} onChange={(e) => setAddrForm((f) => ({ ...f, phone: e.target.value }))}
                    placeholder="+855 ..."
                    className="w-full border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Recipient Name</label>
                  <input type="text" value={addrForm.recipient_name} onChange={(e) => setAddrForm((f) => ({ ...f, recipient_name: e.target.value }))}
                    placeholder="Full name of the person receiving the order"
                    className="w-full border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Street / House No.</label>
                  <input type="text" value={addrForm.street} onChange={(e) => setAddrForm((f) => ({ ...f, street: e.target.value }))}
                    placeholder="Auto-filled from map or type manually"
                    className="w-full border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">City</label>
                  <input type="text" value={addrForm.city} onChange={(e) => setAddrForm((f) => ({ ...f, city: e.target.value }))}
                    className="w-full border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Province / State</label>
                  <input type="text" value={addrForm.state} onChange={(e) => setAddrForm((f) => ({ ...f, state: e.target.value }))}
                    className="w-full border rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
              </div>

              {addrForm.latitude && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-primary" />
                  Pin: {addrForm.latitude.toFixed(5)}, {addrForm.longitude?.toFixed(5)}
                </p>
              )}

              <div className="flex gap-3 pt-1">
                <button onClick={() => saveAddrMutation.mutate(addrForm)} disabled={saveAddrMutation.isPending}
                  className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
                  <Check className="w-4 h-4" />
                  {saveAddrMutation.isPending ? "Saving…" : "Save Address"}
                </button>
                <button onClick={() => { setShowAddrForm(false); setEditingAddr(null); setAddrForm(EMPTY_FORM); }}
                  className="px-5 py-2.5 bg-muted rounded-xl text-sm font-medium hover:bg-muted/80">Cancel</button>
              </div>
            </div>
          )}

          {/* Address list */}
          {!addresses?.length && !showAddrForm ? (
            <div className="text-center py-16 bg-muted/30 rounded-2xl border-2 border-dashed">
              <MapPin className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-muted-foreground text-sm mb-4">No delivery addresses yet.</p>
              <button onClick={openAddForm}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90">
                <Plus className="w-4 h-4" /> Add your first address
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {addresses?.map((addr) => (
                <div key={addr.id}
                  className={`flex items-start justify-between p-4 rounded-2xl border-2 transition ${
                    addr.is_default ? "border-primary bg-primary/5" : "border-border"
                  }`}>
                  <div className="flex items-start gap-3">
                    <MapPin className={`w-4 h-4 mt-0.5 shrink-0 ${addr.is_default ? "text-primary" : "text-muted-foreground"}`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{addr.label}</span>
                        {addr.is_default && (
                          <span className="flex items-center gap-0.5 text-[10px] text-primary font-bold bg-primary/10 px-1.5 py-0.5 rounded-full">
                            <Star className="w-2.5 h-2.5 fill-primary" /> Default
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium mt-0.5">{addr.recipient_name}</p>
                      <p className="text-xs text-muted-foreground">{addr.street}, {addr.city}{addr.state ? `, ${addr.state}` : ""}</p>
                      <p className="text-xs text-muted-foreground">{addr.phone}</p>
                      {(addr as any).latitude && (
                        <p className="text-[10px] text-primary/60 mt-0.5 flex items-center gap-0.5">
                          <MapPin className="w-2.5 h-2.5" />
                          {Number((addr as any).latitude).toFixed(5)}, {Number((addr as any).longitude).toFixed(5)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    {!addr.is_default && (
                      <button onClick={() => setDefaultMutation.mutate(addr.id)}
                        title="Set as default"
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition">
                        <Star className="w-4 h-4" />
                      </button>
                    )}
                    <button onClick={() => openEditForm(addr)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => { if (confirm("Delete this address?")) deleteAddrMutation.mutate(addr.id); }}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Payment Methods tab ── */}
      {tab === "payment" && (
        <div className="space-y-4 max-w-2xl">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Saved Cards</h2>
            {!showCardForm && (
              <button onClick={() => setShowCardForm(true)}
                className="flex items-center gap-1.5 text-sm px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition">
                <Plus className="w-4 h-4" /> Add Card
              </button>
            )}
          </div>

          {showCardForm && (
            <div className="bg-card border rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">New Card</h3>
                <button onClick={() => { setShowCardForm(false); setCardData(EMPTY_CARD); setCardErrors({}); }}
                  className="p-1.5 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
              </div>
              <CardInput value={cardData} onChange={setCardData} errors={cardErrors} />
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5" />
                CVV is never stored — used only for verification at time of payment.
              </p>
              <div className="flex gap-3 pt-1">
                <button onClick={handleSaveCard} disabled={saveCardMutation.isPending}
                  className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
                  <Check className="w-4 h-4" />
                  {saveCardMutation.isPending ? "Saving…" : "Save Card"}
                </button>
                <button onClick={() => { setShowCardForm(false); setCardData(EMPTY_CARD); setCardErrors({}); }}
                  className="px-5 py-2.5 bg-muted rounded-xl text-sm font-medium hover:bg-muted/80">Cancel</button>
              </div>
            </div>
          )}

          {!savedCards?.length && !showCardForm ? (
            <div className="text-center py-16 bg-muted/30 rounded-2xl border-2 border-dashed">
              <CreditCard className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-muted-foreground text-sm mb-4">No saved cards yet.</p>
              <button onClick={() => setShowCardForm(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90">
                <Plus className="w-4 h-4" /> Add your first card
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {savedCards?.map((card) => (
                <div key={card.id}
                  className={`flex items-center justify-between p-4 rounded-2xl border-2 transition ${
                    card.is_default ? "border-primary bg-primary/5" : "border-border"
                  }`}>
                  <div className="flex items-center gap-3">
                    <CreditCard className={`w-5 h-5 shrink-0 ${card.is_default ? "text-primary" : "text-muted-foreground"}`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-sm">•••• {card.card_last_four ?? card.masked_number?.slice(-4)}</span>
                        <span className="text-xs capitalize text-muted-foreground">{card.card_brand}</span>
                        {card.is_default && (
                          <span className="flex items-center gap-0.5 text-[10px] text-primary font-bold bg-primary/10 px-1.5 py-0.5 rounded-full">
                            <Star className="w-2.5 h-2.5 fill-primary" /> Default
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {card.card_holder_name} · Exp {card.expiry_month}/{String(card.expiry_year).slice(2)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {!card.is_default && (
                      <button onClick={() => setDefaultCardMutation.mutate(card.id)}
                        title="Set as default"
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition">
                        <Star className="w-4 h-4" />
                      </button>
                    )}
                    <button onClick={() => { if (confirm("Remove this card?")) deleteCardMutation.mutate(card.id); }}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Settings tab ── */}
      {tab === "settings" && (
        <div className="space-y-6 max-w-lg">
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
              <button type="submit" disabled={changePwMutation.isPending}
                className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
                {changePwMutation.isPending ? "Updating…" : "Update Password"}
              </button>
            </form>
          </div>
          <div className="bg-card border rounded-2xl p-6">
            <h2 className="font-semibold mb-1">Session</h2>
            <p className="text-sm text-muted-foreground mb-4">Signed in as <span className="font-medium">{me?.email}</span></p>
            <button onClick={() => logoutMutation.mutate()} disabled={logoutMutation.isPending}
              className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition disabled:opacity-50">
              <LogOut className="w-4 h-4" />
              {logoutMutation.isPending ? "Signing out…" : "Sign Out"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
