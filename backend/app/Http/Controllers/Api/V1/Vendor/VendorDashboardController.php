<?php

namespace App\Http\Controllers\Api\V1\Vendor;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use App\Models\Shop;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class VendorDashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $shop = Shop::where('user_id', $request->user()->id)->first();

        if (!$shop) {
            return response()->json(['dashboard' => [
                'total_income' => 0, 'this_month_income' => 0, 'last_month_income' => 0,
                'total_orders' => 0, 'pending_orders' => 0, 'total_products' => 0,
                'revenue_chart' => [], 'top_by_sold' => [], 'low_by_sold' => [],
                'top_by_rating' => [], 'low_by_rating' => [], 'recent_orders' => [],
            ]]);
        }

        $shopId = $shop->id;

        $now           = now();
        $chartYear      = (int) $request->query('year', $now->year);
        $thisMonthStart = $now->copy()->startOfMonth();
        $lastMonthStart = $now->copy()->subMonth()->startOfMonth();
        $lastMonthEnd   = $now->copy()->subMonth()->endOfMonth();
        $yearStart      = $now->copy()->setYear($chartYear)->startOfYear();

        // Only count delivered orders as income
        $incomeStatuses = ['delivered'];

        // Total income (all time)
        $totalIncome = Order::where('shop_id', $shopId)
            ->whereIn('status', $incomeStatuses)
            ->sum(DB::raw('total - COALESCE(platform_fee, 0)'));

        // This month income
        $thisMonthIncome = Order::where('shop_id', $shopId)
            ->whereIn('status', $incomeStatuses)
            ->whereBetween('created_at', [$thisMonthStart, $now])
            ->sum(DB::raw('total - COALESCE(platform_fee, 0)'));

        // Last month income
        $lastMonthIncome = Order::where('shop_id', $shopId)
            ->whereIn('status', $incomeStatuses)
            ->whereBetween('created_at', [$lastMonthStart, $lastMonthEnd])
            ->sum(DB::raw('total - COALESCE(platform_fee, 0)'));

        // Total orders today
        $totalOrders = Order::where('shop_id', $shopId)
            ->whereDate('created_at', $now->toDateString())
            ->count();

        // Pending orders
        $pendingOrders = Order::where('shop_id', $shopId)
            ->where('status', 'pending')
            ->count();

        // Total products — all non-banned, non-deleted products
        $totalProducts = Product::where('shop_id', $shopId)
            ->whereNotIn('status', ['banned'])
            ->count();

        // Yearly income chart (monthly breakdown, current year)
        $monthlyRevenue = Order::where('shop_id', $shopId)
            ->whereIn('status', $incomeStatuses)
            ->where('created_at', '>=', $yearStart)
            ->select(
                DB::raw("TO_CHAR(created_at, 'YYYY-MM') as month"),
                DB::raw('SUM(total - COALESCE(platform_fee, 0)) as revenue')
            )
            ->groupBy('month')
            ->orderBy('month')
            ->get()
            ->keyBy('month');

        // Fill all 12 months even if no data
        $revenueChart = [];
        for ($m = 1; $m <= 12; $m++) {
            $key = $now->copy()->setYear($chartYear)->startOfYear()->addMonths($m - 1)->format('Y-m');
            $revenueChart[] = [
                'month'   => $key,
                'revenue' => (float) ($monthlyRevenue[$key]->revenue ?? 0),
            ];
        }

        // Top 5 products by sold_count
        $topBySold = Product::where('shop_id', $shopId)
            ->where('status', '!=', 'banned')
            ->with(['images' => fn ($q) => $q->where('is_primary', true)->limit(1)])
            ->orderByDesc('sold_count')
            ->limit(5)
            ->get(['id', 'name', 'price', 'sold_count', 'rating', 'review_count']);

        // Bottom 5 active products by sold_count (exclude 0-sold new products older than 7 days)
        $lowBySold = Product::where('shop_id', $shopId)
            ->where('status', 'active')
            ->with(['images' => fn ($q) => $q->where('is_primary', true)->limit(1)])
            ->orderBy('sold_count')
            ->limit(5)
            ->get(['id', 'name', 'price', 'sold_count', 'rating', 'review_count']);

        // Top 5 by rating
        $topByRating = Product::where('shop_id', $shopId)
            ->where('status', '!=', 'banned')
            ->where('review_count', '>', 0)
            ->with(['images' => fn ($q) => $q->where('is_primary', true)->limit(1)])
            ->orderByDesc('rating')
            ->orderByDesc('review_count')
            ->limit(5)
            ->get(['id', 'name', 'price', 'sold_count', 'rating', 'review_count']);

        // Bottom 5 by rating
        $lowByRating = Product::where('shop_id', $shopId)
            ->where('status', 'active')
            ->where('review_count', '>', 0)
            ->with(['images' => fn ($q) => $q->where('is_primary', true)->limit(1)])
            ->orderBy('rating')
            ->orderByDesc('review_count')
            ->limit(5)
            ->get(['id', 'name', 'price', 'sold_count', 'rating', 'review_count']);

        // Recent orders
        $recentOrders = Order::where('shop_id', $shopId)
            ->with(['customer:id,name,email', 'payment:order_id,status,gateway'])
            ->latest()
            ->limit(5)
            ->get(['id', 'order_number', 'total', 'platform_fee', 'status', 'created_at', 'user_id']);

        return response()->json([
            'dashboard' => [
                'total_income'      => (float) $totalIncome,
                'this_month_income' => (float) $thisMonthIncome,
                'last_month_income' => (float) $lastMonthIncome,
                'total_orders'      => $totalOrders,
                'pending_orders'    => $pendingOrders,
                'total_products'    => $totalProducts,
                'revenue_chart'     => $revenueChart,
                'top_by_sold'       => $topBySold,
                'low_by_sold'       => $lowBySold,
                'top_by_rating'     => $topByRating,
                'low_by_rating'     => $lowByRating,
                'recent_orders'     => $recentOrders,
            ],
        ]);
    }
}
