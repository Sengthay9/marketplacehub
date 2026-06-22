"use client";

import { useQuery } from "@tanstack/react-query";
import { Package, ShoppingBag, DollarSign, Star, TrendingUp, AlertTriangle } from "lucide-react";
import api from "@/lib/axios";
import { formatCurrency } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import VendorLayout from "@/components/layout/dashboards/VendorLayout";

export default function VendorDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["vendor-dashboard"],
    queryFn: async () => {
      const res = await api.get("/vendor/dashboard");
      return res.data.dashboard;
    },
  });

  const stats = [
    { label: "Total Revenue",   value: formatCurrency(data?.total_revenue ?? 0),      icon: DollarSign, color: "text-green-500",  bg: "bg-green-50  dark:bg-green-950" },
    { label: "Total Orders",    value: data?.total_orders ?? 0,                         icon: ShoppingBag, color: "text-blue-500", bg: "bg-blue-50   dark:bg-blue-950"  },
    { label: "Pending Orders",  value: data?.pending_orders ?? 0,                       icon: Package,     color: "text-orange-500",bg: "bg-orange-50 dark:bg-orange-950"},
    { label: "Total Products",  value: data?.total_products ?? 0,                       icon: Star,        color: "text-purple-500",bg: "bg-purple-50 dark:bg-purple-950"},
  ];

  return (
    <VendorLayout title="Dashboard">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-card border rounded-2xl p-5">
            <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center mb-3`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <p className="text-2xl font-black">{isLoading ? "—" : stat.value}</p>
            <p className="text-sm text-muted-foreground mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-card border rounded-2xl p-6">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" /> Revenue (12 months)
          </h3>
          {data?.revenue_chart?.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.revenue_chart}>
                <XAxis dataKey="month" tick={{ fontSize: 11 }} tickFormatter={(v) => v?.slice(5, 7)} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-52 flex items-center justify-center text-muted-foreground text-sm">
              No revenue data yet
            </div>
          )}
        </div>

        {/* Top Products */}
        <div className="bg-card border rounded-2xl p-6">
          <h3 className="font-bold mb-4">Top Products</h3>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <div key={i} className="h-10 bg-muted rounded animate-pulse" />)}
            </div>
          ) : (
            <div className="space-y-3">
              {(data?.top_products ?? []).map((p: { id: number; name: string; sold_count: number; price: number }, i: number) => (
                <div key={p.id} className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-muted rounded-full flex items-center justify-center text-xs font-bold">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-1">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.sold_count} sold</p>
                  </div>
                  <span className="text-sm font-bold text-primary">{formatCurrency(p.price)}</span>
                </div>
              ))}
              {!data?.top_products?.length && (
                <p className="text-sm text-muted-foreground text-center py-8">No products yet</p>
              )}
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div className="bg-card border rounded-2xl p-6 lg:col-span-2">
          <h3 className="font-bold mb-4">Recent Orders</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left pb-3 font-medium text-muted-foreground">Order</th>
                  <th className="text-left pb-3 font-medium text-muted-foreground">Items</th>
                  <th className="text-left pb-3 font-medium text-muted-foreground">Total</th>
                  <th className="text-left pb-3 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(data?.recent_orders ?? []).map((order: {
                  id: number; order_number: string;
                  items: { length: number }; total: number; status: string;
                }) => (
                  <tr key={order.id} className="hover:bg-muted/40">
                    <td className="py-3 font-mono text-xs">{order.order_number}</td>
                    <td className="py-3">{(order.items as unknown[]).length} items</td>
                    <td className="py-3 font-bold">{formatCurrency(order.total)}</td>
                    <td className="py-3">
                      <span className="capitalize text-xs px-2 py-1 bg-muted rounded-full">{order.status}</span>
                    </td>
                  </tr>
                ))}
                {!data?.recent_orders?.length && (
                  <tr><td colSpan={4} className="py-8 text-center text-muted-foreground">No orders yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </VendorLayout>
  );
}
