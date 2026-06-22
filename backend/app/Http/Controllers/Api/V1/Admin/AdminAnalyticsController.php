<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Shop;
use App\Models\ShopCommission;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class AdminAnalyticsController extends Controller
{
    public function index(): JsonResponse
    {
        $now        = now();
        $monthStart = $now->copy()->startOfMonth();
        $lastMonth  = $now->copy()->subMonth()->startOfMonth();

        // ── Income (platform commission) ─────────────────
        $totalIncome   = ShopCommission::sum('commission_amount');
        $monthlyIncome = ShopCommission::where('year', $now->year)
                            ->where('month', $now->month)
                            ->sum('commission_amount');
        $lastMonthIncome = ShopCommission::where('year', $lastMonth->year)
                            ->where('month', $lastMonth->month)
                            ->sum('commission_amount');

        // ── Total revenue across all shops ────────────────
        $totalRevenue   = Order::where('status', 'delivered')->sum('total');
        $monthlyRevenue = Order::where('status', 'delivered')
                            ->where('created_at', '>=', $monthStart)->sum('total');

        // ── Shops ─────────────────────────────────────────
        $totalShops = Shop::where('status', 'approved')->count();
        $newShops   = Shop::where('status', 'approved')
                        ->where('created_at', '>=', $monthStart)->count();

        // ── Users ─────────────────────────────────────────
        $totalUsers = User::where('role', 'customer')->count();
        $newUsers   = User::where('role', 'customer')
                        ->where('created_at', '>=', $monthStart)->count();

        // ── Products ──────────────────────────────────────
        $totalProducts = Product::where('status', 'published')->count();
        $newProducts   = Product::where('status', 'published')
                            ->where('created_at', '>=', $monthStart)->count();

        // ── Monthly income chart (last 12 months) ─────────
        $incomeChart = $this->incomeChart();

        // ── Top 5 performing shops ────────────────────────
        $topShops = Shop::select('shops.id', 'shops.name', 'shops.slug', 'shops.logo',
                        DB::raw('SUM(orders.total) as revenue'),
                        DB::raw('COUNT(orders.id) as order_count'))
            ->join('orders', 'orders.shop_id', '=', 'shops.id')
            ->where('orders.status', 'delivered')
            ->groupBy('shops.id', 'shops.name', 'shops.slug', 'shops.logo')
            ->orderByDesc('revenue')
            ->limit(5)
            ->get();

        // ── Top 5 selling products ────────────────────────
        $topProducts = Product::select('products.id', 'products.name', 'products.price',
                        'products.discount_price', 'products.sold_count',
                        'shops.name as shop_name')
            ->leftJoin('shops', 'shops.id', '=', 'products.shop_id')
            ->where('products.status', 'published')
            ->orderByDesc('products.sold_count')
            ->limit(5)
            ->get();

        // ── Low income shops (approved, revenue in bottom 20%) ──
        $lowShops = Shop::select('shops.id', 'shops.name', 'shops.slug',
                        DB::raw('COALESCE(SUM(orders.total), 0) as revenue'),
                        DB::raw('COUNT(orders.id) as order_count'))
            ->leftJoin('orders', function ($join) {
                $join->on('orders.shop_id', '=', 'shops.id')
                     ->where('orders.status', 'delivered');
            })
            ->where('shops.status', 'approved')
            ->groupBy('shops.id', 'shops.name', 'shops.slug')
            ->orderBy('revenue')
            ->limit(5)
            ->get();

        return response()->json([
            // Income
            'total_income'       => (float) $totalIncome,
            'monthly_income'     => (float) $monthlyIncome,
            'last_month_income'  => (float) $lastMonthIncome,
            'total_revenue'      => (float) $totalRevenue,
            'monthly_revenue'    => (float) $monthlyRevenue,
            // Counts
            'total_shops'    => $totalShops,
            'new_shops'      => $newShops,
            'total_users'    => $totalUsers,
            'new_users'      => $newUsers,
            'total_products' => $totalProducts,
            'new_products'   => $newProducts,
            // Charts & lists
            'income_chart'   => $incomeChart,
            'top_shops'      => $topShops,
            'top_products'   => $topProducts,
            'low_shops'      => $lowShops,
        ]);
    }

    private function incomeChart(): array
    {
        $months = collect();
        for ($i = 11; $i >= 0; $i--) {
            $months->push(now()->subMonths($i));
        }

        $records = ShopCommission::select('year', 'month',
                        DB::raw('SUM(commission_amount) as income'),
                        DB::raw('SUM(gross_revenue) as revenue'))
            ->groupBy('year', 'month')
            ->get()
            ->keyBy(fn ($r) => sprintf('%04d-%02d', $r->year, $r->month));

        return $months->map(function ($date) use ($records) {
            $key    = $date->format('Y-m');
            $record = $records->get($key);
            return [
                'label'   => $date->format('M Y'),
                'short'   => $date->format('M'),
                'income'  => $record ? (float) $record->income  : 0.0,
                'revenue' => $record ? (float) $record->revenue : 0.0,
            ];
        })->values()->toArray();
    }
}
