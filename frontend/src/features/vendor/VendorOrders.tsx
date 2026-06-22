"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/axios";
import { formatCurrency } from "@/lib/utils";
import VendorLayout from "@/components/layout/dashboards/VendorLayout";

const STATUS_COLORS: Record<string, string> = {
  pending:    "bg-yellow-100 text-yellow-700",
  confirmed:  "bg-blue-100 text-blue-700",
  processing: "bg-indigo-100 text-indigo-700",
  shipped:    "bg-purple-100 text-purple-700",
  delivered:  "bg-green-100 text-green-700",
  cancelled:  "bg-red-100 text-red-700",
  refunded:   "bg-orange-100 text-orange-700",
};

export default function VendorOrders() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("all");

  const { data, isLoading } = useQuery({
    queryKey: ["vendor-orders", page, status],
    queryFn: async () => {
      const res = await api.get("/vendor/orders", { params: { page, status: status !== "all" ? status : undefined } });
      return res.data;
    },
  });

  const action = (id: number, endpoint: string, label: string) =>
    api.post(`/vendor/orders/${id}/${endpoint}`)
      .then(() => { toast.success(`Order ${label}!`); qc.invalidateQueries({ queryKey: ["vendor-orders"] }); })
      .catch(() => toast.error("Action failed."));

  return (
    <VendorLayout title="Orders">
      <div className="flex gap-2 mb-6 flex-wrap">
        {["all", "pending", "confirmed", "processing", "shipped", "delivered", "cancelled"].map((s) => (
          <button key={s} onClick={() => setStatus(s)}
            className={`px-3 py-1.5 rounded-xl text-sm font-medium capitalize transition ${status === s ? "bg-primary text-white" : "bg-muted hover:bg-muted/80"}`}>
            {s}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}</div>
      ) : (
        <div className="bg-card border rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4 font-medium">Order #</th>
                <th className="text-left p-4 font-medium">Customer</th>
                <th className="text-left p-4 font-medium">Total</th>
                <th className="text-left p-4 font-medium">Status</th>
                <th className="text-left p-4 font-medium">Date</th>
                <th className="text-left p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data?.data?.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No orders yet.</td></tr>
              )}
              {data?.data?.map((order: any) => (
                <tr key={order.id} className="hover:bg-muted/30">
                  <td className="p-4 font-mono font-medium">#{order.order_number ?? order.id}</td>
                  <td className="p-4">
                    <p className="font-medium">{order.user?.name}</p>
                    <p className="text-xs text-muted-foreground">{order.user?.email}</p>
                  </td>
                  <td className="p-4 font-medium">{formatCurrency(order.total)}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[order.status] ?? "bg-muted"}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="p-4 text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</td>
                  <td className="p-4">
                    <div className="flex gap-1">
                      {order.status === "pending"    && <button onClick={() => action(order.id, "confirm", "confirmed")}  className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs hover:bg-blue-200">Confirm</button>}
                      {order.status === "confirmed"  && <button onClick={() => action(order.id, "ship", "shipped")}       className="px-2 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs hover:bg-purple-200">Ship</button>}
                      {order.status === "shipped"    && <button onClick={() => action(order.id, "deliver", "delivered")}  className="px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs hover:bg-green-200">Deliver</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data?.last_page > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 rounded-xl text-sm bg-muted hover:bg-muted/80 disabled:opacity-40">Previous</button>
          <span className="px-4 py-2 text-sm text-muted-foreground">Page {page} of {data.last_page}</span>
          <button onClick={() => setPage((p) => p + 1)} disabled={page === data.last_page} className="px-4 py-2 rounded-xl text-sm bg-muted hover:bg-muted/80 disabled:opacity-40">Next</button>
        </div>
      )}
    </VendorLayout>
  );
}
