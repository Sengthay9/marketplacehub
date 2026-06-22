"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Star, Package } from "lucide-react";
import type { Product } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { useCart } from "@/hooks/useCart";
import { useAuthStore } from "@/store/auth.store";

interface Props {
  product: Product;
}

export default function ProductCard({ product }: Props) {
  const { addItem, isAddingItem } = useCart();
  const { isAuthenticated, user } = useAuthStore();
  const image = product.images?.find((i) => i.is_primary) ?? product.images?.[0];

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) { window.location.href = "/login"; return; }
    addItem({ productId: product.id });
  };

  const discount = product.discount_price
    ? Math.round(((product.price - product.discount_price) / product.price) * 100)
    : 0;

  return (
    <Link href={`/products/${product.slug}`} className="group">
      <div className="bg-card border rounded-2xl overflow-hidden hover:shadow-lg transition-shadow duration-300">
        {/* Image */}
        <div className="relative aspect-square bg-muted overflow-hidden">
          {image ? (
            <Image
              src={image.url}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 50vw, 25vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-12 h-12 text-muted-foreground/30" />
            </div>
          )}
          {discount > 0 && (
            <span className="absolute top-2 left-2 bg-destructive text-white text-xs font-bold px-2 py-1 rounded-full">
              -{discount}%
            </span>
          )}
          {product.is_featured && (
            <span className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full">
              ⭐ Featured
            </span>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          {product.shop && (
            <p className="text-xs text-muted-foreground mb-1">{product.shop.name}</p>
          )}
          <h3 className="font-semibold text-sm leading-tight line-clamp-2 mb-2">{product.name}</h3>

          {/* Rating */}
          <div className="flex items-center gap-1 mb-2">
            <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
            <span className="text-xs font-medium">{product.rating.toFixed(1)}</span>
            <span className="text-xs text-muted-foreground">({product.review_count})</span>
          </div>

          {/* Price & Add to Cart */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-base font-bold text-primary">
                {formatCurrency(product.effective_price)}
              </span>
              {product.discount_price && (
                <span className="text-xs text-muted-foreground line-through ml-1">
                  {formatCurrency(product.price)}
                </span>
              )}
            </div>
            {user?.role === "customer" || !isAuthenticated ? (
              <button
                onClick={handleAddToCart}
                disabled={isAddingItem || !product.is_in_stock}
                className="p-2 bg-primary/10 text-primary rounded-full hover:bg-primary hover:text-white transition disabled:opacity-40"
                title="Add to cart"
              >
                <ShoppingCart className="w-4 h-4" />
              </button>
            ) : null}
          </div>

          {product.stock_quantity === 0 && (
            <p className="text-xs text-destructive mt-1 font-medium">Out of stock</p>
          )}
        </div>
      </div>
    </Link>
  );
}
