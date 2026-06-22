import type { Metadata } from "next";
import VendorCoupons from "@/features/vendor/VendorCoupons";

export const metadata: Metadata = { title: "Coupons" };

export default function VendorCouponsPage() {
  return <VendorCoupons />;
}
