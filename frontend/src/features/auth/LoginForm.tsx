"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/store/auth.store";
import { authService } from "@/services/auth.service";
import GoogleLoginButton from "@/components/shared/GoogleLoginButton";

const schema = z.object({
  identifier: z.string().min(1, "Username is required"),
  password:   z.string().min(1, "Password is required"),
});
type FormData = z.infer<typeof schema>;

export default function LoginForm() {
  const { login, isLoggingIn } = useAuth();
  const { setAuth } = useAuthStore();
  const router = useRouter();
  const [showPw, setShowPw] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleSuccess = async (accessToken: string) => {
    setGoogleLoading(true);
    try {
      const result = await authService.googleLogin(accessToken);
      setAuth(result.user, result.token);
      if (result.needs_onboarding) {
        router.push("/register/complete");
      } else if (result.force_password_change) {
        router.push("/set-password");
      } else {
        toast.success(`Welcome back, ${result.user.name}!`);
        const redirects: Record<string, string> = { admin: "/admin/dashboard", vendor: "/vendor/dashboard", customer: "/" };
        router.push(redirects[result.user.role] ?? "/");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Google sign-in failed.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = (data: FormData) => login(data as any);

  return (
    <div className="space-y-4">
      {/* Username + Password */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-1.5">Username</label>
          <input
            type="text"
            {...register("identifier")}
            placeholder="Enter your username"
            autoComplete="username"
            className="w-full px-4 py-2.5 rounded-xl border-2 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
          {errors.identifier && <p className="text-destructive text-xs mt-1">{errors.identifier.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1.5">Password</label>
          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              {...register("password")}
              placeholder="••••••••"
              autoComplete="current-password"
              className="w-full px-4 py-2.5 pr-11 rounded-xl border-2 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
            <button type="button" onClick={() => setShowPw((v) => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="text-destructive text-xs mt-1">{errors.password.message}</p>}
          <div className="text-right mt-1">
            <Link href="/forgot-password" className="text-xs text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoggingIn}
          className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isLoggingIn && <Loader2 className="w-4 h-4 animate-spin" />}
          {isLoggingIn ? "Signing in…" : "Sign In"}
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 border-t" />
        <span className="text-xs text-muted-foreground font-medium">or continue with</span>
        <div className="flex-1 border-t" />
      </div>

      {/* Google — only shown when OAuth is configured */}
      {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && (
        <GoogleLoginButton
          onSuccess={handleGoogleSuccess}
          loading={googleLoading}
          label="Sign in with Google"
          loadingLabel="Signing in…"
          className="w-full flex items-center justify-center gap-3 py-2.5 border-2 rounded-xl font-semibold text-sm hover:bg-muted transition disabled:opacity-50"
        />
      )}

<p className="text-center text-sm text-muted-foreground">
        Create new account?{" "}
        <Link href="/register" className="text-primary font-semibold hover:underline">Sign Up</Link>
      </p>
      <p className="text-center text-sm text-muted-foreground">
        Want to become a vendor?{" "}
        <Link href="/vendor-register" className="text-primary font-semibold hover:underline">Sign Up</Link>
      </p>
    </div>
  );
}
