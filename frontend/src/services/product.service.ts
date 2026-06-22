import api from "@/lib/axios";
import type { PaginatedResponse, Product } from "@/types";

export interface ProductFilters {
  q?: string;
  category?: string;
  shop?: string;
  min_price?: number;
  max_price?: number;
  min_rating?: number;
  featured?: boolean;
  sort?: "latest" | "price_asc" | "price_desc" | "rating" | "popular";
  page?: number;
  per_page?: number;
}

export const productService = {
  async list(filters: ProductFilters = {}) {
    const res = await api.get("/products", { params: filters });
    return res.data as PaginatedResponse<Product>;
  },

  async get(slug: string) {
    const res = await api.get(`/products/${slug}`);
    return res.data.product as Product;
  },

  // Vendor
  async vendorList(filters: { page?: number; status?: string; q?: string } = {}) {
    const res = await api.get("/vendor/products", { params: filters });
    return res.data as PaginatedResponse<Product>;
  },

  async vendorCreate(data: FormData) {
    const res = await api.post("/vendor/products", data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data.product as Product;
  },

  async vendorUpdate(id: number, data: FormData | Record<string, unknown>) {
    const res = await api.put(`/vendor/products/${id}`, data);
    return res.data.product as Product;
  },

  async vendorDelete(id: number) {
    await api.delete(`/vendor/products/${id}`);
  },

  async uploadImages(id: number, images: File[]) {
    const form = new FormData();
    images.forEach((img) => form.append("images[]", img));
    const res = await api.post(`/vendor/products/${id}/images`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },
};
