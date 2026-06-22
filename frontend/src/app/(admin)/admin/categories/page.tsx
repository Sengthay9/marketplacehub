import type { Metadata } from "next";
import AdminCategories from "@/features/admin/AdminCategories";

export const metadata: Metadata = { title: "Manage Categories" };

export default function AdminCategoriesPage() {
  return <AdminCategories />;
}
