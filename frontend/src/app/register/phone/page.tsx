"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Phone, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import Link from "next/link";

export default function PhoneRegisterPage() {
  const router = useRouter();

  const [phone,   setPhone]   = useState("");
  const [otp,     setOtp]     = useState("");
  const [step,    setStep]    = useState<"input" | "verify">("input");
  const [loading, setLoading] = useState(false);

  const fullPhone = () => "+855" + phone.trim().replace(/^0/, "").replace(/[\s\-]/g, "");

  const sendOtp = async () => {
    const num = phone.trim().replace(/^0/, "").replace(/[\s\-]/g, "");
    if (num.length < 7) { toast.error("Enter a valid phone number."); return; }
    setLoading(true);
    try {
      await api.post("/auth/phone/send-otp", { phone: fullPhone() });
      setStep("verify");
      toast.success("Verification code sent to your phone.");
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to send code.");
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
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-slate-900">
      <div className="w-full max-w-md bg-card border rounded-2xl shadow-lg p-8">
        <Link href="/register" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition mb-6">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>

        <div className="text-center mb-6">
          <Link href="/" className="text-2xl font-black text-primary mb-1 block">🛍️ MarketplaceHub</Link>
          <h2 className="text-xl font-bold mt-2">
            {step === "input" ? "Verify Your Phone" : "Enter Your Code"}
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            {step === "input"
              ? "We'll send a one-time verification code to your number."
              : `Code sent to +855 ${phone.replace(/^0/, "")}`}
          </p>
        </div>

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
                  className="flex-1 border-2 rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={sendOtp}
              disabled={loading}
              className="w-full py-3 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Phone className="w-4 h-4" />}
              {loading ? "Sending…" : "Send Verification Code"}
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
                className="w-full border-2 rounded-xl px-4 py-4 text-center tracking-[0.6em] font-mono text-2xl bg-background focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500"
              />
            </div>
            <button
              type="button"
              onClick={verifyOtp}
              disabled={loading || otp.length !== 6}
              className="w-full py-3 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              {loading ? "Verifying…" : "Verify Phone"}
            </button>
            <div className="flex justify-between text-sm text-muted-foreground">
              <button type="button" onClick={() => { setStep("input"); setOtp(""); }}
                className="hover:text-foreground transition">← Change number</button>
              <button type="button" onClick={sendOtp} disabled={loading}
                className="hover:text-foreground transition disabled:opacity-50">Resend code</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
