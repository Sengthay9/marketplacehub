"use client";

import { use, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Package } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ProductCard from "@/features/products/ProductCard";
import { useProducts } from "@/hooks/useProducts";
import api from "@/lib/axios";
import type { Category } from "@/types";

const SORT_OPTIONS = [
  { value: "latest",     label: "Newest" },
  { value: "popular",    label: "Most Popular" },
  { value: "rating",     label: "Top Rated" },
  { value: "price_asc",  label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
];

export default function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [sort, setSort] = useState("latest");
  const [page, setPage] = useState(1);

  const { data: categoryData } = useQuery({
    queryKey: ["category", slug],
    queryFn: async () => {
      const res = await api.get(`/categories/${slug}`);
      return res.data.category as Category;
    },
    enabled: Boolean(slug),
  });

  const { data, isLoading } = useProducts({ category: slug, sort: sort as any, page, per_page: 20 });

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="text-sm text-muted-foreground mb-6 flex items-center gap-2">
          <Link href="/" className="hover:text-foreground">Home</Link>
          <span>/</span>
          <Link href="/categories" className="hover:text-foreground">Categories</Link>
          <span>/</span>
          <span className="text-foreground font-medium">{categoryData?.name ?? slug}</span>
        </nav>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-2xl font-bold">{categoryData?.name ?? slug}</h1>
              {data && (
                <p className="text-sm text-muted-foreground mt-0.5">{data.total} products</p>
              )}
            </div>
          </div>
          <select
            value={sort}
            onChange={(e) => { setSort(e.target.value); setPage(1); }}
            className="text-sm border rounded-lg px-3 py-1.5 bg-background"
          >
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {/* Sub-categories */}
        {categoryData?.children && categoryData.children.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-8">
            {categoryData.children.map((child: Category) => (
              <Link
                key={child.id}
                href={`/categories/${child.slug}`}
                className="px-4 py-1.5 bg-muted rounded-full text-sm font-medium hover:bg-primary hover:text-primary-foreground transition"
              >
                {child.name}
              </Link>
            ))}
          </div>
        )}

        {/* Products */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-muted rounded-2xl aspect-[3/4] animate-pulse" />
            ))}
          </div>
        ) : !data?.data.length ? (
          <div className="text-center py-20 text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-4 opacity-40" />
            <p className="font-medium text-lg">No products in this category yet</p>
            <Link href="/products" className="mt-4 inline-block text-primary hover:underline text-sm">
              Browse all products
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {data.data.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {data.last_page > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                {Array.from({ length: data.last_page }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-9 h-9 rounded-lg text-sm font-medium transition ${
                      data.current_page === p
                        ? "bg-primary text-primary-foreground"
                        : "border hover:bg-muted"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </main>
      <Footer />
    </>
  );
}
