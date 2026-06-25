<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payout;
use App\Models\Product;
use App\Models\Shop;
use App\Models\ShopCommission;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class AdminAnalyticsController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $payload = Cache::remember('admin_analytics_index', 120, function () {
        $now          = now();
        $monthStart   = $now->copy()->startOfMonth();
        $last30Days   = $now->copy()->subDays(30);
        $lastMonth    = $now->copy()->subMonth()->startOfMonth();

        // ── Income (fee charged from vendors on payouts) ──
        $lastMonthEnd    = $monthStart->copy()->subSecond();
        $totalIncome     = Payout::sum('platform_fee');
        $monthlyIncome   = Payout::where('created_at', '>=', $monthStart)->sum('platform_fee');
        $lastMonthIncome = Payout::whereBetween('created_at', [$lastMonth, $lastMonthEnd])->sum('platform_fee');

        // ── Total revenue across all shops ────────────────
        $totalRevenue   = Order::where('status', 'delivered')->sum('total');
        $monthlyRevenue = Order::where('status', 'delivered')
                            ->where('created_at', '>=', $monthStart)->sum('total');

        // ── Shops (exclude banned) ────────────────────────
        $totalShops = Shop::where('status', '!=', 'banned')->count();
        $newShops   = Shop::where('status', '!=', 'banned')
                        ->where('created_at', '>=', $monthStart)->count();

        // ── Vendors (approved + suspended only) ───────────
        $totalVendors = User::where('role', 'vendor')
                            ->whereIn('vendor_status', ['approved', 'suspended'])->count();
        $newVendors   = User::where('role', 'vendor')
                            ->whereIn('vendor_status', ['approved', 'suspended'])
                            ->where('created_at', '>=', $monthStart)->count();

        // ── Customers (exclude banned) ────────────────────
        $totalUsers = User::withTrashed()
                        ->where('role', 'customer')
                        ->where(fn ($q) => $q->whereNull('ban_type')->orWhere('ban_type', '!=', 'ban'))
                        ->count();
        $newUsers   = User::withTrashed()
                        ->where('role', 'customer')
                        ->where(fn ($q) => $q->whereNull('ban_type')->orWhere('ban_type', '!=', 'ban'))
                        ->where('created_at', '>=', $monthStart)->count();

        // ── Products (exclude banned) ─────────────────────
        $totalProducts = Product::where('status', '!=', 'banned')->count();
        $newProducts   = Product::where('status', '!=', 'banned')
                            ->where('created_at', '>=', $monthStart)->count();

        // ── Monthly income chart (current year default) ───────
        $incomeChart = $this->incomeChart($now->year);

        // ── Top 5 shops by sales (revenue) ───────────────
        $topShops = Shop::select('shops.id', 'shops.name', 'shops.slug', 'shops.logo',
                        DB::raw('SUM(orders.total) as revenue'),
                        DB::raw('COUNT(orders.id) as order_count'))
            ->join('orders', 'orders.shop_id', '=', 'shops.id')
            ->where('orders.status', 'delivered')
            ->groupBy('shops.id', 'shops.name', 'shops.slug', 'shops.logo')
            ->orderByDesc('revenue')
            ->limit(5)
            ->get();

        // ── Top 5 shops by customer rating ───────────────
        $topShopsByRating = Shop::select('shops.id', 'shops.name',
                        DB::raw('ROUND(AVG(shop_reviews.rating)::numeric, 1) as avg_rating'),
                        DB::raw('COUNT(shop_reviews.id) as review_count'))
            ->join('shop_reviews', 'shop_reviews.shop_id', '=', 'shops.id')
            ->where('shops.status', '!=', 'banned')
            ->groupBy('shops.id', 'shops.name')
            ->orderByDesc('avg_rating')
            ->orderByDesc('review_count')
            ->limit(5)
            ->get();

        // ── Top 5 selling products (by sold_count) ───────
        $topProducts = Product::select('products.id', 'products.name', 'products.price',
                        'products.discount_price', 'products.sold_count',
                        'shops.name as shop_name')
            ->leftJoin('shops', 'shops.id', '=', 'products.shop_id')
            ->where('products.status', 'active')
            ->orderByDesc('products.sold_count')
            ->limit(5)
            ->get();

        // ── Low selling products (active, lowest sold_count) ─────
        $lowProducts = Product::select('products.id', 'products.name', 'products.price',
                        'products.discount_price', 'products.sold_count',
                        'shops.name as shop_name')
            ->leftJoin('shops', 'shops.id', '=', 'products.shop_id')
            ->where('products.status', 'active')
            ->orderBy('products.sold_count')
            ->limit(5)
            ->get();

        // ── Top 5 products by customer rating ────────────
        $topProductsByRating = Product::select('products.id', 'products.name', 'products.price',
                        'products.discount_price',
                        'shops.name as shop_name',
                        DB::raw('ROUND(AVG(reviews.rating)::numeric, 1) as avg_rating'),
                        DB::raw('COUNT(reviews.id) as review_count'))
            ->join('reviews', 'reviews.product_id', '=', 'products.id')
            ->leftJoin('shops', 'shops.id', '=', 'products.shop_id')
            ->where('products.status', 'active')
            ->whereNull('reviews.deleted_at')
            ->groupBy('products.id', 'products.name', 'products.price', 'products.discount_price', 'shops.name')
            ->orderByDesc('avg_rating')
            ->orderByDesc('review_count')
            ->limit(5)
            ->get();

        // ── Low 5 products by customer rating ────────────
        $lowProductsByRating = Product::select('products.id', 'products.name', 'products.price',
                        'products.discount_price',
                        'shops.name as shop_name',
                        DB::raw('ROUND(AVG(reviews.rating)::numeric, 1) as avg_rating'),
                        DB::raw('COUNT(reviews.id) as review_count'))
            ->join('reviews', 'reviews.product_id', '=', 'products.id')
            ->leftJoin('shops', 'shops.id', '=', 'products.shop_id')
            ->where('products.status', 'active')
            ->whereNull('reviews.deleted_at')
            ->groupBy('products.id', 'products.name', 'products.price', 'products.discount_price', 'shops.name')
            ->orderBy('avg_rating')
            ->orderBy('review_count')
            ->limit(5)
            ->get();

        // ── Low shops by sales ────────────────────────────
        $lowShops = Shop::select('shops.id', 'shops.name', 'shops.slug',
                        DB::raw('COALESCE(SUM(orders.total), 0) as revenue'),
                        DB::raw('COUNT(orders.id) as order_count'))
            ->leftJoin('orders', function ($join) {
                $join->on('orders.shop_id', '=', 'shops.id')
                     ->where('orders.status', 'delivered');
            })
            ->where('shops.status', '!=', 'banned')
            ->groupBy('shops.id', 'shops.name', 'shops.slug')
            ->orderBy('revenue')
            ->limit(5)
            ->get();

        // ── Low 5 shops by customer rating ───────────────
        $lowShopsByRating = Shop::select('shops.id', 'shops.name',
                        DB::raw('ROUND(AVG(shop_reviews.rating)::numeric, 1) as avg_rating'),
                        DB::raw('COUNT(shop_reviews.id) as review_count'))
            ->join('shop_reviews', 'shop_reviews.shop_id', '=', 'shops.id')
            ->where('shops.status', '!=', 'banned')
            ->groupBy('shops.id', 'shops.name')
            ->orderBy('avg_rating')
            ->orderBy('review_count')
            ->limit(5)
            ->get();

        return [
            // Income
            'total_income'       => (float) $totalIncome,
            'monthly_income'     => (float) $monthlyIncome,
            'last_month_income'  => (float) $lastMonthIncome,
            'total_revenue'      => (float) $totalRevenue,
            'monthly_revenue'    => (float) $monthlyRevenue,
            // Counts
            'total_shops'    => $totalShops,
            'new_shops'      => $newShops,
            'total_vendors'  => $totalVendors,
            'new_vendors'    => $newVendors,
            'total_users'    => $totalUsers,
            'new_users'      => $newUsers,
            'total_products' => $totalProducts,
            'new_products'   => $newProducts,
            // Charts & lists
            'income_chart'   => $incomeChart,
            'top_shops'               => $topShops,
            'top_shops_by_rating'     => $topShopsByRating,
            'top_products'            => $topProducts,
            'top_products_by_rating'  => $topProductsByRating,
            'low_shops'               => $lowShops,
            'low_shops_by_rating'     => $lowShopsByRating,
            'low_products'            => $lowProducts,
            'low_products_by_rating'  => $lowProductsByRating,
        ];
        }); // end Cache::remember

        return response()->json($payload);
    }

    public function chart(Request $request): JsonResponse
    {
        $year = (int) $request->input('year', now()->year);
        return response()->json(['income_chart' => $this->incomeChart($year)]);
    }

    public function badges(): JsonResponse
    {
        return response()->json([
            'pending_vendors' => User::where('role', 'vendor')->where('vendor_status', 'pending')->count(),
            'pending_payouts' => Payout::where('status', 'pending')->count(),
        ]);
    }

    private function incomeChart(int $year): array
    {
        $records = Payout::select(
                        DB::raw("TO_CHAR(created_at, 'YYYY-MM') as month_key"),
                        DB::raw('SUM(platform_fee) as income'),
                        DB::raw('SUM(gross_amount) as revenue'))
            ->whereYear('created_at', $year)
            ->groupBy('month_key')
            ->get()
            ->keyBy('month_key');

        $months = [];
        for ($m = 1; $m <= 12; $m++) {
            $key    = sprintf('%04d-%02d', $year, $m);
            $record = $records->get($key);
            $date   = \Carbon\Carbon::createFromDate($year, $m, 1);
            $months[] = [
                'label'   => $date->format('M Y'),
                'short'   => $date->format('M'),
                'income'  => $record ? (float) $record->income  : 0.0,
                'revenue' => $record ? (float) $record->revenue : 0.0,
            ];
        }

        return $months;
    }
}
