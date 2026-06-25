<?php

namespace App\Http\Controllers\Api\V1\Vendor;

use App\Http\Controllers\Controller;
use App\Models\Coupon;
use App\Models\Shop;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VendorCouponController extends Controller
{
    private function getShop(Request $request): Shop
    {
        return Shop::where('user_id', $request->user()->id)->firstOrFail();
    }

    public function index(Request $request): JsonResponse
    {
        $shop    = $this->getShop($request);
        $coupons = Coupon::where('shop_id', $shop->id)
            ->where(function ($q) {
                $q->whereNull('expires_at')
                  ->orWhere('expires_at', '>=', now()->startOfDay());
            })
            ->where(function ($q) {
                $q->whereNull('fully_used_at')
                  ->orWhere('fully_used_at', '>=', now()->subDays(3));
            })
            ->latest()
            ->paginate(20);

        return response()->json($coupons);
    }

    public function store(Request $request): JsonResponse
    {
        $shop = $this->getShop($request);

        $data = $request->validate([
            'code'                 => 'required|string|max:50|unique:coupons,code',
            'description'          => 'nullable|string',
            'type'                 => 'required|in:percentage,fixed',
            'value'                => 'required|numeric|min:0.01',
            'min_order_amount'     => 'nullable|numeric|min:0',
            'max_discount'         => 'nullable|numeric|min:0',
            'usage_limit'          => 'nullable|integer|min:1',
            'usage_limit_per_user' => 'nullable|integer|min:1',
            'new_customers_only'   => 'boolean',
            'expires_at'           => 'nullable|date|after:today',
            'is_active'            => 'boolean',
        ]);

        $data['code']    = strtoupper($data['code']);
        $data['shop_id'] = $shop->id;

        $coupon = Coupon::create($data);
        return response()->json(['coupon' => $coupon, 'message' => 'Coupon created.'], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $shop   = $this->getShop($request);
        $coupon = Coupon::where('id', $id)->where('shop_id', $shop->id)->firstOrFail();

        $data = $request->validate([
            'description'          => 'nullable|string',
            'type'                 => 'sometimes|in:percentage,fixed',
            'value'                => 'sometimes|numeric|min:0.01',
            'min_order_amount'     => 'nullable|numeric|min:0',
            'max_discount'         => 'nullable|numeric|min:0',
            'usage_limit'          => 'nullable|integer|min:1',
            'usage_limit_per_user' => 'nullable|integer|min:1',
            'new_customers_only'   => 'boolean',
            'expires_at'           => 'nullable|date',
            'is_active'            => 'boolean',
        ]);

        $coupon->update($data);
        return response()->json(['coupon' => $coupon, 'message' => 'Coupon updated.']);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $shop   = $this->getShop($request);
        $coupon = Coupon::where('id', $id)->where('shop_id', $shop->id)->firstOrFail();
        $coupon->delete();
        return response()->json(['message' => 'Coupon deleted.']);
    }
}
