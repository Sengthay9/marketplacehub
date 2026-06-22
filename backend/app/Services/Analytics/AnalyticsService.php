<?php

namespace App\Services\Analytics;

use App\Models\Order;
use App\Models\Product;
use App\Models\Shop;
use App\Models\ShopCommission;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class AnalyticsService
{
    public function adminDashboard(): array
    {
        $now   = now();
        $month = $now->startOfMonth();

        return [
            'total_revenue'     => Order::where('status', 'delivered')->sum('total'),
            'monthly_revenue'   => Order::where('status', 'delivered')->where('created_at', '>=', $month)->sum('total'),
            'total_orders'      => Order::count(),
            'pending_orders'    => Order::where('status', 'pending')->count(),
            'active_shops'      => Shop::where('status', 'approved')->count(),
            'pending_shops'     => Shop::where('status', 'pending')->count(),
            'total_customers'   => User::where('role', 'customer')->count(),
            'total_products'    => Product::where('status', 'published')->count(),
            'pending_products'  => Product::where('status', 'pending')->count(),
            'monthly_growth'           => $this->monthlyGrowth(),
            'top_shops'                => $this->topShops(),
            'revenue_chart'            => $this->revenueChart(),
            'monthly_commission'       => ShopCommission::where('year', $now->year)->where('month', $now->month)->sum('commission_amount'),
            'total_commission'         => ShopCommission::sum('commission_amount'),
            'pending_commission'       => ShopCommission::where('status', 'pending')->sum('commission_amount'),
            'commission_chart'         => $this->commissionChart(),
        ];
    }

    public function vendorDashboard(int $shopId): array
    {
        return [
            'total_revenue'   => Order::where('shop_id', $shopId)->where('status', 'delivered')->sum('total'),
            'total_orders'    => Order::where('shop_id', $shopId)->count(),
            'pending_orders'  => Order::where('shop_id', $shopId)->where('status', 'pending')->count(),
            'total_products'  => Product::where('shop_id', $shopId)->count(),
            'top_products'    => $this->vendorTopProducts($shopId),
            'recent_orders'   => Order::where('shop_id', $shopId)->latest()->take(5)->with('items')->get(),
            'revenue_chart'   => $this->vendorRevenueChart($shopId),
        ];
    }

    private function monthlyGrowth(): array
    {
        return Order::select(
            DB::raw("DATE_TRUNC('month', created_at) as month"),
            DB::raw('SUM(total) as revenue'),
            DB::raw('COUNT(*) as orders')
        )
        ->where('status', 'delivered')
        ->where('created_at', '>=', now()->subMonths(12))
        ->groupBy('month')
        ->orderBy('month')
        ->get()
        ->map(fn ($r) => [
            'month'   => $r->month,
            'revenue' => (float) $r->revenue,
            'orders'  => (int)   $r->orders,
        ])
        ->toArray();
    }

    private function topShops(int $limit = 5): array
    {
        return Shop::select('shops.*', DB::raw('SUM(orders.total) as revenue'))
            ->join('orders', 'orders.shop_id', '=', 'shops.id')
            ->where('orders.status', 'delivered')
            ->groupBy('shops.id')
            ->orderByDesc('revenue')
            ->limit($limit)
            ->get()
            ->toArray();
    }

    private function vendorTopProducts(int $shopId, int $limit = 5): array
    {
        return Product::where('shop_id', $shopId)
            ->orderByDesc('sold_count')
            ->limit($limit)
            ->get(['id', 'name', 'sold_count', 'price', 'discount_price'])
            ->toArray();
    }

    private function revenueChart(): array
    {
        return $this->monthlyGrowth();
    }

    private function commissionChart(): array
    {
        $months = collect();
        for ($i = 11; $i >= 0; $i--) {
            $months->push(now()->subMonths($i));
        }

        $records = ShopCommission::select('year', 'month', DB::raw('SUM(commission_amount) as total'))
            ->where(function ($q) {
                $q->where('year', '>', now()->subMonths(12)->year)
                  ->orWhere(function ($q2) {
                      $q2->where('year', now()->subMonths(12)->year)
                         ->where('month', '>=', now()->subMonths(12)->month);
                  });
            })
            ->groupBy('year', 'month')
            ->get()
            ->keyBy(fn ($r) => sprintf('%04d-%02d', $r->year, $r->month));

        return $months->map(function ($date) use ($records) {
            $key = $date->format('Y-m');
            $record = $records->get($key);
            return [
                'month'      => $date->format('Y-m'),
                'label'      => $date->format('M Y'),
                'commission' => $record ? (float) $record->total : 0.0,
            ];
        })->values()->toArray();
    }

    private function vendorRevenueChart(int $shopId): array
    {
        return Order::select(
            DB::raw("DATE_TRUNC('month', created_at) as month"),
            DB::raw('SUM(total) as revenue'),
            DB::raw('COUNT(*) as orders')
        )
        ->where('shop_id', $shopId)
        ->where('status', 'delivered')
        ->where('created_at', '>=', now()->subMonths(12))
        ->groupBy('month')
        ->orderBy('month')
        ->get()
        ->map(fn ($r) => [
            'month'   => $r->month,
            'revenue' => (float) $r->revenue,
            'orders'  => (int)   $r->orders,
        ])
        ->toArray();
    }
}
