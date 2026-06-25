"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  TrendingUp, TrendingDown, Store, Users, UserCheck, Package,
  ShoppingBag, AlertTriangle, DollarSign, Star,
} from "lucide-react";

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
        <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
          style={{ background: "rgba(0,0,0,0.08)" }}>
          <span className={textColor}>{icon}</span>
        </div>
      </div>
      <p className={`text-3xl font-black ${textColor}`}>{value}</p>
      <p className="text-sm font-semibold mt-1">{label}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
    </div>
  );
}
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";
import api from "@/lib/axios";
import { formatCurrency } from "@/lib/utils";

interface AnalyticsData {
  total_income:      number;
  monthly_income:    number;
  last_month_income: number;
  total_revenue:     number;
  monthly_revenue:   number;
  total_shops:       number;
  new_shops:         number;
  total_vendors:     number;
  new_vendors:       number;
  total_users:       number;
  new_users:         number;
  total_products:    number;
  new_products:      number;
  income_chart:      { label: string; short: string; income: number; revenue: number }[];
  top_shops:            { id: number; name: string; revenue: number; order_count: number }[];
  top_shops_by_rating:  { id: number; name: string; avg_rating: number; review_count: number }[];
  top_products:            { id: number; name: string; shop_name: string; sold_count: number; price: number; discount_price?: number }[];
  top_products_by_rating:  { id: number; name: string; shop_name: string; avg_rating: number; review_count: number; price: number; discount_price?: number }[];
  low_shops:               { id: number; name: string; revenue: number; order_count: number }[];
  low_shops_by_rating:     { id: number; name: string; avg_rating: number; review_count: number }[];
  low_products:            { id: number; name: string; shop_name: string; sold_count: number; price: number; discount_price?: number }[];
  low_products_by_rating:  { id: number; name: string; shop_name: string; avg_rating: number; review_count: number; price: number; discount_price?: number }[];
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

export default function AdminDashboard() {
  const [shopMode, setShopMode]       = useState<"rating" | "sales">("rating");
  const [productMode, setProductMode] = useState<"rating" | "sales">("rating");
  const currentYear = new Date().getFullYear();
  const [chartYear, setChartYear]     = useState(currentYear);

  const { data, isLoading } = useQuery<AnalyticsData>({
    queryKey: ["admin-analytics"],
    queryFn: async () => (await api.get("/admin/analytics")).data,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: chartData } = useQuery<{ income_chart: AnalyticsData["income_chart"] }>({
    queryKey: ["admin-analytics-chart", chartYear],
    queryFn: async () => (await api.get("/admin/analytics/chart", { params: { year: chartYear } })).data,
  });

  if (!data && isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-3 gap-0 rounded-2xl overflow-hidden border h-28" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-muted rounded-2xl" />)}
        </div>
        <div className="h-64 bg-muted rounded-2xl" />
      </div>
    );
  }

  const d = data ?? {} as AnalyticsData;

  const thisMonth   = d.monthly_income   ?? 0;
  const lastMonth   = d.last_month_income ?? 0;
  const thisUp      = thisMonth >= lastMonth;
  const incomeChange = lastMonth > 0
    ? (((thisMonth - lastMonth) / lastMonth) * 100)
    : null;

  return (
    <>

      {/* ── Commission cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {/* Total Commission */}
        <BigStatCard
          label="Total Commission"
          sub="All-time platform commission"
          value={formatCurrency(d.total_income ?? 0)}
          icon={<DollarSign className="w-6 h-6" />}
          accent="bg-emerald-500"
          bg="bg-emerald-50 dark:bg-emerald-950/30"
          textColor="text-emerald-700 dark:text-emerald-400"
        />
        {/* This Month — arrow UP if this > last, DOWN if this < last */}
        <BigStatCard
          label="This Month Commission"
          sub={incomeChange !== null
            ? `${Math.abs(incomeChange).toFixed(1)}% ${thisUp ? "more" : "less"} than last month`
            : "Commission this month"}
          value={formatCurrency(thisMonth)}
          icon={thisUp ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
          accent={thisUp ? "bg-blue-500" : "bg-red-500"}
          bg={thisUp ? "bg-blue-50 dark:bg-blue-950/30" : "bg-red-50 dark:bg-red-950/30"}
          textColor={thisUp ? "text-blue-700 dark:text-blue-400" : "text-red-700 dark:text-red-400"}
          positive={thisUp}
        />
        {/* Last Month — arrow opposite of this month */}
        <BigStatCard
          label="Last Month Commission"
          sub={incomeChange !== null
            ? `${Math.abs(incomeChange).toFixed(1)}% ${thisUp ? "less" : "more"} than this month`
            : "Commission last month"}
          value={formatCurrency(lastMonth)}
          icon={thisUp ? <TrendingDown className="w-6 h-6" /> : <TrendingUp className="w-6 h-6" />}
          accent={thisUp ? "bg-orange-500" : "bg-emerald-500"}
          bg={thisUp ? "bg-orange-50 dark:bg-orange-950/30" : "bg-emerald-50 dark:bg-emerald-950/30"}
          textColor={thisUp ? "text-orange-700 dark:text-orange-400" : "text-emerald-700 dark:text-emerald-400"}
          positive={!thisUp}
        />
      </div>

      {/* ── KPI cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <SmallStatCard
          label="Total Shops" value={d.total_shops ?? 0}
          sub={`+${d.new_shops ?? 0} this month`}
          icon={<Store className="w-5 h-5" />}
          color="text-violet-600" bg="bg-violet-50 dark:bg-violet-950/30"
        />
        <SmallStatCard
          label="Total Vendors" value={d.total_vendors ?? 0}
          sub={`+${d.new_vendors ?? 0} this month`}
          icon={<UserCheck className="w-5 h-5" />}
          color="text-orange-600" bg="bg-orange-50 dark:bg-orange-950/30"
        />
        <SmallStatCard
          label="Total Customers" value={d.total_users ?? 0}
          sub={`+${d.new_users ?? 0} this month`}
          icon={<Users className="w-5 h-5" />}
          color="text-sky-600" bg="bg-sky-50 dark:bg-sky-950/30"
        />
        <SmallStatCard
          label="Total Products" value={d.total_products ?? 0}
          sub={`+${d.new_products ?? 0} this month`}
          icon={<Package className="w-5 h-5" />}
          color="text-indigo-600" bg="bg-indigo-50 dark:bg-indigo-950/30"
        />
      </div>

      {/* ── Income chart ── */}
      <div
        className="bg-card border rounded-2xl p-6 mb-6 select-none"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          if (e.clientX < rect.left + rect.width / 2) {
            setChartYear((y) => Math.max(y - 1, 2024));
          } else {
            setChartYear((y) => Math.min(y + 1, currentYear));
          }
        }}
        style={{ cursor: "pointer" }}
      >
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-bold text-base">
            Monthly Commission —{" "}
            {chartYear === currentYear
              ? "This Year"
              : chartYear === currentYear - 1
              ? "Last Year"
              : chartYear}
          </h3>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart
            key={chartYear}
            data={chartData?.income_chart ?? d.income_chart ?? []}
            margin={{ left: 12, right: 8, top: 8, bottom: 16 }}
          >
            <defs>
              <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#10b981" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.07} />
            <XAxis
              dataKey="short"
              height={28}
              interval={0}
              tick={{ fontSize: 11, fill: "#6b7280" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#6b7280" }}
              tickLine={false}
              axisLine={false}
              width={52}
              domain={[0, (dataMax: number) => dataMax > 0 ? Math.ceil(dataMax * 1.25) : 200]}
              tickFormatter={(v: number) => {
                if (v === 0) return "$0";
                if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
                if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}k`;
                return `$${v.toFixed(0)}`;
              }}
            />
            <Tooltip
              formatter={(v: number) => [formatCurrency(v), "Commission"]}
              labelFormatter={(label: string) => label}
              contentStyle={{ borderRadius: 12, fontSize: 12 }}
            />
            <Area
              type="monotone"
              dataKey="income"
              stroke="#10b981"
              strokeWidth={2.5}
              fill="url(#incomeGrad)"
              dot={false}
              activeDot={{ r: 5 }}
              isAnimationActive={true}
              animationDuration={800}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ── Row 1: Top Shops | Top Products (equal height) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-card border rounded-2xl p-5 cursor-pointer select-none" onClick={() => setShopMode(m => m === "rating" ? "sales" : "rating")}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-violet-100 dark:bg-violet-900/40 rounded-lg flex items-center justify-center">
                <Store className="w-4 h-4 text-violet-600" />
              </div>
              <h3 className="font-bold text-sm">Top Performing Shops</h3>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-muted font-medium">
              {shopMode === "rating" ? "⭐ Rating" : "💰 Sales"}
            </span>
          </div>
          <div className="space-y-3 min-h-[220px]">
            {shopMode === "rating" ? (
              (d.top_shops_by_rating ?? []).length ? (d.top_shops_by_rating ?? []).map((shop, i) => {
                const maxR = d.top_shops_by_rating?.[0]?.avg_rating ?? 5;
                const pct  = Math.round((shop.avg_rating / maxR) * 100);
                return (
                  <div key={shop.id}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-black text-muted-foreground w-5 shrink-0">#{i + 1}</span>
                        <span className="text-sm font-medium truncate">{shop.name}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground">{shop.review_count} reviews</span>
                        <StarRating value={shop.avg_rating} />
                      </div>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-yellow-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              }) : <p className="text-sm text-muted-foreground text-center py-4">No ratings yet.</p>
            ) : (
              (d.top_shops ?? []).length ? (d.top_shops ?? []).map((shop, i) => {
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
                      <div className="h-full bg-violet-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              }) : <p className="text-sm text-muted-foreground text-center py-4">No data yet.</p>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground mt-3 text-center">Click to switch view</p>
        </div>

        <div className="bg-card border rounded-2xl p-5 cursor-pointer select-none" onClick={() => setProductMode(m => m === "rating" ? "sales" : "rating")}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/40 rounded-lg flex items-center justify-center">
                <ShoppingBag className="w-4 h-4 text-orange-600" />
              </div>
              <h3 className="font-bold text-sm">Top Selling Products</h3>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-muted font-medium">
              {productMode === "rating" ? "⭐ Rating" : "📦 Sold"}
            </span>
          </div>
          <div className="space-y-3 min-h-[220px]">
            {productMode === "rating" ? (
              (d.top_products_by_rating ?? []).length ? (d.top_products_by_rating ?? []).map((p, i) => {
                const maxR = d.top_products_by_rating?.[0]?.avg_rating ?? 5;
                const pct  = Math.round((p.avg_rating / maxR) * 100);
                return (
                  <div key={p.id}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-black text-muted-foreground w-5 shrink-0">#{i + 1}</span>
                        <p className="text-sm font-medium truncate">{p.name}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground">{p.review_count} reviews</span>
                        <StarRating value={p.avg_rating} />
                      </div>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-yellow-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              }) : <p className="text-sm text-muted-foreground text-center py-4">No ratings yet.</p>
            ) : (
              (d.top_products ?? []).length ? (d.top_products ?? []).map((p, i) => {
                const maxSold = d.top_products?.[0]?.sold_count ?? 1;
                const pct     = Math.round(((p.sold_count || 0) / maxSold) * 100);
                return (
                  <div key={p.id}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-black text-muted-foreground w-5 shrink-0">#{i + 1}</span>
                        <p className="text-sm font-medium truncate">{p.name}</p>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">{p.sold_count ?? 0} sold</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-orange-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              }) : <p className="text-sm text-muted-foreground text-center py-4">No data yet.</p>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground mt-3 text-center">Click to switch view</p>
        </div>
      </div>

      {/* ── Row 2: Low Performing Shops | Low Selling Products ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border rounded-2xl p-5 cursor-pointer select-none" onClick={() => setShopMode(m => m === "rating" ? "sales" : "rating")}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-red-100 dark:bg-red-900/40 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-red-500" />
              </div>
              <h3 className="font-bold text-sm">Low Performing Shops</h3>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-muted font-medium">
              {shopMode === "rating" ? "⭐ Rating" : "💰 Sales"}
            </span>
          </div>
          <div className="space-y-3 min-h-[220px]">
            {shopMode === "rating" ? (
              (d.low_shops_by_rating ?? []).length ? (d.low_shops_by_rating ?? []).map((shop, i) => {
                const maxR = d.low_shops_by_rating?.[0]?.avg_rating ?? 5;
                const pct  = Math.round((shop.avg_rating / maxR) * 100);
                return (
                  <div key={shop.id}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-black text-muted-foreground w-5 shrink-0">#{i + 1}</span>
                        <span className="text-sm font-medium truncate">{shop.name}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground">{shop.review_count} reviews</span>
                        <StarRating value={shop.avg_rating} />
                      </div>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-orange-400 rounded-full transition-all" style={{ width: `${pct || 2}%` }} />
                    </div>
                  </div>
                );
              }) : <p className="text-sm text-muted-foreground text-center py-4">No ratings yet.</p>
            ) : (
              (d.low_shops ?? []).length ? (d.low_shops ?? []).map((shop, i) => {
                const maxRev = Math.max(...(d.low_shops ?? []).map(s => s.revenue), 1);
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
                        <span className={`text-sm font-bold ${shop.revenue === 0 ? "text-red-500" : "text-muted-foreground"}`}>
                          {formatCurrency(shop.revenue)}
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-red-400 rounded-full transition-all" style={{ width: `${pct || 2}%` }} />
                    </div>
                  </div>
                );
              }) : <p className="text-sm text-muted-foreground text-center py-4">No data yet.</p>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground mt-3 text-center">Click to switch view</p>
        </div>

        <div className="bg-card border rounded-2xl p-5 cursor-pointer select-none" onClick={() => setProductMode(m => m === "rating" ? "sales" : "rating")}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-red-100 dark:bg-red-900/40 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-red-500" />
              </div>
              <h3 className="font-bold text-sm">Low Selling Products</h3>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-muted font-medium">
              {productMode === "rating" ? "⭐ Rating" : "📦 Sold"}
            </span>
          </div>
          <div className="space-y-3 min-h-[220px]">
            {productMode === "rating" ? (
              (d.low_products_by_rating ?? []).length ? (d.low_products_by_rating ?? []).map((p, i) => {
                const maxR = d.low_products_by_rating?.[0]?.avg_rating ?? 5;
                const pct  = Math.round((p.avg_rating / maxR) * 100);
                return (
                  <div key={p.id}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-black text-muted-foreground w-5 shrink-0">#{i + 1}</span>
                        <p className="text-sm font-medium truncate">{p.name}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground">{p.review_count} reviews</span>
                        <StarRating value={p.avg_rating} />
                      </div>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-orange-400 rounded-full transition-all" style={{ width: `${pct || 2}%` }} />
                    </div>
                  </div>
                );
              }) : <p className="text-sm text-muted-foreground text-center py-4">No ratings yet.</p>
            ) : (
              (d.low_products ?? []).length ? (d.low_products ?? []).map((p, i) => {
                const maxSold = Math.max(...(d.low_products ?? []).map(x => x.sold_count || 0), 1);
                const pct     = Math.round(((p.sold_count || 0) / maxSold) * 100);
                return (
                  <div key={p.id}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-black text-muted-foreground w-5 shrink-0">#{i + 1}</span>
                        <p className="text-sm font-medium truncate">{p.name}</p>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">{p.sold_count ?? 0} sold</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-red-400 rounded-full transition-all" style={{ width: `${pct || 2}%` }} />
                    </div>
                  </div>
                );
              }) : <p className="text-sm text-muted-foreground text-center py-4">No data yet.</p>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground mt-3 text-center">Click to switch view</p>
        </div>
      </div>

    </>
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
