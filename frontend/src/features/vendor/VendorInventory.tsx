"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Plus, Pencil, Trash2, X, ImagePlus, Loader2, Store, Search } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import api from "@/lib/axios";
import VendorLayout from "@/components/layout/dashboards/VendorLayout";

type CatalogForm = {
  name: string;
  category_id: string;
  description: string;
};

export default function VendorInventory() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editProduct, setEditProduct] = useState<any>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
  const [searchQuery,   setSearchQuery]   = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const { data: shop, isLoading: shopLoading } = useQuery({
    queryKey: ["vendor-shop"],
    queryFn: async () => (await api.get("/vendor/shop")).data.shop,
  });

  const { data: products, isLoading } = useQuery({
    queryKey: ["vendor-products-inventory"],
    queryFn: async () => (await api.get("/vendor/products", { params: { per_page: 100 } })).data.data,
    enabled: !!shop,
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => (await api.get("/categories")).data.data,
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CatalogForm>();

  const openCreate = () => {
    reset({ name: "", category_id: "", description: "" });
    setImageFile(null);
    setImagePreview(null);
    setModal("create");
  };

  const openEdit = (product: any) => {
    setEditProduct(product);
    reset({
      name:        product.name ?? "",
      category_id: String(product.category_id ?? ""),
      description: product.description ?? "",
    });
    setImageFile(null);
    const primary = product.images?.find((i: any) => i.is_primary) ?? product.images?.[0];
    setImagePreview(primary?.url ?? primary?.image_url ?? null);
    setModal("edit");
  };

  const closeModal = () => { setModal(null); setEditProduct(null); };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const uploadImage = async (productId: number) => {
    if (!imageFile) return;
    if (modal === "edit" && editProduct?.images?.length > 0) {
      await Promise.all(
        editProduct.images.map((img: any) =>
          api.delete(`/vendor/products/${productId}/images/${img.id}`).catch(() => {})
        )
      );
    }
    const form = new FormData();
    form.append("images[]", imageFile);
    await api.post(`/vendor/products/${productId}/images`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  };

  const createMutation = useMutation({
    mutationFn: async (data: CatalogForm) => {
      const res = await api.post("/vendor/products", {
        name:        data.name.trim(),
        category_id: Number(data.category_id),
        description: data.description.trim() || null,
      });
      return res.data.product;
    },
    onSuccess: async (product) => {
      try {
        setUploading(true);
        await uploadImage(product.id);
      } catch {}
      setUploading(false);
      toast.success("Product created.");
      qc.invalidateQueries({ queryKey: ["vendor-products-inventory"] });
      qc.invalidateQueries({ queryKey: ["vendor-products"] });
      closeModal();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Failed to create product."),
  });

  const editMutation = useMutation({
    mutationFn: async (data: CatalogForm) => {
      await api.put(`/vendor/products/${editProduct.id}`, {
        name:        data.name.trim(),
        category_id: Number(data.category_id),
        description: data.description.trim() || null,
      });
      return editProduct.id;
    },
    onSuccess: async (productId) => {
      try {
        setUploading(true);
        await uploadImage(productId);
      } catch {}
      setUploading(false);
      toast.success("Product updated.");
      qc.invalidateQueries({ queryKey: ["vendor-products-inventory"] });
      qc.invalidateQueries({ queryKey: ["vendor-products"] });
      closeModal();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Failed to update product."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/vendor/products/${id}`),
    onSuccess: () => {
      toast.success("Product deleted.");
      setDeleteTarget(null);
      qc.invalidateQueries({ queryKey: ["vendor-products-inventory"] });
      qc.invalidateQueries({ queryKey: ["vendor-products"] });
    },
    onError: () => toast.error("Failed to delete product."),
  });

  const onSubmit = (data: CatalogForm) => {
    if (modal === "create") createMutation.mutate(data);
    else editMutation.mutate(data);
  };

  const isSaving = createMutation.isPending || editMutation.isPending || uploading;

  const filteredProducts = (products ?? []).filter((p: any) => {
    const matchesName = p.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat  = !categoryFilter || String(p.category_id) === categoryFilter;
    return matchesName && matchesCat;
  });

  if (!shopLoading && !shop) {
    return (
      <VendorLayout title="Inventory">
        <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <Store className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-bold">No shop yet</h3>
          <p className="text-muted-foreground text-sm max-w-xs">
            You need to set up your shop before you can add products to your inventory.
          </p>
          <Link
            href="/vendor/shop"
            className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition"
          >
            Set Up My Shop
          </Link>
        </div>
      </VendorLayout>
    );
  }

  return (
    <VendorLayout title="Inventory">
      <div className="flex flex-wrap gap-3 mb-6">
        {/* Search — fixed width ~40% of a full row */}
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search product name…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border-2 rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>
        {/* Category filter — compact fixed width */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="w-36 border-2 rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        >
          <option value="">All Categories</option>
          {categories?.map((cat: any) => (
            <option key={cat.id} value={String(cat.id)}>{cat.name}</option>
          ))}
        </select>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 whitespace-nowrap ml-auto">
          <Plus className="w-4 h-4" /> New Product
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="bg-card border rounded-2xl overflow-hidden">
          <table className="w-full text-sm table-fixed">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left p-4 font-medium w-[20%]">Image</th>
                <th className="text-left p-4 font-medium w-[20%]">Name</th>
                <th className="text-left p-4 font-medium w-[20%]">Category</th>
                <th className="text-left p-4 font-medium w-[20%]">Description</th>
                <th className="text-left p-4 font-medium w-[20%]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {!filteredProducts.length && (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-muted-foreground">
                    {searchQuery || categoryFilter ? "No products match your search." : "No products yet. Create your first product."}
                  </td>
                </tr>
              )}
              {filteredProducts.map((p: any) => {
                const thumb = p.images?.[0]?.url ?? p.images?.[0]?.image_url ?? null;
                return (
                  <tr key={p.id} className="hover:bg-muted/30">
                    {/* Image */}
                    <td className="p-4">
                      <div className="w-20 h-20 rounded-xl bg-muted overflow-hidden flex-shrink-0 border">
                        {thumb
                          ? <img src={thumb} alt={p.name} className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-muted-foreground"><ImagePlus className="w-6 h-6" /></div>
                        }
                      </div>
                    </td>
                    {/* Name */}
                    <td className="p-4">
                      <p className="font-semibold leading-snug">{p.name}</p>
                    </td>
                    {/* Category */}
                    <td className="p-4 text-muted-foreground">
                      {p.category?.name ?? <span className="italic text-xs">No category</span>}
                    </td>
                    {/* Description — truncated to 1 line */}
                    <td className="p-4 text-muted-foreground max-w-xs">
                      {p.description
                        ? <span className="line-clamp-1 text-xs">{p.description}</span>
                        : <span className="italic text-xs">—</span>
                      }
                    </td>
                    {/* Actions */}
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(p)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-200">
                          <Pencil className="w-3 h-3" /> Edit
                        </button>
                        <button onClick={() => setDeleteTarget({ id: p.id, name: p.name })}
                          className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-medium hover:bg-red-200">
                          <Trash2 className="w-3 h-3" /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-card rounded-2xl w-full max-w-lg shadow-xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="font-bold text-lg">{modal === "create" ? "New Product" : "Edit Product"}</h2>
              <button onClick={closeModal} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
              {/* Product Image — single slot */}
              <div>
                <label className="block text-sm font-semibold mb-2">Product Image</label>
                <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-xl cursor-pointer hover:bg-muted/50 transition overflow-hidden relative group">
                  {imagePreview
                    ? <>
                        <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                          <span className="text-white text-xs font-semibold">Click to replace</span>
                        </div>
                      </>
                    : (
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <ImagePlus className="w-8 h-8" />
                        <span className="text-xs">Click to upload image</span>
                      </div>
                    )
                  }
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                </label>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-semibold mb-1.5">Product Name *</label>
                <input {...register("name", { required: "Required" })}
                  placeholder="e.g. Wireless Earbuds"
                  className="w-full border-2 rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-semibold mb-1.5">Category *</label>
                <select {...register("category_id", { required: "Required" })}
                  className="w-full border-2 rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary">
                  <option value="">Select a category</option>
                  {categories?.map((cat: any) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                {errors.category_id && <p className="text-xs text-red-500 mt-1">{errors.category_id.message}</p>}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold mb-1.5">Description</label>
                <textarea {...register("description")} rows={3}
                  placeholder="Describe your product…"
                  className="w-full border-2 rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none" />
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={closeModal}
                  className="flex-1 py-2.5 border-2 rounded-xl text-sm font-medium hover:bg-muted transition">
                  Cancel
                </button>
                <button type="submit" disabled={isSaving}
                  className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition disabled:opacity-50 flex items-center justify-center gap-2">
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isSaving ? "Saving…" : modal === "create" ? "Create Product" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Delete confirm modal */}
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
