<?php

namespace App\Http\Controllers\Api\V1\Customer;

use App\Http\Controllers\Controller;
use App\Models\Shop;
use App\Models\ShopReview;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ShopReviewController extends Controller
{
    public function index(string $slug): JsonResponse
    {
        $shop = Shop::where('slug', $slug)->firstOrFail();

        $reviews = $shop->shopReviews()
            ->with('user:id,name,avatar')
            ->latest()
            ->paginate(20);

        return response()->json($reviews);
    }

    public function store(Request $request, string $slug): JsonResponse
    {
        $shop = Shop::where('slug', $slug)->firstOrFail();

        $data = $request->validate([
            'rating'   => 'required|integer|min:1|max:5',
            'comment'  => 'nullable|string|max:2000',
            'order_id' => 'nullable|integer|exists:orders,id',
        ]);

        $existing = ShopReview::where('shop_id', $shop->id)
            ->where('user_id', $request->user()->id)
            ->first();

        if ($existing) {
            return response()->json(['message' => 'You have already reviewed this shop.'], 422);
        }

        $review = ShopReview::create([
            'shop_id'  => $shop->id,
            'user_id'  => $request->user()->id,
            'order_id' => $data['order_id'] ?? null,
            'rating'   => $data['rating'],
            'comment'  => $data['comment'] ?? null,
        ]);

        $shop->recalculateRating();

        return response()->json([
            'review'  => $review->load('user:id,name,avatar'),
            'message' => 'Review submitted.',
        ], 201);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $review = ShopReview::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $shop = $review->shop;
        $review->delete();
        $shop->recalculateRating();

        return response()->json(['message' => 'Review deleted.']);
    }
}
