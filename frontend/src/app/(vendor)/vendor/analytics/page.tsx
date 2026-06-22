import type { Metadata } from "next";
import VendorAnalytics from "@/features/vendor/VendorAnalytics";

export const metadata: Metadata = { title: "Analytics" };

export default function VendorAnalyticsPage() {
  return <VendorAnalytics />;
}
