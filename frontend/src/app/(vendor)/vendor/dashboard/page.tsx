import type { Metadata } from "next";
import VendorDashboard from "@/features/vendor/VendorDashboard";

export const metadata: Metadata = { title: "Vendor Dashboard" };

export default function VendorDashboardPage() {
  return <VendorDashboard />;
}
