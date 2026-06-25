<?php

namespace App\Http\Controllers\Api\V1\Vendor;

use App\Http\Controllers\Controller;
use App\Models\Review;
use App\Models\Shop;
use App\Models\ShopReview;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VendorReviewController extends Controller
{
    private function getShop(Request $request): Shop
    {
        return Shop::where('user_id', $request->user()->id)->firstOrFail();
    }

    /* ════════════════════════════════
     *  PRODUCT REVIEWS
     * ════════════════════════════════ */

    public function index(Request $request): JsonResponse
    {
        $shop = $this->getShop($request);

        $reviews = Review::with(['user:id,name', 'product:id,name,slug'])
            ->whereHas('product', fn ($q) => $q->where('shop_id', $shop->id))
            ->latest()
            ->paginate(20);

        return response()->json($reviews);
    }

    public function reply(Request $request, int $id): JsonResponse
    {
        $shop   = $this->getShop($request);
        $review = Review::whereHas('product', fn ($q) => $q->where('shop_id', $shop->id))
            ->findOrFail($id);

        $data = $request->validate(['reply' => 'required|string|max:1000']);

        $review->update([
            'vendor_reply'      => $data['reply'],
            'vendor_replied_at' => now(),
        ]);

        return response()->json(['message' => 'Reply posted.', 'review' => $review->fresh()]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $shop   = $this->getShop($request);
        $review = Review::whereHas('product', fn ($q) => $q->where('shop_id', $shop->id))
            ->findOrFail($id);

        $review->delete();

        return response()->json(['message' => 'Review removed.']);
    }

    /* ════════════════════════════════
     *  SHOP REVIEWS
     * ════════════════════════════════ */

    public function shopIndex(Request $request): JsonResponse
    {
        $shop = $this->getShop($request);

        $reviews = ShopReview::with(['user:id,name'])
            ->where('shop_id', $shop->id)
            ->latest()
            ->paginate(20);

        return response()->json($reviews);
    }

    public function shopReply(Request $request, int $id): JsonResponse
    {
        $shop   = $this->getShop($request);
        $review = ShopReview::where('shop_id', $shop->id)->findOrFail($id);

        $data = $request->validate(['reply' => 'required|string|max:1000']);

        $review->update([
            'vendor_reply'      => $data['reply'],
            'vendor_replied_at' => now(),
        ]);

        return response()->json(['message' => 'Reply posted.', 'review' => $review->fresh()]);
    }

    public function shopDestroy(Request $request, int $id): JsonResponse
    {
        $shop   = $this->getShop($request);
        $review = ShopReview::where('shop_id', $shop->id)->findOrFail($id);

        $review->delete();

        return response()->json(['message' => 'Review removed.']);
    }
}
