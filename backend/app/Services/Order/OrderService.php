<?php

namespace App\Services\Order;

use App\Events\OrderPlaced;
use App\Events\OrderStatusUpdated;
use App\Models\Cart;
use App\Models\Coupon;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Services\Coupon\CouponService;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OrderService
{
    public function __construct(private readonly CouponService $couponService) {}

    private function platformFeeRate(float $amount): float
    {
        return match (true) {
            $amount <= 50  => 0.05,
            $amount <= 150 => 0.08,
            $amount <= 300 => 0.10,
            default        => 0.15,
        };
    }

    public function calculateSummary(int $userId, ?string $couponCode = null): array
    {
        $cart = Cart::with(['items.product', 'items.variant'])
            ->where('user_id', $userId)
            ->firstOrFail();

        if ($cart->items->isEmpty()) {
            throw ValidationException::withMessages(['cart' => 'Cart is empty.']);
        }

        $subtotal    = $cart->items->sum(fn ($i) => $i->unit_price * $i->quantity);
        $cartShopId  = $cart->items->first()?->product->shop_id;

        $discount = 0.0;
        $coupon   = null;

        if ($couponCode) {
            $coupon   = $this->couponService->validate($couponCode, $userId, $subtotal, $cartShopId);
            $discount = $coupon->calculateDiscount($subtotal);
        }

        $total = round($subtotal - $discount, 2);

        return [
            'subtotal'   => $subtotal,
            'tax_amount' => 0,
            'discount'   => $discount,
            'total'      => $total,
            'coupon'     => $coupon,
        ];
    }

    public function placeOrder(int $userId, array $data): Order
    {
        return DB::transaction(function () use ($userId, $data) {
            $cart = Cart::with(['items.product.shop', 'items.variant'])
                ->where('user_id', $userId)
                ->firstOrFail();

            if ($cart->items->isEmpty()) {
                throw ValidationException::withMessages(['cart' => 'Cart is empty.']);
            }

            $summary = $this->calculateSummary($userId, $data['coupon_code'] ?? null);

            // One order per shop (multi-vendor)
            $shopGroups = $cart->items->groupBy(fn ($i) => $i->product->shop_id);
            $orders     = [];

            foreach ($shopGroups as $shopId => $items) {
                $shopSubtotal = $items->sum(fn ($i) => $i->unit_price * $i->quantity);
                $shopDiscount = count($shopGroups) === 1 ? $summary['discount'] : 0;
                $shopTotal    = round($shopSubtotal - $shopDiscount, 2);

                // Tiered fee silently recorded — deducted from vendor payout, invisible to customer
                $shopPlatformFee = round($shopTotal * $this->platformFeeRate($shopTotal), 2);

                $order = Order::create([
                    'user_id'         => $userId,
                    'shop_id'         => $shopId,
                    'address_id'      => $data['address_id'],
                    'coupon_id'       => $summary['coupon']?->id,
                    'subtotal'        => $shopSubtotal,
                    'discount_amount' => $shopDiscount,
                    'tax_amount'      => 0,
                    'platform_fee'    => $shopPlatformFee,
                    'total'           => $shopTotal,
                    'notes'           => $data['notes'] ?? null,
                ]);

                foreach ($items as $cartItem) {
                    OrderItem::create([
                        'order_id'     => $order->id,
                        'product_id'   => $cartItem->product_id,
                        'variant_id'   => $cartItem->variant_id,
                        'product_name' => $cartItem->product->name,
                        'variant_info' => $cartItem->variant?->attribute_label,
                        'quantity'     => $cartItem->quantity,
                        'unit_price'   => $cartItem->unit_price,
                        'total_price'  => $cartItem->unit_price * $cartItem->quantity,
                    ]);

                    // Deduct stock
                    if ($cartItem->variant) {
                        $cartItem->variant->decrement('stock_quantity', $cartItem->quantity);
                    }
                    $cartItem->product->decrement('stock_quantity', $cartItem->quantity);
                    $cartItem->product->increment('sold_count', $cartItem->quantity);

                    // Auto-deactivate when stock runs out
                    $cartItem->product->refresh();
                    if ($cartItem->product->stock_quantity <= 0 && $cartItem->product->status === 'active') {
                        $cartItem->product->update(['status' => 'inactive', 'stock_quantity' => 0]);
                    }
                }

                Payment::create([
                    'order_id' => $order->id,
                    'gateway'  => $data['payment_method'] ?? 'cod',
                    'amount'   => $order->total,
                    'status'   => 'pending',
                ]);

                event(new OrderPlaced($order));
                $orders[] = $order;
            }

            // Record coupon usage
            if ($summary['coupon']) {
                $this->couponService->recordUsage($summary['coupon'], $userId, $orders[0]->id, $summary['discount']);
            }

            // Clear cart
            $cart->items()->delete();

            return $orders[0]; // Return first order; FE handles multi-order
        });
    }

    public function updateStatus(Order $order, string $status, array $extra = []): Order
    {
        $allowed = [
            'confirmed'  => ['pending'],
            'processing' => ['confirmed'],
            'delivered'  => ['confirmed', 'processing'],
            'cancelled'  => ['pending', 'confirmed'],
        ];

        if (!in_array($order->status, $allowed[$status] ?? [])) {
            throw ValidationException::withMessages([
                'status' => "Cannot transition from '{$order->status}' to '{$status}'.",
            ]);
        }

        $timestamps = [
            'confirmed'  => 'confirmed_at',
            'delivered'  => 'delivered_at',
            'cancelled'  => 'cancelled_at',
        ];

        $update = array_merge(['status' => $status], $extra);
        if (isset($timestamps[$status])) {
            $update[$timestamps[$status]] = now();
        }

        $order->update($update);
        event(new OrderStatusUpdated($order));

        return $order->fresh();
    }
}
