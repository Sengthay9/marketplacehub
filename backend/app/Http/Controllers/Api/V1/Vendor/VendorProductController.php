<?php

namespace App\Http\Controllers\Api\V1\Vendor;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Shop;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\Sluggable\SlugOptions;

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
            ->when($request->input('status'), fn ($q, $s) => $q->where('status', $s))
            ->when($request->input('q'), fn ($q, $search) => $q->where('name', 'ilike', "%$search%"))
            ->latest()
            ->paginate(20);

        return response()->json($products);
    }

    public function store(Request $request): JsonResponse
    {
        $shop = $this->getShop($request);

        if (!$shop->isApproved()) {
            return response()->json(['message' => 'Your shop must be approved before listing products.'], 403);
        }

        $data = $request->validate([
            'name'           => 'required|string|max:255',
            'sku'            => 'required|string|unique:products,sku',
            'category_id'    => 'required|integer|exists:categories,id',
            'description'    => 'nullable|string',
            'price'          => 'required|numeric|min:0',
            'discount_price' => 'nullable|numeric|lt:price',
            'stock_quantity' => 'required|integer|min:0',
        ]);

        $product = Product::create([
            ...$data,
            'shop_id' => $shop->id,
            'status'  => 'pending',
        ]);

        return response()->json(['product' => $product], 201);
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
            'discount_price' => 'nullable|numeric',
            'stock_quantity' => 'sometimes|integer|min:0',
        ]);

        // Reset to pending if price/stock changes on published product
        if ($product->isPublished() && (isset($data['price']) || isset($data['description']))) {
            $data['status'] = 'pending';
        }

        $product->update($data);
        return response()->json(['product' => $product]);
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
