import type { Metadata } from "next";
import Link from "next/link";
import VendorRegisterForm from "@/features/auth/VendorRegisterForm";

export const metadata: Metadata = { title: "Become a Vendor" };

export default function VendorRegisterPage() {
  return (
    <div className="min-h-screen bg-muted/30 py-10 px-4">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-black text-primary">🛍️ MarketplaceHub</Link>
          <h1 className="text-2xl font-bold mt-4 mb-1">Become a Vendor</h1>
          <p className="text-muted-foreground text-sm">
            Submit your ID verification to start selling on MarketplaceHub
          </p>
        </div>
        <div className="bg-card border rounded-2xl p-8">
          <VendorRegisterForm />
        </div>
      </div>
    </div>
  );
}
