"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Pencil, Trash2, AlertTriangle, Ban, Loader2, Boxes, ImagePlus, Search } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import api from "@/lib/axios";
import { formatCurrency } from "@/lib/utils";
import VendorLayout from "@/components/layout/dashboards/VendorLayout";

const ADMIN_STATUSES = ["suspended", "banned"];

const isSetupRequired = (product: any) =>
  product.status === "inactive" &&
  (Number(product.price) <= 0 || Number(product.stock_quantity) <= 0);

const statusStyle = (product: any) => {
  if (isSetupRequired(product))       return "bg-yellow-100 text-yellow-700";
  if (product.status === "active")    return "bg-green-100 text-green-700";
  if (product.status === "inactive")  return "bg-gray-100 text-gray-500";
  if (product.status === "suspended") return "bg-orange-100 text-orange-700";
  if (product.status === "banned")    return "bg-red-100 text-red-700";
  return "bg-muted text-muted-foreground";
};

const statusLabel = (product: any) => {
  if (isSetupRequired(product))       return "Setup Required";
  if (product.status === "active")    return "Active";
  if (product.status === "inactive")  return "Inactive";
  if (product.status === "suspended") return "Suspended";
  if (product.status === "banned")    return "Banned";
  return product.status;
};

type EditForm = { price: string; stock_quantity: string; status: "active" | "inactive" };

