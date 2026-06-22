import type { Metadata } from "next";
import VendorSettings from "@/features/vendor/VendorSettings";

export const metadata: Metadata = { title: "Settings" };

export default function VendorSettingsPage() {
  return <VendorSettings />;
}
