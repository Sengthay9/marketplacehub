import type { Metadata } from "next";
import VendorPayment from "@/features/vendor/VendorPayment";

export const metadata: Metadata = { title: "Payment" };

export default function VendorPaymentPage() {
  return <VendorPayment />;
}
