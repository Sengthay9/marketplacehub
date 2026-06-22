import type { Metadata } from "next";
import VendorInventory from "@/features/vendor/VendorInventory";

export const metadata: Metadata = { title: "Inventory" };

export default function VendorInventoryPage() {
  return <VendorInventory />;
}
