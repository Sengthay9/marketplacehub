"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Smartphone, Trash2, CheckCircle2, QrCode } from "lucide-react";
import api from "@/lib/axios";
import KhqrCard from "@/components/payment/KhqrCard";

export default function AdminBankAccount({ className }: { className?: string }) {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-bank-account"],
    queryFn: async () => (await api.get("/admin/bank-account")).data.data,
  });

  const [form, setForm] = useState({
    account_holder_name: "",
    phone_number: "",
    bakong_transfer_token: "",
  });

  useEffect(() => {
    if (data) {
      setForm({
        account_holder_name: data.account_holder_name ?? "",
        phone_number: data.phone_number ?? "",
        bakong_transfer_token: "",
      });
    }
  }, [data]);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-bank-account"] });

  const saveMutation = useMutation({
    mutationFn: () => api.post("/admin/bank-account", form),
    onSuccess: () => { toast.success("Bakong account saved!"); invalidate(); },
    onError: () => toast.error("Failed to save. Check all fields."),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete("/admin/bank-account"),
    onSuccess: () => {
      toast.success("Bakong account removed.");
      setForm({ account_holder_name: "", phone_number: "", bakong_transfer_token: "" });
      invalidate();
    },
    onError: () => toast.error("Failed to remove."),
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  if (isLoading) {
    return <div className="h-40 bg-muted rounded-2xl animate-pulse" />;
  }

  return (
    <div className={className ?? "max-w-xl space-y-6"}>

      {/* Current account preview */}
      {data?.khqr_string && (
        <div className="bg-card border rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-green-600 font-semibold">
            <CheckCircle2 className="w-5 h-5" />
            Active Bakong Account
          </div>
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <KhqrCard
              khqrString={data.khqr_string}
              merchantName={data.account_holder_name}
              bankName="Bakong"
              size={160}
            />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between gap-8">
                <span className="text-muted-foreground">Name</span>
                <span className="font-medium">{data.account_holder_name}</span>
              </div>
              <div className="flex justify-between gap-8">
                <span className="text-muted-foreground">Phone</span>
                <span className="font-medium">{data.phone_number}</span>
              </div>
              <div className="flex justify-between gap-8">
                <span className="text-muted-foreground">Bank</span>
                <span className="font-medium">Bakong (NBC)</span>
              </div>
              <div className="flex justify-between gap-8">
                <span className="text-muted-foreground">Auto-Transfer</span>
                {data.has_transfer_token ? (
                  <span className="flex items-center gap-1 text-green-600 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Enabled
                  </span>
                ) : (
                  <span className="text-yellow-600 font-medium">Not configured</span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
            className="flex items-center gap-2 text-sm text-destructive hover:underline"
          >
            <Trash2 className="w-4 h-4" /> Remove account
          </button>
        </div>
      )}

      {/* No KHQR yet */}
      {data && !data.khqr_string && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 text-sm text-yellow-800 flex items-center gap-2">
          <QrCode className="w-4 h-4 shrink-0" />
          Account saved but KHQR could not be generated. Check the phone number format.
        </div>
      )}

      {/* Auto-transfer not configured warning */}
      {data && !data.has_transfer_token && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 text-sm text-yellow-800 flex items-start gap-2">
          <Smartphone className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Auto-transfer not enabled</p>
            <p className="mt-0.5 text-yellow-700">
              Vendor payouts will stay <strong>pending</strong> and require manual transfer.
              Add your Bakong Business Transfer API token below to enable automatic payouts.
            </p>
          </div>
        </div>
      )}

      {/* Form */}
      <div className="bg-card border rounded-2xl p-6 space-y-4">
        <h2 className="font-bold text-base flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-primary" />
          Bakong Account
        </h2>
        <p className="text-sm text-muted-foreground">
          This is the account customers pay into. After deducting the platform fee, the remaining amount is auto-transferred to each vendor's Bakong account immediately.
        </p>

        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium block mb-1">Account Holder Name</label>
            <input
              name="account_holder_name"
              value={form.account_holder_name}
              onChange={handleChange}
              placeholder="e.g. CamCart Platform"
              className="w-full px-3 py-2 text-sm border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">Bakong Phone Number</label>
            <input
              name="phone_number"
              value={form.phone_number}
              onChange={handleChange}
              placeholder="e.g. 012345678 or +85512345678"
              className="w-full px-3 py-2 text-sm border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Must be a Bakong-registered phone. This is where customer payments arrive.
            </p>
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">
              Bakong Business Transfer API Token
              {data?.has_transfer_token && (
                <span className="ml-2 text-xs text-green-600 font-normal">(already set — leave blank to keep)</span>
              )}
            </label>
            <input
              type="password"
              name="bakong_transfer_token"
              value={form.bakong_transfer_token}
              onChange={handleChange}
              placeholder={data?.has_transfer_token ? "••••••••••••••••" : "Paste your Bakong Business API token"}
              className="w-full px-3 py-2 text-sm border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-ring font-mono"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Required for automatic vendor payouts. Get this from the NBC Bakong Business/Merchant developer portal.
            </p>
          </div>
        </div>

        <button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending || !form.account_holder_name || !form.phone_number}
          className="w-full py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition disabled:opacity-50"
        >
          {saveMutation.isPending ? "Saving…" : data ? "Update Account" : "Save Account & Generate KHQR"}
        </button>
      </div>
    </div>
  );
}
