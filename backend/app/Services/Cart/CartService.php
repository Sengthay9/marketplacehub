<?php

namespace App\Services\Cart;

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Validation\ValidationException;

class CartService
{
    public function getCart(int $userId): Cart
    {
        return Cart::firstOrCreate(['user_id' => $userId])
            ->load(['items.product.images', 'items.variant']);
    }

    public function addItem(int $userId, array $data): Cart
    {
        $product = Product::findOrFail($data['product_id']);
        $variant = isset($data['variant_id'])
            ? ProductVariant::findOrFail($data['variant_id'])
            : null;

        if ($product->status !== 'published') {
            throw ValidationException::withMessages(['product' => 'Product is not available.']);
        }

        $qty = $data['quantity'] ?? 1;
        $stock = $variant ? $variant->stock_quantity : $product->stock_quantity;

        if ($stock < $qty) {
            throw ValidationException::withMessages(['quantity' => 'Insufficient stock.']);
        }

        $price = $variant
            ? ($variant->discount_price ?? $variant->price ?? $product->effective_price)
            : $product->effective_price;

        $cart = Cart::firstOrCreate(['user_id' => $userId]);

        $existing = CartItem::where([
            'cart_id'    => $cart->id,
            'product_id' => $product->id,
            'variant_id' => $variant?->id,
        ])->first();

        if ($existing) {
            $newQty = $existing->quantity + $qty;
            if ($stock < $newQty) {
                throw ValidationException::withMessages(['quantity' => 'Insufficient stock.']);
            }
            $existing->update(['quantity' => $newQty]);
        } else {
            CartItem::create([
                'cart_id'    => $cart->id,
                'product_id' => $product->id,
                'variant_id' => $variant?->id,
                'quantity'   => $qty,
                'unit_price' => $price,
            ]);
        }

        return $this->getCart($userId);
    }

    public function updateItem(int $userId, int $itemId, int $quantity): Cart
    {
        $cart = Cart::where('user_id', $userId)->firstOrFail();
        $item = CartItem::where(['id' => $itemId, 'cart_id' => $cart->id])->firstOrFail();

        if ($quantity <= 0) {
            $item->delete();
        } else {
            $stock = $item->variant
                ? $item->variant->stock_quantity
                : $item->product->stock_quantity;

            if ($stock < $quantity) {
                throw ValidationException::withMessages(['quantity' => 'Insufficient stock.']);
            }

            $item->update(['quantity' => $quantity]);
        }

        return $this->getCart($userId);
    }

    public function removeItem(int $userId, int $itemId): Cart
    {
        $cart = Cart::where('user_id', $userId)->firstOrFail();
        CartItem::where(['id' => $itemId, 'cart_id' => $cart->id])->delete();
        return $this->getCart($userId);
    }

    public function clearCart(int $userId): void
    {
        $cart = Cart::where('user_id', $userId)->first();
        $cart?->items()->delete();
    }
}
