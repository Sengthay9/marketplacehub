"use client";

import Image from "next/image";
import Link from "next/link";
import { Star, Store, MapPin, Phone, Mail, ArrowLeft, Package, Heart, Send } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import api from "@/lib/axios";
import type { Shop, Product } from "@/types";
import ProductCard from "@/features/products/ProductCard";
import { useAuthStore } from "@/store/auth.store";

interface ShopReview {
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
          className="transition"
        >
          <Star className={`w-6 h-6 transition-colors ${s <= (hover || value) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
        </button>
      ))}
    </div>
  );
}

export default function ShopDetailView({ slug }: { slug: string }) {
  const { isAuthenticated, user } = useAuthStore();
  const qc = useQueryClient();
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [showReviewForm, setShowReviewForm] = useState(false);

  const { data: shop, isLoading, isError } = useQuery({
    queryKey: ["shop", slug],
    queryFn: async () => {
      const res = await api.get(`/shops/${slug}`);
      return res.data.data as Shop;
    },
  });

  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ["shop-products", slug],
    queryFn: async () => {
      const res = await api.get(`/shops/${slug}/products`);
      return res.data as { data: Product[] };
    },
    enabled: !!shop,
  });

  const { data: reviews, isLoading: reviewsLoading } = useQuery({
    queryKey: ["shop-reviews", slug],
    queryFn: async () => {
      const res = await api.get(`/shops/${slug}/reviews`);
      return res.data.data as ShopReview[];
    },
    enabled: !!shop,
  });

  const { data: favData } = useQuery({
    queryKey: ["shop-favorites"],
    queryFn: async () => {
      const res = await api.get("/customer/shop-favorites");
      return res.data.shop_ids as number[];
    },
    enabled: isAuthenticated && user?.role === "customer",
  });

  const isFavorited = !!shop && (favData?.includes(shop.id) ?? false);

  const toggleFavorite = useMutation({
    mutationFn: async () => {
      if (!isAuthenticated) { window.location.href = "/login"; throw new Error(); }
      await api.post(`/customer/shops/${slug}/favorite`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shop-favorites"] });
      toast.success(isFavorited ? "Removed from favorites." : "Shop added to favorites.");
    },
  });

  const submitReview = useMutation({
    mutationFn: async () => {
      if (!isAuthenticated) { window.location.href = "/login"; throw new Error(); }
      if (reviewRating === 0) { toast.error("Please select a star rating."); throw new Error(); }
      await api.post(`/customer/shops/${slug}/reviews`, { rating: reviewRating, comment: reviewComment });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shop-reviews", slug] });
      qc.invalidateQueries({ queryKey: ["shop", slug] });
      setReviewRating(0);
      setReviewComment("");
      setShowReviewForm(false);
      toast.success("Review submitted!");
    },
    onError: (err: any) => {
      if (err?.response?.data?.message) toast.error(err.response.data.message);
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="h-48 bg-muted rounded-2xl animate-pulse mb-6" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-muted rounded-2xl aspect-square animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !shop) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <Store className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
        <h1 className="text-2xl font-bold mb-2">Shop Not Found</h1>
        <p className="text-muted-foreground mb-6">This shop doesn't exist or is no longer active.</p>
        <Link href="/shops" className="text-primary font-medium hover:underline flex items-center gap-2 justify-center">
          <ArrowLeft className="w-4 h-4" /> Browse all shops
        </Link>
      </div>
    );
  }

  const products = productsData?.data ?? [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Link href="/shops" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition">
        <ArrowLeft className="w-4 h-4" /> All Shops
      </Link>

      {/* Shop Header */}
      <div className="bg-card border rounded-2xl overflow-hidden mb-8">
        {/* Banner */}
        <div className="h-40 md:h-56 bg-gradient-to-r from-primary/20 via-blue-500/10 to-indigo-500/20 relative">
          {shop.banner && (
            <Image src={shop.banner} alt="" fill className="object-cover" unoptimized />
          )}
        </div>

        <div className="px-6 pb-6">
          {/* Logo + info row */}
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-10 mb-4">
            <div className="w-20 h-20 rounded-2xl border-4 border-background bg-card overflow-hidden shrink-0 shadow-lg">
              {shop.logo
                ? <Image src={shop.logo} alt={shop.name} width={80} height={80} className="object-cover" unoptimized />
                : <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                    <Store className="w-8 h-8 text-primary/50" />
                  </div>
              }
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-black">{shop.name}</h1>
                {/* Favorite button */}
                {isAuthenticated && user?.role === "customer" && (
                  <button
                    onClick={() => toggleFavorite.mutate()}
                    disabled={toggleFavorite.isPending}
                    title={isFavorited ? "Remove from favorites" : "Add to favorites"}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium transition ${
                      isFavorited
                        ? "bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100"
                        : "border-border text-muted-foreground hover:border-rose-300 hover:text-rose-500"
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${isFavorited ? "fill-rose-500 text-rose-500" : ""}`} />
                    {isFavorited ? "Favorited" : "Add to Favorites"}
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-semibold">{Number(shop.rating ?? 0).toFixed(1)}</span>
                  <span className="text-sm text-muted-foreground">({shop.review_count} reviews)</span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  shop.status === "approved" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                }`}>
                  {shop.status === "approved" ? "Verified Shop" : shop.status}
                </span>
              </div>
            </div>
          </div>

          {shop.description && (
            <p className="text-muted-foreground text-sm mb-4 max-w-2xl">{shop.description}</p>
          )}

          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            {shop.address && (
              <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" />{shop.address}</span>
            )}
            {shop.contact_number && (
              <span className="flex items-center gap-1.5"><Phone className="w-4 h-4" />{shop.contact_number}</span>
            )}
            {shop.email && (
              <span className="flex items-center gap-1.5"><Mail className="w-4 h-4" />{shop.email}</span>
            )}
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="mb-12">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Package className="w-5 h-5 text-primary" /> Products from this shop
        </h2>

        {productsLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-muted rounded-2xl aspect-square animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No products available yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>

      {/* Reviews */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
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
              placeholder="Share your experience with this shop (optional)"
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

        {/* Review list */}
        {reviewsLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-muted rounded-2xl animate-pulse" />)}
          </div>
        ) : !reviews?.length ? (
          <div className="text-center py-12 bg-muted/20 rounded-2xl border border-dashed">
            <Star className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">No reviews yet. Be the first to review this shop!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="bg-card border rounded-2xl p-5">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm shrink-0">
                    {review.user?.name?.[0]?.toUpperCase() ?? "?"}
                  </div>
                  <div className="flex-1 min-w-0">
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
                        <span className="font-medium text-foreground">Shop reply: </span>
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
