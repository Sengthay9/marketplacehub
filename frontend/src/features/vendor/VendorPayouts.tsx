"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Wallet, Clock, CheckCircle2, TrendingUp,
  ShoppingBag, CheckCircle, XCircle, MapPin, ChevronDown, ChevronUp,
} from "lucide-react";
import api from "@/lib/axios";
import { formatCurrency } from "@/lib/utils";
import VendorLayout from "@/components/layout/dashboards/VendorLayout";

/* ══════════════════════════════════════════
   Read-only Leaflet map for delivery address
══════════════════════════════════════════ */
function OrderLocationMap({ lat, lng }: { lat: number; lng: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<any>(null);

  useEffect(() => {
    if (typeof window === "undefined" || mapRef.current || !containerRef.current) return;

    import("leaflet").then((L) => {
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });
      const map = L.map(containerRef.current!, { zoomControl: true, dragging: true, scrollWheelZoom: false })
        .setView([lat, lng], 15);
      mapRef.current = map;
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap", maxZoom: 19,
      }).addTo(map);
      L.marker([lat, lng]).addTo(map);
    });

    return () => { mapRef.current?.remove(); mapRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={containerRef} className="w-full h-52 rounded-xl border overflow-hidden" style={{ minHeight: 208 }} />
  );
}

