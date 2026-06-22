import type { Metadata } from "next";
import AdminUsers from "@/features/admin/AdminUsers";

export const metadata: Metadata = { title: "Manage Users" };

export default function AdminUsersPage() {
  return <AdminUsers />;
}
