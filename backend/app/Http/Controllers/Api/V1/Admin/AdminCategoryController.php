<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminCategoryController extends Controller
{
    public function index(): JsonResponse
    {
        $cats = Category::with('children')->whereNull('parent_id')->orderBy('sort_order')->get();
        return response()->json(['data' => $cats]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'      => 'required|string|max:100',
            'parent_id' => 'nullable|exists:categories,id',
            'icon'      => 'nullable|string|max:10',
            'is_active' => 'boolean',
            'sort_order'=> 'integer',
        ]);
        $cat = Category::create($data);
        return response()->json(['category' => $cat], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $cat  = Category::findOrFail($id);
        $data = $request->validate([
            'name'      => 'sometimes|string|max:100',
            'icon'      => 'nullable|string|max:10',
            'is_active' => 'boolean',
            'sort_order'=> 'integer',
        ]);
        $cat->update($data);
        return response()->json(['category' => $cat]);
    }

    public function destroy(int $id): JsonResponse
    {
        Category::findOrFail($id)->delete();
        return response()->json(['message' => 'Category deleted.']);
    }
}
