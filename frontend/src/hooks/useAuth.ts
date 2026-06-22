"use client";

import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { authService } from "@/services/auth.service";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";

export function useAuth() {
  const router = useRouter();
  const { user, token, isAuthenticated, setAuth, clearAuth } = useAuthStore();

  const loginMutation = useMutation({
    mutationFn: ({ identifier, password }: { identifier: string; password: string }) =>
      authService.login(identifier, password),
    onSuccess: (data) => {
      setAuth(data.user, data.token);
      toast.success("Welcome back!");
      // Redirect by role
      const redirects: Record<string, string> = {
        admin:    "/admin/dashboard",
        vendor:   "/vendor/dashboard",
        customer: "/",
      };
      router.push(redirects[data.user.role] ?? "/");
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message ?? "Login failed.");
    },
  });

  const registerMutation = useMutation({
    mutationFn: (data: {
      name: string; email: string; password: string;
      password_confirmation: string; role?: string;
    }) => authService.register(data),
    onSuccess: (data) => {
      setAuth(data.user, data.token);
      toast.success("Account created successfully!");
      router.push(data.user.role === "vendor" ? "/vendor/dashboard" : "/");
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message ?? "Registration failed.");
    },
  });

  const logout = async () => {
    try { await authService.logout(); } catch { /* ignore */ }
    clearAuth();
    router.push("/login");
    toast.info("Logged out successfully.");
  };

  return {
    user,
    token,
    isAuthenticated,
    isAdmin:    user?.role === "admin",
    isVendor:   user?.role === "vendor",
    isCustomer: user?.role === "customer",
    login:      loginMutation.mutate,
    register:   registerMutation.mutate,
    logout,
    isLoggingIn:    loginMutation.isPending,
    isRegistering:  registerMutation.isPending,
  };
}
