"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import api from "@/lib/axios";
import { formatCurrency } from "@/lib/utils";
import VendorLayout from "@/components/layout/dashboards/VendorLayout";

export default function VendorProducts() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["vendor-products", page],
    queryFn: async () => {
      const res = await api.get("/vendor/products", { params: { page } });
      return res.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/vendor/products/${id}`),
    onSuccess: () => { toast.success("Product deleted."); qc.invalidateQueries({ queryKey: ["vendor-products"] }); },
    onError: () => toast.error("Failed to delete product."),
  });

  const statusColor: Record<string, string> = {
    published: "bg-green-100 text-green-700",
    pending:   "bg-yellow-100 text-yellow-700",
    draft:     "bg-muted text-muted-foreground",
    rejected:  "bg-red-100 text-red-700",
  };

  return (
    <VendorLayout title="Products">
      <div className="flex justify-end mb-6">
        <Link href="/vendor/products/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90">
          <Plus className="w-4 h-4" /> Add Product
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <>
          <div className="bg-card border rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-4 font-medium">Product</th>
                  <th className="text-left p-4 font-medium">Price</th>
                  <th className="text-left p-4 font-medium">Stock</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-left p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data?.data?.length === 0 && (
                  <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No products yet. Add your first product!</td></tr>
                )}
                {data?.data?.map((product: any) => (
                  <tr key={product.id} className="hover:bg-muted/30">
                    <td className="p-4">
                      <p className="font-medium">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.sku}</p>
                    </td>
                    <td className="p-4">{formatCurrency(product.price)}</td>
                    <td className="p-4">{product.stock ?? 0}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${statusColor[product.status] ?? "bg-muted"}`}>
                        {product.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <Link href={`/vendor/products/${product.id}/edit`}
                          className="flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-200">
                          <Pencil className="w-3 h-3" /> Edit
                        </Link>
                        <button onClick={() => { if (confirm("Delete this product?")) deleteMutation.mutate(product.id); }}
                          className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-medium hover:bg-red-200">
                          <Trash2 className="w-3 h-3" /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data?.last_page > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="px-4 py-2 rounded-xl text-sm bg-muted hover:bg-muted/80 disabled:opacity-40">Previous</button>
              <span className="px-4 py-2 text-sm text-muted-foreground">Page {page} of {data.last_page}</span>
              <button onClick={() => setPage((p) => p + 1)} disabled={page === data.last_page}
                className="px-4 py-2 rounded-xl text-sm bg-muted hover:bg-muted/80 disabled:opacity-40">Next</button>
            </div>
          )}
        </>
      )}
    </VendorLayout>
  );
}
