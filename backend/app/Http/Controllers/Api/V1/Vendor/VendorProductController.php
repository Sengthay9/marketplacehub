<?php

namespace App\Http\Controllers\Api\V1\Vendor;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Shop;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class VendorProductController extends Controller
{
    private function getShop(Request $request): Shop
    {
        return Shop::where('user_id', $request->user()->id)->firstOrFail();
    }

    public function index(Request $request): JsonResponse
    {
        $shop = $this->getShop($request);
        $products = Product::with(['images', 'category'])
            ->where('shop_id', $shop->id)
            ->where('status', '!=', 'banned')
            ->when($request->input('status'), fn ($q, $s) => $q->where('status', $s))
            ->when($request->input('q'), fn ($q, $search) => $q->where('name', 'ilike', "%$search%"))
            ->latest()
            ->paginate(20);

        return response()->json($products);
    }

    public function store(Request $request): JsonResponse
    {
        $shop = Shop::where('user_id', $request->user()->id)->first();

        if (!$shop) {
            return response()->json([
                'message' => 'You need to set up your shop before adding products.',
            ], 403);
        }

        $data = $request->validate([
            'name'           => 'required|string|max:255',
            'category_id'    => 'required|integer|exists:categories,id',
            'description'    => 'nullable|string',
            'price'          => 'sometimes|numeric|min:0',
            'stock_quantity' => 'sometimes|integer|min:0',
        ]);

        // Auto-generate unique SKU from product name
        $base = strtoupper(preg_replace('/[^a-zA-Z0-9]/', '', $data['name']));
        $base = substr($base, 0, 5) ?: 'PROD';
        do {
            $sku = $base . '-' . strtoupper(Str::random(6));
        } while (Product::where('sku', $sku)->exists());

        $product = Product::create([
            'name'           => $data['name'],
            'category_id'    => $data['category_id'],
            'description'    => $data['description'] ?? null,
            'sku'            => $sku,
            'shop_id'        => $shop->id,
            'price'          => $data['price'] ?? 0,
            'stock_quantity' => $data['stock_quantity'] ?? 0,
            'status'         => 'inactive',
        ]);

        return response()->json(['product' => $product->load(['images', 'category'])], 201);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $shop = $this->getShop($request);
        $product = Product::with(['images', 'variants', 'category'])
            ->where(['id' => $id, 'shop_id' => $shop->id])
            ->firstOrFail();

        return response()->json(['product' => $product]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $shop    = $this->getShop($request);
        $product = Product::where(['id' => $id, 'shop_id' => $shop->id])->firstOrFail();

        $data = $request->validate([
            'name'           => 'sometimes|string|max:255',
            'category_id'    => 'sometimes|integer|exists:categories,id',
            'description'    => 'nullable|string',
            'price'          => 'sometimes|numeric|min:0',
            'stock_quantity' => 'sometimes|integer|min:0',
        ]);

        // Banned products cannot be edited by the vendor
        if ($product->status === 'banned') {
            return response()->json(['message' => 'This product has been permanently banned and cannot be edited.'], 403);
        }

        $product->update($data);

        if (!in_array($product->status, ['suspended', 'banned'])) {
            if ($product->stock_quantity <= 0 && $product->status === 'active') {
                // Stock ran out — auto-deactivate
                $product->update(['status' => 'inactive']);
            } elseif ($product->price > 0 && $product->stock_quantity > 0 && $product->status === 'inactive') {
                // Price and stock are now set — auto-activate
                $product->update(['status' => 'active']);
            }
        }

        return response()->json(['product' => $product->fresh()]);
    }

    public function toggle(Request $request, int $id): JsonResponse
    {
        $shop    = $this->getShop($request);
        $product = Product::where(['id' => $id, 'shop_id' => $shop->id])->firstOrFail();

        if (in_array($product->status, ['suspended', 'banned'])) {
            return response()->json(['message' => 'This product has been restricted by admin.'], 403);
        }

        // Cannot activate without price and stock
        if ($product->status === 'inactive' && ($product->price <= 0 || $product->stock_quantity <= 0)) {
            return response()->json(['message' => 'Set a price and stock before activating this product.'], 422);
        }

        $newStatus = $product->status === 'active' ? 'inactive' : 'active';
        $product->update(['status' => $newStatus]);
        return response()->json(['product' => $product, 'status' => $newStatus]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $shop = $this->getShop($request);
        Product::where(['id' => $id, 'shop_id' => $shop->id])->firstOrFail()->delete();
        return response()->json(['message' => 'Product deleted.']);
    }

    public function uploadImages(Request $request, int $id): JsonResponse
    {
        $request->validate(['images.*' => 'required|image|max:4096']);
        $shop    = $this->getShop($request);
        $product = Product::where(['id' => $id, 'shop_id' => $shop->id])->firstOrFail();

        $images = [];
        foreach ($request->file('images') as $i => $file) {
            $path = $file->store("products/{$product->id}", 'public');
            $images[] = $product->images()->create([
                'path'       => $path,
                'is_primary' => $product->images()->count() === 0 && $i === 0,
                'sort_order' => $product->images()->count() + $i,
            ]);
        }

        return response()->json(['images' => $images], 201);
    }
}
