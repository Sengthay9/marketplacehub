"use client";

import { useState } from "react";
import { X, AlertTriangle, Clock, Ban, RotateCcw, XCircle, Image, Type, DollarSign, Package, PenLine, CheckCircle2, Store, ImageIcon, MapPin, Phone } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/axios";

export type ModerationAction = "warn" | "suspend" | "ban" | "unban" | "reject";

interface Target { id: number; name: string; role?: string; type?: "user" | "vendor" | "product" }

interface Props {
  target: Target;
  action: ModerationAction;
  queryKey: string;
  onClose: () => void;
  onActionSuccess?: (action: ModerationAction) => void;
}

const SUSPEND_OPTIONS = [
  { label: "1 day",    days: 1   },
  { label: "3 days",   days: 3   },
  { label: "1 week",   days: 7   },
  { label: "2 weeks",  days: 14  },
  { label: "1 month",  days: 30  },
  { label: "3 months", days: 90  },
];

/* ── Preset reasons per action for vendors ── */
const VENDOR_REASONS: Record<"warn" | "suspend" | "ban", { icon: React.ElementType; label: string; reason: string }[]> = {
  warn: [
    { icon: Store,     label: "Shop name not acceptable",        reason: "Your shop name is not acceptable — it may be inappropriate, misleading, or violate platform naming policies. Please update your shop name." },
    { icon: Image,     label: "Shop logo not acceptable",        reason: "Your shop logo is not acceptable — it may contain inappropriate content or not represent your shop accurately. Please upload a suitable logo." },
    { icon: ImageIcon, label: "Background image not acceptable", reason: "Your shop background image is not acceptable — it may contain inappropriate content or violate platform guidelines. Please upload a suitable background image." },
    { icon: MapPin,    label: "Location incorrect",              reason: "The location listed on your shop appears to be incorrect or invalid. Please update your shop address with the correct location." },
    { icon: Phone,     label: "Phone number incorrect",          reason: "The phone number listed on your shop appears to be incorrect or invalid. Please update your shop with a valid contact number." },
  ],
  suspend: [
    { icon: Store,     label: "Shop name not acceptable",        reason: "Shop suspended: your shop name violates platform policies. Please update your shop name and contact support to request reinstatement." },
    { icon: Image,     label: "Shop logo not acceptable",        reason: "Shop suspended: your shop logo contains inappropriate content or violates platform guidelines. Please update your logo and contact support." },
    { icon: ImageIcon, label: "Background image not acceptable", reason: "Shop suspended: your shop background image violates platform guidelines. Please upload a suitable background image and contact support." },
    { icon: MapPin,    label: "Location incorrect",              reason: "Shop suspended: the location listed on your shop is incorrect or unverifiable. Please update your shop address and contact support for reinstatement." },
    { icon: Phone,     label: "Phone number incorrect",          reason: "Shop suspended: the phone number listed on your shop is incorrect or unreachable. Please update your contact number and contact support for reinstatement." },
  ],
  ban: [
    { icon: Store,     label: "Shop name violation",             reason: "Shop permanently banned: the shop name severely violates platform policies and community standards." },
    { icon: Image,     label: "Shop logo violation",             reason: "Shop permanently banned: the shop logo contains content that severely violates platform policies and community standards." },
    { icon: ImageIcon, label: "Background image violation",      reason: "Shop permanently banned: the background image contains content that severely violates platform policies and community standards." },
    { icon: MapPin,    label: "False location",                  reason: "Shop permanently banned: the shop location is deliberately false or fraudulent, violating platform trust and safety policies." },
    { icon: Phone,     label: "False phone number",              reason: "Shop permanently banned: the shop contact number is deliberately false or fraudulent, violating platform trust and safety policies." },
  ],
};

/* ── Preset reasons per action for products ── */
const PRODUCT_REASONS: Record<"warn" | "suspend" | "ban", { icon: React.ElementType; label: string; reason: string }[]> = {
  warn: [
    { icon: Image,       label: "Image not acceptable",   reason: "The product image is not acceptable — it doesn't match the product or contains inappropriate content." },
    { icon: Type,        label: "Name not acceptable",    reason: "The product name is not acceptable — it doesn't match the image or contains inappropriate/sexual language." },
    { icon: DollarSign,  label: "Price not acceptable",   reason: "The product price is not acceptable — it is too high or unrealistic compared to market value." },
    { icon: Package,     label: "Product not acceptable", reason: "The product is not acceptable — it may be illegal, low quality, or does not meet platform standards." },
  ],
  suspend: [
    { icon: Image,       label: "Image not acceptable",   reason: "Product suspended: the image doesn't match the product or contains inappropriate content. Please update the image and resubmit." },
    { icon: Type,        label: "Name not acceptable",    reason: "Product suspended: the name doesn't match the image or contains inappropriate/sexual language. Please update and resubmit." },
    { icon: DollarSign,  label: "Price not acceptable",   reason: "Product suspended: the price is too high or unrealistic. Please revise the price and resubmit." },
    { icon: Package,     label: "Product not acceptable", reason: "Product suspended: this item may be illegal, low quality, or violates platform policies. Please review and resubmit." },
  ],
  ban: [
    { icon: Image,       label: "Image violation",        reason: "Product permanently banned: the image is explicit, offensive, or severely violates community standards." },
    { icon: Type,        label: "Name violation",         reason: "Product permanently banned: the product name is sexual, offensive, or severely violates platform policies." },
    { icon: DollarSign,  label: "Price fraud",            reason: "Product permanently banned: price manipulation or fraudulent pricing detected." },
    { icon: Package,     label: "Illegal / harmful",      reason: "Product permanently banned: this item is illegal, dangerous, or in severe violation of platform policies." },
  ],
};

