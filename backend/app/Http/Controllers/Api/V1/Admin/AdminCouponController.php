<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Coupon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminCouponController extends Controller
{
    public function index(): JsonResponse
    {
        $coupons = Coupon::whereNull('shop_id')
            // Hide expired coupons (past midnight of expiry date)
            ->where(function ($q) {
                $q->whereNull('expires_at')
                  ->orWhere('expires_at', '>=', now()->startOfDay());
            })
            // Hide fully-used coupons after 3-day grace period
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
        $data = $request->validate([
            'code'              => 'required|string|max:50|unique:coupons,code',
            'description'       => 'nullable|string',
            'type'              => 'required|in:percentage,fixed',
            'value'             => 'required|numeric|min:0',
            'min_order_amount'  => 'numeric|min:0',
            'max_discount'      => 'nullable|numeric|min:0',
            'usage_limit'           => 'nullable|integer|min:1',
            'usage_limit_per_user'  => 'nullable|integer|min:1',
            'new_customers_only'    => 'boolean',
            'starts_at'             => 'nullable|date',
            'expires_at'            => 'nullable|date|after:today',
            'is_active'             => 'boolean',
        ]);

        $coupon = Coupon::create(array_merge($data, ['shop_id' => null]));
        return response()->json(['coupon' => $coupon], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $coupon = Coupon::whereNull('shop_id')->findOrFail($id);

        $data = $request->validate([
            'code'             => 'sometimes|string|max:50|unique:coupons,code,' . $id,
            'description'      => 'nullable|string',
            'type'             => 'sometimes|in:percentage,fixed',
            'value'            => 'sometimes|numeric|min:0',
            'min_order_amount' => 'nullable|numeric|min:0',
            'max_discount'     => 'nullable|numeric|min:0',
            'usage_limit'           => 'nullable|integer|min:1',
            'usage_limit_per_user'  => 'nullable|integer|min:1',
            'new_customers_only'    => 'boolean',
            'starts_at'             => 'nullable|date',
            'expires_at'            => 'nullable|date',
            'is_active'             => 'boolean',
        ]);

        if (isset($data['code'])) {
            $data['code'] = strtoupper($data['code']);
        }

        $coupon->update($data);
        return response()->json(['coupon' => $coupon, 'message' => 'Coupon updated.']);
    }

    public function destroy(int $id): JsonResponse
    {
        Coupon::findOrFail($id)->delete();
        return response()->json(['message' => 'Coupon deleted.']);
    }
}
