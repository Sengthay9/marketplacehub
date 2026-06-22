<?php

namespace App\Services\Coupon;

use App\Models\Coupon;
use App\Models\CouponUsage;
use Illuminate\Validation\ValidationException;

class CouponService
{
    public function validate(string $code, int $userId, float $orderTotal): Coupon
    {
        $coupon = Coupon::where('code', strtoupper($code))->first();

        if (!$coupon || !$coupon->isValid()) {
            throw ValidationException::withMessages(['coupon' => 'Invalid or expired coupon.']);
        }

        if ($orderTotal < $coupon->min_order_amount) {
            throw ValidationException::withMessages([
                'coupon' => "Minimum order amount is $" . $coupon->min_order_amount . " for this coupon.",
            ]);
        }

        // Check per-user usage
        $used = CouponUsage::where(['coupon_id' => $coupon->id, 'user_id' => $userId])->count();
        if ($used > 0) {
            throw ValidationException::withMessages(['coupon' => 'You have already used this coupon.']);
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
    }
}
