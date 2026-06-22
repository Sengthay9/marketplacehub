"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, Eye, EyeOff, Loader2, User, Mail } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth.store";
import api from "@/lib/axios";

function CompleteForm() {
  const router  = useRouter();
  const params  = useSearchParams();
  const source  = params.get("source");        // "phone" | null (google)
  const phone   = params.get("phone") ?? "";   // pre-filled from phone OTP

  const { isAuthenticated, user, setAuth, updateUser } = useAuthStore();

  const [firstName, setFirstName] = useState("");
  const [lastName,  setLastName]  = useState("");
  const [email,     setEmail]     = useState("");
  const [password,  setPassword]  = useState("");
  const [confirm,   setConfirm]   = useState("");
  const [showPw,    setShowPw]    = useState(false);
  const [showCp,    setShowCp]    = useState(false);
  const [loading,   setLoading]   = useState(false);

  const isPhone  = source === "phone";
  const isGoogle = !isPhone && isAuthenticated;

  useEffect(() => {
    // Google flow: must be authenticated already
    if (!isPhone && !isAuthenticated) {
      router.replace("/register");
      return;
    }
    // Phone flow: must have phone param
    if (isPhone && !phone) {
      router.replace("/register");
      return;
    }
    // Pre-fill name from Google account
    if (isGoogle && user?.name) {
      const parts = user.name.split(" ");
      setFirstName(parts[0] ?? "");
      setLastName(parts.slice(1).join(" ") ?? "");
      setEmail(user.email ?? "");
    }
  }, [isAuthenticated, user, isPhone, phone, isGoogle, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim())       { toast.error("First name is required."); return; }
    if (!lastName.trim())        { toast.error("Last name is required."); return; }
    if (!password)               { toast.error("Password is required."); return; }
    if (password.length < 8)     { toast.error("Password must be at least 8 characters."); return; }
    if (password !== confirm)    { toast.error("Passwords do not match."); return; }
    if (isPhone && !email.trim()) { toast.error("Email is required."); return; }

    setLoading(true);
    try {
      if (isPhone) {
        // Create brand-new account (phone signup)
        const { data } = await api.post("/auth/phone/register", {
          phone,
          first_name:            firstName.trim(),
          last_name:             lastName.trim(),
          email:                 email.trim(),
          password,
          password_confirmation: confirm,
        });
        setAuth(data.user, data.token);
        toast.success("Account created! Welcome to MarketplaceHub.");
      } else {
        // Update existing Google account (name + password)
        const { data } = await api.patch("/auth/onboard", {
          first_name:            firstName.trim(),
          last_name:             lastName.trim(),
          password,
          password_confirmation: confirm,
        });
        updateUser(data.user);
        toast.success("Welcome to MarketplaceHub!");
      }
      router.replace("/");
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  // Don't render until we know the source
  if (!isPhone && !isAuthenticated) return null;

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-slate-900">
      <div className="w-full max-w-md bg-card border rounded-2xl shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <User className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Almost done!</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Fill in your details to finish creating your account.
          </p>
        </div>

        {/* Verified badge */}
        <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl px-4 py-2.5 mb-6">
          <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
          <span className="text-sm text-green-700 dark:text-green-400 font-medium">
            {isPhone
              ? `Phone verified — ${phone}`
              : `Google verified — ${user?.email}`}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold mb-1.5">First Name</label>
              <input value={firstName} onChange={(e) => setFirstName(e.target.value)}
                placeholder="Alice"
                className="w-full px-4 py-2.5 rounded-xl border-2 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5">Last Name</label>
              <input value={lastName} onChange={(e) => setLastName(e.target.value)}
                placeholder="Smith"
                className="w-full px-4 py-2.5 rounded-xl border-2 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
            </div>
          </div>

          {/* Email — only for phone signups (Google already has it) */}
          {isPhone && (
            <div>
              <label className="block text-sm font-semibold mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
            </div>
          )}

          {/* Password */}
          <div>
            <label className="block text-sm font-semibold mb-1.5">
              Password
              {isGoogle && <span className="text-muted-foreground font-normal"> (for email sign-in)</span>}
            </label>
            <div className="relative">
              <input type={showPw ? "text" : "password"} value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full px-4 py-2.5 pr-11 rounded-xl border-2 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
              <button type="button" onClick={() => setShowPw((v) => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm password */}
          <div>
            <label className="block text-sm font-semibold mb-1.5">Confirm Password</label>
            <div className="relative">
              <input type={showCp ? "text" : "password"} value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repeat your password"
                className="w-full px-4 py-2.5 pr-11 rounded-xl border-2 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
              <button type="button" onClick={() => setShowCp((v) => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showCp ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition disabled:opacity-50 flex items-center justify-center gap-2 mt-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            {loading ? "Creating account…" : "Complete My Account"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function RegisterCompletePage() {
  return (
    <Suspense>
      <CompleteForm />
    </Suspense>
  );
}
