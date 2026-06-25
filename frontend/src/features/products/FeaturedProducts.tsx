"use client";

import { useProducts } from "@/hooks/useProducts";
import ProductCard from "./ProductCard";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function FeaturedProducts() {
  // Popular products (most sold) — top 15
  const { data: popular, isLoading: loadingPopular } = useProducts({ per_page: 15, sort: "popular" });
  // New arrivals — top 15, deduped against popular
  const { data: latest,  isLoading: loadingLatest  } = useProducts({ per_page: 15, sort: "latest"  });

  const popularIds = new Set(popular?.data.map((p) => p.id) ?? []);
  const newArrivals = latest?.data.filter((p) => !popularIds.has(p.id)) ?? [];

  const combined = [...(popular?.data ?? []), ...newArrivals].slice(0, 30);
  const isLoading = loadingPopular || loadingLatest;

  return (
    <section className="max-w-7xl mx-auto px-4 py-16">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold">Featured Products</h2>
          <p className="text-muted-foreground text-sm mt-1">Top popular and new items from all shops</p>
        </div>
        <Link href="/products" className="text-primary text-sm font-medium hover:underline flex items-center gap-1">
          View all <ArrowRight className="inline w-3.5 h-3.5" />
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="bg-muted rounded-2xl aspect-square animate-pulse" />
          ))}
        </div>
      ) : combined.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p>No products available yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {combined.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}
