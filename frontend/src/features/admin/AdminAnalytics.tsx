"use client";

import { useQuery } from "@tanstack/react-query";
import {
  TrendingUp, TrendingDown, Store, Users, Package,
  DollarSign, ShoppingBag, AlertTriangle, ArrowUpRight,
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import api from "@/lib/axios";
import { formatCurrency } from "@/lib/utils";

export default function AdminAnalytics() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: async () => (await api.get("/admin/analytics")).data,
    refetchInterval: 60_000,
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <div key={i} className="h-28 bg-muted rounded-2xl" />)}
        </div>
        <div className="h-64 bg-muted rounded-2xl" />
      </div>
    );
  }

  const d = data ?? {};

  const incomeChange = d.last_month_income > 0
    ? (((d.monthly_income - d.last_month_income) / d.last_month_income) * 100).toFixed(1)
    : null;

  return (
    <div className="space-y-6">

      {/* ── Row 1: Income cards ─────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <BigStatCard
          label="Total Income"
          sub="Platform commission earned"
          value={formatCurrency(d.total_income ?? 0)}
          icon={<DollarSign className="w-6 h-6" />}
          accent="bg-emerald-500"
          bg="bg-emerald-50 dark:bg-emerald-950/30"
          textColor="text-emerald-700 dark:text-emerald-400"
        />
        <BigStatCard
          label="Monthly Income"
          sub={incomeChange !== null
            ? `${Number(incomeChange) >= 0 ? "▲" : "▼"} ${Math.abs(Number(incomeChange))}% vs last month`
            : "This month's commission"}
          value={formatCurrency(d.monthly_income ?? 0)}
          icon={<TrendingUp className="w-6 h-6" />}
          accent="bg-blue-500"
          bg="bg-blue-50 dark:bg-blue-950/30"
          textColor="text-blue-700 dark:text-blue-400"
          positive={incomeChange !== null ? Number(incomeChange) >= 0 : undefined}
        />
      </div>

      {/* ── Row 2: Shops / Users / Products ────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <SmallStatCard
          label="Total Shops"    value={d.total_shops ?? 0}
          sub={`+${d.new_shops ?? 0} this month`}
          icon={<Store className="w-5 h-5" />}
          color="text-violet-600" bg="bg-violet-50 dark:bg-violet-950/30"
        />
        <SmallStatCard
          label="Total Users"    value={d.total_users ?? 0}
          sub={`+${d.new_users ?? 0} this month`}
          icon={<Users className="w-5 h-5" />}
          color="text-sky-600" bg="bg-sky-50 dark:bg-sky-950/30"
        />
        <SmallStatCard
          label="Total Products" value={d.total_products ?? 0}
          sub={`+${d.new_products ?? 0} this month`}
          icon={<Package className="w-5 h-5" />}
          color="text-orange-600" bg="bg-orange-50 dark:bg-orange-950/30"
        />
      </div>

      {/* ── Income chart ────────────────────────────── */}
      <div className="bg-card border rounded-2xl p-6">
        <h3 className="font-bold text-base mb-1">Monthly Income — Last 12 Months</h3>
        <p className="text-xs text-muted-foreground mb-5">Platform commission collected per month (15%)</p>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={d.income_chart ?? []} margin={{ left: 0, right: 8, top: 4, bottom: 0 }}>
            <defs>
              <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.06} />
            <XAxis dataKey="short" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false}
              tickFormatter={(v) => v === 0 ? "$0" : `$${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              formatter={(v: number) => [formatCurrency(v), "Income"]}
              labelFormatter={(l) => l}
              contentStyle={{ borderRadius: 12, fontSize: 12 }}
            />
            <Area type="monotone" dataKey="income"
              stroke="#10b981" strokeWidth={2.5}
              fill="url(#incomeGrad)" dot={false} activeDot={{ r: 5 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ── Top shops + Top items ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Top performing shops */}
        <div className="bg-card border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-violet-100 dark:bg-violet-900/40 rounded-lg flex items-center justify-center">
              <Store className="w-4 h-4 text-violet-600" />
            </div>
            <h3 className="font-bold text-sm">Top Performing Shops</h3>
          </div>
          <div className="space-y-3">
            {(d.top_shops ?? []).map((shop: any, i: number) => {
              const maxRev = d.top_shops?.[0]?.revenue ?? 1;
              const pct    = Math.round((shop.revenue / maxRev) * 100);
              return (
                <div key={shop.id}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-black text-muted-foreground w-5 shrink-0">#{i + 1}</span>
                      <span className="text-sm font-medium truncate">{shop.name}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-muted-foreground">{shop.order_count} orders</span>
                      <span className="text-sm font-bold text-emerald-600">{formatCurrency(shop.revenue)}</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-violet-500 rounded-full transition-all"
                      style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            {!(d.top_shops?.length) && <p className="text-sm text-muted-foreground text-center py-4">No data yet.</p>}
          </div>
        </div>

        {/* Top selling items */}
        <div className="bg-card border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/40 rounded-lg flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-orange-600" />
            </div>
            <h3 className="font-bold text-sm">Top Selling Items</h3>
          </div>
          <div className="space-y-3">
            {(d.top_products ?? []).map((p: any, i: number) => {
              const maxSold = d.top_products?.[0]?.sold_count ?? 1;
              const pct     = Math.round(((p.sold_count || 0) / maxSold) * 100);
              const price   = p.discount_price ?? p.price;
              return (
                <div key={p.id}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-black text-muted-foreground w-5 shrink-0">#{i + 1}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{p.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{p.shop_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-muted-foreground">{p.sold_count ?? 0} sold</span>
                      <span className="text-sm font-bold">{formatCurrency(price)}</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-orange-500 rounded-full transition-all"
                      style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            {!(d.top_products?.length) && <p className="text-sm text-muted-foreground text-center py-4">No data yet.</p>}
          </div>
        </div>
      </div>

      {/* ── Low income shops ─────────────────────── */}
      <div className="bg-card border rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-red-100 dark:bg-red-900/40 rounded-lg flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>
          <div>
            <h3 className="font-bold text-sm">Shops with Low Income</h3>
            <p className="text-xs text-muted-foreground">Approved shops with the lowest revenue — may need attention</p>
          </div>
        </div>
        <div className="divide-y">
          {(d.low_shops ?? []).map((shop: any) => (
            <div key={shop.id} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <Store className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">{shop.name}</p>
                  <p className="text-xs text-muted-foreground">{shop.order_count} delivered orders</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-sm font-bold ${shop.revenue === 0 ? "text-red-500" : "text-muted-foreground"}`}>
                  {formatCurrency(shop.revenue)}
                </p>
                {shop.revenue === 0 && (
                  <span className="text-xs text-red-400">No sales yet</span>
                )}
              </div>
            </div>
          ))}
          {!(d.low_shops?.length) && <p className="text-sm text-muted-foreground text-center py-4">No data yet.</p>}
        </div>
      </div>

    </div>
  );
}

