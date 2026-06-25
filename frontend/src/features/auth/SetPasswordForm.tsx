"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/store/auth.store";

type FormData = {
  password: string;
  password_confirmation: string;
};

export default function SetPasswordForm() {
  const router = useRouter();
  const { user, updateUser } = useAuthStore();
  const [showPass, setShowPass] = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [loading, setLoading]   = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await authService.setPassword(data);
      updateUser({ force_password_change: false });
      toast.success("Password set! Welcome to CamCart.");
      const redirects: Record<string, string> = {
        admin:    "/admin/dashboard",
        vendor:   "/vendor/dashboard",
        customer: "/",
      };
      router.push(redirects[user?.role ?? "customer"] ?? "/");
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to set password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-semibold mb-1.5">New Password</label>
        <div className="relative">
          <input
            type={showPass ? "text" : "password"}
            {...register("password", {
              required: "Required",
              minLength: { value: 8, message: "Min 8 characters" },
            })}
            placeholder="Min 8 characters"
            className="w-full px-4 py-2.5 pr-11 rounded-xl border-2 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
          <button type="button" onClick={() => setShowPass((v) => !v)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {errors.password && <p className="text-destructive text-xs mt-1">{errors.password.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-semibold mb-1.5">Confirm Password</label>
        <div className="relative">
          <input
            type={showConf ? "text" : "password"}
            {...register("password_confirmation", {
              required: "Required",
              validate: (v) => v === watch("password") || "Passwords do not match",
            })}
            placeholder="Repeat your password"
            className="w-full px-4 py-2.5 pr-11 rounded-xl border-2 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
          <button type="button" onClick={() => setShowConf((v) => !v)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            {showConf ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {errors.password_confirmation && <p className="text-destructive text-xs mt-1">{errors.password_confirmation.message}</p>}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {loading ? "Saving…" : "Set My Password"}
      </button>
    </form>
  );
}
