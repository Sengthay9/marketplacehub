"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth.store";
import api from "@/lib/axios";

export default function CallbackHandler() {
  const router      = useRouter();
  const params      = useSearchParams();
  const { setAuth } = useAuthStore();

  useEffect(() => {
    const token = params.get("token");
    const error = params.get("error");

    if (error) {
      if (error === "not_configured") {
        toast.error("Google sign-in is not set up yet. Please sign in with email.");
      } else if (error === "not_registered") {
        toast.error("No account found with this Google account. Please sign up first.", { duration: 5000 });
        router.replace("/register");
        return;
      } else {
        toast.error("Google sign-in failed. Please try again or use email.");
      }
      router.replace("/login");
      return;
    }

    if (!token) {
      toast.error("Sign-in failed. Please try again.");
      router.replace("/login");
      return;
    }

    // Temporarily set the token so the /auth/me request is authenticated
    localStorage.setItem("mh_token", token);

    const needsOnboarding = params.get("needs_onboarding") === "1";

    api.get("/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(({ data }) => {
        const user = data.user;
        setAuth(user, token);

        // New Google/social users → complete their profile first
        if (needsOnboarding) {
          router.replace("/register/complete");
          return;
        }

        toast.success(`Welcome back, ${user.name}!`);
        if (user.role === "admin")  { router.replace("/admin/dashboard"); return; }
        if (user.role === "vendor") { router.replace("/vendor/dashboard"); return; }
        router.replace("/");
      })
      .catch(() => {
        localStorage.removeItem("mh_token");
        toast.error("Could not load your account. Please sign in manually.");
        router.replace("/login");
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex items-center gap-3 text-muted-foreground">
      <Loader2 className="w-5 h-5 animate-spin" />
      <span>Completing Google sign-in…</span>
    </div>
  );
}
