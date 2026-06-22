<?php

namespace App\Http\Controllers\Api\V1\Customer;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Product::with(['shop:id,name,slug,logo', 'category:id,name,slug', 'images'])
            ->where('status', 'published');

        // Search
        if ($search = $request->input('q')) {
            $query->where(fn ($q) => $q
                ->where('name', 'ilike', "%$search%")
                ->orWhere('description', 'ilike', "%$search%")
            );
        }

        // Filters
        if ($category = $request->input('category')) {
            $query->whereHas('category', fn ($q) => $q->where('slug', $category));
        }
        if ($shop = $request->input('shop')) {
            $query->whereHas('shop', fn ($q) => $q->where('slug', $shop));
        }
        if ($minPrice = $request->input('min_price')) {
            $query->where('price', '>=', $minPrice);
        }
        if ($maxPrice = $request->input('max_price')) {
            $query->where('price', '<=', $maxPrice);
        }
        if ($rating = $request->input('min_rating')) {
            $query->where('rating', '>=', $rating);
        }
        if ($request->boolean('featured')) {
            $query->where('is_featured', true);
        }

        // Sort
        match ($request->input('sort', 'latest')) {
            'price_asc'    => $query->orderBy('price'),
            'price_desc'   => $query->orderByDesc('price'),
            'rating'       => $query->orderByDesc('rating'),
            'popular'      => $query->orderByDesc('sold_count'),
            default        => $query->latest(),
        };

        $products = $query->paginate($request->integer('per_page', 20));

        return response()->json($products);
    }

    public function show(string $slug): JsonResponse
    {
        $product = Product::with([
            'shop:id,name,slug,logo,rating',
            'category:id,name,slug',
            'images',
            'variants',
            'reviews' => fn ($q) => $q->with('user:id,name,avatar')->latest()->limit(10),
        ])
        ->where('slug', $slug)
        ->where('status', 'published')
        ->firstOrFail();

        return response()->json(['product' => $product]);
    }
}
