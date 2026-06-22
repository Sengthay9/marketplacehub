import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ShopsListing from "@/features/shops/ShopsListing";

export const metadata: Metadata = { title: "All Shops" };

export default function ShopsPage() {
  return (
    <>
      <Navbar />
      <main>
        <ShopsListing />
      </main>
      <Footer />
    </>
  );
}
