import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle, Clock, Mail } from "lucide-react";

export const metadata: Metadata = { title: "Application Submitted" };

export default function VendorApplicationSubmittedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Application Submitted!</h1>
        <p className="text-muted-foreground mb-8">
          Thank you for applying to become a vendor on MarketplaceHub. Our team will review your documents and identity verification.
        </p>

        <div className="bg-card border rounded-2xl p-6 space-y-4 text-left mb-8">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">Review Timeline</p>
              <p className="text-sm text-muted-foreground">1–3 business days for identity verification</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">Email Notification</p>
              <p className="text-sm text-muted-foreground">Once approved, you'll receive your login credentials by email. Please check your inbox and spam folder.</p>
            </div>
          </div>
        </div>

        <Link href="/" className="inline-block px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition">
          Back to Home
        </Link>
      </div>
    </div>
  );
}
