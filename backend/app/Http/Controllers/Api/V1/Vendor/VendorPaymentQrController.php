<?php

namespace App\Http\Controllers\Api\V1\Vendor;

use App\Http\Controllers\Controller;
use App\Models\VendorPaymentQrCode;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class VendorPaymentQrController extends Controller
{
    private function getShop(Request $request)
    {
        $shop = $request->user()->shop;
        abort_unless($shop && in_array($shop->status, ['approved', 'closed']), 403, 'Shop not found or not approved.');
        return $shop;
    }

    public function index(Request $request): JsonResponse
    {
        $shop = $this->getShop($request);
        $qrs = $shop->paymentQrCodes()->orderBy('currency')->orderBy('bank_label')->get();

        return response()->json([
            'data' => $qrs->map(fn($q) => array_merge($q->toPublicArray(), ['is_active' => $q->is_active])),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $shop = $this->getShop($request);

        $request->validate([
            'bank_name'      => 'required|string|max:50',
            'bank_label'     => 'required|string|max:100',
            'currency'       => 'required|in:usd,khr',
            'qr_image'       => 'required|image|max:4096|mimes:jpg,jpeg,png,webp',
            'account_name'   => 'nullable|string|max:150',
            'account_number' => 'nullable|string|max:50',
        ]);

        // Limit: max 10 QR codes per shop
        if ($shop->paymentQrCodes()->count() >= 10) {
            return response()->json(['message' => 'Maximum 10 QR codes per shop.'], 422);
        }

        $path = $request->file('qr_image')->store("qr_codes/shop_{$shop->id}", 'public');

        $qr = $shop->paymentQrCodes()->create([
            'bank_name'      => strtolower($request->bank_name),
            'bank_label'     => $request->bank_label,
            'currency'       => $request->currency,
            'qr_image_path'  => $path,
            'account_name'   => $request->account_name,
            'account_number' => $request->account_number,
            'is_active'      => true,
        ]);

        return response()->json(['message' => 'QR code added.', 'data' => $qr->toPublicArray()], 201);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $shop = $this->getShop($request);
        $qr   = $shop->paymentQrCodes()->findOrFail($id);

        Storage::disk('public')->delete($qr->qr_image_path);
        $qr->delete();

        return response()->json(['message' => 'QR code removed.']);
    }

    public function toggle(Request $request, int $id): JsonResponse
    {
        $shop = $this->getShop($request);
        $qr   = $shop->paymentQrCodes()->findOrFail($id);
        $qr->update(['is_active' => !$qr->is_active]);

        return response()->json(['message' => $qr->is_active ? 'QR enabled.' : 'QR disabled.', 'is_active' => $qr->is_active]);
    }
}