export default function VendorProducts() {
  const qc = useQueryClient();
  const [page,           setPage]          = useState(1);
  const [searchQuery,    setSearchQuery]   = useState("");
  const [statusFilter,   setStatusFilter]  = useState("");
  const [deleteTarget,   setDeleteTarget]  = useState<{ id: number; name: string } | null>(null);
  const [editTarget,     setEditTarget]    = useState<any | null>(null);
  const [saving,         setSaving]        = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["vendor-products", page, searchQuery, statusFilter],
    queryFn: async () => (await api.get("/vendor/products", {
      params: {
        page,
        ...(searchQuery   && { q:      searchQuery }),
        ...(statusFilter  && { status: statusFilter }),
      },
    })).data,
  });

  const handleSearch = (value: string) => { setSearchQuery(value); setPage(1); };
  const handleStatus = (value: string) => { setStatusFilter(value); setPage(1); };

  const { register, handleSubmit, reset, formState: { errors } } = useForm<EditForm>();

  const openEdit = (product: any) => {
    setEditTarget(product);
    reset({
      price:          String(product.price ?? "0"),
      stock_quantity: String(product.stock_quantity ?? "0"),
      status:         product.status === "active" ? "active" : "inactive",
    });
  };

  const onSave = async (data: EditForm) => {
    if (!editTarget) return;
    setSaving(true);
    try {
      const res = await api.put(`/vendor/products/${editTarget.id}`, {
        price:          Number(data.price),
        stock_quantity: Number(data.stock_quantity),
      });

      const updatedProduct = res.data.product;
      const needsSetup     = isSetupRequired(editTarget);

      // If it wasn't setup-required, allow manual status toggle
      if (!needsSetup && updatedProduct) {
        const wantActive = data.status === "active";
        const nowActive  = updatedProduct.status === "active";
        if (wantActive !== nowActive && !ADMIN_STATUSES.includes(updatedProduct.status)) {
          await api.post(`/vendor/products/${editTarget.id}/toggle`);
        }
      }

      const wasSetup = needsSetup && Number(data.price) > 0 && Number(data.stock_quantity) > 0;
      toast.success(wasSetup ? "Product activated and ready to sell!" : "Product updated.");
      qc.invalidateQueries({ queryKey: ["vendor-products"] });
      setEditTarget(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to update product.");
    } finally {
      setSaving(false);
    }
  };

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/vendor/products/${id}`),
    onSuccess: () => {
      toast.success("Product deleted.");
      setDeleteTarget(null);
      qc.invalidateQueries({ queryKey: ["vendor-products"] });
    },
    onError: () => toast.error("Failed to delete product."),
  });

  return (
    <VendorLayout title="Products">
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}
        </div>
      ) : !searchQuery && !statusFilter && !(data?.data?.length > 0) ? (
        <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <Boxes className="w-8 h-8 text-muted-foreground" />
          </div>
          <div>
            <p className="font-semibold text-base">No products yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Create your first product from the Inventory page.
            </p>
          </div>
          <Link
            href="/vendor/inventory"
            className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition"
          >
            Go to Inventory
          </Link>
        </div>
      ) : (
        <>
          {/* Search + filter bar */}
          <div className="flex flex-wrap gap-3 mb-6">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Search by product name…"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border-2 rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => handleStatus(e.target.value)}
              className="sm:w-44 border-2 rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="bg-card border rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-4 font-medium">Image</th>
                  <th className="text-left p-4 font-medium">Product</th>
                  <th className="text-left p-4 font-medium">Price</th>
                  <th className="text-left p-4 font-medium">Stock</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-left p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {!(data?.data?.length > 0) ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-muted-foreground">
                      No products match your search.
                    </td>
                  </tr>
                ) : (
                  data.data.map((product: any) => {
                    const isSuspended     = product.status === "suspended";
                    const isBanned        = product.status === "banned";
                    const adminRestricted = ADMIN_STATUSES.includes(product.status);
                    const needsSetup      = isSetupRequired(product);
                    const thumbUrl        = product.images?.[0]?.url ?? product.images?.[0]?.image_url ?? null;

                    return (
                      <>
                        <tr key={product.id} className={`hover:bg-muted/30 ${isBanned ? "opacity-60" : ""}`}>
                          <td className="p-4">
                            {thumbUrl ? (
                              <img src={thumbUrl} alt={product.name}
                                className="w-12 h-12 rounded-lg object-cover border" />
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-muted border flex items-center justify-center">
                                <ImagePlus className="w-5 h-5 text-muted-foreground" />
                              </div>
                            )}
                          </td>
                          <td className="p-4">
                            <p className="font-medium">{product.name}</p>
                            <p className="text-xs text-muted-foreground">{product.sku}</p>
                          </td>
                          <td className="p-4">{formatCurrency(product.price)}</td>
                          <td className="p-4">{product.stock_quantity ?? 0}</td>
                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusStyle(product)}`}>
                              {statusLabel(product)}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex gap-2">
                              {isSuspended && (
                                <Link href="/vendor/inventory"
                                  className="flex items-center gap-1 px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg text-xs font-medium hover:bg-orange-200">
                                  <Pencil className="w-3 h-3" /> Edit & Resubmit
                                </Link>
                              )}
                              {!adminRestricted && (
                                <>
                                  <button
                                    onClick={() => openEdit(product)}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-200">
                                    <Pencil className="w-3 h-3" /> Edit
                                  </button>
                                  <button
                                    onClick={() => setDeleteTarget({ id: product.id, name: product.name })}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-medium hover:bg-red-200">
                                    <Trash2 className="w-3 h-3" /> Delete
                                  </button>
                                </>
                              )}
                              {isBanned && (
                                <span className="text-xs text-muted-foreground italic">No actions available</span>
                              )}
                            </div>
                          </td>
                        </tr>

                        {needsSetup && (
                          <tr key={`${product.id}-setup`} className="bg-yellow-50">
                            <td colSpan={6} className="px-4 py-2.5">
                              <div className="flex items-start gap-2 text-yellow-700 text-xs">
                                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                                <span>
                                  <strong>Setup required:</strong> Set a price and stock quantity to activate this product for sale.
                                </span>
                              </div>
                            </td>
                          </tr>
                        )}

                        {isSuspended && (
                          <tr key={`${product.id}-suspended`} className="bg-orange-50">
                            <td colSpan={6} className="px-4 py-2.5">
                              <div className="flex items-start gap-2 text-orange-700 text-xs">
                                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                                <span>
                                  <strong>Suspended by admin:</strong> {product.warning_reason ?? "Policy violation."}{" "}
                                  Go to Inventory to edit and resubmit this product for admin review.
                                </span>
                              </div>
                            </td>
                          </tr>
                        )}

                        {isBanned && (
                          <tr key={`${product.id}-banned`} className="bg-red-50">
                            <td colSpan={6} className="px-4 py-2.5">
                              <div className="flex items-start gap-2 text-red-700 text-xs">
                                <Ban className="w-4 h-4 mt-0.5 shrink-0" />
                                <span>
                                  <strong>This item has been permanently banned by admin.</strong>{" "}
                                  {product.warning_reason ? `Reason: ${product.warning_reason}` : ""}
                                  {" "}This product has been removed from your shop and cannot be relisted.
                                </span>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })
                )}
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

      {/* ── Edit price / stock / status modal ── */}
      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-card border rounded-2xl shadow-xl w-full max-w-sm p-6 mx-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-base">Edit Product</h3>
                <p className="text-xs text-muted-foreground truncate max-w-[220px]">{editTarget.name}</p>
              </div>
              <button onClick={() => setEditTarget(null)} className="text-muted-foreground hover:text-foreground text-lg leading-none">✕</button>
            </div>

            <form onSubmit={handleSubmit(onSave)} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Price ($)</label>
                  <input
                    type="number" step="0.01" min="0"
                    {...register("price", { required: "Required", min: { value: 0, message: "≥ 0" } })}
                    className="w-full border-2 rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                  {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Stock</label>
                  <input
                    type="number" min="0"
                    {...register("stock_quantity", { required: "Required", min: { value: 0, message: "≥ 0" } })}
                    className="w-full border-2 rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                  {errors.stock_quantity && <p className="text-xs text-red-500 mt-1">{errors.stock_quantity.message}</p>}
                </div>
              </div>

              {isSetupRequired(editTarget) ? (
                <div className="rounded-xl bg-yellow-50 border border-yellow-200 px-3 py-2.5 text-xs text-yellow-700 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  Set a price and stock above — the product will auto-activate once both are set.
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Status</label>
                  <select
                    {...register("status")}
                    className="w-full border-2 rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setEditTarget(null)}
                  className="flex-1 py-2.5 border-2 rounded-xl text-sm font-medium hover:bg-muted transition">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete confirm modal ── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-card border rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4 mx-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base">Delete Product</h3>
              <button onClick={() => setDeleteTarget(null)} className="text-muted-foreground hover:text-foreground text-lg leading-none">✕</button>
            </div>
            <p className="text-sm text-muted-foreground">
              Permanently delete <span className="font-semibold text-foreground">{deleteTarget.name}</span>? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 border-2 rounded-xl text-sm font-semibold hover:bg-muted transition">
                Cancel
              </button>
              <button
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(deleteTarget.id)}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition disabled:opacity-50">
                {deleteMutation.isPending ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </VendorLayout>
  );
}
