<?php

namespace App\Http\Controllers\Api\V1\Vendor;

use App\Http\Controllers\Controller;
use App\Models\Shop;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VendorShopController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $shop = Shop::where('user_id', $request->user()->id)->first();

        if (!$shop) {
            return response()->json(['message' => 'You do not have a shop yet.', 'shop' => null], 200);
        }

        return response()->json(['shop' => $shop]);
    }

    public function create(Request $request): JsonResponse
    {
        if (Shop::where('user_id', $request->user()->id)->exists()) {
            return response()->json(['message' => 'You already have a shop.'], 422);
        }

        $data = $request->validate([
            'name'           => 'required|string|max:100|unique:shops,name',
            'description'    => 'nullable|string|max:1000',
            'contact_number' => 'nullable|string|max:20',
            'email'          => 'nullable|email|max:100',
            'address'        => 'nullable|string|max:255',
        ]);

        $shop = Shop::create(array_merge($data, [
            'user_id' => $request->user()->id,
            'status'  => 'pending',
        ]));

        return response()->json(['shop' => $shop, 'message' => 'Shop created and pending admin approval.'], 201);
    }

    public function update(Request $request): JsonResponse
    {
        $shop = Shop::where('user_id', $request->user()->id)->firstOrFail();

        $data = $request->validate([
            'name'           => 'sometimes|string|max:100',
            'description'    => 'nullable|string|max:1000',
            'contact_number' => 'nullable|string|max:20',
            'address'        => 'nullable|string|max:255',
        ]);

        $shop->update($data);

        return response()->json(['shop' => $shop, 'message' => 'Shop updated.']);
    }

    public function uploadLogo(Request $request): JsonResponse
    {
        $request->validate(['logo' => 'required|image|max:2048']);
        $shop = Shop::where('user_id', $request->user()->id)->firstOrFail();
        $path = $request->file('logo')->store('shops/logos', 'public');
        $shop->update(['logo' => asset('storage/' . $path)]);
        return response()->json(['shop' => $shop, 'message' => 'Logo uploaded.']);
    }

    public function uploadBanner(Request $request): JsonResponse
    {
        $request->validate(['banner' => 'required|image|max:5120']);
        $shop = Shop::where('user_id', $request->user()->id)->firstOrFail();
        $path = $request->file('banner')->store('shops/banners', 'public');
        $shop->update(['banner' => asset('storage/' . $path)]);
        return response()->json(['shop' => $shop, 'message' => 'Banner uploaded.']);
    }
}
