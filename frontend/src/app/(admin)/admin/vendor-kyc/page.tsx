import AdminLayout from "@/components/layout/dashboards/AdminLayout";
import AdminVendorKyc from "@/features/admin/AdminVendorKyc";

export const metadata = { title: "Vendor KYC" };

export default function AdminVendorKycPage() {
  return (
    <AdminLayout title="Vendor KYC Review">
      <AdminVendorKyc />
    </AdminLayout>
  );
}
