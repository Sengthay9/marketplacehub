<?php

namespace App\Http\Controllers\Api\V1\Customer;

use App\Http\Controllers\Controller;
use App\Models\Shop;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ShopFavoriteController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $userId = $request->user()->id;

        $shops = Shop::whereIn('id', function ($q) use ($userId) {
            $q->select('shop_id')->from('shop_favorites')->where('user_id', $userId);
        })->get(['id', 'name', 'slug', 'logo', 'rating', 'review_count', 'status']);

        $shopIds = $shops->pluck('id');

        return response()->json(['shops' => $shops, 'shop_ids' => $shopIds]);
    }

    public function toggle(Request $request, string $slug): JsonResponse
    {
        $shop   = Shop::where('slug', $slug)->firstOrFail();
        $userId = $request->user()->id;

        $exists = DB::table('shop_favorites')
            ->where('user_id', $userId)
            ->where('shop_id', $shop->id)
            ->exists();

        if ($exists) {
            DB::table('shop_favorites')
                ->where('user_id', $userId)
                ->where('shop_id', $shop->id)
                ->delete();
            return response()->json(['favorited' => false, 'message' => 'Removed from favorites.']);
        }

        DB::table('shop_favorites')->insert([
            'user_id'    => $userId,
            'shop_id'    => $shop->id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json(['favorited' => true, 'message' => 'Shop added to favorites.']);
    }
}
