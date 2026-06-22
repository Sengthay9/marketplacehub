import api from "@/lib/axios";
import type { User } from "@/types";

export const authService = {
  async register(data: {
    name: string; email: string; password: string;
    password_confirmation: string; role?: string; phone?: string;
  }) {
    const res = await api.post("/auth/register", data);
    return res.data as { token: string; user: User; message: string };
  },

  async login(identifier: string, password: string) {
    const res = await api.post("/auth/login", { identifier, password });
    return res.data as { token: string; user: User; message: string };
  },

  async logout() {
    await api.post("/auth/logout");
  },

  async me() {
    const res = await api.get("/auth/me");
    return res.data.user as User;
  },

  async forgotPassword(email: string) {
    const res = await api.post("/auth/forgot-password", { email });
    return res.data as { message: string };
  },

  async resetPassword(data: {
    token: string; email: string; password: string; password_confirmation: string;
  }) {
    const res = await api.post("/auth/reset-password", data);
    return res.data as { message: string };
  },
};
