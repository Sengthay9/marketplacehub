"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Star, Package, Heart, Share2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Product } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { useCart } from "@/hooks/useCart";
import { useAuthStore } from "@/store/auth.store";
import api from "@/lib/axios";

interface Props {
  product: Product;
}

function useWishlist() {
  const { isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: ["wishlist-ids"],
    queryFn: async () => {
      const res = await api.get("/customer/wishlist");
      return res.data.product_ids as number[];
    },
    enabled: isAuthenticated,
    staleTime: 1000 * 60,
  });
}

export default function ProductCard({ product }: Props) {
  const { addItem, isAddingItem } = useCart();
  const { isAuthenticated, user } = useAuthStore();
  const qc = useQueryClient();
  const image = product.images?.find((i) => i.is_primary) ?? product.images?.[0];

  const { data: wishlistIds } = useWishlist();
  const isWishlisted = wishlistIds?.includes(product.id) ?? false;

  const toggleWishlist = useMutation({
    mutationFn: async () => {
      if (!isAuthenticated) { window.location.href = "/login"; throw new Error(); }
      if (isWishlisted) {
        await api.delete(`/customer/wishlist/items/${product.id}`);
      } else {
        await api.post("/customer/wishlist/items", { product_id: product.id });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wishlist-ids"] });
      qc.invalidateQueries({ queryKey: ["wishlist"] });
      toast.success(isWishlisted ? "Removed from wishlist." : "Added to wishlist.");
    },
  });

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    const url = `${window.location.origin}/products/${product.slug}`;
    if (navigator.share) {
      await navigator.share({ title: product.name, url });
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    }
  };

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
            <img
              src={image.url}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                e.currentTarget.style.display = "none";
                e.currentTarget.nextElementSibling?.classList.remove("hidden");
              }}
            />
          ) : null}
          <div className={`w-full h-full flex items-center justify-center ${image ? "hidden" : ""}`}>
            <Package className="w-12 h-12 text-muted-foreground/30" />
          </div>
          {discount > 0 && (
            <span className="absolute top-2 left-2 bg-destructive text-white text-xs font-bold px-2 py-1 rounded-full">
              -{discount}%
            </span>
          )}
          {product.is_featured && (
            <span className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full">
              Featured
            </span>
          )}

          {/* Wishlist + Share — shown on hover */}
          <div className="absolute bottom-2 right-2 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => { e.preventDefault(); toggleWishlist.mutate(); }}
              disabled={toggleWishlist.isPending}
              title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
              className="p-1.5 bg-white/90 backdrop-blur rounded-full shadow hover:bg-white transition"
            >
              <Heart className={`w-4 h-4 transition-colors ${isWishlisted ? "fill-rose-500 text-rose-500" : "text-muted-foreground"}`} />
            </button>
            <button
              onClick={handleShare}
              title="Share product"
              className="p-1.5 bg-white/90 backdrop-blur rounded-full shadow hover:bg-white transition"
            >
              <Share2 className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {product.shop && (
            <p className="text-xs text-muted-foreground mb-1">{product.shop.name}</p>
          )}
          <h3 className="font-semibold text-sm leading-tight line-clamp-2 mb-2">{product.name}</h3>

          <div className="flex items-center gap-1 mb-2">
            <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
            <span className="text-xs font-medium">{product.rating.toFixed(1)}</span>
            <span className="text-xs text-muted-foreground">({product.review_count})</span>
          </div>

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
