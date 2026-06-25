<?php

namespace App\Services\Coupon;

use App\Models\Coupon;
use App\Models\CouponUsage;
use App\Models\Order;
use Illuminate\Validation\ValidationException;

class CouponService
{
    public function validate(string $code, int $userId, float $orderTotal, ?int $cartShopId = null): Coupon
    {
        $coupon = Coupon::where('code', strtoupper($code))->first();

        if (!$coupon || !$coupon->isValid()) {
            throw ValidationException::withMessages(['coupon' => 'Invalid or expired coupon.']);
        }

        // Vendor coupon: must match the cart's shop
        if ($coupon->shop_id !== null && $coupon->shop_id !== $cartShopId) {
            throw ValidationException::withMessages(['coupon' => 'This coupon is only valid for a specific shop and cannot be applied here.']);
        }

        if ($orderTotal < $coupon->min_order_amount) {
            throw ValidationException::withMessages([
                'coupon' => "Minimum order amount is $" . $coupon->min_order_amount . " for this coupon.",
            ]);
        }

        // New customers only check
        if ($coupon->new_customers_only) {
            $hasOrders = Order::where('user_id', $userId)
                ->whereNotIn('status', ['cancelled'])
                ->exists();
            if ($hasOrders) {
                throw ValidationException::withMessages(['coupon' => 'This coupon is for new customers only.']);
            }
        }

        // Check per-user usage limit
        $perUserLimit = $coupon->usage_limit_per_user ?? 1;
        $used = CouponUsage::where(['coupon_id' => $coupon->id, 'user_id' => $userId])->count();
        if ($used >= $perUserLimit) {
            $msg = $perUserLimit === 1
                ? 'You have already used this coupon.'
                : "You have reached the usage limit ({$perUserLimit}x) for this coupon.";
            throw ValidationException::withMessages(['coupon' => $msg]);
        }

        return $coupon;
    }

    public function recordUsage(Coupon $coupon, int $userId, int $orderId, float $discount): void
    {
        CouponUsage::create([
            'coupon_id'        => $coupon->id,
            'user_id'          => $userId,
            'order_id'         => $orderId,
            'discount_applied' => $discount,
        ]);
        $coupon->increment('used_count');

        // Stamp fully_used_at when usage limit is reached (for auto-hide after 3 days)
        $coupon->refresh();
        if ($coupon->usage_limit && $coupon->used_count >= $coupon->usage_limit && !$coupon->fully_used_at) {
            $coupon->update(['fully_used_at' => now()]);
        }
    }
}
