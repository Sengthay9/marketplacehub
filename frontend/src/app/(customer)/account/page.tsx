import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import CartSidebar from "@/features/cart/CartSidebar";
import CustomerAccount from "@/features/customer/CustomerAccount";

export const metadata: Metadata = { title: "My Account" };

export default function AccountPage() {
  return (
    <>
      <Navbar />
      <main>
        <CustomerAccount />
      </main>
      <Footer />
      <CartSidebar />
    </>
  );
}
