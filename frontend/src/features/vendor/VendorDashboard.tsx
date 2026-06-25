"use client";

import { useState } from "react";
import { keepPreviousData } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import {
  TrendingUp, TrendingDown, DollarSign,
  ShoppingBag, Package, AlertTriangle, Star,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";
import api from "@/lib/axios";
import { formatCurrency } from "@/lib/utils";
import VendorLayout from "@/components/layout/dashboards/VendorLayout";

// ── Shared sub-components (same style as admin) ─────────────────────────────

function BigStatCard({
  label, sub, value, icon, accent, bg, textColor,
}: {
  label: string; sub: string; value: string; icon: React.ReactNode;
  accent: string; bg: string; textColor: string;
}) {
  return (
    <div className={`relative rounded-2xl border p-6 overflow-hidden ${bg}`}>
      <div className={`absolute top-0 left-0 w-1 h-full ${accent} rounded-l-2xl`} />
      <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: "rgba(0,0,0,0.08)" }}>
        <span className={textColor}>{icon}</span>
      </div>
      <p className={`text-3xl font-black ${textColor}`}>{value}</p>
      <p className="text-sm font-semibold mt-1">{label}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
    </div>
  );
}

function SmallStatCard({ label, value, sub, icon, color, bg }: {
  label: string; value: number; sub: string; icon: React.ReactNode; color: string; bg: string;
}) {
  return (
    <div className={`rounded-2xl border p-5 ${bg}`}>
      <div className="flex items-center justify-between mb-3">
        <span className={color}>{icon}</span>
        <span className="text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">
          {sub}
        </span>
      </div>
      <p className="text-2xl font-black">{value.toLocaleString()}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}

function StarRating({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map((s) => (
        <Star key={s} className={`w-3 h-3 ${s <= Math.round(value) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`} />
      ))}
      <span className="text-xs font-semibold ml-1">{value?.toFixed(1)}</span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function VendorDashboard() {
  const [topMode, setTopMode] = useState<"rating" | "sales">("sales");
  const [lowMode, setLowMode] = useState<"rating" | "sales">("sales");
  const currentYear = new Date().getFullYear();
  const [chartYear, setChartYear] = useState(currentYear);

  const { data, isLoading } = useQuery({
    queryKey: ["vendor-dashboard", chartYear],
    queryFn: async () => (await api.get(`/vendor/dashboard?year=${chartYear}`)).data.dashboard,
    staleTime:       5 * 60 * 1000,
    gcTime:          30 * 60 * 1000,
    placeholderData: keepPreviousData,
  });

  const d = data ?? {} as any;

  const thisMonth    = d.this_month_income ?? 0;
  const lastMonth    = d.last_month_income ?? 0;
  const thisUp       = thisMonth >= lastMonth;
  const incomeChange = lastMonth > 0
    ? Math.abs(((thisMonth - lastMonth) / lastMonth) * 100).toFixed(1)
    : null;

  // Always build all 12 months so X-axis labels always show
  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const revenueMap: Record<string, number> = {};
  (d.revenue_chart ?? []).forEach((row: any) => {
    revenueMap[row.month] = Number(row.revenue) || 0;
  });
  const chartData = MONTHS.map((short, i) => ({
    short,
    revenue: revenueMap[`${chartYear}-${String(i + 1).padStart(2, "0")}`] ?? 0,
  }));

  if (!data && isLoading) {
    return (
      <VendorLayout title="Dashboard">
        <div className="space-y-6 animate-pulse">
          <div className="grid grid-cols-3 gap-0 rounded-2xl overflow-hidden border h-28" />
          <div className="grid grid-cols-2 gap-4">
            {[...Array(2)].map((_, i) => <div key={i} className="h-24 bg-muted rounded-2xl" />)}
          </div>
          <div className="h-64 bg-muted rounded-2xl" />
        </div>
      </VendorLayout>
    );
  }

  return (
    <VendorLayout title="Dashboard">

      {/* ── Income big cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <BigStatCard
          label="Total Income"
          sub="All-time shop income"
          value={formatCurrency(d.total_income ?? 0)}
          icon={<DollarSign className="w-6 h-6" />}
          accent="bg-emerald-500"
          bg="bg-emerald-50 dark:bg-emerald-950/30"
          textColor="text-emerald-700 dark:text-emerald-400"
        />
        <BigStatCard
          label="This Month"
          sub={incomeChange !== null
            ? `${incomeChange}% ${thisUp ? "more" : "less"} than last month`
            : "Income this month"}
          value={formatCurrency(thisMonth)}
          icon={thisUp ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
          accent={thisUp ? "bg-blue-500" : "bg-red-500"}
          bg={thisUp ? "bg-blue-50 dark:bg-blue-950/30" : "bg-red-50 dark:bg-red-950/30"}
          textColor={thisUp ? "text-blue-700 dark:text-blue-400" : "text-red-700 dark:text-red-400"}
        />
        <BigStatCard
          label="Last Month"
          sub={incomeChange !== null
            ? `${incomeChange}% ${thisUp ? "less" : "more"} than this month`
            : "Income last month"}
          value={formatCurrency(lastMonth)}
          icon={thisUp ? <TrendingDown className="w-6 h-6" /> : <TrendingUp className="w-6 h-6" />}
          accent={thisUp ? "bg-orange-500" : "bg-emerald-500"}
          bg={thisUp ? "bg-orange-50 dark:bg-orange-950/30" : "bg-emerald-50 dark:bg-emerald-950/30"}
          textColor={thisUp ? "text-orange-700 dark:text-orange-400" : "text-emerald-700 dark:text-emerald-400"}
        />
      </div>

      {/* ── Small KPI cards ── */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <SmallStatCard
          label="Today's Orders" value={d.total_orders ?? 0}
          sub={`${d.pending_orders ?? 0} pending`}
          icon={<ShoppingBag className="w-5 h-5" />}
          color="text-blue-600" bg="bg-blue-50 dark:bg-blue-950/30"
        />
        <SmallStatCard
          label="Total Products" value={d.total_products ?? 0}
          sub="in your shop"
          icon={<Package className="w-5 h-5" />}
          color="text-indigo-600" bg="bg-indigo-50 dark:bg-indigo-950/30"
        />
      </div>

      {/* ── Income chart ── */}
      <div
        className="bg-card border rounded-2xl p-6 mb-6 select-none"
        style={{ cursor: "pointer" }}
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          if (e.clientX < rect.left + rect.width / 2) {
            setChartYear((y) => Math.max(y - 1, 2024));
          } else {
            setChartYear((y) => Math.min(y + 1, currentYear));
          }
        }}
      >
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-bold text-base">
            Shop Income —{" "}
            {chartYear === currentYear
              ? "This Year"
              : chartYear === currentYear - 1
              ? "Last Year"
              : chartYear}
          </h3>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart key={chartYear} data={chartData} margin={{ left: 12, right: 8, top: 8, bottom: 0 }}>
            <defs>
              <linearGradient id="vendorIncomeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#10b981" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.07} />
            <XAxis
              dataKey="short"
              height={40}
              interval={0}
              tick={{ fontSize: 12, fill: "#6b7280", fontWeight: 600 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#6b7280" }} tickLine={false} axisLine={false} width={56}
              domain={[0, (dataMax: number) => dataMax > 0 ? Math.ceil(dataMax * 1.25) : 1000]}
              tickFormatter={(v: number) => {
                if (v === 0) return "$0";
                if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
                if (v >= 1_000)     return `$${(v / 1_000).toFixed(1)}k`;
                return `$${v.toFixed(0)}`;
              }}
            />
            <Tooltip formatter={(v: number) => [formatCurrency(v), "Income"]} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
            <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2.5}
              fill="url(#vendorIncomeGrad)" dot={false} activeDot={{ r: 5 }}
              isAnimationActive animationDuration={800} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ── Top products | Low products ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">

        {/* Top Selling */}
        <div className="bg-card border rounded-2xl p-5 cursor-pointer select-none"
          onClick={() => setTopMode(m => m === "rating" ? "sales" : "rating")}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/40 rounded-lg flex items-center justify-center">
                <ShoppingBag className="w-4 h-4 text-orange-600" />
              </div>
              <h3 className="font-bold text-sm">Top Selling Products</h3>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-muted font-medium">
              {topMode === "rating" ? "⭐ Rating" : "📦 Sold"}
            </span>
          </div>
          <div className="space-y-3 min-h-[220px]">
            {topMode === "rating" ? (
              (d.top_by_rating ?? []).length
                ? (d.top_by_rating ?? []).map((p: any, i: number) => {
                    const maxR = d.top_by_rating?.[0]?.rating ?? 5;
                    const pct  = Math.round(((p.rating ?? 0) / maxR) * 100);
                    return (
                      <div key={p.id}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-xs font-black text-muted-foreground w-5 shrink-0">#{i+1}</span>
                            <p className="text-sm font-medium truncate">{p.name}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs text-muted-foreground">{p.review_count} reviews</span>
                            <StarRating value={p.rating ?? 0} />
                          </div>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-yellow-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })
                : <p className="text-sm text-muted-foreground text-center py-4">No ratings yet.</p>
            ) : (
              (d.top_by_sold ?? []).length
                ? (d.top_by_sold ?? []).map((p: any, i: number) => {
                    const maxS = d.top_by_sold?.[0]?.sold_count ?? 1;
                    const pct  = Math.round(((p.sold_count || 0) / maxS) * 100);
                    return (
                      <div key={p.id}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-xs font-black text-muted-foreground w-5 shrink-0">#{i+1}</span>
                            <p className="text-sm font-medium truncate">{p.name}</p>
                          </div>
                          <span className="text-xs text-muted-foreground shrink-0">{p.sold_count ?? 0} sold</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-orange-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })
                : <p className="text-sm text-muted-foreground text-center py-4">No data yet.</p>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground mt-3 text-center">Click to switch view</p>
        </div>

        {/* Low Selling */}
        <div className="bg-card border rounded-2xl p-5 cursor-pointer select-none"
          onClick={() => setLowMode(m => m === "rating" ? "sales" : "rating")}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-red-100 dark:bg-red-900/40 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-red-500" />
              </div>
              <h3 className="font-bold text-sm">Low Selling Products</h3>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-muted font-medium">
              {lowMode === "rating" ? "⭐ Rating" : "📦 Sold"}
            </span>
          </div>
          <div className="space-y-3 min-h-[220px]">
            {lowMode === "rating" ? (
              (d.low_by_rating ?? []).length
                ? (d.low_by_rating ?? []).map((p: any, i: number) => {
                    const maxR = d.low_by_rating?.[0]?.rating ?? 5;
                    const pct  = Math.round(((p.rating ?? 0) / maxR) * 100);
                    return (
                      <div key={p.id}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-xs font-black text-muted-foreground w-5 shrink-0">#{i+1}</span>
                            <p className="text-sm font-medium truncate">{p.name}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs text-muted-foreground">{p.review_count} reviews</span>
                            <StarRating value={p.rating ?? 0} />
                          </div>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-orange-400 rounded-full transition-all" style={{ width: `${pct || 2}%` }} />
                        </div>
                      </div>
                    );
                  })
                : <p className="text-sm text-muted-foreground text-center py-4">No ratings yet.</p>
            ) : (
              (d.low_by_sold ?? []).length
                ? (d.low_by_sold ?? []).map((p: any, i: number) => {
                    const maxS = Math.max(...(d.low_by_sold ?? []).map((x: any) => x.sold_count || 0), 1);
                    const pct  = Math.round(((p.sold_count || 0) / maxS) * 100);
                    return (
                      <div key={p.id}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-xs font-black text-muted-foreground w-5 shrink-0">#{i+1}</span>
                            <p className="text-sm font-medium truncate">{p.name}</p>
                          </div>
                          <span className="text-xs text-muted-foreground shrink-0">{p.sold_count ?? 0} sold</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-red-400 rounded-full transition-all" style={{ width: `${pct || 2}%` }} />
                        </div>
                      </div>
                    );
                  })
                : <p className="text-sm text-muted-foreground text-center py-4">No data yet.</p>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground mt-3 text-center">Click to switch view</p>
        </div>
      </div>


    </VendorLayout>
  );
}
