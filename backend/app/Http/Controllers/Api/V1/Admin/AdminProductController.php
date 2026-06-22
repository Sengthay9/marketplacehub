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

        $products = Product::with(['shop:id,name', 'category:id,name'])
            ->when($status, fn ($q, $s) => $q->where('status', $s))
            // "New Products" tab: only show pending items from the last 3 days
            ->when($status === 'pending', fn ($q) => $q->where('created_at', '>=', now()->subDays(3)))
            ->when($request->input('q'), fn ($q, $search) =>
                $q->where('name', 'ilike', "%$search%")->orWhere('sku', 'ilike', "%$search%")
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
        $product->update(['status' => 'published', 'rejection_reason' => null]);

        $this->notificationService->send($product->shop->owner, 'product_approved', [
            'title'   => 'Product Approved',
            'message' => "Your product '{$product->name}' is now live on MarketplaceHub.",
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
        $request->validate(['reason' => 'required|string|max:500']);
        $product = Product::with('shop.owner')->findOrFail($id);
        $product->update([
            'status'         => 'suspended',
            'warning_reason' => $request->input('reason'),
        ]);

        $this->notificationService->send($product->shop->owner, 'product_suspended', [
            'title'   => 'Product Suspended',
            'message' => "'{$product->name}' has been suspended: " . $request->input('reason'),
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
            'message' => "'{$product->name}' has been permanently banned: " . $request->input('reason'),
            'data'    => ['product_id' => $product->id],
        ]);

        return response()->json(['message' => 'Product banned.', 'product' => $product]);
    }

    public function unban(int $id): JsonResponse
    {
        $product = Product::with('shop.owner')->findOrFail($id);
        $product->update([
            'status'         => 'published',
            'warning_reason' => null,
        ]);

        $this->notificationService->send($product->shop->owner, 'product_restored', [
            'title'   => 'Product Restored',
            'message' => "'{$product->name}' has been restored and is now live again.",
            'data'    => ['product_id' => $product->id],
        ]);

        return response()->json(['message' => 'Product restored to published.', 'product' => $product]);
    }

    public function destroy(int $id): JsonResponse
    {
        Product::findOrFail($id)->delete();
        return response()->json(['message' => 'Product deleted.']);
    }
}
