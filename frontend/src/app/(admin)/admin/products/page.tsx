import type { Metadata } from "next";
import AdminProducts from "@/features/admin/AdminProducts";

export const metadata: Metadata = { title: "Manage Products" };

export default function AdminProductsPage() {
  return <AdminProducts />;
}
