import api from "@/lib/axios";
import type { Cart } from "@/types";

export const cartService = {
  async get() {
    const res = await api.get("/customer/cart");
    return res.data.cart as Cart;
  },

  async addItem(productId: number, variantId?: number, quantity = 1) {
    const res = await api.post("/customer/cart/items", {
      product_id: productId, variant_id: variantId, quantity,
    });
    return res.data.cart as Cart;
  },

  async updateItem(itemId: number, quantity: number) {
    const res = await api.put(`/customer/cart/items/${itemId}`, { quantity });
    return res.data.cart as Cart;
  },

  async removeItem(itemId: number) {
    const res = await api.delete(`/customer/cart/items/${itemId}`);
    return res.data.cart as Cart;
  },

  async clear() {
    await api.delete("/customer/cart");
  },
};
