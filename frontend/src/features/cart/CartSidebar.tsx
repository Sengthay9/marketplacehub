"use client";

import { X, ShoppingCart, Trash2, Plus, Minus, ArrowRight, Package } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/store/cart.store";
import { useCart } from "@/hooks/useCart";
import { formatCurrency } from "@/lib/utils";

export default function CartSidebar() {
  const { isOpen, closeCart, cart } = useCartStore();
  const { updateItem, removeItem } = useCart();

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
        onClick={closeCart}
      />

      {/* Sidebar */}
      <div className="fixed top-0 right-0 h-full w-full max-w-sm bg-background border-l shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            <h2 className="font-bold text-lg">Your Cart</h2>
            {cart && cart.item_count > 0 && (
              <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">
                {cart.item_count}
              </span>
            )}
          </div>
          <button onClick={closeCart} className="p-2 hover:bg-muted rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {!cart || cart.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <ShoppingCart className="w-16 h-16 text-muted-foreground/30 mb-4" />
              <p className="font-medium text-muted-foreground">Your cart is empty</p>
              <p className="text-sm text-muted-foreground mt-1">Add items to get started</p>
              <button onClick={closeCart} className="mt-4 text-primary text-sm font-medium hover:underline">
                Continue shopping <ArrowRight className="inline w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            cart.items.map((item) => {
              const image = item.product?.images?.find((i) => i.is_primary) ?? item.product?.images?.[0];
              return (
                <div key={item.id} className="flex gap-3 bg-muted/40 rounded-xl p-3">
                  {/* Image */}
                  <div className="w-16 h-16 bg-muted rounded-lg overflow-hidden shrink-0">
                    {image
                      ? <Image src={image.url} alt={item.product?.name ?? ""} width={64} height={64} className="object-cover w-full h-full" unoptimized />
                      : <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-6 h-6 text-muted-foreground/30" />
                        </div>
                    }
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm line-clamp-1">{item.product?.name}</p>
                    {item.variant && (
                      <p className="text-xs text-muted-foreground">{item.variant.attribute_label}</p>
                    )}
                    <p className="text-primary font-bold text-sm mt-1">{formatCurrency(item.subtotal)}</p>

                    {/* Qty controls */}
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => updateItem({ itemId: item.id, quantity: item.quantity - 1 })}
                        className="w-6 h-6 rounded-full border flex items-center justify-center hover:bg-muted"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateItem({ itemId: item.id, quantity: item.quantity + 1 })}
                        className="w-6 h-6 rounded-full border flex items-center justify-center hover:bg-muted"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="ml-auto text-destructive hover:bg-destructive/10 p-1 rounded-full"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {cart && cart.items.length > 0 && (
          <div className="border-t p-4 space-y-3">
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span className="text-primary">{formatCurrency(cart.total)}</span>
            </div>
            <Link
              href="/checkout"
              onClick={closeCart}
              className="block w-full py-3 bg-primary text-white text-center font-semibold rounded-xl hover:bg-primary/90 transition"
            >
              Proceed to Checkout
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
