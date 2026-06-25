import type { Metadata } from "next";
import VendorPayouts from "@/features/vendor/VendorPayouts";

export const metadata: Metadata = { title: "Orders & Payouts" };

export default function VendorPayoutsPage() {
  return <VendorPayouts />;
}
