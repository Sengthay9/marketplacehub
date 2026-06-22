"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Mail, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import api from "@/lib/axios";

export default function VerifyEmailView() {
  const params = useSearchParams();
  const router = useRouter();
  const email = params.get("email");
  const id    = params.get("id");
  const hash  = params.get("hash");

  const [status, setStatus] = useState<"idle" | "verifying" | "success" | "error">("idle");
  const [resending, setResending] = useState(false);

  // Auto-verify if id+hash are in URL (user clicked the email link)
  useEffect(() => {
    if (id && hash) {
      setStatus("verifying");
      api.get(`/auth/email/verify/${id}/${hash}`)
        .then(() => setStatus("success"))
        .catch(() => setStatus("error"));
    }
  }, [id, hash]);

  const resend = async () => {
    if (!email) return;
    setResending(true);
    try {
      await api.post("/auth/email/resend", { email });
      toast.success("Verification email sent! Check your inbox.");
    } catch {
      toast.error("Failed to resend. Please try again.");
    } finally {
      setResending(false);
    }
  };

  // Verification result screen
  if (id && hash) {
    if (status === "verifying") {
      return (
        <div className="text-center py-10">
          <RefreshCw className="w-10 h-10 mx-auto mb-3 animate-spin text-primary" />
          <p>Verifying your email…</p>
        </div>
      );
    }
    if (status === "success") {
      return (
        <div className="text-center py-10">
          <CheckCircle className="w-14 h-14 mx-auto mb-4 text-green-500" />
          <h2 className="text-xl font-bold mb-2">Email Verified!</h2>
          <p className="text-muted-foreground mb-6">Your account is now active. You can sign in.</p>
          <Link href="/login" className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90">
            Go to Sign In
          </Link>
        </div>
      );
    }
    return (
      <div className="text-center py-10">
        <XCircle className="w-14 h-14 mx-auto mb-4 text-destructive" />
        <h2 className="text-xl font-bold mb-2">Verification Failed</h2>
        <p className="text-muted-foreground mb-4">The link may be invalid or expired.</p>
        {email && (
          <button onClick={resend} disabled={resending}
            className="text-primary text-sm hover:underline disabled:opacity-50">
            Resend verification email
          </button>
        )}
      </div>
    );
  }

  // Default "check your email" screen (after registration)
  return (
    <div className="text-center py-10">
      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
        <Mail className="w-10 h-10 text-primary" />
      </div>
      <h2 className="text-2xl font-bold mb-2">Check your email</h2>
      <p className="text-muted-foreground mb-1">
        We sent a verification link to
      </p>
      {email && (
        <p className="font-semibold mb-6">{email}</p>
      )}
      <p className="text-sm text-muted-foreground mb-8 max-w-sm mx-auto">
        Click the link in the email to verify your account. Check your spam folder if you don't see it.
      </p>

      <div className="space-y-3">
        {email && (
          <button
            onClick={resend}
            disabled={resending}
            className="w-full max-w-xs mx-auto flex items-center justify-center gap-2 px-6 py-2.5 border rounded-xl text-sm font-medium hover:bg-muted transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${resending ? "animate-spin" : ""}`} />
            {resending ? "Sending…" : "Resend verification email"}
          </button>
        )}
        <div>
          <Link href="/login" className="text-sm text-primary hover:underline">
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
