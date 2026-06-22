<?php

namespace App\Http\Controllers\Api\V1\Customer;

use App\Http\Controllers\Controller;
use App\Services\Cart\CartService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CartController extends Controller
{
    public function __construct(private readonly CartService $cartService) {}

    public function show(Request $request): JsonResponse
    {
        $cart = $this->cartService->getCart($request->user()->id);
        return response()->json(['cart' => $cart]);
    }

    public function addItem(Request $request): JsonResponse
    {
        $request->validate([
            'product_id' => 'required|integer|exists:products,id',
            'variant_id' => 'nullable|integer|exists:product_variants,id',
            'quantity'   => 'nullable|integer|min:1|max:99',
        ]);

        $cart = $this->cartService->addItem($request->user()->id, $request->only(['product_id', 'variant_id', 'quantity']));
        return response()->json(['cart' => $cart, 'message' => 'Item added to cart.'], 201);
    }

    public function updateItem(Request $request, int $id): JsonResponse
    {
        $request->validate(['quantity' => 'required|integer|min:0|max:99']);
        $cart = $this->cartService->updateItem($request->user()->id, $id, $request->integer('quantity'));
        return response()->json(['cart' => $cart]);
    }

    public function removeItem(Request $request, int $id): JsonResponse
    {
        $cart = $this->cartService->removeItem($request->user()->id, $id);
        return response()->json(['cart' => $cart, 'message' => 'Item removed.']);
    }

    public function clear(Request $request): JsonResponse
    {
        $this->cartService->clearCart($request->user()->id);
        return response()->json(['message' => 'Cart cleared.']);
    }
}
