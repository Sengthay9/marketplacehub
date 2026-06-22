import type { Metadata } from "next";
import AdminCoupons from "@/features/admin/AdminCoupons";

export const metadata: Metadata = { title: "Manage Coupons" };

export default function AdminCouponsPage() {
  return <AdminCoupons />;
}