/* ══════════════════════════════════════════
   Expanded order detail
══════════════════════════════════════════ */
function OrderDetail({ order }: { order: any }) {
  const address = order.address;
  const hasMap  = address?.latitude && address?.longitude;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Items */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Items Ordered</p>
        <div className="space-y-2">
          {order.items?.map((item: any) => (
            <div key={item.id} className="flex justify-between items-start text-sm">
              <div>
                <p className="font-medium">{item.product_name}</p>
                {item.variant_info && <p className="text-xs text-muted-foreground">{item.variant_info}</p>}
                <p className="text-xs text-muted-foreground">× {item.quantity}</p>
              </div>
              <span className="font-medium whitespace-nowrap">{formatCurrency(item.total_price)}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-3 border-t space-y-1 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span><span>{formatCurrency(order.subtotal)}</span>
          </div>
          {Number(order.discount_amount) > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount</span><span>-{formatCurrency(order.discount_amount)}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold border-t pt-1">
            <span>Total</span><span>{formatCurrency(order.total)}</span>
          </div>
        </div>
      </div>

      {/* Address + Map */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Delivery Location</p>
        {address ? (
          <div className="space-y-3">
            <div className="flex items-start gap-2 text-sm">
              <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">{address.recipient_name}</p>
                {address.phone && <p className="text-muted-foreground text-xs">{address.phone}</p>}
                <p className="text-muted-foreground text-xs mt-0.5">
                  {[address.street, address.city, address.state, address.country].filter(Boolean).join(", ")}
                </p>
              </div>
            </div>
            {hasMap
              ? <OrderLocationMap lat={address.latitude} lng={address.longitude} />
              : <div className="h-52 rounded-xl border bg-muted/30 flex items-center justify-center text-sm text-muted-foreground">No map coordinates saved</div>
            }
          </div>
        ) : (
          <div className="h-52 rounded-xl border bg-muted/30 flex items-center justify-center text-sm text-muted-foreground">
            No delivery address provided
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   Constants
══════════════════════════════════════════ */
const ORDER_STATUS_COLORS: Record<string, string> = {
  pending:    "bg-yellow-100 text-yellow-700",
  confirmed:  "bg-blue-100 text-blue-700",
  processing: "bg-indigo-100 text-indigo-700",
  delivered:  "bg-green-100 text-green-700",
  cancelled:  "bg-red-100 text-red-700",
  refunded:   "bg-orange-100 text-orange-700",
};

const ORDER_STATUS_LABEL: Record<string, string> = {
  pending:    "Pending",
  confirmed:  "Confirmed",
  processing: "Processing",
  delivered:  "Delivered",
  cancelled:  "Cancelled",
  refunded:   "Refunded",
};

const STATUS_FILTERS = [
  { value: "all",       label: "All" },
  { value: "pending",   label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "await",     label: "Await" },
  { value: "receive",   label: "Receive" },
];

/* ══════════════════════════════════════════
   Main page
══════════════════════════════════════════ */
export default function VendorPayouts() {
  const qc = useQueryClient();
  const [page, setPage]           = useState(1);
  const [status, setStatus]       = useState("all");
  const [expanded, setExpanded]   = useState<number | null>(null);
  const [expandedPayout, setExpandedPayout] = useState<number | null>(null);

  /* Payout summary */
  const { data: payoutData, isLoading: summaryLoading } = useQuery({
    queryKey: ["vendor-payouts"],
    queryFn: async () => (await api.get("/vendor/payouts")).data,
  });

  const isPayoutTab = status === "await" || status === "receive";

  /* Orders */
  const { data: orderData, isLoading: ordersLoading } = useQuery({
    queryKey: ["vendor-orders", page, status],
    queryFn: async () => (await api.get("/vendor/orders", {
      params: { page, status: !["all", "await", "receive"].includes(status) ? status : undefined },
    })).data,
    enabled: !isPayoutTab,
  });

  const invalidateOrders = () => qc.invalidateQueries({ queryKey: ["vendor-orders"] });

  const confirmMutation = useMutation({
    mutationFn: (id: number) => api.post(`/vendor/orders/${id}/confirm`),
    onSuccess: () => { toast.success("Order confirmed!"); invalidateOrders(); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? "Failed to confirm order."),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: number) => api.post(`/vendor/orders/${id}/reject-payment`),
    onSuccess: () => { toast.success("Order rejected and cancelled."); invalidateOrders(); },
    onError: () => toast.error("Failed to reject order."),
  });

  const summary = payoutData?.summary;

  return (
    <VendorLayout title="Orders & Payouts">

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Total Earned */}
        <div className="bg-card border rounded-2xl p-5">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
            <TrendingUp className="w-4 h-4 text-green-500" /> Total Earned
          </div>
          {summaryLoading
            ? <div className="h-8 w-28 bg-muted rounded-lg animate-pulse" />
            : <p className="text-2xl font-bold text-green-600">{formatCurrency(summary?.total_earned ?? 0)}</p>
          }
          <p className="text-xs text-muted-foreground mt-1">Gross revenue across all orders</p>
        </div>

        {/* Pending */}
        <div className="bg-card border rounded-2xl p-5">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
            <Clock className="w-4 h-4 text-yellow-500" /> Pending
          </div>
          {summaryLoading
            ? <div className="h-8 w-28 bg-muted rounded-lg animate-pulse" />
            : <p className="text-2xl font-bold text-yellow-600">{formatCurrency(summary?.pending_amount ?? 0)}</p>
          }
          <p className="text-xs text-muted-foreground mt-1">Awaiting admin transfer</p>
        </div>

        {/* Received */}
        <div className="bg-card border rounded-2xl p-5">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
            <CheckCircle2 className="w-4 h-4 text-blue-500" /> Received
          </div>
          {summaryLoading
            ? <div className="h-8 w-28 bg-muted rounded-lg animate-pulse" />
            : <p className="text-2xl font-bold text-blue-600">{formatCurrency(summary?.completed_amount ?? 0)}</p>
          }
          <p className="text-xs text-muted-foreground mt-1">Transferred to your account</p>
        </div>

        {/* Platform Fee */}
        <div className="bg-card border rounded-2xl p-5">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
            <Wallet className="w-4 h-4 text-orange-500" /> Platform Fee Paid
          </div>
          {summaryLoading
            ? <div className="h-8 w-28 bg-muted rounded-lg animate-pulse" />
            : <p className="text-2xl font-bold text-orange-500">{formatCurrency(summary?.total_fee_paid ?? 0)}</p>
          }
          <p className="text-xs text-muted-foreground mt-1">Deducted before payout</p>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {STATUS_FILTERS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => { setStatus(value); setPage(1); setExpanded(null); setExpandedPayout(null); }}
            className={`px-3 py-1.5 rounded-xl text-sm font-medium transition ${
              status === value ? "bg-primary text-white" : "bg-muted hover:bg-muted/80"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Payout Bills (Await / Receive tabs) ── */}
      {isPayoutTab ? (() => {
        const allPayouts: any[] = payoutData?.payouts?.data ?? [];
        const rows = status === "await"
          ? allPayouts.filter((p) => ["pending", "processing"].includes(p.status))
          : allPayouts.filter((p) => p.status === "completed");

        return summaryLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => <div key={i} className="h-14 bg-muted rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <div className="border rounded-2xl overflow-hidden overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead className="bg-muted/40 border-b">
                <tr>
                  <th className="text-left px-6 py-4 font-medium text-muted-foreground">Order #</th>
                  <th className="text-left px-6 py-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-6 py-4 font-medium text-muted-foreground">Receive</th>
                  <th className="text-left px-6 py-4 font-medium text-muted-foreground">Fee</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
                          {status === "await"
                            ? <Clock className="w-7 h-7 text-muted-foreground" />
                            : <CheckCircle2 className="w-7 h-7 text-muted-foreground" />
                          }
                        </div>
                        <p className="font-semibold">
                          {status === "await" ? "No pending bills" : "No received bills yet"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {status === "await"
                            ? "Bills awaiting admin transfer will appear here."
                            : "Bills paid out by admin will appear here."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : rows.map((p: any) => {
                  const feeRate    = p.gross_amount > 0 ? ((p.platform_fee / p.gross_amount) * 100).toFixed(0) : "0";
                  const isReceive  = status === "receive";
                  const isPExpanded = expandedPayout === p.id;

                  return (
                    <>
                      <tr
                        key={p.id}
                        onClick={() => isReceive && setExpandedPayout(isPExpanded ? null : p.id)}
                        className={`transition-colors ${isReceive ? "cursor-pointer" : ""} ${
                          isPExpanded ? "bg-green-50/50" : "hover:bg-muted/20"
                        }`}
                      >
                        <td className="px-6 py-4 font-mono font-medium text-primary">
                          <div className="flex items-center gap-2">
                            {isReceive && (isPExpanded
                              ? <ChevronUp   className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                              : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            )}
                            #{p.order?.order_number ?? p.order_id}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {status === "await" ? (
                            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                              Await
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                              Receive
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {status === "await" ? (
                            <span className="text-muted-foreground font-medium">— — —</span>
                          ) : (
                            <span className="text-green-600 font-bold">{formatCurrency(p.vendor_amount)}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-orange-600 font-medium">
                          -{formatCurrency(p.platform_fee)}
                          <span className="text-[11px] text-muted-foreground ml-1">({feeRate}%)</span>
                        </td>
                      </tr>

                      {/* Expanded Bakong bill detail — Receive tab only */}
                      {isPExpanded && (
                        <tr key={`${p.id}-bill`} className="border-t bg-green-50/30">
                          <td colSpan={4} className="px-8 py-6">
                            <div className="max-w-md">
                              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-4 flex items-center gap-2">
                                <Wallet className="w-3.5 h-3.5" /> Bakong Transfer Receipt
                              </p>
                              <div className="bg-card border rounded-2xl p-5 space-y-3">
                                {/* Order # */}
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Order</span>
                                  <span className="font-mono font-medium">#{p.order?.order_number ?? p.order_id}</span>
                                </div>
                                {/* Order total */}
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Order Total</span>
                                  <span className="font-medium">{formatCurrency(p.gross_amount)}</span>
                                </div>
                                {/* Fee deducted */}
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Platform Fee ({feeRate}%)</span>
                                  <span className="text-orange-600 font-medium">-{formatCurrency(p.platform_fee)}</span>
                                </div>
                                {/* Divider */}
                                <div className="border-t pt-3 flex justify-between text-sm font-semibold">
                                  <span>Amount Received</span>
                                  <span className="text-green-600 text-base">{formatCurrency(p.vendor_amount)}</span>
                                </div>
                                {/* Bakong ref */}
                                {p.reference && (
                                  <div className="flex justify-between text-sm border-t pt-3">
                                    <span className="text-muted-foreground">Bakong Ref #</span>
                                    <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">{p.reference}</span>
                                  </div>
                                )}
                                {/* Transfer date */}
                                {p.processed_at && (
                                  <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Transfer Date</span>
                                    <span>{new Date(p.processed_at).toLocaleString()}</span>
                                  </div>
                                )}
                                {/* Notes */}
                                {p.notes && (
                                  <div className="text-sm border-t pt-3">
                                    <p className="text-muted-foreground mb-1">Notes</p>
                                    <p className="text-foreground/80">{p.notes}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      })() : (
        /* ── Orders table ── */
        <>
          {ordersLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}
            </div>
          ) : (
            <div className="border rounded-2xl overflow-hidden overflow-x-auto">
              <table className="w-full text-sm min-w-[800px]">
                <thead className="bg-muted/40 border-b">
                  <tr>
                    <th className="text-left px-6 py-4 font-medium text-muted-foreground">Customer</th>
                    <th className="text-left px-6 py-4 font-medium text-muted-foreground">Email</th>
                    <th className="text-left px-6 py-4 font-medium text-muted-foreground">Fee</th>
                    <th className="text-left px-6 py-4 font-medium text-muted-foreground">Receive</th>
                    <th className="text-left px-6 py-4 font-medium text-muted-foreground">Status</th>
                    <th className="text-left px-6 py-4 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {!(orderData?.data?.length > 0) ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
                            <ShoppingBag className="w-7 h-7 text-muted-foreground" />
                          </div>
                          <p className="font-semibold">No orders yet</p>
                          <p className="text-sm text-muted-foreground">Orders from customers will appear here.</p>
                        </div>
                      </td>
                    </tr>
                  ) : orderData.data.map((order: any) => {
                    const vendorGets = Number(order.total) - Number(order.platform_fee ?? 0);
                    const payStatus  = order.payment?.status ?? "pending";
                    const canConfirm = order.status === "pending" && payStatus === "completed";
                    const canReject  = ["pending", "confirmed"].includes(order.status);
                    const isExpanded = expanded === order.id;

                    return (
                      <>
                        <tr
                          key={order.id}
                          onClick={() => setExpanded(isExpanded ? null : order.id)}
                          className={`border-t cursor-pointer transition-colors ${
                            isExpanded ? "bg-muted/30" : "hover:bg-muted/20"
                          }`}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              {isExpanded
                                ? <ChevronUp   className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                              }
                              <p className="font-medium leading-snug">{order.customer?.name ?? "—"}</p>
                            </div>
                          </td>

                          <td className="px-6 py-4 text-sm text-muted-foreground">
                            {order.customer?.email ?? "—"}
                          </td>

                          <td className="px-6 py-4">
                            <span className="text-orange-600 font-medium">
                              -{formatCurrency(order.platform_fee ?? 0)}
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            <span className="text-green-600 font-semibold">{formatCurrency(vendorGets)}</span>
                          </td>

                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${ORDER_STATUS_COLORS[order.status] ?? "bg-muted"}`}>
                              {ORDER_STATUS_LABEL[order.status] ?? order.status}
                            </span>
                          </td>

                          <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                            <div className="flex gap-2 flex-wrap">
                              {canConfirm && (
                                <button
                                  onClick={() => confirmMutation.mutate(order.id)}
                                  disabled={confirmMutation.isPending}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap transition-colors"
                                >
                                  <CheckCircle className="w-3.5 h-3.5" /> Confirm Order
                                </button>
                              )}
                              {canReject && (
                                <button
                                  onClick={() => rejectMutation.mutate(order.id)}
                                  disabled={rejectMutation.isPending}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-medium hover:bg-red-100 disabled:opacity-50 whitespace-nowrap transition-colors"
                                >
                                  <XCircle className="w-3.5 h-3.5" /> Reject
                                </button>
                              )}
                              {order.status === "delivered" && (
                                <span className="text-xs text-green-600 font-medium">Completed</span>
                              )}
                              {order.status === "cancelled" && (
                                <span className="text-xs text-red-500 font-medium">Cancelled</span>
                              )}
                            </div>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr key={`${order.id}-detail`} className="border-t bg-muted/10">
                            <td colSpan={6} className="px-8 py-6">
                              <OrderDetail order={order} />
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {orderData?.last_page > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 rounded-xl text-sm bg-muted hover:bg-muted/80 disabled:opacity-40"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-sm text-muted-foreground">
                Page {page} of {orderData.last_page}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page === orderData.last_page}
                className="px-4 py-2 rounded-xl text-sm bg-muted hover:bg-muted/80 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

    </VendorLayout>
  );
}
