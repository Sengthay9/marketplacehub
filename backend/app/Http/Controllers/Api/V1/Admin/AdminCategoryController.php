<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class AdminCategoryController extends Controller
{
    public function index(): JsonResponse
    {
        $cats = Category::with('children')->whereNull('parent_id')->orderBy('sort_order')->get();
        $cats->each(fn ($c) => $c->image_url = $c->image ? Storage::disk('public')->url($c->image) : null);
        return response()->json(['data' => $cats]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'       => 'required|string|max:100',
            'parent_id'  => 'nullable|exists:categories,id',
            'icon'       => 'nullable|string|max:10',
            'is_active'  => 'boolean',
            'sort_order' => 'integer',
            'image'      => 'nullable|image|max:2048',
        ]);

        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image')->store('categories', 'public');
        } else {
            unset($data['image']);
        }

        $data['is_active'] ??= true;
        $cat = Category::create($data);
        $cat->image_url = $cat->image ? Storage::disk('public')->url($cat->image) : null;

        return response()->json(['category' => $cat], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $cat  = Category::findOrFail($id);
        $data = $request->validate([
            'name'       => 'sometimes|string|max:100',
            'icon'       => 'nullable|string|max:10',
            'is_active'  => 'boolean',
            'sort_order' => 'integer',
            'image'      => 'nullable|image|max:2048',
        ]);

        if ($request->hasFile('image')) {
            if ($cat->image) Storage::disk('public')->delete($cat->image);
            $data['image'] = $request->file('image')->store('categories', 'public');
        } else {
            unset($data['image']);
        }

        $cat->update($data);
        $cat->image_url = $cat->image ? Storage::disk('public')->url($cat->image) : null;

        return response()->json(['category' => $cat]);
    }

    public function destroy(int $id): JsonResponse
    {
        $cat = Category::findOrFail($id);
        if ($cat->image) Storage::disk('public')->delete($cat->image);
        $cat->delete();
        return response()->json(['message' => 'Category deleted.']);
    }
}
