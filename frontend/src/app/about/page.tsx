import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = { title: "About Us" };

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main>
        <div className="max-w-3xl mx-auto px-4 py-16">
          <h1 className="text-4xl font-bold mb-4">About MarketplaceHub</h1>
          <p className="text-muted-foreground text-lg mb-8">
            The multi-vendor marketplace that connects buyers with trusted sellers.
          </p>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {[
              { emoji: "🛍️", title: "Browse & Buy", body: "Discover thousands of products from verified vendors across every category." },
              { emoji: "🏪", title: "Start Selling", body: "Launch your online shop in minutes and reach customers everywhere." },
              { emoji: "🔒", title: "Shop Safely", body: "Every transaction is protected. Secure payments and buyer guarantees." },
            ].map((item) => (
              <div key={item.title} className="bg-card border rounded-2xl p-6 text-center">
                <div className="text-4xl mb-3">{item.emoji}</div>
                <h3 className="font-semibold mb-1">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.body}</p>
              </div>
            ))}
          </div>

          <div className="bg-muted/40 border rounded-2xl p-8">
            <h2 className="text-2xl font-bold mb-3">How It Works</h2>
            <ol className="space-y-4">
              {[
                "Create your free account — it only takes a minute.",
                "Browse products and add your favourites to the cart.",
                "Checkout securely with your preferred payment method.",
                "Track your order from dispatch to doorstep.",
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-4">
                  <span className="w-8 h-8 shrink-0 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">{i + 1}</span>
                  <span className="text-sm pt-1">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
