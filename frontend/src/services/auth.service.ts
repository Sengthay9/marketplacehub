import api from "@/lib/axios";
import type { User } from "@/types";

export const authService = {
  async register(data: {
    name: string; username: string; password: string;
    password_confirmation: string; role?: string; phone?: string; email?: string;
  }) {
    const res = await api.post("/auth/register", data);
    return res.data as { message: string };
  },

  async login(identifier: string, password: string) {
    const res = await api.post("/auth/login", { identifier, password });
    return res.data as { token: string; user: User; message: string; force_password_change: boolean };
  },

  async googleLogin(accessToken: string) {
    const res = await api.post("/auth/google/token", { access_token: accessToken });
    return res.data as { token: string; user: User; message: string; needs_onboarding: boolean; force_password_change: boolean };
  },

  async setPassword(data: { password: string; password_confirmation: string }) {
    const res = await api.post("/auth/set-password", data);
    return res.data as { message: string };
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
