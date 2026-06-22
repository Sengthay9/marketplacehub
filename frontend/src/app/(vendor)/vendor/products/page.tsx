import type { Metadata } from "next";
import VendorProducts from "@/features/vendor/VendorProducts";

export const metadata: Metadata = { title: "Products" };

export default function VendorProductsPage() {
  return <VendorProducts />;
}
