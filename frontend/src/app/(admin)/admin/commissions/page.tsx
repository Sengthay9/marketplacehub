import AdminLayout from "@/components/layout/dashboards/AdminLayout";
import AdminCommissions from "@/features/admin/AdminCommissions";

export const metadata = { title: "Commission Management" };

export default function AdminCommissionsPage() {
  return (
    <AdminLayout title="Commission Management">
      <AdminCommissions />
    </AdminLayout>
  );
}
