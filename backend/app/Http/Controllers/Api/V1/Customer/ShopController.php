<?php

namespace App\Http\Controllers\Api\V1\Customer;

use App\Http\Controllers\Controller;
use App\Models\Shop;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ShopController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $shops = Shop::where('status', 'approved')
            ->withCount('products')
            ->when($request->search, fn($q, $s) => $q->where('name', 'like', "%{$s}%"))
            ->orderByDesc('rating')
            ->paginate(20);

        return response()->json($shops);
    }

    public function show(string $slug): JsonResponse
    {
        $shop = Shop::where('slug', $slug)->where('status', 'approved')
            ->withCount('products')
            ->firstOrFail();

        return response()->json(['data' => $shop]);
    }

    public function products(string $slug, Request $request): JsonResponse
    {
        $shop = Shop::where('slug', $slug)->where('status', 'approved')->firstOrFail();

        $products = $shop->products()
            ->where('status', 'published')
            ->with(['images', 'category'])
            ->when($request->category, fn($q, $c) => $q->whereHas('category', fn($q2) => $q2->where('slug', $c)))
            ->when($request->search,   fn($q, $s) => $q->where('name', 'like', "%{$s}%"))
            ->orderByDesc('created_at')
            ->paginate(24);

        return response()->json($products);
    }

    /** Return active QR payment codes for this shop so customers can pick which bank to pay with. */
    public function paymentQrCodes(string $slug): JsonResponse
    {
        $shop = Shop::where('slug', $slug)->where('status', 'approved')->firstOrFail();

        $qrCodes = $shop->paymentQrCodes()
            ->where('is_active', true)
            ->orderBy('currency')
            ->orderBy('bank_label')
            ->get()
            ->map(fn($q) => $q->toPublicArray());

        return response()->json(['data' => $qrCodes]);
    }
}
