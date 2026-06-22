"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, Package, Store, ShoppingCart, Trash2, ArrowLeft } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/axios";
import { formatCurrency } from "@/lib/utils";
import ProductCard from "@/features/products/ProductCard";

type Tab = "products" | "shops";

export default function WishlistView() {
  const [tab, setTab] = useState<Tab>("products");
  const qc = useQueryClient();

  const { data: wishlist, isLoading: wLoading } = useQuery({
    queryKey: ["wishlist"],
    queryFn: async () => {
      const res = await api.get("/customer/wishlist");
      return res.data as { items: any[]; product_ids: number[] };
    },
  });

  const { data: shopFavs, isLoading: sLoading } = useQuery({
    queryKey: ["shop-favorites"],
    queryFn: async () => {
      const res = await api.get("/customer/shop-favorites");
      return res.data.shops as any[];
    },
  });

  const removeProduct = useMutation({
    mutationFn: async (productId: number) => {
      await api.delete(`/customer/wishlist/items/${productId}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wishlist"] });
      qc.invalidateQueries({ queryKey: ["wishlist-ids"] });
      toast.success("Removed from wishlist.");
    },
  });

  const removeShop = useMutation({
    mutationFn: async (slug: string) => {
      await api.post(`/customer/shops/${slug}/favorite`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shop-favorites"] });
      toast.success("Shop removed from favorites.");
    },
  });

  const products = wishlist?.items?.map((item: any) => item.product).filter(Boolean) ?? [];
  const shops = shopFavs ?? [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition">
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <Heart className="w-6 h-6 text-rose-500 fill-rose-500" />
        <h1 className="text-2xl font-bold">My Favorites</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b mb-8">
        {([
          { key: "products", label: `Products (${products.length})`, icon: Package },
          { key: "shops",    label: `Shops (${shops.length})`,    icon: Store },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition -mb-px ${
              tab === key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      {/* Products tab */}
      {tab === "products" && (
        <>
          {wLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-muted rounded-2xl aspect-square animate-pulse" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="font-medium mb-2">No favorite products yet</p>
              <p className="text-sm mb-6">Heart products while browsing to save them here.</p>
              <Link href="/products" className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90">
                Browse Products
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {products.map((product: any) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Shops tab */}
      {tab === "shops" && (
        <>
          {sLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-28 bg-muted rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : shops.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <Store className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="font-medium mb-2">No favorite shops yet</p>
              <p className="text-sm mb-6">Add shops to favorites while visiting them.</p>
              <Link href="/shops" className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90">
                Browse Shops
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {shops.map((shop: any) => (
                <div key={shop.id} className="bg-card border rounded-2xl p-4 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-muted shrink-0 flex items-center justify-center">
                    {shop.logo
                      ? <Image src={shop.logo} alt={shop.name} width={56} height={56} className="object-cover" unoptimized />
                      : <Store className="w-6 h-6 text-muted-foreground" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link href={`/shops/${shop.slug}`} className="font-semibold text-sm hover:text-primary transition truncate block">
                      {shop.name}
                    </Link>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-xs text-yellow-500">★</span>
                      <span className="text-xs font-medium">{Number(shop.rating ?? 0).toFixed(1)}</span>
                      <span className="text-xs text-muted-foreground">({shop.review_count} reviews)</span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeShop.mutate(shop.slug)}
                    disabled={removeShop.isPending}
                    title="Remove from favorites"
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-50 transition shrink-0"
                  >
                    <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
