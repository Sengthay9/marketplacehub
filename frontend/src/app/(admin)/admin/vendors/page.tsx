import type { Metadata } from "next";
import AdminVendors from "@/features/admin/AdminVendors";

export const metadata: Metadata = { title: "Manage Vendors" };

export default function AdminVendorsPage() {
  return <AdminVendors />;
}
