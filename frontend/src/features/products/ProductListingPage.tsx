"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { SlidersHorizontal, Grid3X3, List } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass, faStar } from "@fortawesome/free-solid-svg-icons";
import { useProducts } from "@/hooks/useProducts";
import ProductCard from "./ProductCard";
import type { ProductFilters } from "@/services/product.service";

const SORT_OPTIONS = [
  { value: "latest",    label: "Newest" },
  { value: "popular",   label: "Most Popular" },
  { value: "rating",    label: "Top Rated" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc",label: "Price: High to Low" },
];

export default function ProductListingPage() {
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<ProductFilters>({
    q:        searchParams.get("q") ?? undefined,
    category: searchParams.get("category") ?? undefined,
    sort:     "latest",
    page:     1,
    per_page: 20,
  });

  const { data, isLoading } = useProducts(filters);

  return (
    <div className="flex gap-6">
      {/* Filters Sidebar */}
      <aside className="w-56 shrink-0 hidden lg:block">
        <div className="bg-card border rounded-2xl p-4 space-y-5 sticky top-24">
          <h3 className="font-bold">Filters</h3>

          {/* Price Range */}
          <div>
            <p className="text-sm font-medium mb-2">Price Range</p>
            <div className="flex gap-2">
              <input
                type="number" placeholder="Min"
                className="w-full text-xs px-2 py-1.5 border rounded-lg bg-background"
                onChange={(e) => setFilters((f) => ({ ...f, min_price: Number(e.target.value) || undefined, page: 1 }))}
              />
              <input
                type="number" placeholder="Max"
                className="w-full text-xs px-2 py-1.5 border rounded-lg bg-background"
                onChange={(e) => setFilters((f) => ({ ...f, max_price: Number(e.target.value) || undefined, page: 1 }))}
              />
            </div>
          </div>

          {/* Min Rating */}
          <div>
            <p className="text-sm font-medium mb-2">Min Rating</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((r) => (
                <button
                  key={r}
                  onClick={() => setFilters((f) => ({ ...f, min_rating: r, page: 1 }))}
                  className={`text-lg ${(filters.min_rating ?? 0) >= r ? "text-yellow-400" : "text-muted-foreground"}`}
                >
                  <FontAwesomeIcon icon={faStar} className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-xl font-bold">
              {filters.q ? `Search: "${filters.q}"` : filters.category ? filters.category : "All Products"}
            </h1>
            {data && <p className="text-sm text-muted-foreground mt-0.5">{data.total} products found</p>}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <select
              value={filters.sort}
              onChange={(e) => setFilters((f) => ({ ...f, sort: e.target.value as ProductFilters["sort"], page: 1 }))}
              className="text-sm border rounded-lg px-3 py-1.5 bg-background"
            >
              {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-muted rounded-2xl aspect-[3/4] animate-pulse" />
            ))}
          </div>
        ) : !data?.data.length ? (
          <div className="text-center py-20 text-muted-foreground">
            <FontAwesomeIcon icon={faMagnifyingGlass} className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="font-medium">No products found</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {data.data.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* Pagination */}
            {data.last_page > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                {Array.from({ length: data.last_page }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setFilters((f) => ({ ...f, page }))}
                    className={`w-9 h-9 rounded-lg text-sm font-medium transition ${
                      data.current_page === page
                        ? "bg-primary text-primary-foreground"
                        : "border hover:bg-muted"
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
