"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Star, ShoppingCart, Heart, Minus, Plus, Share2 } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBoxOpen } from "@fortawesome/free-solid-svg-icons";
import { useProduct } from "@/hooks/useProducts";
import { useCart } from "@/hooks/useCart";
import { formatCurrency } from "@/lib/utils";
import type { ProductVariant } from "@/types";

export default function ProductDetailView({ slug }: { slug: string }) {
  const { data: product, isLoading } = useProduct(slug);
  const { addItem, isAddingItem } = useCart();
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);

  if (isLoading) {
    return (
      <div className="grid md:grid-cols-2 gap-10 animate-pulse">
        <div className="aspect-square bg-muted rounded-2xl" />
        <div className="space-y-4">
          <div className="h-8 bg-muted rounded w-3/4" />
          <div className="h-6 bg-muted rounded w-1/4" />
          <div className="h-24 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!product) return <div className="text-center py-20">Product not found</div>;

  const primaryImage = product.images?.[activeImage];
  const effectivePrice = selectedVariant?.effective_price ?? product.effective_price;
  const originalPrice  = selectedVariant?.price ?? product.price;
  const discount = originalPrice > effectivePrice
    ? Math.round(((originalPrice - effectivePrice) / originalPrice) * 100)
    : 0;

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <span>/</span>
        {product.category && (
          <>
            <Link href={`/categories/${product.category.slug}`} className="hover:text-foreground">
              {product.category.name}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="text-foreground font-medium truncate max-w-40">{product.name}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-10">
        {/* Images */}
        <div className="space-y-3">
          <div className="aspect-square bg-muted rounded-2xl overflow-hidden">
            {primaryImage ? (
              <Image src={primaryImage.url} alt={product.name} fill className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <FontAwesomeIcon icon={faBoxOpen} className="w-24 h-24 text-muted-foreground/20" />
              </div>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {product.images.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setActiveImage(i)}
                  className={`w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition ${
                    i === activeImage ? "border-primary" : "border-transparent"
                  }`}
                >
                  <Image src={img.url} alt="" width={64} height={64} className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          {product.shop && (
            <Link href={`/shops/${product.shop.slug}`} className="text-sm text-primary font-medium hover:underline">
              {product.shop.name}
            </Link>
          )}
          <h1 className="text-2xl font-bold mt-1 mb-2">{product.name}</h1>

          {/* Rating */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className={`w-4 h-4 ${s <= Math.round(product.rating) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
              ))}
            </div>
            <span className="font-medium text-sm">{product.rating.toFixed(1)}</span>
            <span className="text-muted-foreground text-sm">({product.review_count} reviews)</span>
            <span className="text-muted-foreground text-sm">· {product.sold_count} sold</span>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3 mb-6">
            <span className="text-3xl font-black text-primary">{formatCurrency(effectivePrice)}</span>
            {discount > 0 && (
              <>
                <span className="text-lg text-muted-foreground line-through">{formatCurrency(originalPrice)}</span>
                <span className="bg-destructive/10 text-destructive text-sm font-bold px-2 py-0.5 rounded-full">-{discount}%</span>
              </>
            )}
          </div>

          {/* Variants */}
          {product.variants.length > 0 && (
            <div className="mb-6">
              <p className="text-sm font-medium mb-2">Options</p>
              <div className="flex flex-wrap gap-2">
                {product.variants.filter((v) => v.is_active).map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariant(v)}
                    className={`px-3 py-1.5 rounded-lg border text-sm transition ${
                      selectedVariant?.id === v.id
                        ? "border-primary bg-primary/10 font-medium"
                        : "hover:border-primary"
                    } ${v.stock_quantity === 0 ? "opacity-40 cursor-not-allowed" : ""}`}
                    disabled={v.stock_quantity === 0}
                  >
                    {v.attribute_label}
                    {v.stock_quantity === 0 && " (sold out)"}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="flex items-center gap-4 mb-6">
            <p className="text-sm font-medium">Quantity</p>
            <div className="flex items-center border rounded-xl overflow-hidden">
              <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="px-4 py-2 hover:bg-muted">
                <Minus className="w-4 h-4" />
              </button>
              <span className="px-4 py-2 font-medium min-w-[3rem] text-center">{quantity}</span>
              <button onClick={() => setQuantity((q) => q + 1)} className="px-4 py-2 hover:bg-muted">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <span className="text-sm text-muted-foreground">
              {product.stock_quantity} available
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => addItem({ productId: product.id, variantId: selectedVariant?.id, quantity })}
              disabled={isAddingItem || product.stock_quantity === 0}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition disabled:opacity-50"
            >
              <ShoppingCart className="w-5 h-5" />
              {product.stock_quantity === 0 ? "Out of Stock" : isAddingItem ? "Adding…" : "Add to Cart"}
            </button>
            <button className="p-3 border rounded-xl hover:bg-muted">
              <Heart className="w-5 h-5" />
            </button>
            <button className="p-3 border rounded-xl hover:bg-muted">
              <Share2 className="w-5 h-5" />
            </button>
          </div>

          {/* Description */}
          {product.description && (
            <div className="mt-8 prose prose-sm max-w-none">
              <h3 className="font-bold mb-2">Description</h3>
              <p className="text-muted-foreground leading-relaxed">{product.description}</p>
            </div>
          )}
        </div>
      </div>

      {/* Reviews */}
      {product.reviews && product.reviews.length > 0 && (
        <div className="mt-16">
          <h2 className="text-xl font-bold mb-6">Customer Reviews</h2>
          <div className="space-y-4">
            {product.reviews.map((review) => (
              <div key={review.id} className="bg-card border rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center font-bold text-primary text-sm">
                    {review.user?.name?.[0] ?? "?"}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{review.user?.name}</p>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={`w-3 h-3 ${s <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
                      ))}
                    </div>
                  </div>
                </div>
                {review.comment && <p className="text-sm text-muted-foreground">{review.comment}</p>}
                {review.vendor_reply && (
                  <div className="mt-3 pl-4 border-l-2 border-primary/30 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Vendor reply: </span>
                    {review.vendor_reply}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
