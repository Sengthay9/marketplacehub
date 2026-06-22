import type { Metadata } from "next";
import AdminReports from "@/features/admin/AdminReports";

export const metadata: Metadata = { title: "Reports" };

export default function AdminReportsPage() {
  return <AdminReports />;
}
