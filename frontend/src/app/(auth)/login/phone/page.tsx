"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Phone, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth.store";
import api from "@/lib/axios";
import Link from "next/link";

export default function PhoneLoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const [phone,   setPhone]   = useState("");
  const [otp,     setOtp]     = useState("");
  const [step,    setStep]    = useState<"input" | "verify">("input");
  const [sending, setSending] = useState(false);

  const fullPhone = () => "+855" + phone.trim().replace(/^0/, "").replace(/[\s\-]/g, "");

  const sendOtp = async () => {
    const num = phone.trim().replace(/^0/, "").replace(/[\s\-]/g, "");
    if (num.length < 7) { toast.error("Enter a valid phone number."); return; }
    setSending(true);
    try {
      await api.post("/auth/phone/send-otp", { phone: fullPhone() });
      setStep("verify");
      toast.success("Verification code sent to your phone.");
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to send code.");
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
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Brand panel */}
      <div className="hidden lg:flex flex-col justify-center px-16 bg-gradient-to-br from-primary via-blue-600 to-indigo-700 text-white">
        <div className="max-w-md">
          <div className="text-4xl font-black mb-3">🛍️ MarketplaceHub</div>
          <h1 className="text-4xl font-bold leading-tight mb-4">Sign in with<br />your phone</h1>
          <p className="text-blue-100 text-lg">Quick, secure sign-in with one-time verification code.</p>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to Sign In
          </Link>

          <Link href="/" className="text-2xl font-black text-primary mb-2 lg:hidden block">
            🛍️ MarketplaceHub
          </Link>

          <h2 className="text-2xl font-bold mb-1">Phone Sign In</h2>
          <p className="text-muted-foreground mb-8">
            {step === "input" ? "Enter your Cambodian phone number" : `Code sent to +855 ${phone.replace(/^0/, "")}`}
          </p>

          {step === "input" ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5">Phone Number</label>
                <div className="flex gap-2">
                  <div className="flex items-center gap-1.5 border-2 rounded-xl px-4 bg-muted/30 text-sm font-medium text-muted-foreground shrink-0">
                    🇰🇭 +855
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="11 665 875"
                    autoFocus
                    className="flex-1 border-2 rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={sendOtp}
                disabled={sending}
                className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Phone className="w-4 h-4" />}
                {sending ? "Sending…" : "Send Code"}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5">Verification Code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="• • • • • •"
                  autoFocus
                  className="w-full border-2 rounded-xl px-4 py-4 text-center tracking-[0.6em] font-mono text-2xl bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
              <button
                type="button"
                onClick={verifyOtp}
                disabled={sending || otp.length !== 6}
                className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                {sending ? "Verifying…" : "Verify & Sign In"}
              </button>
              <div className="flex justify-between text-sm text-muted-foreground">
                <button type="button" onClick={() => { setStep("input"); setOtp(""); }}
                  className="hover:text-foreground transition">← Change number</button>
                <button type="button" onClick={sendOtp} disabled={sending}
                  className="hover:text-foreground transition disabled:opacity-50">Resend code</button>
              </div>
            </div>
          )}

          <p className="text-center text-sm text-muted-foreground mt-6">
            No account?{" "}
            <Link href="/register" className="text-primary font-semibold hover:underline">Sign up free</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
