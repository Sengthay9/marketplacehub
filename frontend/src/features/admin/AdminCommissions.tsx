"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Store, CheckCircle, ChevronLeft, ChevronRight, Mail, SendHorizonal, Eye } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { formatCurrency } from "@/lib/utils";
import type { ShopCommission } from "@/types";

const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function AdminCommissions() {
  const now  = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const qc = useQueryClient();

  const prevYear = () => setYear((y) => y - 1);
  const nextYear = () => { if (year < now.getFullYear()) setYear((y) => y + 1); };

  // ── Query — all commissions for this year ────────────
  const { data, isLoading } = useQuery({
    queryKey: ["commissions", year],
    queryFn: async () => (await api.get("/admin/commissions", { params: { year } })).data,
  });

  const commissions: ShopCommission[] = data?.data ?? [];
  const periodTotal  = commissions.reduce((s, c) => s + c.commission_amount, 0);
  const pendingTotal = commissions.filter((c) => c.status === "pending").reduce((s, c) => s + c.commission_amount, 0);
  const paidTotal    = commissions.filter((c) => c.status === "paid").reduce((s, c) => s + c.commission_amount, 0);
  const hasPending   = commissions.some((c) => c.status === "pending");
  const hasUnsent    = commissions.some((c) => !c.invoice_sent_at);

  // ── Mutations ────────────────────────────────────────
  const invalidate = () => qc.invalidateQueries({ queryKey: ["commissions"] });

  const markPaidMutation = useMutation({
    mutationFn: (id: number) => api.post(`/admin/commissions/${id}/paid`),
    onSuccess: () => { toast.success("Marked as paid."); invalidate(); },
    onError: () => toast.error("Failed."),
  });

  const markAllPaidMutation = useMutation({
    mutationFn: () => api.post("/admin/commissions/mark-all-paid-year", { year }),
    onSuccess: (res) => { toast.success(res.data.message); invalidate(); },
    onError: () => toast.error("Failed."),
  });

  const sendInvoiceMutation = useMutation({
    mutationFn: (id: number) => api.post(`/admin/commissions/${id}/send-invoice`),
    onSuccess: (res) => {
      res.data.email_sent ? toast.success(res.data.message) : toast.warning(res.data.message);
      invalidate();
    },
    onError: () => toast.error("Failed to send invoice."),
  });

  const sendAllInvoicesMutation = useMutation({
    mutationFn: () => api.post("/admin/commissions/send-all-invoices-year", { year }),
    onSuccess: (res) => { toast.success(`Sent ${res.data.sent} invoice(s).`); invalidate(); },
    onError: () => toast.error("Failed."),
  });

  const openPreview = (id: number) => window.open(`/api/v1/admin/commissions/${id}/invoice-preview`, "_blank");

  return (
    <div className="space-y-6">

      {/* ══════════════════════════════════
          BIG YEAR BANNER  ←  2026  →
      ══════════════════════════════════ */}
      <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl overflow-hidden select-none">
        <div className="flex items-stretch min-h-[180px]">

          {/* ← Left arrow */}
          <button onClick={prevYear}
            className="flex items-center justify-center w-20 shrink-0 text-white/40 hover:text-white hover:bg-white/10 transition"
            aria-label="Previous year">
            <ChevronLeft className="w-10 h-10" />
          </button>

          {/* Centre */}
          <div className="flex-1 flex flex-col items-center justify-center gap-4 py-8 px-4">
            <div className="text-center">
              <p className="text-5xl font-black text-white tracking-tight">{year}</p>
              <p className="text-xs text-white/50 mt-2 uppercase tracking-widest">Annual Commission — 15% every 30 days</p>
            </div>

            <div className="flex gap-8 flex-wrap justify-center">
              <Stat label="Total"   value={formatCurrency(periodTotal)}  color="text-white" />
              <div className="w-px bg-white/10 self-stretch" />
              <Stat label="Pending" value={formatCurrency(pendingTotal)} color="text-yellow-400" />
              <div className="w-px bg-white/10 self-stretch" />
              <Stat label="Paid"    value={formatCurrency(paidTotal)}    color="text-green-400" />
              <div className="w-px bg-white/10 self-stretch" />
              <Stat label="Records" value={String(commissions.length)}   color="text-white" />
            </div>
          </div>

          {/* → Right arrow */}
          <button onClick={nextYear} disabled={year >= now.getFullYear()}
            className="flex items-center justify-center w-20 shrink-0 text-white/40 hover:text-white hover:bg-white/10 transition disabled:opacity-20 disabled:cursor-not-allowed"
            aria-label="Next year">
            <ChevronRight className="w-10 h-10" />
          </button>
        </div>
      </div>

      {/* ── Action bar ── */}
      {(hasPending || hasUnsent) && (
        <div className="flex gap-3 justify-end flex-wrap">
          {hasPending && (
            <button onClick={() => markAllPaidMutation.mutate()} disabled={markAllPaidMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition disabled:opacity-50">
              <CheckCircle className="w-4 h-4" />
              Mark All Paid
            </button>
          )}
          {hasUnsent && (
            <button onClick={() => sendAllInvoicesMutation.mutate()} disabled={sendAllInvoicesMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-50">
              <Mail className="w-4 h-4" />
              {sendAllInvoicesMutation.isPending ? "Sending…" : "Send All Invoices"}
            </button>
          )}
        </div>
      )}

      {/* ── Table ── */}
      <div className="bg-card border rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Loading…</div>
        ) : commissions.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            No commission records for {year}. Records are created automatically every 30 days per vendor.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40">
              <tr>
                <th className="text-left px-5 py-3 font-semibold">Shop</th>
                <th className="text-left px-5 py-3 font-semibold">Period</th>
                <th className="text-left px-5 py-3 font-semibold">Cycle</th>
                <th className="text-right px-5 py-3 font-semibold">Gross Revenue</th>
                <th className="text-right px-5 py-3 font-semibold">Commission (15%)</th>
                <th className="text-center px-5 py-3 font-semibold">Status</th>
                <th className="text-center px-5 py-3 font-semibold">Invoice</th>
                <th className="text-center px-5 py-3 font-semibold">Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {commissions.map((c) => (
                <tr key={c.id} className="hover:bg-muted/20 transition">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Store className="w-4 h-4 text-primary" />
                      </div>
                      <p className="font-medium">{c.shop?.name ?? `Shop #${c.shop_id}`}</p>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground text-xs">
                    {c.period_start && c.period_end ? (
                      <>
                        {new Date(c.period_start).toLocaleDateString("en", { day: "numeric", month: "short" })}
                        {" — "}
                        {new Date(c.period_end).toLocaleDateString("en", { day: "numeric", month: "short", year: "numeric" })}
                      </>
                    ) : (
                      `${MONTHS_SHORT[c.month - 1]} ${c.year}`
                    )}
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {c.cycle ? (
                      <span className="text-xs bg-muted px-2 py-0.5 rounded-full font-medium">#{c.cycle}</span>
                    ) : "—"}
                  </td>
                  <td className="px-5 py-3 text-right font-medium">{formatCurrency(c.gross_revenue)}</td>
                  <td className="px-5 py-3 text-right font-bold text-green-600">{formatCurrency(c.commission_amount)}</td>
                  <td className="px-5 py-3 text-center">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      c.status === "paid" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                    }`}>
                      {c.status === "paid" ? "Paid" : "Pending"}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-center gap-1.5">
                      <button onClick={() => openPreview(c.id)} title="Preview Invoice"
                        className="p-1.5 rounded-lg hover:bg-muted transition text-muted-foreground hover:text-foreground">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => sendInvoiceMutation.mutate(c.id)}
                        disabled={sendInvoiceMutation.isPending}
                        title={c.invoice_sent_at ? `Resend (sent ${new Date(c.invoice_sent_at).toLocaleDateString()})` : "Send Invoice"}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition disabled:opacity-50 ${
                          c.invoice_sent_at
                            ? "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                            : "bg-indigo-600 text-white hover:bg-indigo-700"
                        }`}
                      >
                        <SendHorizonal className="w-3 h-3" />
                        {c.invoice_sent_at ? "Resend" : "Send"}
                      </button>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-center">
                    {c.status === "pending" ? (
                      <button onClick={() => markPaidMutation.mutate(c.id)} disabled={markPaidMutation.isPending}
                        className="text-xs px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50">
                        Mark Paid
                      </button>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {c.paid_at ? new Date(c.paid_at).toLocaleDateString() : "—"}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t bg-muted/20">
              <tr>
                <td colSpan={4} className="px-5 py-3 font-semibold text-right">Total {year}</td>
                <td className="px-5 py-3 text-right font-black text-green-600">{formatCurrency(periodTotal)}</td>
                <td colSpan={3} />
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="text-center">
      <p className={`text-2xl font-black ${color}`}>{value}</p>
      <p className="text-xs text-white/50 mt-0.5">{label}</p>
    </div>
  );
}