const CONFIG = {
  warn: {
    icon: AlertTriangle,
    color: "text-yellow-600",
    bg: "bg-yellow-50 dark:bg-yellow-950/30",
    border: "border-yellow-200 dark:border-yellow-800",
    chipActive: "bg-yellow-500 text-white border-yellow-500",
    chipIdle: "bg-yellow-50 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800 hover:bg-yellow-100 dark:hover:bg-yellow-900/50",
    title: "Send Warning",
    btnClass: "bg-yellow-500 hover:bg-yellow-600 text-white",
    btnLabel: "Send Warning",
  },
  suspend: {
    icon: Clock,
    color: "text-orange-600",
    bg: "bg-orange-50 dark:bg-orange-950/30",
    border: "border-orange-200 dark:border-orange-800",
    chipActive: "bg-orange-500 text-white border-orange-500",
    chipIdle: "bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-900/50",
    title: "Suspend Product",
    btnClass: "bg-orange-500 hover:bg-orange-600 text-white",
    btnLabel: "Suspend",
  },
  ban: {
    icon: Ban,
    color: "text-red-600",
    bg: "bg-red-50 dark:bg-red-950/30",
    border: "border-red-200 dark:border-red-800",
    chipActive: "bg-red-600 text-white border-red-600",
    chipIdle: "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/50",
    title: "Permanently Ban",
    btnClass: "bg-red-600 hover:bg-red-700 text-white",
    btnLabel: "Ban Permanently",
  },
  unban: {
    icon: RotateCcw,
    color: "text-green-600",
    bg: "bg-green-50 dark:bg-green-950/30",
    border: "border-green-200 dark:border-green-800",
    chipActive: "",
    chipIdle: "",
    title: "Restore Product",
    btnClass: "bg-green-600 hover:bg-green-700 text-white",
    btnLabel: "Restore",
  },
  reject: {
    icon: XCircle,
    color: "text-red-600",
    bg: "bg-red-50 dark:bg-red-950/30",
    border: "border-red-200 dark:border-red-800",
    chipActive: "",
    chipIdle: "",
    title: "Reject Product",
    btnClass: "bg-red-600 hover:bg-red-700 text-white",
    btnLabel: "Reject Product",
  },
};

