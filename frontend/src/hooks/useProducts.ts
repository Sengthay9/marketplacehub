"use client";

import { useQuery } from "@tanstack/react-query";
import { productService, type ProductFilters } from "@/services/product.service";

export function useProducts(filters: ProductFilters = {}) {
  return useQuery({
    queryKey: ["products", filters],
    queryFn: () => productService.list(filters),
    staleTime: 60_000,
  });
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: ["product", slug],
    queryFn: () => productService.get(slug),
    enabled: Boolean(slug),
    staleTime: 120_000,
  });
}
