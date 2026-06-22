import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import OrderDetailView from "@/features/orders/OrderDetailView";

export const metadata: Metadata = { title: "Order Details" };

interface Props { params: Promise<{ id: string }> }

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params;
  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-10">
        <OrderDetailView orderId={Number(id)} />
      </main>
    </>
  );
}
