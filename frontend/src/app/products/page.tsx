import { Suspense } from "react";
import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ProductListingPage from "@/features/products/ProductListingPage";

export const metadata: Metadata = { title: "Products" };

export default function ProductsPage() {
  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <Suspense fallback={<div>Loading...</div>}>
          <ProductListingPage />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
