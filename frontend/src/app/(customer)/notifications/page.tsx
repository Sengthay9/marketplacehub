import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import CustomerNotifications from "@/features/customer/CustomerNotifications";

export const metadata: Metadata = { title: "Notifications" };

export default function NotificationsPage() {
  return (
    <>
      <Navbar />
      <main>
        <CustomerNotifications />
      </main>
      <Footer />
    </>
  );
}
