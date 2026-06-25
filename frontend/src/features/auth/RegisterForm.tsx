"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/store/auth.store";
import { useRouter } from "next/navigation";
import GoogleLoginButton from "@/components/shared/GoogleLoginButton";

type FormData = {
  first_name: string;
  last_name: string;
  username: string;
  phone: string;
  password: string;
  password_confirmation: string;
};

export default function RegisterForm() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [showPass, setShowPass]   = useState(false);
  const [showConf, setShowConf]   = useState(false);
  const [loading,  setLoading]    = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await authService.register({
        name:                  data.first_name.trim() + " " + data.last_name.trim(),
        username:              data.username.trim(),
        phone:                 data.phone.trim(),
        password:              data.password,
        password_confirmation: data.password_confirmation,
      });
      toast.success("Account created! You can now sign in.");
      router.push("/login");
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Registration failed. Please try again.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (accessToken: string) => {
    setGoogleLoading(true);
    try {
      const result = await authService.googleLogin(accessToken);
      setAuth(result.user, result.token);
      if (result.needs_onboarding) {
        router.push("/register/complete");
      } else {
        toast.success(`Welcome, ${result.user.name}!`);
        const redirects: Record<string, string> = { admin: "/admin/dashboard", vendor: "/vendor/dashboard", customer: "/" };
        router.push(redirects[result.user.role] ?? "/");
      }
    } catch {
      toast.error("Google sign-up failed. Please try again.");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Google — only shown when OAuth is configured */}
      {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && (
        <>
          <GoogleLoginButton
            onSuccess={handleGoogleSuccess}
            loading={googleLoading}
            label="Continue with Google"
            loadingLabel="Signing up…"
          />
          <div className="flex items-center gap-3">
            <div className="flex-1 border-t" />
            <span className="text-xs text-muted-foreground font-medium">or sign up with username</span>
            <div className="flex-1 border-t" />
          </div>
        </>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        {/* First + Last name */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold mb-1">First Name</label>
            <input
              {...register("first_name", { required: "Required" })}
              placeholder="John"
              className="w-full border-2 rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
            {errors.first_name && <p className="text-xs text-red-500 mt-1">{errors.first_name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Last Name</label>
            <input
              {...register("last_name", { required: "Required" })}
              placeholder="Doe"
              className="w-full border-2 rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
            {errors.last_name && <p className="text-xs text-red-500 mt-1">{errors.last_name.message}</p>}
          </div>
        </div>

        {/* Username */}
        <div>
          <label className="block text-sm font-semibold mb-1">Username</label>
          <input
            {...register("username", {
              required: "Required",
              minLength: { value: 3, message: "Min 3 characters" },
              maxLength: { value: 30, message: "Max 30 characters" },
              pattern: { value: /^[a-zA-Z0-9_-]+$/, message: "Letters, numbers, _ and - only" },
            })}
            placeholder="john_doe"
            autoComplete="username"
            className="w-full border-2 rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
          {errors.username && <p className="text-xs text-red-500 mt-1">{errors.username.message}</p>}
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-semibold mb-1">Phone Number</label>
          <input
            type="tel"
            {...register("phone", { required: "Required" })}
            placeholder="+855 12 345 678"
            className="w-full border-2 rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
          {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>}
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-semibold mb-1">Password</label>
          <div className="relative">
            <input
              type={showPass ? "text" : "password"}
              {...register("password", { required: "Required", minLength: { value: 8, message: "Min 8 characters" } })}
              placeholder="Min 8 characters"
              className="w-full border-2 rounded-xl px-3 py-2.5 pr-10 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-2.5 text-muted-foreground">
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-sm font-semibold mb-1">Confirm Password</label>
          <div className="relative">
            <input
              type={showConf ? "text" : "password"}
              {...register("password_confirmation", {
                required: "Required",
                validate: (v) => v === watch("password") || "Passwords do not match",
              })}
              placeholder="Repeat your password"
              className="w-full border-2 rounded-xl px-3 py-2.5 pr-10 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
            <button type="button" onClick={() => setShowConf(!showConf)} className="absolute right-3 top-2.5 text-muted-foreground">
              {showConf ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password_confirmation && <p className="text-xs text-red-500 mt-1">{errors.password_confirmation.message}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? "Creating account…" : "Create Account"}
        </button>
      </form>

      <p className="text-center text-xs text-muted-foreground">
        By signing up you agree to our{" "}
        <Link href="/terms" className="underline hover:text-foreground">Terms</Link> and{" "}
        <Link href="/privacy" className="underline hover:text-foreground">Privacy Policy</Link>.
      </p>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="text-primary font-semibold hover:underline">Sign in</Link>
      </p>
    </div>
  );
}
