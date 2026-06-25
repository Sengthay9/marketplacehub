"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, Trash2, X, Smartphone, CheckCircle, AlertCircle } from "lucide-react";
import api from "@/lib/axios";
import VendorLayout from "@/components/layout/dashboards/VendorLayout";
import KhqrCard from "@/components/payment/KhqrCard";

interface BakongAccount {
  id: number;
  bank_name: string;
  account_holder_name: string;
  account_number: string | null;
  phone_number: string | null;
  is_primary: boolean;
  khqr_string: string | null;
}

const EMPTY = { account_holder_name: "", phone_number: "", account_number: "" };

function BakongSetup() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<BakongAccount | null>(null);
  const [form, setForm] = useState(EMPTY);

  const { data, isLoading } = useQuery({
    queryKey: ["vendor-bank-accounts"],
    queryFn: async () => (await api.get("/vendor/bank-accounts")).data.data as BakongAccount[],
  });

  const account = data?.[0] ?? null;

  const addMutation = useMutation({
    mutationFn: () => api.post("/vendor/bank-accounts", form),
    onSuccess: () => {
      toast.success("Bakong account connected!");
      qc.invalidateQueries({ queryKey: ["vendor-bank-accounts"] });
      setShowForm(false);
      setForm(EMPTY);
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? "Failed to connect account."),
  });

  const updateMutation = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => v && fd.append(k, v));
      fd.append("_method", "PUT");
      return api.post(`/vendor/bank-accounts/${editing!.id}`, fd);
    },
    onSuccess: () => {
      toast.success("Bakong account updated.");
      qc.invalidateQueries({ queryKey: ["vendor-bank-accounts"] });
      setEditing(null);
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? "Failed to update."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/vendor/bank-accounts/${id}`),
    onSuccess: () => {
      toast.success("Bakong account disconnected.");
      qc.invalidateQueries({ queryKey: ["vendor-bank-accounts"] });
    },
  });

  const openEdit = (acc: BakongAccount) => {
    setEditing(acc);
    setForm({
      account_holder_name: acc.account_holder_name,
      phone_number: acc.phone_number ?? "",
      account_number: acc.account_number ?? "",
    });
  };

  const isFormOpen = showForm || !!editing;

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold">Payout Account</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Connect your Bakong account to receive your earnings automatically after each sale.
        </p>
      </div>

      {/* How it works */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-sm text-blue-800 space-y-1">
        <p className="font-semibold">How payouts work</p>
        <ol className="list-decimal list-inside space-y-1 text-blue-700 text-xs">
          <li>Customer pays CamCart via KHQR at checkout</li>
          <li>CamCart deducts the platform fee from the order total</li>
          <li>The remaining amount is sent to your Bakong account immediately</li>
          <li>You receive a payout notification — no manual steps needed</li>
        </ol>
      </div>

      {isLoading ? (
        <div className="h-32 bg-muted rounded-2xl animate-pulse" />
      ) : account && !isFormOpen ? (
        /* ── Connected account card ── */
        <div className="border rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 bg-green-50 border-b border-green-200">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="w-5 h-5" />
              <span className="font-semibold text-sm">Bakong Account Connected</span>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => openEdit(account)}
                className="p-1.5 rounded-lg hover:bg-green-100 text-green-700"
                title="Edit"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => { if (confirm("Disconnect your Bakong account? Customers won't be able to pay via QR.")) deleteMutation.mutate(account.id); }}
                className="p-1.5 rounded-lg hover:bg-red-100 text-red-500"
                title="Disconnect"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-5 flex flex-col md:flex-row gap-6 items-start">
            {/* Info */}
            <div className="flex-1 space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Account Name</p>
                <p className="font-semibold">{account.account_holder_name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Bakong Phone</p>
                <p className="font-semibold flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-primary" />
                  {account.phone_number}
                </p>
              </div>
              {account.account_number && (
                <div>
                  <p className="text-xs text-muted-foreground">Account Number</p>
                  <p className="font-semibold font-mono">{account.account_number}</p>
                </div>
              )}
              <div className="text-xs text-muted-foreground bg-muted/40 rounded-xl px-3 py-2">
                Compatible with ABA Pay, ACLEDA Pay, Wing Money, and all KHQR-supported apps.
              </div>
            </div>

            {/* KHQR Preview */}
            {account.khqr_string && (
              <div className="shrink-0">
                <p className="text-xs text-muted-foreground mb-2 text-center">Your KHQR (preview)</p>
                <KhqrCard
                  khqrString={account.khqr_string}
                  merchantName={account.account_holder_name}
                  bankName="Bakong"
                  accountNumber={account.account_number ?? undefined}
                  size={160}
                />
              </div>
            )}

            {!account.khqr_string && (
              <div className="flex items-center gap-2 text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                No KHQR generated — make sure your phone number is a valid Bakong-registered number.
              </div>
            )}
          </div>
        </div>
      ) : !isFormOpen ? (
        /* ── No account yet ── */
        <div className="border-2 border-dashed rounded-2xl p-10 text-center">
          <Smartphone className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
          <p className="font-semibold text-muted-foreground">No Bakong account connected</p>
          <p className="text-xs text-muted-foreground mt-1 mb-4">Add your phone number to start accepting KHQR payments</p>
          <button
            onClick={() => { setShowForm(true); setForm(EMPTY); }}
            className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90"
          >
            Connect Bakong Account
          </button>
        </div>
      ) : null}

      {/* ── Add / Edit form ── */}
      {isFormOpen && (
        <div className="border rounded-2xl p-5 bg-muted/30 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{editing ? "Update Bakong Account" : "Connect Bakong Account"}</h3>
            <button
              onClick={() => { setShowForm(false); setEditing(null); }}
              className="p-1 hover:bg-muted rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium mb-1">
                Account Holder Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.account_holder_name}
                onChange={(e) => setForm((f) => ({ ...f, account_holder_name: e.target.value }))}
                placeholder="e.g. SOKHA MEAS"
                className="w-full px-3 py-2.5 text-sm border rounded-xl bg-background"
              />
              <p className="text-[10px] text-muted-foreground mt-1">Name shown to customers on the KHQR card</p>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">
                Bakong Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.phone_number}
                onChange={(e) => setForm((f) => ({ ...f, phone_number: e.target.value }))}
                placeholder="e.g. 012 345 678"
                className="w-full px-3 py-2.5 text-sm border rounded-xl bg-background"
              />
              <p className="text-[10px] text-muted-foreground mt-1">Must be the phone linked to your Bakong wallet</p>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">Account Number (optional)</label>
              <input
                type="text"
                value={form.account_number}
                onChange={(e) => setForm((f) => ({ ...f, account_number: e.target.value }))}
                placeholder="e.g. 000 123 456 789"
                className="w-full px-3 py-2.5 text-sm border rounded-xl bg-background"
              />
              <p className="text-[10px] text-muted-foreground mt-1">Displayed for reference — not required for KHQR</p>
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              onClick={() => { setShowForm(false); setEditing(null); }}
              className="flex-1 py-2.5 border rounded-xl text-sm hover:bg-muted"
            >
              Cancel
            </button>
            <button
              onClick={() => editing ? updateMutation.mutate() : addMutation.mutate()}
              disabled={!form.account_holder_name || !form.phone_number || addMutation.isPending || updateMutation.isPending}
              className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 disabled:opacity-50"
            >
              {(addMutation.isPending || updateMutation.isPending)
                ? "Saving…"
                : editing ? "Save Changes" : "Connect & Generate KHQR"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VendorPayment() {
  return (
    <VendorLayout title="Payment">
      <BakongSetup />
    </VendorLayout>
  );
}
