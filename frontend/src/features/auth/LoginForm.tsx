"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { Eye, EyeOff, Loader2, Phone, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/store/auth.store";
import api from "@/lib/axios";

function GoogleIcon() {
  return (
    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

const schema = z.object({
  identifier: z.string().min(1, "Username is required"),
  password:   z.string().min(1, "Password is required"),
});
type FormData = z.infer<typeof schema>;

export default function LoginForm() {
  const { login, isLoggingIn } = useAuth();
  const { setAuth }            = useAuthStore();
  const router                 = useRouter();

  const [showPw,  setShowPw]  = useState(false);
  const [phone,   setPhone]   = useState("");
  const [otp,     setOtp]     = useState("");
  const [otpStep, setOtpStep] = useState<"input" | "verify">("input");
  const [devOtp,  setDevOtp]  = useState("");
  const [sending, setSending] = useState(false);
  const [showPhone, setShowPhone] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = (data: FormData) => login(data as any);

  const fullPhone = () => "+855" + phone.trim().replace(/^0/, "").replace(/[\s\-]/g, "");

  const sendOtp = async () => {
    const num = phone.trim().replace(/^0/, "").replace(/[\s\-]/g, "");
    if (num.length < 7) { toast.error("Enter a valid phone number."); return; }
    setSending(true);
    try {
      const res = await api.post("/auth/phone/send-otp", { phone: fullPhone() });
      setOtpStep("verify");
      if (res.data.dev_otp) {
        setDevOtp(res.data.dev_otp);
      } else {
        toast.success("Verification code sent to your phone.");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to send OTP.");
    } finally {
      setSending(false);
    }
  };

  const verifyOtp = async () => {
    if (otp.length !== 6) { toast.error("Enter the 6-digit code."); return; }
    setSending(true);
    try {
      const { data } = await api.post("/auth/phone/verify-otp", {
        phone:   fullPhone(),
        otp,
        purpose: "login",
      });
      setAuth(data.user, data.token);
      toast.success(`Welcome back, ${data.user.name}!`);
      if (data.user.role === "admin")  { router.replace("/admin/dashboard"); return; }
      if (data.user.role === "vendor") { router.replace("/vendor/dashboard"); return; }
      router.replace("/");
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Invalid code. Try again.");
      setOtp("");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* ── Username + Password form ── */}
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

      {/* ── Divider ── */}
      <div className="flex items-center gap-3">
        <div className="flex-1 border-t" />
        <span className="text-xs text-muted-foreground font-medium">or sign in with</span>
        <div className="flex-1 border-t" />
      </div>

      {/* ── Google ── */}
      <button
        type="button"
        onClick={() => { window.location.href = "/api/v1/auth/google?mode=login"; }}
        className="w-full flex items-center justify-center gap-3 py-2.5 border-2 rounded-xl font-semibold text-sm hover:bg-muted transition"
      >
        <GoogleIcon /> Sign in with Google
      </button>

      {/* ── Phone OTP ── */}
      {!showPhone ? (
        <button
          type="button"
          onClick={() => setShowPhone(true)}
          className="w-full flex items-center justify-center gap-3 py-2.5 border-2 rounded-xl font-semibold text-sm hover:bg-muted transition"
        >
          <Phone className="w-4 h-4 text-green-600" /> Sign in with Phone
        </button>
      ) : (
        <div className="border-2 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold flex items-center gap-2">
              <Phone className="w-4 h-4 text-green-600" /> Phone verification
            </span>
            <button type="button" onClick={() => { setShowPhone(false); setOtpStep("input"); setOtp(""); setDevOtp(""); }}
              className="text-xs text-muted-foreground hover:text-foreground transition">✕</button>
          </div>

          {otpStep === "input" ? (
            <>
              <div className="flex gap-2">
                <div className="flex items-center gap-1 border-2 rounded-xl px-3 bg-muted/30 text-sm font-medium text-muted-foreground shrink-0">
                  🇰🇭 +855
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="11 665 875"
                  className="flex-1 border-2 rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
              <button type="button" onClick={sendOtp} disabled={sending}
                className="w-full py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition disabled:opacity-50 flex items-center justify-center gap-2">
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Phone className="w-4 h-4" />}
                {sending ? "Sending…" : "Confirm"}
              </button>
            </>
          ) : (
            <>
              {devOtp ? (
                <div className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-300 dark:border-amber-700 rounded-xl px-4 py-3 text-center">
                  <p className="text-xs text-amber-700 dark:text-amber-400 font-medium mb-1">SMS not configured — your code is:</p>
                  <p className="text-2xl font-black tracking-widest text-amber-800 dark:text-amber-300">{devOtp}</p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center">
                  Code sent to <strong>+855 {phone.replace(/^0/, "")}</strong>
                </p>
              )}
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="• • • • • •"
                className="w-full border-2 rounded-xl px-4 py-3 text-sm bg-background text-center tracking-[0.5em] font-mono text-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
              <button type="button" onClick={verifyOtp} disabled={sending || otp.length !== 6}
                className="w-full py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition disabled:opacity-50 flex items-center justify-center gap-2">
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                {sending ? "Verifying…" : "Verify"}
              </button>
              <div className="flex justify-between text-xs text-muted-foreground">
                <button type="button" onClick={() => { setOtpStep("input"); setOtp(""); setDevOtp(""); }}
                  className="hover:text-foreground transition">← Change number</button>
                <button type="button" onClick={sendOtp} disabled={sending}
                  className="hover:text-foreground transition disabled:opacity-50">Resend code</button>
              </div>
            </>
          )}
        </div>
      )}

      <p className="text-center text-sm text-muted-foreground">
        No account?{" "}
        <Link href="/register" className="text-primary font-semibold hover:underline">Create one free</Link>
      </p>

      {/* Demo credentials */}
      <div className="p-4 bg-muted/50 rounded-xl border border-dashed text-xs space-y-2">
        <p className="font-semibold text-muted-foreground">Demo Accounts</p>
        <div className="space-y-1.5">
          {[
            { role: "Admin",    user: "admin@marketplacehub.com", pw: "Admin@2024" },
            { role: "Vendor",   user: "vendor@demo.com",          pw: "Demo@2024" },
            { role: "Customer", user: "customer@demo.com",        pw: "Demo@2024" },
          ].map(({ role, user, pw }) => (
            <div key={role} className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-muted-foreground w-14 shrink-0">{role}:</span>
              <button
                type="button"
                onClick={() => { setValue("identifier", user); setValue("password", pw); }}
                className="text-primary hover:underline font-mono"
              >
                {user}
              </button>
              <span className="text-muted-foreground">/</span>
              <code>{pw}</code>
            </div>
          ))}
        </div>
        <p className="text-muted-foreground/70 pt-1">Click an email above to auto-fill the form.</p>
      </div>
    </div>
  );
}
