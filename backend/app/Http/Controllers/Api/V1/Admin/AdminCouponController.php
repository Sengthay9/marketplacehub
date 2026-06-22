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
        $coupons = Coupon::whereNull('shop_id')->latest()->paginate(20);
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
            'usage_limit'       => 'nullable|integer|min:1',
            'starts_at'         => 'nullable|date',
            'expires_at'        => 'nullable|date|after:today',
            'is_active'         => 'boolean',
        ]);

        $coupon = Coupon::create(array_merge($data, ['shop_id' => null]));
        return response()->json(['coupon' => $coupon], 201);
    }

    public function destroy(int $id): JsonResponse
    {
        Coupon::findOrFail($id)->delete();
        return response()->json(['message' => 'Coupon deleted.']);
    }
}
