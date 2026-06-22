<?php

namespace App\Http\Controllers\Api\V1\Customer;

use App\Http\Controllers\Controller;
use App\Services\Order\OrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CheckoutController extends Controller
{
    public function __construct(private readonly OrderService $orderService) {}

    public function summary(Request $request): JsonResponse
    {
        $request->validate(['coupon_code' => 'nullable|string|max:50']);
        $summary = $this->orderService->calculateSummary(
            $request->user()->id,
            $request->input('coupon_code')
        );
        return response()->json(['summary' => $summary]);
    }

    public function applyCoupon(Request $request): JsonResponse
    {
        $request->validate(['coupon_code' => 'required|string|max:50']);
        $summary = $this->orderService->calculateSummary(
            $request->user()->id,
            $request->input('coupon_code')
        );
        return response()->json([
            'discount' => $summary['discount'],
            'total'    => $summary['total'],
            'coupon'   => $summary['coupon'],
        ]);
    }

    public function placeOrder(Request $request): JsonResponse
    {
        $request->validate([
            'address_id'     => 'required|integer|exists:addresses,id',
            'payment_method' => 'required|in:cod,aba,bakong,acleda,card',
            'saved_card_id'  => 'nullable|integer|exists:saved_cards,id',
            'coupon_code'    => 'nullable|string|max:50',
            'notes'          => 'nullable|string|max:500',
        ]);

        $order = $this->orderService->placeOrder($request->user()->id, $request->validated());

        return response()->json([
            'message'      => 'Order placed successfully.',
            'order_number' => $order->order_number,
            'order'        => $order->load(['items', 'payment']),
        ], 201);
    }
}
