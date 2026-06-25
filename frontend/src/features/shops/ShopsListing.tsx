"use client";

import Link from "next/link";
import { useState } from "react";
import { Star, Store, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import type { Shop } from "@/types";

function ShopLogo({ src, alt, size }: { src: string; alt: string; size: number }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className="w-full h-full bg-primary/10 flex items-center justify-center">
        <Store className="w-5 h-5 text-primary/50" />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      className="w-full h-full object-cover"
      onError={() => setFailed(true)}
    />
  );
}

function ShopBanner({ src }: { src: string }) {
  return (
    <img
      src={src}
      alt=""
      className="absolute inset-0 w-full h-full object-cover"
      onError={(e) => { e.currentTarget.style.display = "none"; }}
    />
  );
}

export default function ShopsListing() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["shops", search, page],
    queryFn: async () => {
      const res = await api.get("/shops", { params: { search: search || undefined, page, per_page: 12 } });
      return res.data;
    },
    staleTime: 60_000,
  });

  const shops: Shop[] = data?.data ?? [];
  const lastPage = data?.meta?.last_page ?? 1;

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-1">All Shops</h1>
        <p className="text-muted-foreground">Discover verified vendors on the platform</p>
      </div>

      {/* Search */}
      <div className="relative max-w-md mb-8">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search shops…"
          className="w-full border rounded-xl pl-10 pr-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-card rounded-2xl h-44 animate-pulse" />
          ))}
        </div>
      ) : !shops.length ? (
        <div className="text-center py-20 text-muted-foreground">
          <Store className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No shops found{search ? ` for "${search}"` : ""}.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {shops.map((shop) => (
              <Link
                key={shop.id}
                href={`/shops/${shop.slug}`}
                className="group bg-card border rounded-2xl hover:shadow-lg transition-shadow"
              >
                <div className="h-24 bg-gradient-to-r from-primary/20 to-blue-500/20 relative overflow-hidden rounded-t-2xl">
                  {shop.banner && <ShopBanner src={shop.banner} />}
                </div>
                <div className="p-4 -mt-6">
                  <div className="relative z-10 w-12 h-12 bg-card border-2 border-background rounded-xl overflow-hidden mb-2">
                    {shop.logo
                      ? <ShopLogo src={shop.logo} alt={shop.name} size={48} />
                      : <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                          <Store className="w-5 h-5 text-primary/50" />
                        </div>
                    }
                  </div>
                  <h3 className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition">{shop.name}</h3>
                  {shop.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{shop.description}</p>
                  )}
                  <div className="flex items-center gap-1 mt-2">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs font-medium">{shop.rating != null ? Number(shop.rating).toFixed(1) : "—"}</span>
                    <span className="text-xs text-muted-foreground">({shop.review_count})</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {lastPage > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 rounded-xl border text-sm font-medium disabled:opacity-40 hover:bg-muted transition"
              >
                Previous
              </button>
              <span className="text-sm text-muted-foreground">Page {page} of {lastPage}</span>
              <button
                onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                disabled={page === lastPage}
                className="px-4 py-2 rounded-xl border text-sm font-medium disabled:opacity-40 hover:bg-muted transition"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