export default function ModerationModal({ target, action, queryKey, onClose, onActionSuccess }: Props) {
  const [reason, setReason]         = useState("");
  const [selectedPreset, setPreset] = useState<number | "custom" | null>(null);
  const [days, setDays]             = useState(7);
  const [banConfirm, setBanConfirm] = useState("");
  const qc = useQueryClient();
  const cfg = CONFIG[action];
  const Icon = cfg.icon;

  const isProduct = target.type === "product";
  const isVendor  = target.role === "vendor";
  const presetMap = isVendor ? VENDOR_REASONS : PRODUCT_REASONS;
  const presets = (isProduct || isVendor) && (action === "warn" || action === "suspend" || action === "ban")
    ? presetMap[action]
    : null;

  const selectPreset = (i: number) => {
    setPreset(i);
    setReason(presetMap[action as "warn" | "suspend" | "ban"][i].reason);
  };

  const selectCustom = () => {
    setPreset("custom");
    setReason("");
  };

  const baseUrl = target.type === "product"
    ? `/admin/products`
    : target.role === "vendor"
    ? `/admin/vendors`
    : `/admin/users`;

  const mutation = useMutation({
    mutationFn: () => {
      if (action === "warn")    return api.post(`${baseUrl}/${target.id}/warn`,    { reason });
      if (action === "suspend") return api.post(`${baseUrl}/${target.id}/suspend`, { reason, days });
      if (action === "ban")     return api.post(`${baseUrl}/${target.id}/ban`,     { reason });
      if (action === "reject")  return api.post(`${baseUrl}/${target.id}/reject`,  { reason });
      return api.post(`${baseUrl}/${target.id}/unban`);
    },
    onSuccess: (res) => {
      toast.success(res.data.message);
      qc.invalidateQueries({ queryKey: [queryKey] });
      onActionSuccess?.(action);
      onClose();
    },
    onError: () => toast.error("Action failed. Please try again."),
  });

  const canSubmit = () => {
    if (action === "unban")   return true;
    if (action === "ban")     return reason.trim().length > 0 && banConfirm === "BAN";
    return reason.trim().length > 0;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-card border rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className={`flex items-center gap-3 p-5 border-b rounded-t-2xl ${cfg.bg} ${cfg.border} border`}>
          <div className={`w-10 h-10 rounded-xl ${cfg.bg} border ${cfg.border} flex items-center justify-center shrink-0`}>
            <Icon className={`w-5 h-5 ${cfg.color}`} />
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-base">{cfg.title}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-black/10 rounded-lg transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">

          {/* Unban */}
          {action === "unban" && (
            <p className="text-sm text-muted-foreground">
              This will restore <strong>{target.name}</strong>. All restrictions will be lifted.
            </p>
          )}

          {/* Preset reason chips (products only) */}
          {presets && (
            <div>
              <p className="text-sm font-semibold mb-3">Select a reason</p>
              <div className="grid grid-cols-2 gap-2">
                {presets.map((p, i) => {
                  const active = selectedPreset === i;
                  return (
                    <button
                      key={i}
                      onClick={() => selectPreset(i)}
                      className={`flex items-center gap-2.5 px-3 py-3 rounded-xl border text-left text-sm font-medium transition ${active ? cfg.chipActive : cfg.chipIdle}`}
                    >
                      {active
                        ? <CheckCircle2 className="w-4 h-4 shrink-0" />
                        : <p.icon className="w-4 h-4 shrink-0 opacity-70" />
                      }
                      <span className="leading-tight">{p.label}</span>
                    </button>
                  );
                })}
                {/* Write your own */}
                <button
                  onClick={selectCustom}
                  className={`flex items-center gap-2.5 px-3 py-3 rounded-xl border text-left text-sm font-medium transition col-span-2 ${
                    selectedPreset === "custom"
                      ? "bg-primary text-white border-primary"
                      : "border hover:bg-muted text-muted-foreground"
                  }`}
                >
                  {selectedPreset === "custom"
                    ? <CheckCircle2 className="w-4 h-4 shrink-0" />
                    : <PenLine className="w-4 h-4 shrink-0 opacity-70" />
                  }
                  Write your own reason
                </button>
              </div>
            </div>
          )}

          {/* Reason textarea — shown after preset selected, or always for non-product */}
          {action !== "unban" && (presets === null || selectedPreset !== null) && (
            <div>
              <label className="block text-sm font-medium mb-1.5">
                {action === "warn" ? "Warning message" : "Reason"}
                <span className="text-destructive ml-1">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => { setReason(e.target.value); if (selectedPreset !== "custom") setPreset("custom"); }}
                rows={3}
                placeholder={
                  action === "warn"
                    ? "Explain the warning to the vendor…"
                    : action === "suspend"
                    ? "Why is this product being suspended?"
                    : "Why is this product being permanently banned?"
                }
                className="w-full border rounded-xl px-3 py-2.5 text-sm bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          )}

          {/* Suspend duration */}
          {action === "suspend" && (
            <div>
              <label className="block text-sm font-medium mb-1.5">Suspension duration</label>
              <div className="grid grid-cols-3 gap-2">
                {SUSPEND_OPTIONS.map((opt) => (
                  <button
                    key={opt.days}
                    onClick={() => setDays(opt.days)}
                    className={`py-2 rounded-xl text-sm font-medium border transition ${
                      days === opt.days
                        ? "bg-orange-500 text-white border-orange-500"
                        : "border hover:bg-muted"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Product will auto-restore on {new Date(Date.now() + days * 86400000).toLocaleDateString()}.
              </p>
            </div>
          )}

          {/* Ban confirm */}
          {action === "ban" && (
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Type <strong className="text-red-600">BAN</strong> to confirm permanent ban
              </label>
              <input
                value={banConfirm}
                onChange={(e) => setBanConfirm(e.target.value)}
                placeholder="Type BAN"
                className="w-full border border-red-200 rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-red-300"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-5 pb-5">
          <button onClick={onClose}
            className="flex-1 py-2.5 border rounded-xl text-sm font-medium hover:bg-muted transition">
            Cancel
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={!canSubmit() || mutation.isPending}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-40 ${cfg.btnClass}`}
          >
            {mutation.isPending ? "Processing…" : cfg.btnLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
