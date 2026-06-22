"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { LayoutGrid } from "lucide-react";
import api from "@/lib/axios";
import type { Category } from "@/types";

export default function CategoryGrid() {
  const { data: categories, isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await api.get("/categories");
      return res.data.data as Category[];
    },
    staleTime: 300_000,
  });

  if (isLoading) {
    return (
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex gap-5 overflow-x-auto pb-2 scrollbar-hide">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="w-48 h-52 bg-muted rounded-2xl animate-pulse shrink-0" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-7xl mx-auto px-4 py-12">
      <h2 className="text-2xl font-bold mb-6">Shop by Category</h2>
      <div className="flex flex-row gap-5 overflow-x-auto pb-2 scrollbar-hide">
        {categories?.map((cat) => (
          <Link
            key={cat.id}
            href={`/categories/${cat.slug}`}
            className="group flex flex-col items-center gap-4 p-7 bg-card border-2 rounded-2xl hover:border-primary hover:shadow-md transition shrink-0 w-48"
          >
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition">
              <LayoutGrid className="w-10 h-10 text-primary" />
            </div>
            <span className="text-base font-semibold text-center leading-tight line-clamp-2">{cat.name}</span>
          </Link>
        ))}
        <Link
          href="/categories"
          className="flex flex-col items-center gap-4 p-7 bg-primary/5 border-2 border-primary/20 rounded-2xl hover:bg-primary/10 transition shrink-0 w-48"
        >
          <div className="w-20 h-20 rounded-2xl bg-primary/20 flex items-center justify-center">
            <LayoutGrid className="w-10 h-10 text-primary" />
          </div>
          <span className="text-base font-semibold text-center text-primary">All Categories</span>
        </Link>
      </div>
    </section>
  );
}
