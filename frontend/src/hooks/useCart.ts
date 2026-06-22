"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cartService } from "@/services/cart.service";
import { useCartStore } from "@/store/cart.store";
import { useAuthStore } from "@/store/auth.store";
import { toast } from "sonner";

export function useCart() {
  const { isAuthenticated } = useAuthStore();
  const { setCart } = useCartStore();
  const qc = useQueryClient();

  const { data: cart, isLoading } = useQuery({
    queryKey: ["cart"],
    queryFn: async () => {
      const data = await cartService.get();
      setCart(data);
      return data;
    },
    enabled: isAuthenticated,
    staleTime: 30_000,
  });

  const addItemMutation = useMutation({
    mutationFn: ({ productId, variantId, quantity }: {
      productId: number; variantId?: number; quantity?: number;
    }) => cartService.addItem(productId, variantId, quantity),
    onSuccess: (data) => {
      setCart(data);
      qc.setQueryData(["cart"], data);
      toast.success("Added to cart!");
    },
    onError: () => toast.error("Could not add to cart."),
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: number; quantity: number }) =>
      cartService.updateItem(itemId, quantity),
    onSuccess: (data) => { setCart(data); qc.setQueryData(["cart"], data); },
  });

  const removeItemMutation = useMutation({
    mutationFn: (itemId: number) => cartService.removeItem(itemId),
    onSuccess: (data) => {
      setCart(data);
      qc.setQueryData(["cart"], data);
      toast.success("Item removed.");
    },
  });

  return {
    cart,
    isLoading,
    addItem:       addItemMutation.mutate,
    updateItem:    updateItemMutation.mutate,
    removeItem:    removeItemMutation.mutate,
    isAddingItem:  addItemMutation.isPending,
  };
}
