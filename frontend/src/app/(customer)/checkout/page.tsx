import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import CheckoutView from "@/features/checkout/CheckoutView";

export const metadata: Metadata = { title: "Checkout" };

export default function CheckoutPage() {
  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-10">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-5 transition">
          ← Back to Home
        </Link>
        <h1 className="text-2xl font-bold mb-8">Checkout</h1>
        <CheckoutView />
      </main>
    </>
  );
}