// ── Sub-components ────────────────────────────────────

function BigStatCard({
  label, sub, value, icon, accent, bg, textColor, positive,
}: {
  label: string; sub: string; value: string; icon: React.ReactNode;
  accent: string; bg: string; textColor: string; positive?: boolean;
}) {
  return (
    <div className={`relative rounded-2xl border p-6 overflow-hidden ${bg}`}>
      <div className={`absolute top-0 left-0 w-1 h-full ${accent} rounded-l-2xl`} />
      <div className="flex items-start justify-between">
        <div className={`w-12 h-12 rounded-xl ${accent} bg-opacity-15 flex items-center justify-center text-white mb-4`}
          style={{ background: "rgba(0,0,0,0.08)" }}>
          <span className={textColor}>{icon}</span>
        </div>
        {positive !== undefined && (
          <span className={`flex items-center gap-1 text-xs font-semibold ${positive ? "text-emerald-600" : "text-red-500"}`}>
            {positive ? <ArrowUpRight className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          </span>
        )}
      </div>
      <p className={`text-3xl font-black ${textColor}`}>{value}</p>
      <p className="text-sm font-semibold mt-1">{label}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
    </div>
  );
}

function SmallStatCard({
  label, value, sub, icon, color, bg,
}: {
  label: string; value: number; sub: string; icon: React.ReactNode;
  color: string; bg: string;
}) {
  return (
    <div className={`rounded-2xl border p-5 ${bg}`}>
      <div className="flex items-center justify-between mb-3">
        <span className={`${color}`}>{icon}</span>
        <span className="text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">
          {sub}
        </span>
      </div>
      <p className="text-2xl font-black">{value.toLocaleString()}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}
