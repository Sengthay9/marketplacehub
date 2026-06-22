<?php

namespace App\Http\Controllers\Api\V1\Customer;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\Order\OrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    public function __construct(private readonly OrderService $orderService) {}

    public function index(Request $request): JsonResponse
    {
        $orders = Order::with(['shop:id,name,slug,logo', 'items', 'payment'])
            ->where('user_id', $request->user()->id)
            ->latest()
            ->paginate(10);

        return response()->json($orders);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $order = Order::with(['shop', 'items.product.images', 'address', 'payment', 'coupon'])
            ->where(['id' => $id, 'user_id' => $request->user()->id])
            ->firstOrFail();

        return response()->json(['order' => $order]);
    }

    public function cancel(Request $request, int $id): JsonResponse
    {
        $order = Order::where(['id' => $id, 'user_id' => $request->user()->id])->firstOrFail();

        if (!$order->isCancellable()) {
            return response()->json(['message' => 'This order cannot be cancelled.'], 422);
        }

        $order = $this->orderService->updateStatus($order, 'cancelled');
        return response()->json(['order' => $order, 'message' => 'Order cancelled.']);
    }
}
