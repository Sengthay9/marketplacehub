"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Star, Package, Heart, Share2, Zap } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Product } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { useCart } from "@/hooks/useCart";
import { useAuthStore } from "@/store/auth.store";
import { useLangStore } from "@/store/lang.store";
import api from "@/lib/axios";

interface Props { product: Product }

function useWishlist() {
  const { isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: ["wishlist-ids"],
    queryFn: async () => {
      const res = await api.get("/customer/wishlist");
      return res.data.product_ids as number[];
    },
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
}

export default function ProductCard({ product }: Props) {
  const { addItem, isAddingItem }  = useCart();
  const { isAuthenticated, user }  = useAuthStore();
  const { lang }                   = useLangStore();
  const km = lang === "km";
  const qc = useQueryClient();
  const imageObj = product.images?.find((i) => i.is_primary) ?? product.images?.[0];
  const image = imageObj ? { ...imageObj, url: imageObj.image_url ?? imageObj.url } : null;

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
      toast.success(isWishlisted
        ? (km ? "បានដកចេញពី Wishlist" : "Removed from wishlist")
        : (km ? "បានបន្ថែមទៅ Wishlist" : "Added to wishlist"));
    },
  });

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    const url = `${window.location.origin}/products/${product.slug}`;
    if (navigator.share) {
      await navigator.share({ title: product.name, url });
    } else {
      await navigator.clipboard.writeText(url);
      toast.success(km ? "បានចម្លង Link!" : "Link copied!");
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

  const canBuy = user?.role === "customer" || !isAuthenticated;

  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <div className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300">

        {/* Image container */}
        <div className="relative aspect-square bg-muted overflow-hidden">
          {image ? (
            <img
              src={image.url}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={(e) => {
                e.currentTarget.style.display = "none";
                (e.currentTarget.nextElementSibling as HTMLElement)?.classList.remove("hidden");
              }}
            />
          ) : null}
          <div className={`w-full h-full absolute inset-0 flex items-center justify-center ${image ? "hidden" : ""}`}>
            <Package className="w-14 h-14 text-muted-foreground/25" />
          </div>

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1.5">
            {discount > 0 && (
              <span className="bg-[#FF6B00] text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow">
                -{discount}%
              </span>
            )}
            {product.is_featured && (
              <span className="bg-[#0D47A1] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow flex items-center gap-1">
                <Zap className="w-2.5 h-2.5" />
                {km ? "ពិសេស" : "Featured"}
              </span>
            )}
          </div>

          {/* Out of stock overlay */}
          {!product.is_in_stock && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="bg-white/90 text-gray-800 text-xs font-bold px-3 py-1.5 rounded-full">
                {km ? "អស់ស្ដុក" : "Out of Stock"}
              </span>
            </div>
          )}

          {/* Wishlist + Share on hover */}
          <div className="absolute top-2 right-2 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-200">
            <button
              onClick={(e) => { e.preventDefault(); toggleWishlist.mutate(); }}
              disabled={toggleWishlist.isPending}
              className="w-8 h-8 bg-white/90 dark:bg-gray-800/90 backdrop-blur rounded-full shadow flex items-center justify-center hover:scale-110 transition-transform"
              title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
            >
              <Heart className={`w-4 h-4 transition-colors ${isWishlisted ? "fill-rose-500 text-rose-500" : "text-gray-500"}`} />
            </button>
            <button
              onClick={handleShare}
              className="w-8 h-8 bg-white/90 dark:bg-gray-800/90 backdrop-blur rounded-full shadow flex items-center justify-center hover:scale-110 transition-transform"
              title="Share product"
            >
              <Share2 className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {/* Quick add — appears on hover at bottom */}
          {canBuy && product.is_in_stock && (
            <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-200">
              <button
                onClick={handleAddToCart}
                disabled={isAddingItem}
                className="w-full py-2.5 bg-[#0D47A1] hover:bg-[#1565C0] text-white text-xs font-bold flex items-center justify-center gap-2 transition disabled:opacity-60"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                {km ? "បន្ថែមក្នុងរទេះ" : "Add to Cart"}
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-3.5">
          {product.shop && (
            <p className="text-[11px] text-muted-foreground mb-1 font-medium truncate">{product.shop.name}</p>
          )}
          <h3 className="font-semibold text-sm leading-tight line-clamp-2 mb-2 group-hover:text-[#0D47A1] dark:group-hover:text-blue-400 transition-colors">
            {product.name}
          </h3>

          {/* Rating */}
          <div className="flex items-center gap-1 mb-2.5">
            <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400 shrink-0" />
            <span className="text-xs font-semibold">{product.rating.toFixed(1)}</span>
            <span className="text-xs text-muted-foreground">({product.review_count})</span>
          </div>

          {/* Price + Cart button */}
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <span className="price text-base font-black text-[#0D47A1] dark:text-blue-400">
                {formatCurrency(product.effective_price)}
              </span>
              {product.discount_price && (
                <span className="price text-xs text-muted-foreground line-through ml-1.5">
                  {formatCurrency(product.price)}
                </span>
              )}
            </div>

            {canBuy && (
              <button
                onClick={handleAddToCart}
                disabled={isAddingItem || !product.is_in_stock}
                className="shrink-0 w-8 h-8 bg-[#0D47A1]/8 dark:bg-[#0D47A1]/20 text-[#0D47A1] dark:text-blue-400 rounded-xl hover:bg-[#0D47A1] hover:text-white dark:hover:bg-[#1565C0] transition-all disabled:opacity-40"
                title={km ? "បន្ថែមក្នុងរទេះ" : "Add to cart"}
              >
                <ShoppingCart className="w-4 h-4 mx-auto" />
              </button>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
