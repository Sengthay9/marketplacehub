"use client";

import { useQuery } from "@tanstack/react-query";
import { DollarSign, ShoppingBag, Star, TrendingUp } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import api from "@/lib/axios";
import { formatCurrency } from "@/lib/utils";
import VendorLayout from "@/components/layout/dashboards/VendorLayout";

export default function VendorAnalytics() {
  const { data: revenue, isLoading: r } = useQuery({
    queryKey: ["vendor-analytics-revenue"],
    queryFn: async () => (await api.get("/vendor/analytics/revenue")).data,
  });
  const { data: orders, isLoading: o } = useQuery({
    queryKey: ["vendor-analytics-orders"],
    queryFn: async () => (await api.get("/vendor/analytics/orders")).data,
  });
  const { data: topProducts, isLoading: t } = useQuery({
    queryKey: ["vendor-analytics-top"],
    queryFn: async () => (await api.get("/vendor/analytics/top-products")).data,
  });

  const isLoading = r || o || t;

  const stats = [
    { label: "Total Revenue",   value: formatCurrency(revenue?.total ?? 0),      icon: DollarSign, color: "text-green-600",  bg: "bg-green-50" },
    { label: "Total Orders",    value: orders?.total ?? 0,                          icon: ShoppingBag, color: "text-blue-600",  bg: "bg-blue-50" },
    { label: "Avg Order Value", value: formatCurrency(revenue?.avg_order ?? 0),   icon: TrendingUp, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Avg Rating",      value: `${(topProducts?.avg_rating ?? 0).toFixed(1)} ★`, icon: Star, color: "text-yellow-600", bg: "bg-yellow-50" },
  ];

  return (
    <VendorLayout title="Analytics">
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-muted rounded-2xl animate-pulse" />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {stats.map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="bg-card border rounded-2xl p-5">
                <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-3`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-sm text-muted-foreground mt-1">{label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-card border rounded-2xl p-5">
              <h3 className="font-semibold mb-4">Revenue (12 months)</h3>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={revenue?.monthly ?? []}>
                  <defs>
                    <linearGradient id="rv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Area type="monotone" dataKey="revenue" stroke="#6366f1" fill="url(#rv)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-card border rounded-2xl p-5">
              <h3 className="font-semibold mb-4">Orders (12 months)</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={orders?.monthly ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-card border rounded-2xl p-5">
            <h3 className="font-semibold mb-4">Top Products</h3>
            <div className="space-y-3">
              {(topProducts?.products ?? []).length === 0 && (
                <p className="text-sm text-muted-foreground">No data yet.</p>
              )}
              {(topProducts?.products ?? []).map((p: any, i: number) => (
                <div key={p.id} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.total_sold ?? 0} sold</p>
                  </div>
                  <span className="text-sm font-semibold">{formatCurrency(p.revenue ?? 0)}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </VendorLayout>
  );
}
