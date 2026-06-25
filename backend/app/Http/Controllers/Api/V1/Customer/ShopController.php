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
        // Show all shops except banned — customers always see the shop listing
        $shops = Shop::whereNotIn('status', ['banned', 'pending'])
            ->withCount('products')
            ->when($request->search, fn($q, $s) => $q->where('name', 'like', "%{$s}%"))
            ->orderByDesc('rating')
            ->paginate(20);

        return response()->json($shops);
    }

    public function show(string $slug): JsonResponse
    {
        $shop = Shop::where('slug', $slug)
            ->whereNotIn('status', ['banned', 'pending'])
            ->withCount('products')
            ->firstOrFail();

        return response()->json(['data' => $shop]);
    }

    public function products(string $slug, Request $request): JsonResponse
    {
        // Only show products when shop is approved AND vendor has opened it
        $shop = Shop::where('slug', $slug)
            ->where('status', 'approved')
            ->where('is_open', true)
            ->firstOrFail();

        $products = $shop->products()
            ->where('status', 'active')
            ->with(['images', 'category'])
            ->when($request->category, fn($q, $c) => $q->whereHas('category', fn($q2) => $q2->where('slug', $c)))
            ->when($request->search,   fn($q, $s) => $q->where('name', 'like', "%{$s}%"))
            ->orderByDesc('created_at')
            ->paginate(24);

        return response()->json($products);
    }

    /**
     * Return payment options for this shop.
     * Prefers auto-generated KHQR bank accounts; falls back to manually-uploaded QR images.
     */
    public function paymentQrCodes(string $slug): JsonResponse
    {
        $shop = Shop::where('slug', $slug)->where('status', 'approved')->firstOrFail();

        // Auto-generated KHQR from connected bank accounts (shown first)
        $bankEntries = $shop->bankAccounts()
            ->orderByDesc('is_primary')
            ->get()
            ->map(fn($acc) => [
                'id'              => 'bank_' . $acc->id,
                'bank_account_id' => $acc->id,
                'bank_name'       => $acc->bank_name,
                'bank_label'      => $acc->bank_name,
                'currency'        => 'usd',
                'qr_image_url'    => $acc->qrImageUrl(),
                'khqr_string'     => $acc->khqr_string,
                'account_name'    => $acc->account_holder_name,
                'account_number'  => $acc->account_number,
                'phone_number'    => $acc->phone_number,
                'is_khqr'         => !empty($acc->phone_number),
            ]);

        // Legacy manually-uploaded QR codes
        $uploadedQrs = $shop->paymentQrCodes()
            ->where('is_active', true)
            ->orderBy('currency')
            ->orderBy('bank_label')
            ->get()
            ->map(fn($q) => array_merge($q->toPublicArray(), ['is_khqr' => false, 'khqr_string' => null, 'phone_number' => null, 'bank_account_id' => null]));

        // Prefer KHQR accounts; include legacy only if no KHQR accounts exist
        $data = $bankEntries->isNotEmpty() ? $bankEntries : $uploadedQrs;

        return response()->json(['data' => $data->values()]);
    }
}
