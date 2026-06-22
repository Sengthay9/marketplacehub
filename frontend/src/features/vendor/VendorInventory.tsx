"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import VendorLayout from "@/components/layout/dashboards/VendorLayout";

export default function VendorInventory() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<number | null>(null);
  const [qty, setQty] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["vendor-inventory"],
    queryFn: async () => {
      const res = await api.get("/vendor/inventory");
      return res.data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, quantity }: { id: number; quantity: number }) =>
      api.put(`/vendor/inventory/${id}`, { quantity }),
    onSuccess: () => {
      toast.success("Stock updated.");
      qc.invalidateQueries({ queryKey: ["vendor-inventory"] });
      setEditing(null);
    },
    onError: () => toast.error("Failed to update stock."),
  });

  return (
    <VendorLayout title="Inventory">
      {isLoading ? (
        <div className="space-y-3">{[...Array(6)].map((_, i) => <div key={i} className="h-14 bg-muted rounded-xl animate-pulse" />)}</div>
      ) : (
        <div className="bg-card border rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4 font-medium">Product</th>
                <th className="text-left p-4 font-medium">SKU</th>
                <th className="text-left p-4 font-medium">Stock</th>
                <th className="text-left p-4 font-medium">Status</th>
                <th className="text-left p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data?.data?.length === 0 && (
                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No inventory items.</td></tr>
              )}
              {data?.data?.map((item: any) => {
                const isLow = item.quantity <= (item.low_stock_threshold ?? 5);
                return (
                  <tr key={item.id} className="hover:bg-muted/30">
                    <td className="p-4 font-medium">{item.product?.name ?? "—"}</td>
                    <td className="p-4 font-mono text-xs text-muted-foreground">{item.sku ?? "—"}</td>
                    <td className="p-4">
                      {editing === item.id ? (
                        <input type="number" value={qty} onChange={(e) => setQty(e.target.value)}
                          className="w-20 border rounded-lg px-2 py-1 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
                      ) : (
                        <span className={`font-semibold ${isLow ? "text-red-600" : ""}`}>{item.quantity}</span>
                      )}
                    </td>
                    <td className="p-4">
                      {isLow ? (
                        <span className="flex items-center gap-1 text-xs text-red-600 font-medium">
                          <AlertTriangle className="w-3 h-3" /> Low Stock
                        </span>
                      ) : (
                        <span className="text-xs text-green-600 font-medium">In Stock</span>
                      )}
                    </td>
                    <td className="p-4">
                      {editing === item.id ? (
                        <div className="flex gap-2">
                          <button onClick={() => updateMutation.mutate({ id: item.id, quantity: parseInt(qty) })}
                            className="px-3 py-1 bg-primary text-white rounded-lg text-xs hover:bg-primary/90">Save</button>
                          <button onClick={() => setEditing(null)}
                            className="px-3 py-1 bg-muted rounded-lg text-xs hover:bg-muted/80">Cancel</button>
                        </div>
                      ) : (
                        <button onClick={() => { setEditing(item.id); setQty(String(item.quantity)); }}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs hover:bg-blue-200">
                          Update Stock
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </VendorLayout>
  );
}
