"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Star, ShoppingCart, Heart, Minus, Plus, Share2, Send, MessageSquare } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBoxOpen } from "@fortawesome/free-solid-svg-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useProduct } from "@/hooks/useProducts";
import { useCart } from "@/hooks/useCart";
import { useAuthStore } from "@/store/auth.store";
import { formatCurrency } from "@/lib/utils";
import type { ProductVariant } from "@/types";
import api from "@/lib/axios";

interface Review {
  id: number;
  rating: number;
  comment: string | null;
  vendor_reply: string | null;
  created_at: string;
  user: { id: number; name: string; avatar: string | null };
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
        >
          <Star className={`w-6 h-6 transition-colors ${s <= (hover || value) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
        </button>
      ))}
    </div>
  );
}

export default function ProductDetailView({ slug }: { slug: string }) {
  const { data: product, isLoading } = useProduct(slug);
  const { addItem, isAddingItem } = useCart();
  const { isAuthenticated, user } = useAuthStore();
  const qc = useQueryClient();
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");

  // Wishlist
  const { data: wishlistIds } = useQuery({
    queryKey: ["wishlist-ids"],
    queryFn: async () => {
      const res = await api.get("/customer/wishlist");
      return res.data.product_ids as number[];
    },
    enabled: isAuthenticated,
  });
  const isWishlisted = product ? (wishlistIds?.includes(product.id) ?? false) : false;

  const toggleWishlist = useMutation({
    mutationFn: async () => {
      if (!isAuthenticated) { window.location.href = "/login"; throw new Error(); }
      if (isWishlisted) {
        await api.delete(`/customer/wishlist/items/${product!.id}`);
      } else {
        await api.post("/customer/wishlist/items", { product_id: product!.id });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wishlist-ids"] });
      qc.invalidateQueries({ queryKey: ["wishlist"] });
      toast.success(isWishlisted ? "Removed from wishlist." : "Added to wishlist.");
    },
  });

  // Reviews
  const { data: reviews, isLoading: reviewsLoading } = useQuery({
    queryKey: ["product-reviews", product?.id],
    queryFn: async () => {
      const res = await api.get("/reviews", { params: { product_id: product!.id } });
      return res.data.data as Review[];
    },
    enabled: !!product,
  });

  const submitReview = useMutation({
    mutationFn: async () => {
      if (!isAuthenticated) { window.location.href = "/login"; throw new Error(); }
      if (reviewRating === 0) { toast.error("Please select a star rating."); throw new Error(); }
      await api.post("/customer/reviews", { product_id: product!.id, rating: reviewRating, comment: reviewComment, order_id: null });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["product-reviews", product?.id] });
      qc.invalidateQueries({ queryKey: ["product", slug] });
      setReviewRating(0);
      setReviewComment("");
      setShowReviewForm(false);
      toast.success("Review submitted!");
    },
    onError: (err: any) => {
      if (err?.response?.data?.message) toast.error(err.response.data.message);
    },
  });

  const handleShare = async () => {
    const url = `${window.location.origin}/products/${slug}`;
    if (navigator.share) {
      await navigator.share({ title: product?.name, url });
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    }
  };

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
          <div className="aspect-square bg-muted rounded-2xl overflow-hidden relative">
            {primaryImage ? (
              <Image src={primaryImage.url} alt={product.name} fill className="object-cover" unoptimized />
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
                  <Image src={img.url} alt="" width={64} height={64} className="object-cover" unoptimized />
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
            <button
              onClick={() => toggleWishlist.mutate()}
              disabled={toggleWishlist.isPending}
              title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
              className={`p-3 border rounded-xl hover:bg-muted transition ${isWishlisted ? "border-rose-300 text-rose-500 bg-rose-50" : ""}`}
            >
              <Heart className={`w-5 h-5 ${isWishlisted ? "fill-rose-500 text-rose-500" : ""}`} />
            </button>
            <button onClick={handleShare} className="p-3 border rounded-xl hover:bg-muted">
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
      <div className="mt-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            Customer Reviews
            {reviews && reviews.length > 0 && (
              <span className="text-base font-normal text-muted-foreground">({reviews.length})</span>
            )}
          </h2>
          {isAuthenticated && user?.role === "customer" && !showReviewForm && (
            <button
              onClick={() => setShowReviewForm(true)}
              className="text-sm px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition"
            >
              Write a Review
            </button>
          )}
        </div>

        {/* Rating summary */}
        {product.review_count > 0 && (
          <div className="flex items-center gap-4 bg-muted/30 rounded-2xl p-4 mb-6">
            <div className="text-center">
              <div className="text-4xl font-black text-foreground">{product.rating.toFixed(1)}</div>
              <div className="flex justify-center mt-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className={`w-3.5 h-3.5 ${s <= Math.round(product.rating) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`} />
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{product.review_count} reviews</p>
            </div>
          </div>
        )}

        {/* Review form */}
        {showReviewForm && (
          <div className="bg-card border rounded-2xl p-5 mb-6">
            <h3 className="font-semibold mb-3">Your Review</h3>
            <div className="mb-3">
              <p className="text-sm text-muted-foreground mb-2">Rating</p>
              <StarPicker value={reviewRating} onChange={setReviewRating} />
            </div>
            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Share your experience with this product (optional)"
              rows={3}
              className="w-full border rounded-xl px-4 py-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none mb-3"
            />
            <div className="flex gap-3">
              <button
                onClick={() => submitReview.mutate()}
                disabled={submitReview.isPending || reviewRating === 0}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {submitReview.isPending ? "Submitting…" : "Submit Review"}
              </button>
              <button
                onClick={() => { setShowReviewForm(false); setReviewRating(0); setReviewComment(""); }}
                className="px-5 py-2.5 bg-muted rounded-xl text-sm font-medium hover:bg-muted/80"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {reviewsLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-muted rounded-2xl animate-pulse" />)}
          </div>
        ) : !reviews?.length ? (
          <div className="text-center py-12 bg-muted/20 rounded-2xl border border-dashed">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">No reviews yet. Be the first to review this product!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="bg-card border rounded-2xl p-5">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm shrink-0">
                    {review.user?.name?.[0]?.toUpperCase() ?? "?"}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">{review.user?.name}</span>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className={`w-3.5 h-3.5 ${s <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`} />
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(review.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-muted-foreground mt-1.5">{review.comment}</p>
                    )}
                    {review.vendor_reply && (
                      <div className="mt-3 pl-3 border-l-2 border-primary/30 text-sm">
                        <span className="font-medium text-foreground">Seller reply: </span>
                        <span className="text-muted-foreground">{review.vendor_reply}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
