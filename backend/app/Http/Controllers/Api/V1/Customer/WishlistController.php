<?php

namespace App\Http\Controllers\Api\V1\Customer;

use App\Http\Controllers\Controller;
use App\Models\Wishlist;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WishlistController extends Controller
{
    private function getOrCreateWishlist(Request $request): Wishlist
    {
        return Wishlist::firstOrCreate(['user_id' => $request->user()->id]);
    }

    public function show(Request $request): JsonResponse
    {
        $wishlist = $this->getOrCreateWishlist($request);
        $items = $wishlist->items()
            ->with(['product' => fn ($q) => $q->with(['images', 'shop:id,name,slug'])])
            ->get();

        // Return product_ids for quick client-side lookup
        return response()->json([
            'items'       => $items,
            'product_ids' => $items->pluck('product_id')->values(),
        ]);
    }

    public function addItem(Request $request): JsonResponse
    {
        $request->validate(['product_id' => 'required|integer|exists:products,id']);

        $wishlist = $this->getOrCreateWishlist($request);

        $item = $wishlist->items()->firstOrCreate([
            'product_id' => $request->product_id,
        ]);

        return response()->json([
            'message' => 'Added to wishlist.',
            'item_id' => $item->id,
        ], 201);
    }

    public function removeItem(Request $request, int $id): JsonResponse
    {
        $wishlist = $this->getOrCreateWishlist($request);
        $wishlist->items()->where('product_id', $id)->delete();

        return response()->json(['message' => 'Removed from wishlist.']);
    }

    public function moveToCart(Request $request, int $id): JsonResponse
    {
        $wishlist = $this->getOrCreateWishlist($request);
        $item = $wishlist->items()->where('product_id', $id)->firstOrFail();

        // Delegate to cart logic — reuse CartController via service or direct
        $request->merge(['product_id' => $item->product_id, 'quantity' => 1]);
        app(CartController::class)->addItem($request);
        $item->delete();

        return response()->json(['message' => 'Moved to cart.']);
    }
}
