"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Package, MapPin, CreditCard, X, Check, ArrowLeft, Banknote, QrCode, Clock, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import api from "@/lib/axios";
import { orderService } from "@/services/order.service";
import { formatCurrency, formatDate, getOrderStatusColor } from "@/lib/utils";
import PaymentQRModal, { type ShopQrCode } from "@/features/checkout/PaymentQRModal";

const GATEWAY_LABELS: Record<string, string> = {
  cod:    "Cash on Delivery",
  bakong: "Bakong KHQR",
  card:   "Credit / Debit Card",
};

const QR_GATEWAYS = new Set(["bakong"]);

const ORDER_STEPS = ["pending", "confirmed", "processing", "delivered"];

export default function OrderDetailView({ orderId }: { orderId: number }) {
  const qc = useQueryClient();
  const [showQrModal, setShowQrModal] = useState(false);

  const { data: order, isLoading } = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => orderService.get(orderId),
  });

  const shopSlug = order?.shop?.slug ?? null;
  const isQrPending =
    order?.payment?.status === "pending" &&
    QR_GATEWAYS.has(order?.payment?.gateway ?? "");

  const { data: shopQrCodes } = useQuery({
    queryKey: ["shop-qr", shopSlug],
    queryFn: async () => (await api.get(`/shops/${shopSlug}/payment-qr`)).data.data as ShopQrCode[],
    enabled: !!shopSlug && isQrPending,
  });

  const matchedQr = shopQrCodes?.find(
    (q) => q.bank_name.toLowerCase() === (order?.payment?.gateway ?? "").toLowerCase()
  ) ?? shopQrCodes?.[0];

  const cancelMutation = useMutation({
    mutationFn: () => orderService.cancel(orderId),
    onSuccess: () => {
      toast.success("Order cancelled.");
      qc.invalidateQueries({ queryKey: ["order", orderId] });
    },
    onError: () => toast.error("Could not cancel this order."),
  });

  if (isLoading) {
    return <div className="space-y-4 animate-pulse">{[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-muted rounded-2xl" />)}</div>;
  }

  if (!order) return <div className="text-center py-20">Order not found</div>;

  const stepIndex = ORDER_STEPS.indexOf(order.status);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/orders" className="text-primary text-sm hover:underline flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> My Orders
          </Link>
          <h1 className="text-xl font-bold mt-1">{order.order_number}</h1>
          <p className="text-muted-foreground text-sm">{formatDate(order.created_at)}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getOrderStatusColor(order.status)}`}>
          {order.status}
        </span>
      </div>

      {/* Progress */}
      {order.status !== "cancelled" && order.status !== "refunded" && (
        <div className="bg-card border rounded-2xl p-6 mb-4">
          <div className="flex items-center justify-between">
            {ORDER_STEPS.map((step, i) => (
              <div key={step} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    i <= stepIndex ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                  }`}>
                    {i < stepIndex ? <Check className="w-4 h-4" /> : i + 1}
                  </div>
                  <span className="text-[10px] mt-1 capitalize text-center">{step}</span>
                </div>
                {i < ORDER_STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-1 ${i < stepIndex ? "bg-primary" : "bg-muted"}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Items */}
      <div className="bg-card border rounded-2xl p-6 mb-4">
        <h2 className="font-bold mb-4 flex items-center gap-2"><Package className="w-4 h-4" /> Items</h2>
        <div className="space-y-3">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between items-center py-2 border-b last:border-0">
              <div>
                <p className="font-medium text-sm">{item.product_name}</p>
                {item.variant_info && <p className="text-xs text-muted-foreground">{item.variant_info}</p>}
                <p className="text-xs text-muted-foreground">× {item.quantity}</p>
              </div>
              <span className="font-bold">{formatCurrency(item.total_price)}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 space-y-1 text-sm">
          <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>{formatCurrency(order.subtotal)}</span></div>
          <div className="flex justify-between text-muted-foreground"><span>Tax</span><span>{formatCurrency(order.tax_amount)}</span></div>
          {order.discount_amount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-{formatCurrency(order.discount_amount)}</span></div>}
          <div className="flex justify-between font-bold text-base border-t pt-2"><span>Total</span><span className="text-primary">{formatCurrency(order.total)}</span></div>
        </div>
      </div>

      {/* Address */}
      {order.address && (
        <div className="bg-card border rounded-2xl p-6 mb-4">
          <h2 className="font-bold mb-2 flex items-center gap-2"><MapPin className="w-4 h-4" /> Delivery Address</h2>
          <p className="text-sm font-medium">{order.address.recipient_name}</p>
          <p className="text-sm text-muted-foreground">{order.address.street}, {order.address.city}</p>
          <p className="text-sm text-muted-foreground">{order.address.phone}</p>
        </div>
      )}

      {/* Payment */}
      {order.payment && (
        <div className="bg-card border rounded-2xl p-6 mb-4">
          <h2 className="font-bold mb-4 flex items-center gap-2">
            <CreditCard className="w-4 h-4" /> Payment
          </h2>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {order.payment.gateway === "cod" ? (
                <Banknote className="w-8 h-8 text-green-600 shrink-0" />
              ) : order.payment.gateway === "card" ? (
                <CreditCard className="w-8 h-8 text-primary shrink-0" />
              ) : (
                <QrCode className="w-8 h-8 text-blue-600 shrink-0" />
              )}
              <div>
                <p className="font-medium text-sm">
                  {GATEWAY_LABELS[order.payment.gateway] ?? order.payment.gateway}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(Number(order.payment.amount))}
                </p>
              </div>
            </div>
            {order.payment.status === "completed" ? (
              <span className="flex items-center gap-1.5 text-sm font-semibold text-green-700 bg-green-100 border border-green-200 px-3 py-1.5 rounded-full">
                <CheckCircle className="w-4 h-4" /> Paid
              </span>
            ) : order.payment.status === "refunded" ? (
              <span className="flex items-center gap-1.5 text-sm font-semibold text-purple-700 bg-purple-100 border border-purple-200 px-3 py-1.5 rounded-full">
                <RefreshCw className="w-4 h-4" /> Refunded
              </span>
            ) : order.payment.status === "failed" ? (
              <span className="flex items-center gap-1.5 text-sm font-semibold text-red-700 bg-red-100 border border-red-200 px-3 py-1.5 rounded-full">
                <XCircle className="w-4 h-4" /> Failed
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-sm font-semibold text-orange-700 bg-orange-100 border border-orange-200 px-3 py-1.5 rounded-full">
                <Clock className="w-4 h-4" /> Awaiting
              </span>
            )}
          </div>

          {/* COD note */}
          {order.payment.gateway === "cod" && order.payment.status === "pending" && (
            <p className="mt-3 text-xs text-muted-foreground bg-muted/40 rounded-xl px-3 py-2">
              Pay in cash when your order arrives.
            </p>
          )}

          {/* QR pending — retry scan */}
          {isQrPending && order.status !== "cancelled" && (
            <div className="mt-4">
              <div className="text-xs text-orange-700 bg-orange-50 border border-orange-200 rounded-xl px-3 py-2 mb-3">
                Waiting for payment. Scan the QR code in your banking app, then click <strong>Pay Now</strong> to confirm.
              </div>
              <button
                onClick={() => setShowQrModal(true)}
                disabled={!matchedQr}
                className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition disabled:opacity-50"
              >
                <QrCode className="w-4 h-4" />
                {matchedQr ? "Pay Now — Scan QR" : "Loading QR…"}
              </button>
            </div>
          )}

          {/* Transaction ref */}
          {order.payment.transaction_id && (
            <p className="mt-3 text-xs text-muted-foreground">
              Ref: <span className="font-mono">{order.payment.transaction_id}</span>
            </p>
          )}
        </div>
      )}

      {/* Cancel */}
      {["pending", "confirmed"].includes(order.status) && (
        <button
          onClick={() => cancelMutation.mutate()}
          disabled={cancelMutation.isPending}
          className="w-full flex items-center justify-center gap-2 py-3 border border-destructive text-destructive rounded-xl hover:bg-destructive/5 transition disabled:opacity-50"
        >
          <X className="w-4 h-4" />
          {cancelMutation.isPending ? "Cancelling…" : "Cancel Order"}
        </button>
      )}

      {/* QR Payment Modal — retry from order page */}
      {showQrModal && matchedQr && order && (
        <PaymentQRModal
          orderId={order.id}
          orderRef={order.order_number}
          total={Number(order.total)}
          qrCode={matchedQr}
          onSuccess={() => {
            setShowQrModal(false);
            qc.invalidateQueries({ queryKey: ["order", orderId] });
          }}
          onCancel={() => setShowQrModal(false)}
        />
      )}
    </div>
  );
}
