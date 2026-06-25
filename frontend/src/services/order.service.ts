import api from "@/lib/axios";
import type { CheckoutSummary, Order, PaginatedResponse } from "@/types";

export const orderService = {
  async list(page = 1) {
    const res = await api.get("/customer/orders", { params: { page } });
    return res.data as PaginatedResponse<Order>;
  },

  async get(id: number) {
    const res = await api.get(`/customer/orders/${id}`);
    return res.data.order as Order;
  },

  async cancel(id: number) {
    const res = await api.post(`/customer/orders/${id}/cancel`);
    return res.data.order as Order;
  },

  async summary(couponCode?: string) {
    const res = await api.post("/customer/checkout/summary", { coupon_code: couponCode });
    return res.data.summary as CheckoutSummary;
  },

  async applyCoupon(code: string) {
    const res = await api.post("/customer/checkout/coupon", { coupon_code: code });
    return res.data as { discount: number; total: number };
  },

  async placeOrder(data: {
    address_id: number;
    payment_method: string;
    coupon_code?: string;
    notes?: string;
  }) {
    const res = await api.post("/customer/checkout/place", data);
    return res.data as { order_number: string; order: Order; message: string };
  },

  // Vendor
  async vendorList(filters: { page?: number; status?: string } = {}) {
    const res = await api.get("/vendor/orders", { params: filters });
    return res.data as PaginatedResponse<Order>;
  },

  async vendorUpdateStatus(id: number, action: "confirm" | "deliver", data: Record<string, unknown> = {}) {
    const res = await api.post(`/vendor/orders/${id}/${action}`, data);
    return res.data.order as Order;
  },
};
