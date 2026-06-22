import type { Metadata } from "next";
import VendorOrders from "@/features/vendor/VendorOrders";

export const metadata: Metadata = { title: "Orders" };

export default function VendorOrdersPage() {
  return <VendorOrders />;
}
