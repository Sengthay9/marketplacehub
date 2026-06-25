<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Services\Notification\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminProductController extends Controller
{
    public function __construct(private readonly NotificationService $notificationService) {}

    public function index(Request $request): JsonResponse
    {
        $status = $request->input('status');

        $isNew = $request->boolean('new');

        $products = Product::with(['shop:id,name', 'category:id,name', 'images'])
            ->when($isNew, fn ($q) => $q->where('created_at', '>=', now()->subDays(3))->whereNotIn('status', ['suspended', 'banned']))
            ->when(!$isNew && !$status, fn ($q) => $q->whereNotIn('status', ['suspended', 'banned']))
            ->when(!$isNew && $status,  fn ($q) => $q->where('status', $status))
            ->when($request->input('q'), fn ($q, $search) =>
                $q->where(fn ($sub) => $sub
                    ->where('name', 'ilike', "%$search%")
                    ->orWhereHas('shop', fn ($sq) => $sq->where('name', 'ilike', "%$search%"))
                )
            )
            ->latest()
            ->paginate(20);

        return response()->json($products);
    }

    public function show(int $id): JsonResponse
    {
        $product = Product::with(['shop', 'category', 'images', 'variants'])->findOrFail($id);
        return response()->json(['product' => $product]);
    }

    public function approve(int $id): JsonResponse
    {
        $product = Product::with('shop.owner')->findOrFail($id);
        $product->update(['status' => 'active', 'rejection_reason' => null]);

        $this->notificationService->send($product->shop->owner, 'product_approved', [
            'title'   => 'Product Approved',
            'message' => "Your product '{$product->name}' is now live on CamCart.",
            'data'    => ['product_id' => $product->id],
        ]);

        return response()->json(['message' => 'Product approved and published.', 'product' => $product]);
    }

    public function reject(Request $request, int $id): JsonResponse
    {
        $request->validate(['reason' => 'required|string|max:500']);
        $product = Product::with('shop.owner')->findOrFail($id);
        $product->update(['status' => 'rejected', 'rejection_reason' => $request->input('reason')]);

        $this->notificationService->send($product->shop->owner, 'product_rejected', [
            'title'   => 'Product Rejected',
            'message' => "'{$product->name}' was rejected: " . $request->input('reason'),
            'data'    => ['product_id' => $product->id],
        ]);

        return response()->json(['message' => 'Product rejected.', 'product' => $product]);
    }

    public function warn(Request $request, int $id): JsonResponse
    {
        $request->validate(['reason' => 'required|string|max:500']);
        $product = Product::with('shop.owner')->findOrFail($id);
        $product->update(['warning_reason' => $request->input('reason')]);

        $this->notificationService->send($product->shop->owner, 'product_warned', [
            'title'   => 'Product Warning',
            'message' => "Warning on '{$product->name}': " . $request->input('reason'),
            'data'    => ['product_id' => $product->id],
        ]);

        return response()->json(['message' => 'Warning sent to vendor.', 'product' => $product]);
    }

    public function suspend(Request $request, int $id): JsonResponse
    {
        $request->validate(['reason' => 'required|string|max:500', 'days' => 'nullable|integer|min:1']);
        $product = Product::with('shop.owner')->findOrFail($id);
        $days  = $request->input('days', 7);
        $until = now()->addDays($days);
        $product->update([
            'status'          => 'suspended',
            'warning_reason'  => $request->input('reason'),
            'suspended_until' => $until,
        ]);

        $this->notificationService->send($product->shop->owner, 'product_suspended', [
            'title'   => 'Product Suspended',
            'message' => "Your product '{$product->name}' has been suspended until {$until->toDateString()}. Reason: " . $request->input('reason') . ". The product will automatically become available again after the suspension ends.",
            'data'    => ['product_id' => $product->id],
        ]);

        return response()->json(['message' => 'Product suspended.', 'product' => $product]);
    }

    public function ban(Request $request, int $id): JsonResponse
    {
        $request->validate(['reason' => 'required|string|max:500']);
        $product = Product::with('shop.owner')->findOrFail($id);
        $product->update([
            'status'         => 'banned',
            'warning_reason' => $request->input('reason'),
        ]);

        $this->notificationService->send($product->shop->owner, 'product_banned', [
            'title'   => 'Product Banned',
            'message' => "'{$product->name}' has been permanently banned and removed from the platform: " . $request->input('reason'),
            'data'    => ['product_id' => $product->id],
        ]);

        return response()->json(['message' => 'Product banned.', 'product' => $product]);
    }

    public function unban(int $id): JsonResponse
    {
        $product = Product::with('shop.owner')->findOrFail($id);
        $product->update([
            'status'          => 'active',
            'warning_reason'  => null,
            'suspended_until' => null,
        ]);

        $this->notificationService->send($product->shop->owner, 'product_restored', [
            'title'   => 'Product Suspension Lifted',
            'message' => "'{$product->name}' suspension has been lifted. It is now active on the platform.",
            'data'    => ['product_id' => $product->id],
        ]);

        return response()->json(['message' => 'Product suspension lifted.', 'product' => $product]);
    }

    public function destroy(int $id): JsonResponse
    {
        Product::findOrFail($id)->delete();
        return response()->json(['message' => 'Product deleted.']);
    }
}
