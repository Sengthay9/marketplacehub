import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import CategoriesListing from "@/features/categories/CategoriesListing";

export const metadata: Metadata = { title: "All Categories" };

export default function CategoriesPage() {
  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <nav className="text-sm text-muted-foreground mb-6 flex items-center gap-2">
          <Link href="/" className="hover:text-foreground">Home</Link>
          <span>/</span>
          <span className="text-foreground font-medium">Categories</span>
        </nav>
        <h1 className="text-2xl font-bold mb-8">All Categories</h1>
        <Suspense fallback={
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded-2xl animate-pulse" />
            ))}
          </div>
        }>
          <CategoriesListing />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
