import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ShopDetailView from "@/features/shops/ShopDetailView";

export const metadata: Metadata = { title: "Shop" };

export default function ShopDetailPage({ params }: { params: { slug: string } }) {
  return (
    <>
      <Navbar />
      <main>
        <ShopDetailView slug={params.slug} />
      </main>
      <Footer />
    </>
  );
}
