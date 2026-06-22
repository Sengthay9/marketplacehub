"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Eye, EyeOff, CheckCircle, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";

export default function ResetPasswordForm() {
  const router  = useRouter();
  const params  = useSearchParams();
  const token   = params.get("token") ?? "";
  const email   = params.get("email") ?? "";

  const [password, setPassword]       = useState("");
  const [confirm,  setConfirm]        = useState("");
  const [showPw,   setShowPw]         = useState(false);
  const [showCp,   setShowCp]         = useState(false);
  const [loading,  setLoading]        = useState(false);
  const [done,     setDone]           = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { toast.error("Password must be at least 8 characters."); return; }
    if (password !== confirm) { toast.error("Passwords do not match."); return; }
    if (!token || !email) { toast.error("Invalid reset link. Please request a new one."); return; }

    setLoading(true);
    try {
      await api.post("/auth/reset-password", {
        token,
        email,
        password,
        password_confirmation: confirm,
      });
      setDone(true);
      toast.success("Password reset successfully!");
      setTimeout(() => router.push("/login"), 2500);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Reset failed. The link may have expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Sign In
      </Link>

      <div className="text-center mb-8">
        <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Lock className="w-7 h-7 text-primary" />
        </div>
        <h1 className="text-2xl font-bold">Set new password</h1>
        {email && <p className="text-muted-foreground text-sm mt-1">For <strong>{email}</strong></p>}
      </div>

      {done ? (
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="font-semibold text-lg">Password updated!</h2>
          <p className="text-sm text-muted-foreground">Redirecting you to sign in…</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1.5">New Password</label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full px-4 py-2.5 pr-11 rounded-xl border-2 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
              <button type="button" onClick={() => setShowPw((v) => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1.5">Confirm Password</label>
            <div className="relative">
              <input
                type={showCp ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repeat your password"
                className="w-full px-4 py-2.5 pr-11 rounded-xl border-2 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
              <button type="button" onClick={() => setShowCp((v) => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showCp ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
            {loading ? "Resetting…" : "Reset Password"}
          </button>
        </form>
      )}
    </>
  );
}
