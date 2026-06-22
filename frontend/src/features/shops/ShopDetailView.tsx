"use client";

import Image from "next/image";
import Link from "next/link";
import { Star, Store, MapPin, Phone, Mail, ArrowLeft, Package } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import type { Shop, Product } from "@/types";
import ProductCard from "@/features/products/ProductCard";

export default function ShopDetailView({ slug }: { slug: string }) {
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
            <Image src={shop.banner} alt="" fill className="object-cover" />
          )}
        </div>

        <div className="px-6 pb-6">
          {/* Logo + info row */}
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-10 mb-4">
            <div className="w-20 h-20 rounded-2xl border-4 border-background bg-card overflow-hidden shrink-0 shadow-lg">
              {shop.logo
                ? <Image src={shop.logo} alt={shop.name} width={80} height={80} className="object-cover" />
                : <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                    <Store className="w-8 h-8 text-primary/50" />
                  </div>
              }
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-black">{shop.name}</h1>
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
      <div>
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
    </div>
  );
}
