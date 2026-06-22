"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Phone, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth.store";
import api from "@/lib/axios";

// ─── Google icon ──────────────────────────────────────────────────────────────
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

// ─── Phone OTP section ────────────────────────────────────────────────────────
function PhoneSection() {
  const router = useRouter();
  const [phone,    setPhone]   = useState("");
  const [otp,      setOtp]     = useState("");
  const [step,     setStep]    = useState<"input" | "otp">("input");
  const [devOtp,   setDevOtp]  = useState("");
  const [loading,  setLoading] = useState(false);

  // +855 prefix is shown separately; strip leading 0 if user typed it
  const fullPhone = () => "+855" + phone.trim().replace(/^0/, "").replace(/[\s\-]/g, "");

  const sendOtp = async () => {
    const num = phone.trim().replace(/^0/, "").replace(/[\s\-]/g, "");
    if (num.length < 7) { toast.error("Enter a valid phone number."); return; }
    setLoading(true);
    try {
      const res = await api.post("/auth/phone/send-otp", { phone: fullPhone() });
      setStep("otp");
      if (res.data.dev_otp) {
        setDevOtp(res.data.dev_otp);
      } else {
        toast.success("Verification code sent to your phone.");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (otp.length !== 6) { toast.error("Enter the 6-digit code."); return; }
    setLoading(true);
    try {
      const res = await api.post("/auth/phone/verify-otp", {
        phone:   fullPhone(),
        otp,
        purpose: "register",
      });
      if (res.data.verified) {
        toast.success("Phone verified! Fill in your details.");
        router.push(`/register/complete?source=phone&phone=${encodeURIComponent(res.data.phone)}`);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Invalid code. Try again.");
      setOtp("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border-2 rounded-2xl p-5 space-y-3 bg-muted/20">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Phone className="w-4 h-4 text-green-600" />
        Sign up with Phone Number
      </div>

      {step === "input" ? (
        <>
          <div className="flex gap-2">
            <div className="flex items-center gap-1 border-2 rounded-xl px-3 bg-background text-sm font-medium text-muted-foreground shrink-0">
              🇰🇭 +855
            </div>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="11 665 875"
              className="flex-1 border-2 rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500"
            />
          </div>
          <button
            type="button"
            onClick={sendOtp}
            disabled={loading}
            className="w-full py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Phone className="w-4 h-4" />}
            {loading ? "Sending…" : "Confirm"}
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
              Enter the 6-digit code sent to <strong>+855 {phone.replace(/^0/, "")}</strong>
            </p>
          )}
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            placeholder="• • • • • •"
            className="w-full border-2 rounded-xl px-4 py-3 text-sm bg-background text-center tracking-[0.5em] font-mono text-xl focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500"
          />
          <button
            type="button"
            onClick={verifyOtp}
            disabled={loading || otp.length !== 6}
            className="w-full py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            {loading ? "Verifying…" : "Verify"}
          </button>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <button type="button" onClick={() => { setStep("input"); setOtp(""); }}
              className="hover:text-foreground transition">← Change number</button>
            <button type="button" onClick={sendOtp} disabled={loading}
              className="hover:text-foreground transition disabled:opacity-50">Resend code</button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Root export ──────────────────────────────────────────────────────────────
export default function RegisterForm() {
  return (
    <div className="space-y-4">
      {/* Phone */}
      <PhoneSection />

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 border-t" />
        <span className="text-xs text-muted-foreground font-medium">or</span>
        <div className="flex-1 border-t" />
      </div>

      {/* Google */}
      <button
        type="button"
        onClick={() => { window.location.href = "/api/v1/auth/google"; }}
        className="w-full flex items-center justify-center gap-3 py-3.5 px-4 border-2 rounded-xl font-semibold text-sm hover:bg-muted transition"
      >
        <GoogleIcon /> Continue with Google
      </button>

      {/* Terms */}
      <p className="text-center text-xs text-muted-foreground pt-1">
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
