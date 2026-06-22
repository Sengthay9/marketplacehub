"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Package, ChevronRight, ArrowLeft } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import CartSidebar from "@/features/cart/CartSidebar";
import { useAuthStore } from "@/store/auth.store";
import api from "@/lib/axios";
import { formatCurrency, formatDate, getOrderStatusColor } from "@/lib/utils";

export default function OrdersPage() {
  const router = useRouter();
  const { isAuthenticated, user, _hasHydrated } = useAuthStore();

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!isAuthenticated) router.replace("/login");
    else if (user?.role !== "customer") router.replace("/");
  }, [_hasHydrated, isAuthenticated, user?.role, router]);

  const { data: orders, isLoading } = useQuery({
    queryKey: ["customer-orders"],
    queryFn: async () => (await api.get("/customer/orders")).data.data,
    enabled: isAuthenticated,
  });

  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-7">
          <Link href="/account" className="text-muted-foreground hover:text-foreground transition">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="text-2xl font-bold">My Orders</h1>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 bg-muted rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : !orders?.length ? (
          <div className="text-center py-24 text-muted-foreground">
            <Package className="w-14 h-14 mx-auto mb-4 opacity-20" />
            <p className="font-medium">No orders yet.</p>
            <p className="text-sm mt-1">When you place an order it will show up here.</p>
            <Link href="/products" className="mt-4 inline-block px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order: any) => (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="flex items-center justify-between bg-card border rounded-2xl p-5 hover:shadow-sm transition"
              >
                <div>
                  <p className="font-semibold text-sm">{order.order_number}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDate(order.created_at)} · {order.items_count} item(s)
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${getOrderStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                  <span className="font-bold text-sm">{formatCurrency(order.total)}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
      <CartSidebar />
    </>
  );
}
