"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Package, MapPin, CreditCard, X, Check, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { orderService } from "@/services/order.service";
import { formatCurrency, formatDate, getOrderStatusColor } from "@/lib/utils";

const ORDER_STEPS = ["pending", "confirmed", "processing", "shipped", "delivered"];

export default function OrderDetailView({ orderId }: { orderId: number }) {
  const qc = useQueryClient();
  const { data: order, isLoading } = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => orderService.get(orderId),
  });

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
          <div className="flex justify-between text-muted-foreground"><span>Shipping</span><span>{formatCurrency(order.shipping_fee)}</span></div>
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
    </div>
  );
}
