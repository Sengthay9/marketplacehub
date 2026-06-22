"use client";

import { useQuery } from "@tanstack/react-query";
import { Users, Store, Package, ArrowRight, Coins } from "lucide-react";
import api from "@/lib/axios";
import { formatCurrency } from "@/lib/utils";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import AdminLayout from "@/components/layout/dashboards/AdminLayout";

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: async () => {
      const res = await api.get("/admin/dashboard");
      return res.data.dashboard;
    },
  });

  const stats = [
    { label: "Monthly Commission (15%)",value: formatCurrency(data?.monthly_commission ?? 0),  icon: Coins,      color: "text-yellow-600", bg: "bg-yellow-50" },
    { label: "Total Commission",       value: formatCurrency(data?.total_commission ?? 0),     icon: Coins,      color: "text-emerald-600",bg: "bg-emerald-50"},
    { label: "Active Shops",           value: data?.active_shops ?? 0,                        icon: Store,      color: "text-purple-500", bg: "bg-purple-50" },
    { label: "Total Customers",        value: data?.total_customers ?? 0,                     icon: Users,      color: "text-orange-500", bg: "bg-orange-50" },
    { label: "Total Products",         value: data?.total_products ?? 0,                      icon: Package,    color: "text-indigo-500", bg: "bg-indigo-50" },
  ];

  return (
    <AdminLayout title="Dashboard">
      {/* Alerts */}
      {(data?.pending_shops > 0 || data?.pending_products > 0) && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          {data?.pending_shops > 0 && (
            <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 rounded-2xl p-4 flex items-center gap-3">
              <Store className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="font-semibold text-yellow-800 dark:text-yellow-400 text-sm">
                  {data.pending_shops} shop(s) awaiting approval
                </p>
                <a href="/admin/vendors?status=pending" className="text-xs text-yellow-600 hover:underline flex items-center gap-1">Review now <ArrowRight className="w-3 h-3" /></a>
              </div>
            </div>
          )}
          {data?.pending_products > 0 && (
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 rounded-2xl p-4 flex items-center gap-3">
              <Package className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-semibold text-blue-800 dark:text-blue-400 text-sm">
                  {data.pending_products} product(s) awaiting moderation
                </p>
                <a href="/admin/products?status=pending" className="text-xs text-blue-600 hover:underline flex items-center gap-1">Review now <ArrowRight className="w-3 h-3" /></a>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
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
        {/* Commission Chart */}
        <div className="bg-card border rounded-2xl p-6 lg:col-span-2">
          <h3 className="font-bold mb-1 flex items-center gap-2">
            <Coins className="w-4 h-4 text-yellow-600" /> Monthly Commission (last 12 months)
          </h3>
          <p className="text-xs text-muted-foreground mb-4">15% platform commission collected per month</p>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={data?.commission_chart ?? []}>
              <XAxis dataKey="label" tick={{ fontSize: 10 }} tickFormatter={(v) => v?.slice(0, 3)} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
              <Tooltip
                formatter={(v: number) => [formatCurrency(v), "Commission"]}
                labelFormatter={(label) => label}
              />
              <Area type="monotone" dataKey="commission" stroke="hsl(45 93% 47%)" fill="hsl(45 93% 47% / 0.12)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
          <p className="text-xs text-muted-foreground mt-3">
            Months with $0 have no delivered orders yet or commission not calculated. Go to <a href="/admin/commissions" className="text-primary hover:underline">Commissions</a> to calculate.
          </p>
        </div>

        {/* Top Shops */}
        <div className="bg-card border rounded-2xl p-6 lg:col-span-2">
          <h3 className="font-bold mb-4">Top Performing Shops</h3>
          <div className="space-y-3">
            {(data?.top_shops ?? []).map((shop: {
              id: number; name: string; revenue: number;
            }, i: number) => (
              <div key={shop.id} className="flex items-center gap-3">
                <span className="w-7 h-7 bg-muted rounded-full flex items-center justify-center text-xs font-bold">
                  {i + 1}
                </span>
                <p className="flex-1 text-sm font-medium">{shop.name}</p>
                <span className="text-sm font-bold text-green-600">{formatCurrency(shop.revenue)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
