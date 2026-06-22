<?php

namespace App\Http\Controllers\Api\V1\Customer;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function index(): JsonResponse
    {
        $categories = Category::whereNull('parent_id')
            ->where('is_active', true)
            ->with('children')
            ->orderBy('sort_order')
            ->get();

        return response()->json(['data' => $categories]);
    }

    public function show(string $slug): JsonResponse
    {
        $category = Category::where('slug', $slug)
            ->where('is_active', true)
            ->with('children')
            ->firstOrFail();

        return response()->json(['category' => $category]);
    }

    public function products(string $slug, Request $request): JsonResponse
    {
        $category = Category::where('slug', $slug)->where('is_active', true)->firstOrFail();

        $query = Product::with(['shop:id,name,slug,logo', 'category:id,name,slug', 'images'])
            ->where('status', 'published')
            ->where('category_id', $category->id);

        if ($search = $request->input('q')) {
            $query->where(fn ($q) => $q
                ->where('name', 'ilike', "%$search%")
                ->orWhere('description', 'ilike', "%$search%")
            );
        }

        match ($request->input('sort', 'latest')) {
            'price_asc'  => $query->orderBy('price'),
            'price_desc' => $query->orderByDesc('price'),
            'rating'     => $query->orderByDesc('rating'),
            'popular'    => $query->orderByDesc('sold_count'),
            default      => $query->latest(),
        };

        $products = $query->paginate($request->integer('per_page', 20));

        return response()->json([
            'category' => $category,
            'products' => $products,
        ]);
    }
}
