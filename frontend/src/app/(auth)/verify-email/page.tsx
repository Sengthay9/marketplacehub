import type { Metadata } from "next";
import { Suspense } from "react";
import VerifyEmailView from "@/features/auth/VerifyEmailView";

export const metadata: Metadata = { title: "Verify Email" };

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Suspense fallback={<div className="text-center py-10">Loading…</div>}>
          <VerifyEmailView />
        </Suspense>
      </div>
    </div>
  );
}
