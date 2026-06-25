"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2, ToggleLeft, ToggleRight, Upload, QrCode, Info } from "lucide-react";
import Image from "next/image";
import api from "@/lib/axios";

const BANK_OPTIONS = [
  { value: "aba",       label: "ABA Pay" },
  { value: "bakong",    label: "Bakong KHQR" },
  { value: "acleda",    label: "ACLEDA Pay" },
  { value: "wing",  label: "Wing Money" },
  { value: "other", label: "Other Bank" },
];

interface QrCode {
  id: number;
  bank_name: string;
  bank_label: string;
  currency: "usd" | "khr";
  qr_image_url: string;
  account_name: string | null;
  account_number: string | null;
  is_active: boolean;
}

interface FormState {
  bank_name: string;
  bank_label: string;
  currency: "usd" | "khr";
  account_name: string;
  account_number: string;
  file: File | null;
}

const DEFAULT_FORM: FormState = {
  bank_name: "aba",
  bank_label: "ABA Pay",
  currency: "usd",
  account_name: "",
  account_number: "",
  file: null,
};

export default function VendorPaymentQr() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [preview, setPreview] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["vendor-payment-qr"],
    queryFn: async () => (await api.get("/vendor/payment-qr")).data.data as QrCode[],
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      fd.append("bank_name",      form.bank_name);
      fd.append("bank_label",     form.bank_label);
      fd.append("currency",       form.currency);
      fd.append("account_name",   form.account_name);
      fd.append("account_number", form.account_number);
      if (form.file) fd.append("qr_image", form.file);
      return api.post("/vendor/payment-qr", fd, { headers: { "Content-Type": "multipart/form-data" } });
    },
    onSuccess: () => {
      toast.success("QR code added!");
      qc.invalidateQueries({ queryKey: ["vendor-payment-qr"] });
      setShowForm(false);
      setForm(DEFAULT_FORM);
      setPreview(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? "Failed to add QR code."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/vendor/payment-qr/${id}`),
    onSuccess: () => { toast.success("QR removed."); qc.invalidateQueries({ queryKey: ["vendor-payment-qr"] }); },
  });

  const toggleMutation = useMutation({
    mutationFn: (id: number) => api.post(`/vendor/payment-qr/${id}/toggle`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vendor-payment-qr"] }),
  });

  const handleBankChange = (val: string) => {
    const opt = BANK_OPTIONS.find((b) => b.value === val);
    setForm((f) => ({ ...f, bank_name: val, bank_label: opt?.label ?? val }));
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setForm((f) => ({ ...f, file }));
    const url = URL.createObjectURL(file);
    setPreview(url);
  };

  const groupedUSD = data?.filter((q) => q.currency === "usd") ?? [];
  const groupedKHR = data?.filter((q) => q.currency === "khr") ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <QrCode className="w-5 h-5 text-primary" /> Payment QR Codes
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Upload your bank QR codes so customers can pay you directly
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" /> Add QR Code
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="border rounded-2xl p-5 bg-muted/30 space-y-4">
          <h3 className="font-semibold">New QR Code</h3>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1">Bank / Payment App</label>
              <select
                value={form.bank_name}
                onChange={(e) => handleBankChange(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-xl bg-background"
              >
                {BANK_OPTIONS.map((b) => (
                  <option key={b.value} value={b.value}>{b.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">Currency</label>
              <select
                value={form.currency}
                onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value as "usd" | "khr" }))}
                className="w-full px-3 py-2 text-sm border rounded-xl bg-background"
              >
                <option value="usd">USD ($)</option>
                <option value="khr">KHR (៛)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">Account Name (shown to customers)</label>
              <input
                type="text"
                value={form.account_name}
                onChange={(e) => setForm((f) => ({ ...f, account_name: e.target.value }))}
                placeholder="e.g. SOKHA MEAS"
                className="w-full px-3 py-2 text-sm border rounded-xl bg-background"
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">Account Number (optional)</label>
              <input
                type="text"
                value={form.account_number}
                onChange={(e) => setForm((f) => ({ ...f, account_number: e.target.value }))}
                placeholder="e.g. 0123456789"
                className="w-full px-3 py-2 text-sm border rounded-xl bg-background"
              />
            </div>
          </div>

          {/* QR Image upload */}
          <div>
            <label className="block text-xs font-medium mb-2">QR Code Image</label>
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition"
            >
              {preview ? (
                <div className="flex flex-col items-center gap-2">
                  <Image src={preview} alt="QR preview" width={140} height={140} className="rounded-lg object-contain" />
                  <span className="text-xs text-muted-foreground">Click to change</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Upload className="w-8 h-8" />
                  <p className="text-sm">Click to upload QR image</p>
                  <p className="text-xs">PNG, JPG, WebP · max 4MB</p>
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
            </div>
          </div>

          <div className="flex items-start gap-2 text-xs text-muted-foreground bg-blue-50 border border-blue-200 rounded-xl p-3">
            <Info className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
            Upload the QR code image you download from your banking app. Customers will see this exact image when they choose to pay with {form.bank_label}.
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => { setShowForm(false); setForm(DEFAULT_FORM); setPreview(null); }}
              className="flex-1 py-2.5 border rounded-xl text-sm hover:bg-muted"
            >
              Cancel
            </button>
            <button
              onClick={() => addMutation.mutate()}
              disabled={addMutation.isPending || !form.file}
              className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 disabled:opacity-50"
            >
              {addMutation.isPending ? "Saving…" : "Save QR Code"}
            </button>
          </div>
        </div>
      )}

      {/* QR list */}
      {isLoading ? (
        <div className="text-center py-10 text-muted-foreground text-sm">Loading…</div>
      ) : !data?.length ? (
        <div className="text-center py-10 border-2 border-dashed rounded-2xl">
          <QrCode className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
          <p className="font-medium text-muted-foreground">No QR codes yet</p>
          <p className="text-xs text-muted-foreground mt-1">Add at least one QR code so customers can pay you via QR</p>
        </div>
      ) : (
        <div className="space-y-6">
          {[{ label: "USD ($) QR Codes", items: groupedUSD }, { label: "KHR (៛) QR Codes", items: groupedKHR }]
            .filter((g) => g.items.length > 0)
            .map((group) => (
              <div key={group.label}>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">{group.label}</p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {group.items.map((qr) => (
                    <div key={qr.id} className={`border rounded-2xl p-4 space-y-3 ${!qr.is_active ? "opacity-50" : ""}`}>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm">{qr.bank_label}</span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => toggleMutation.mutate(qr.id)}
                            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"
                            title={qr.is_active ? "Disable" : "Enable"}
                          >
                            {qr.is_active
                              ? <ToggleRight className="w-4 h-4 text-primary" />
                              : <ToggleLeft className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => { if (confirm("Remove this QR code?")) deleteMutation.mutate(qr.id); }}
                            className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="flex justify-center bg-white rounded-xl p-2">
                        <Image
                          src={qr.qr_image_url}
                          alt={`${qr.bank_label} QR`}
                          width={120}
                          height={120}
                          className="object-contain"
                          onError={(e) => { (e.target as any).style.display = "none"; }}
                        />
                      </div>

                      {qr.account_name && (
                        <p className="text-xs text-center text-muted-foreground">{qr.account_name}</p>
                      )}
                      {!qr.is_active && (
                        <p className="text-xs text-center text-orange-500 font-medium">Disabled — not shown to customers</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
