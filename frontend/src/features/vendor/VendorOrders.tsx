"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle, XCircle, DollarSign } from "lucide-react";
import api from "@/lib/axios";
import { formatCurrency } from "@/lib/utils";
import VendorLayout from "@/components/layout/dashboards/VendorLayout";

const ORDER_STATUS_COLORS: Record<string, string> = {
  pending:    "bg-yellow-100 text-yellow-700",
  confirmed:  "bg-blue-100 text-blue-700",
  processing: "bg-indigo-100 text-indigo-700",
  shipped:    "bg-purple-100 text-purple-700",
  delivered:  "bg-green-100 text-green-700",
  cancelled:  "bg-red-100 text-red-700",
  refunded:   "bg-orange-100 text-orange-700",
};

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  pending:   "bg-yellow-50 text-yellow-600 border-yellow-200",
  completed: "bg-green-50 text-green-700 border-green-200",
  failed:    "bg-red-50 text-red-600 border-red-200",
  refunded:  "bg-orange-50 text-orange-600 border-orange-200",
};

const PAYMENT_LABELS: Record<string, string> = {
  cod:     "COD",
  aba:     "ABA",
  bakong:  "Bakong",
  acleda:  "ACLEDA",
  card:    "Card",
};

const STATUS_FILTERS = [
  { value: "all",       label: "All" },
  { value: "pending",   label: "New Order" },
  { value: "confirmed", label: "Confirmed" },
  { value: "shipped",   label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

export default function VendorOrders() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("all");

  const { data, isLoading } = useQuery({
    queryKey: ["vendor-orders", page, status],
    queryFn: async () => {
      const res = await api.get("/vendor/orders", {
        params: { page, status: status !== "all" ? status : undefined },
      });
      return res.data;
    },
  });

  const orderAction = (id: number, endpoint: string, label: string) =>
    api.post(`/vendor/orders/${id}/${endpoint}`)
      .then(() => { toast.success(`Order ${label}!`); qc.invalidateQueries({ queryKey: ["vendor-orders"] }); })
      .catch(() => toast.error("Action failed."));

  const confirmPaymentMutation = useMutation({
    mutationFn: (id: number) => api.post(`/vendor/orders/${id}/confirm-payment`),
    onSuccess: () => { toast.success("Payment confirmed!"); qc.invalidateQueries({ queryKey: ["vendor-orders"] }); },
    onError: () => toast.error("Failed to confirm payment."),
  });

  const rejectPaymentMutation = useMutation({
    mutationFn: (id: number) => api.post(`/vendor/orders/${id}/reject-payment`),
    onSuccess: () => { toast.success("Payment rejected — order cancelled, refund initiated."); qc.invalidateQueries({ queryKey: ["vendor-orders"] }); },
    onError: () => toast.error("Failed to reject payment."),
  });

  return (
    <VendorLayout title="Orders">
      {/* Status filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {STATUS_FILTERS.map(({ value, label }) => (
          <button key={value} onClick={() => { setStatus(value); setPage(1); }}
            className={`px-3 py-1.5 rounded-xl text-sm font-medium capitalize transition ${
              status === value ? "bg-primary text-white" : "bg-muted hover:bg-muted/80"
            }`}>
            {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}</div>
      ) : (
        <div className="bg-card border rounded-2xl overflow-hidden overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4 font-medium">Order #</th>
                <th className="text-left p-4 font-medium">Customer</th>
                <th className="text-left p-4 font-medium">Total</th>
                <th className="text-left p-4 font-medium">Order Status</th>
                <th className="text-left p-4 font-medium">Payment</th>
                <th className="text-left p-4 font-medium">Date</th>
                <th className="text-left p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data?.data?.length === 0 && (
                <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No orders yet.</td></tr>
              )}
              {data?.data?.map((order: any) => {
                const paymentStatus = order.payment?.status ?? "pending";
                const paymentGateway = order.payment?.gateway ?? "cod";
                const isQrPayment = ["aba", "bakong", "acleda"].includes(paymentGateway);
                const paymentPending = paymentStatus === "pending" && order.status !== "cancelled";

                return (
                  <tr key={order.id} className="hover:bg-muted/30">
                    <td className="p-4 font-mono font-medium">#{order.order_number ?? order.id}</td>
                    <td className="p-4">
                      <p className="font-medium">{order.customer?.name ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">{order.customer?.email}</p>
                    </td>
                    <td className="p-4 font-medium">{formatCurrency(order.total)}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${ORDER_STATUS_COLORS[order.status] ?? "bg-muted"}`}>
                        {order.status === "pending" ? "New Order" : order.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground">{PAYMENT_LABELS[paymentGateway] ?? paymentGateway}</span>
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border w-fit ${PAYMENT_STATUS_COLORS[paymentStatus] ?? "bg-muted"}`}>
                          {paymentStatus === "completed" ? "Paid" : paymentStatus === "refunded" ? "Refunded" : paymentStatus === "failed" ? "Failed" : "Awaiting"}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</td>
                    <td className="p-4">
                      <div className="flex gap-1 flex-wrap">
                        {/* Order status actions */}
                        {order.status === "pending" && paymentStatus === "completed" && (
                          <button onClick={() => orderAction(order.id, "confirm", "confirmed")}
                            className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs hover:bg-blue-200">
                            Confirm
                          </button>
                        )}
                        {order.status === "confirmed" && (
                          <button onClick={() => orderAction(order.id, "ship", "shipped")}
                            className="px-2 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs hover:bg-purple-200">
                            Ship
                          </button>
                        )}
                        {order.status === "shipped" && (
                          <button onClick={() => orderAction(order.id, "deliver", "delivered")}
                            className="px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs hover:bg-green-200">
                            Deliver
                          </button>
                        )}

                        {/* Payment actions — for QR/bank or COD with pending payment */}
                        {paymentPending && (
                          <>
                            <button
                              onClick={() => confirmPaymentMutation.mutate(order.id)}
                              disabled={confirmPaymentMutation.isPending}
                              title="Confirm payment received"
                              className="p-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 disabled:opacity-50"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                            </button>
                            {isQrPayment && (
                              <button
                                onClick={() => rejectPaymentMutation.mutate(order.id)}
                                disabled={rejectPaymentMutation.isPending}
                                title="Reject payment & cancel order"
                                className="p-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </>
                        )}

                        {paymentStatus === "completed" && order.status === "pending" && !isQrPayment && (
                          <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                            <DollarSign className="w-3 h-3" /> Paid
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {data?.last_page > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
            className="px-4 py-2 rounded-xl text-sm bg-muted hover:bg-muted/80 disabled:opacity-40">Previous</button>
          <span className="px-4 py-2 text-sm text-muted-foreground">Page {page} of {data.last_page}</span>
          <button onClick={() => setPage((p) => p + 1)} disabled={page === data.last_page}
            className="px-4 py-2 rounded-xl text-sm bg-muted hover:bg-muted/80 disabled:opacity-40">Next</button>
        </div>
      )}
    </VendorLayout>
  );
}
