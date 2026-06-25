"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2, Loader2, Banknote, Clock } from "lucide-react";
import api from "@/lib/axios";
import { formatCurrency } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  pending:   "bg-yellow-100 text-yellow-700",
  completed: "bg-green-100 text-green-700",
  failed:    "bg-red-100 text-red-700",
};

const STATUS_FILTERS = [
  { value: "all",       label: "All" },
  { value: "pending",   label: "Pending" },
  { value: "completed", label: "Completed" },
];

export default function AdminPayouts() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("pending");
  const [completingId, setCompletingId] = useState<number | null>(null);
  const [reference, setReference] = useState("");

  const { data: summary } = useQuery({
    queryKey: ["payout-summary"],
    queryFn: async () => (await api.get("/admin/payouts/summary")).data,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["admin-payouts", statusFilter],
    queryFn: async () => (await api.get("/admin/payouts", {
      params: { status: statusFilter !== "all" ? statusFilter : undefined },
    })).data,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-payouts"] });
    qc.invalidateQueries({ queryKey: ["payout-summary"] });
  };

  const completeMutation = useMutation({
    mutationFn: ({ id, ref }: { id: number; ref: string }) =>
      api.post(`/admin/payouts/${id}/complete`, { reference: ref }),
    onSuccess: () => {
      toast.success("Payout completed — vendor will be notified.");
      setCompletingId(null);
      setReference("");
      invalidate();
    },
    onError: () => toast.error("Failed. Make sure reference is filled."),
  });

  const payouts = data?.data ?? [];

  return (
    <div>
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-card border rounded-2xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <Clock className="w-4 h-4" /> Pending Payouts
          </div>
          <p className="text-2xl font-bold text-yellow-600">{formatCurrency(summary?.pending_payout ?? 0)}</p>
          <p className="text-xs text-muted-foreground mt-1">{summary?.pending_count ?? 0} vendors waiting</p>
        </div>
        <div className="bg-card border rounded-2xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <CheckCircle2 className="w-4 h-4" /> Paid Out
          </div>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(summary?.completed_payout ?? 0)}</p>
        </div>
        <div className="bg-card border rounded-2xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <Banknote className="w-4 h-4" /> Fee Collected
          </div>
          <p className="text-2xl font-bold text-primary">{formatCurrency(summary?.total_fee ?? 0)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {STATUS_FILTERS.map(({ value, label }) => (
          <button key={value} onClick={() => setStatusFilter(value)}
            className={`px-3 py-1.5 rounded-xl text-sm font-medium transition ${
              statusFilter === value ? "bg-primary text-white" : "bg-muted hover:bg-muted/80"
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-muted rounded-xl animate-pulse" />)}</div>
      ) : (
        <div className="bg-card border rounded-2xl overflow-hidden overflow-x-auto">
          <table className="w-full text-sm min-w-[750px]">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4 font-medium">Order</th>
                <th className="text-left p-4 font-medium">Vendor / Shop</th>
                <th className="text-left p-4 font-medium">Order Total</th>
                <th className="text-left p-4 font-medium">Fee Kept</th>
                <th className="text-left p-4 font-medium">Pay Vendor</th>
                <th className="text-left p-4 font-medium">Status</th>
                <th className="text-left p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {payouts.length === 0 && (
                <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No payouts found.</td></tr>
              )}
              {payouts.map((payout: any) => (
                <tr key={payout.id} className="hover:bg-muted/30">
                  <td className="p-4 font-mono text-xs">
                    #{payout.order?.order_number ?? payout.order_id}
                  </td>
                  <td className="p-4">
                    <p className="font-medium">{payout.shop?.name ?? "—"}</p>
                  </td>
                  <td className="p-4">{formatCurrency(payout.gross_amount)}</td>
                  <td className="p-4 text-primary font-semibold">+{formatCurrency(payout.platform_fee)}</td>
                  <td className="p-4 text-green-600 font-bold">{formatCurrency(payout.vendor_amount)}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[payout.status] ?? "bg-muted"}`}>
                      {payout.status}
                    </span>
                    {payout.reference && (
                      <p className="text-[11px] text-muted-foreground mt-0.5">Ref: {payout.reference}</p>
                    )}
                  </td>
                  <td className="p-4">
                    {payout.status === "pending" && (
                      completingId === payout.id ? (
                        <div className="flex gap-1 mt-1">
                          <input
                            value={reference}
                            onChange={(e) => setReference(e.target.value)}
                            placeholder="Bakong ref #"
                            className="w-28 px-2 py-1 text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                          <button
                            onClick={() => completeMutation.mutate({ id: payout.id, ref: reference })}
                            disabled={!reference || completeMutation.isPending}
                            className="px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs hover:bg-green-200 disabled:opacity-50"
                          >
                            {completeMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Confirm"}
                          </button>
                          <button onClick={() => setCompletingId(null)} className="text-xs text-muted-foreground hover:text-foreground px-1">✕</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setCompletingId(payout.id); setReference(""); }}
                          className="px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs hover:bg-green-200 mt-1 block"
                        >
                          Complete Payout
                        </button>
                      )
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
