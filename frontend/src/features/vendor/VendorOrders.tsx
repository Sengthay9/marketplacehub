"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ShoppingBag, CheckCircle, XCircle, MapPin, ChevronDown, ChevronUp } from "lucide-react";
import api from "@/lib/axios";
import { formatCurrency } from "@/lib/utils";
import VendorLayout from "@/components/layout/dashboards/VendorLayout";

/* ─── Read-only map pinned at customer's saved location ─── */
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
        attribution: "© OpenStreetMap",
        maxZoom: 19,
      }).addTo(map);

      L.marker([lat, lng]).addTo(map);
    });

    return () => { mapRef.current?.remove(); mapRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-52 rounded-xl border overflow-hidden"
      style={{ minHeight: 208 }}
    />
  );
}

/* ─── Expanded order detail panel ─── */
function OrderDetail({ order }: { order: any }) {
  const address = order.address;
  const hasMap  = address?.latitude && address?.longitude;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Items */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
          Items Ordered
        </p>
        <div className="space-y-2">
          {order.items?.map((item: any) => (
            <div key={item.id} className="flex justify-between items-start text-sm">
              <div>
                <p className="font-medium">{item.product_name}</p>
                {item.variant_info && (
                  <p className="text-xs text-muted-foreground">{item.variant_info}</p>
                )}
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
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
          Delivery Location
        </p>
        {address ? (
          <div className="space-y-3">
            <div className="flex items-start gap-2 text-sm">
              <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">{address.recipient_name}</p>
                {address.phone && <p className="text-muted-foreground text-xs">{address.phone}</p>}
                <p className="text-muted-foreground text-xs mt-0.5">
                  {[address.street, address.city, address.state, address.country]
                    .filter(Boolean).join(", ")}
                </p>
              </div>
            </div>
            {hasMap ? (
              <OrderLocationMap lat={address.latitude} lng={address.longitude} />
            ) : (
              <div className="h-52 rounded-xl border bg-muted/30 flex items-center justify-center text-sm text-muted-foreground">
                No map coordinates saved
              </div>
            )}
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

/* ─── Status config ─── */
const STATUS_COLORS: Record<string, string> = {
  pending:    "bg-yellow-100 text-yellow-700",
  confirmed:  "bg-blue-100 text-blue-700",
  processing: "bg-indigo-100 text-indigo-700",
  delivered:  "bg-green-100 text-green-700",
  cancelled:  "bg-red-100 text-red-700",
  refunded:   "bg-orange-100 text-orange-700",
};

const STATUS_LABEL: Record<string, string> = {
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
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

/* ─── Main component ─── */
export default function VendorOrders() {
  const qc = useQueryClient();
  const [page, setPage]         = useState(1);
  const [status, setStatus]     = useState("all");
  const [expanded, setExpanded] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["vendor-orders", page, status],
    queryFn: async () => (await api.get("/vendor/orders", {
      params: { page, status: status !== "all" ? status : undefined },
    })).data,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["vendor-orders"] });

  const confirmMutation = useMutation({
    mutationFn: (id: number) => api.post(`/vendor/orders/${id}/confirm`),
    onSuccess: () => { toast.success("Order confirmed!"); invalidate(); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? "Failed to confirm order."),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: number) => api.post(`/vendor/orders/${id}/reject-payment`),
    onSuccess: () => { toast.success("Order rejected and cancelled."); invalidate(); },
    onError: () => toast.error("Failed to reject order."),
  });

  const deliverMutation = useMutation({
    mutationFn: (id: number) => api.post(`/vendor/orders/${id}/deliver`),
    onSuccess: () => { toast.success("Order marked as delivered."); invalidate(); },
    onError: () => toast.error("Failed to update order."),
  });

  return (
    <VendorLayout title="Orders">
      {/* Status filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {STATUS_FILTERS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => { setStatus(value); setPage(1); setExpanded(null); }}
            className={`px-3 py-1.5 rounded-xl text-sm font-medium transition ${
              status === value ? "bg-primary text-white" : "bg-muted hover:bg-muted/80"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="border rounded-2xl overflow-hidden overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead className="bg-muted/40 border-b">
              <tr>
                <th className="text-left px-6 py-4 font-medium text-muted-foreground">Customer</th>
                <th className="text-left px-6 py-4 font-medium text-muted-foreground">Total</th>
                <th className="text-left px-6 py-4 font-medium text-muted-foreground">QTY</th>
                <th className="text-left px-6 py-4 font-medium text-muted-foreground">Fee</th>
                <th className="text-left px-6 py-4 font-medium text-muted-foreground">Income</th>
                <th className="text-left px-6 py-4 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-6 py-4 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {!(data?.data?.length > 0) ? (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
                        <ShoppingBag className="w-7 h-7 text-muted-foreground" />
                      </div>
                      <p className="font-semibold">No orders yet</p>
                      <p className="text-sm text-muted-foreground">Orders from customers will appear here.</p>
                    </div>
                  </td>
                </tr>
              ) : data.data.map((order: any) => {
                const totalQty   = order.items?.reduce((s: number, i: any) => s + i.quantity, 0) ?? 0;
                const vendorGets = Number(order.total) - Number(order.platform_fee ?? 0);
                const payStatus  = order.payment?.status ?? "pending";
                const canConfirm = order.status === "pending" && payStatus === "completed";
                const canDeliver = order.status === "confirmed";
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
                            ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          }
                          <div>
                            <p className="font-medium leading-snug">{order.customer?.name ?? "—"}</p>
                            <p className="text-xs text-muted-foreground">{order.customer?.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 font-semibold">{formatCurrency(order.total)}</td>

                      <td className="px-6 py-4">
                        {totalQty} item{totalQty !== 1 ? "s" : ""}
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
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[order.status] ?? "bg-muted"}`}>
                          {STATUS_LABEL[order.status] ?? order.status}
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
                          {canDeliver && (
                            <button
                              onClick={() => deliverMutation.mutate(order.id)}
                              disabled={deliverMutation.isPending}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 disabled:opacity-50 whitespace-nowrap transition-colors"
                            >
                              <CheckCircle className="w-3.5 h-3.5" /> Delivered
                            </button>
                          )}
                          {canReject && (
                            <button
                              onClick={() => rejectMutation.mutate(order.id)}
                              disabled={rejectMutation.isPending}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-medium hover:bg-red-100 disabled:opacity-50 whitespace-nowrap transition-colors"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Reject Order
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

                    {/* Expanded detail row */}
                    {isExpanded && (
                      <tr key={`${order.id}-detail`} className="border-t bg-muted/10">
                        <td colSpan={7} className="px-8 py-6">
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

      {data?.last_page > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-xl text-sm bg-muted hover:bg-muted/80 disabled:opacity-40"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-sm text-muted-foreground">
            Page {page} of {data.last_page}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page === data.last_page}
            className="px-4 py-2 rounded-xl text-sm bg-muted hover:bg-muted/80 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </VendorLayout>
  );
}
