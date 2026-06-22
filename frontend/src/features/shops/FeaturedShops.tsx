"use client";

import Link from "next/link";
import Image from "next/image";
import { Star, ShoppingBag, Store } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import type { Shop } from "@/types";

export default function FeaturedShops() {
  const { data, isLoading } = useQuery({
    queryKey: ["featured-shops"],
    queryFn: async () => {
      const res = await api.get("/shops", { params: { per_page: 6, sort: "rating" } });
      return res.data.data as Shop[];
    },
    staleTime: 120_000,
  });

  return (
    <section className="bg-muted/30 py-16">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold">Top Shops</h2>
            <p className="text-muted-foreground text-sm mt-1">Explore verified vendors on the platform</p>
          </div>
          <Link href="/shops" className="text-primary text-sm font-medium hover:underline flex items-center gap-1">
            All shops <ShoppingBag className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-card rounded-2xl h-64 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {data?.map((shop) => (
              <Link
                key={shop.id}
                href={`/shops/${shop.slug}`}
                className="group bg-card border rounded-2xl overflow-hidden hover:shadow-lg transition-shadow flex flex-col"
              >
                {/* Banner */}
                <div className="h-40 bg-gradient-to-r from-primary/20 to-blue-500/20 relative shrink-0">
                  {shop.banner && (
                    <Image src={shop.banner} alt="" fill className="object-cover" />
                  )}
                </div>
                <div className="p-5 -mt-8 flex flex-col flex-1">
                  <div className="w-16 h-16 bg-card border-2 border-background rounded-2xl overflow-hidden mb-3 shadow-sm">
                    {shop.logo
                      ? <Image src={shop.logo} alt={shop.name} width={64} height={64} className="object-cover" />
                      : <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                          <Store className="w-7 h-7 text-primary/50" />
                        </div>
                    }
                  </div>
                  <h3 className="font-bold text-sm line-clamp-1">{shop.name}</h3>
                  {shop.description && (
                    <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed flex-1">
                      {shop.description}
                    </p>
                  )}
                  <div className="flex items-center gap-1 mt-3">
                    <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs font-semibold">{shop.rating != null ? Number(shop.rating).toFixed(1) : "—"}</span>
                    <span className="text-xs text-muted-foreground">({shop.review_count} reviews)</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
