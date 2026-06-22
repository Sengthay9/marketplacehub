<?php

namespace App\Http\Controllers\Api\V1\Customer;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Review;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $request->validate(['product_id' => 'required|integer|exists:products,id']);

        $reviews = Review::where('product_id', $request->product_id)
            ->with('user:id,name,avatar')
            ->latest()
            ->paginate(20);

        return response()->json($reviews);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'product_id' => 'required|integer|exists:products,id',
            'order_id'   => 'nullable|integer|exists:orders,id',
            'rating'     => 'required|integer|min:1|max:5',
            'comment'    => 'nullable|string|max:2000',
        ]);

        $existing = Review::where('product_id', $data['product_id'])
            ->where('user_id', $request->user()->id)
            ->first();

        if ($existing) {
            return response()->json(['message' => 'You have already reviewed this product.'], 422);
        }

        $review = Review::create([
            'product_id' => $data['product_id'],
            'user_id'    => $request->user()->id,
            'order_id'   => $data['order_id'] ?? null,
            'rating'     => $data['rating'],
            'comment'    => $data['comment'] ?? null,
        ]);

        $this->updateProductRating($data['product_id']);

        return response()->json([
            'review'  => $review->load('user:id,name,avatar'),
            'message' => 'Review submitted.',
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $review = Review::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $data = $request->validate([
            'rating'  => 'sometimes|integer|min:1|max:5',
            'comment' => 'nullable|string|max:2000',
        ]);

        $review->update($data);
        $this->updateProductRating($review->product_id);

        return response()->json(['review' => $review, 'message' => 'Review updated.']);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $review = Review::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $productId = $review->product_id;
        $review->delete();
        $this->updateProductRating($productId);

        return response()->json(['message' => 'Review deleted.']);
    }

    private function updateProductRating(int $productId): void
    {
        $product = Product::find($productId);
        if (!$product) return;

        $avg   = Review::where('product_id', $productId)->avg('rating') ?? 0;
        $count = Review::where('product_id', $productId)->count();
        $product->update(['rating' => round($avg, 2), 'review_count' => $count]);
    }
}
