<?php

namespace App\Http\Controllers\Api\V1\Vendor;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Shop;
use App\Services\Order\OrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VendorOrderController extends Controller
{
    public function __construct(private readonly OrderService $orderService) {}

    private function getShop(Request $request): Shop
    {
        return Shop::where('user_id', $request->user()->id)->firstOrFail();
    }

    public function index(Request $request): JsonResponse
    {
        $shop = $this->getShop($request);
        $orders = Order::with(['customer:id,name,email', 'items', 'payment'])
            ->where('shop_id', $shop->id)
            ->when($request->input('status'), fn ($q, $s) => $q->where('status', $s))
            ->latest()
            ->paginate(20);

        return response()->json($orders);
    }

    public function confirmPayment(Request $request, int $id): JsonResponse
    {
        $shop  = $this->getShop($request);
        $order = Order::with('payment')->where(['id' => $id, 'shop_id' => $shop->id])->firstOrFail();

        if ($order->payment) {
            $order->payment->update(['status' => 'completed']);
        } else {
            $order->payment()->create([
                'gateway' => 'cod',
                'amount'  => $order->total,
                'status'  => 'completed',
            ]);
        }

        return response()->json(['message' => 'Payment confirmed.']);
    }

    public function rejectPayment(Request $request, int $id): JsonResponse
    {
        $shop  = $this->getShop($request);
        $order = Order::with(['payment', 'items.product', 'items.variant'])
            ->where(['id' => $id, 'shop_id' => $shop->id])
            ->firstOrFail();

        // Mark payment as refunded
        if ($order->payment) {
            $order->payment->update(['status' => 'refunded']);
        }

        // Cancel the order
        if (in_array($order->status, ['pending', 'confirmed'])) {
            // Restore stock
            foreach ($order->items as $item) {
                if ($item->variant) {
                    $item->variant->increment('stock_quantity', $item->quantity);
                }
                $item->product->increment('stock_quantity', $item->quantity);
                $item->product->decrement('sold_count', $item->quantity);
            }

            $order->update([
                'status'       => 'cancelled',
                'cancelled_at' => now(),
            ]);
        }

        return response()->json(['message' => 'Payment rejected and order cancelled.']);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $shop  = $this->getShop($request);
        $order = Order::with(['customer:id,name,email,phone', 'items.product', 'address', 'payment'])
            ->where(['id' => $id, 'shop_id' => $shop->id])
            ->firstOrFail();

        return response()->json(['order' => $order]);
    }

    public function confirm(Request $request, int $id): JsonResponse
    {
        $shop  = $this->getShop($request);
        $order = Order::where(['id' => $id, 'shop_id' => $shop->id])->firstOrFail();
        $order = $this->orderService->updateStatus($order, 'confirmed');
        return response()->json(['order' => $order, 'message' => 'Order confirmed.']);
    }

    public function ship(Request $request, int $id): JsonResponse
    {
        $request->validate(['tracking_number' => 'nullable|string|max:100']);
        $shop  = $this->getShop($request);
        $order = Order::where(['id' => $id, 'shop_id' => $shop->id])->firstOrFail();
        $order = $this->orderService->updateStatus($order, 'shipped', [
            'tracking_number' => $request->input('tracking_number'),
        ]);
        return response()->json(['order' => $order, 'message' => 'Order marked as shipped.']);
    }

    public function deliver(Request $request, int $id): JsonResponse
    {
        $shop  = $this->getShop($request);
        $order = Order::where(['id' => $id, 'shop_id' => $shop->id])->firstOrFail();
        $order = $this->orderService->updateStatus($order, 'delivered');
        return response()->json(['order' => $order, 'message' => 'Order marked as delivered.']);
    }
}
