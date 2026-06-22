import AdminLayout from "@/components/layout/dashboards/AdminLayout";
import AdminAnalytics from "@/features/admin/AdminAnalytics";

export const metadata = { title: "Analytics" };

export default function AdminAnalyticsPage() {
  return (
    <AdminLayout title="Analytics">
      <AdminAnalytics />
    </AdminLayout>
  );
}
