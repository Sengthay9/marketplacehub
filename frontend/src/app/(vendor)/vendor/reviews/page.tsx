import type { Metadata } from "next";
import VendorReviews from "@/features/vendor/VendorReviews";

export const metadata: Metadata = { title: "Reviews" };

export default function VendorReviewsPage() {
  return <VendorReviews />;
}
