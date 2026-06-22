import { create } from "zustand";
import type { Cart } from "@/types";

interface CartStore {
  cart: Cart | null;
  isOpen: boolean;
  setCart: (cart: Cart) => void;
  clearCart: () => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  itemCount: number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  cart:      null,
  isOpen:    false,
  itemCount: 0,

  setCart: (cart) => set({ cart, itemCount: cart.item_count }),
  clearCart: () => set({ cart: null, itemCount: 0 }),
  toggleCart: () => set((s) => ({ isOpen: !s.isOpen })),
  openCart: () => set({ isOpen: true }),
  closeCart: () => set({ isOpen: false }),
}));
