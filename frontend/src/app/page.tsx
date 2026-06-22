import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/features/products/HeroSection";
import CategoryGrid from "@/features/categories/CategoryGrid";
import FeaturedProducts from "@/features/products/FeaturedProducts";
import FeaturedShops from "@/features/shops/FeaturedShops";
export const metadata: Metadata = {
  title: "MarketplaceHub — Browse. Buy. Sell.",
};

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <CategoryGrid />
        <FeaturedProducts />
        <FeaturedShops />
      </main>
      <Footer />
    </>
  );
}
