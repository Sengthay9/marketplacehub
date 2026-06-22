import type { Metadata } from "next";
import VendorShop from "@/features/vendor/VendorShop";

export const metadata: Metadata = { title: "My Shop" };

export default function VendorShopPage() {
  return <VendorShop />;
}
