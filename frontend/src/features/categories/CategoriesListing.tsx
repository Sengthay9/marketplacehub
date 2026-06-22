"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { LayoutGrid } from "lucide-react";
import api from "@/lib/axios";
import type { Category } from "@/types";

export default function CategoriesListing() {
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
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-32 bg-muted rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {categories?.map((cat) => (
        <Link
          key={cat.id}
          href={`/categories/${cat.slug}`}
          className="group flex flex-col items-center justify-center gap-3 p-6 bg-card border rounded-2xl hover:border-primary hover:shadow-md transition"
        >
          <LayoutGrid className="w-8 h-8 text-muted-foreground group-hover:text-primary transition" />
          <span className="font-semibold text-center">{cat.name}</span>
          {cat.children && cat.children.length > 0 && (
            <span className="text-xs text-muted-foreground">{cat.children.length} subcategories</span>
          )}
        </Link>
      ))}
    </div>
  );
}
