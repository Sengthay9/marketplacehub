"use client";

import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, ImagePlus, X } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import type { Category } from "@/types";

interface CategoryWithImage extends Category {
  image_url?: string | null;
}

export default function AdminCategories() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [editing, setEditing]       = useState<CategoryWithImage | null>(null);
  const [showForm, setShowForm]     = useState(false);
  const [name, setName]             = useState("");
  const [imageFile, setImageFile]   = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CategoryWithImage | null>(null);

  const { data: categories, isLoading } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => (await api.get("/admin/categories")).data.data as CategoryWithImage[],
  });

  function openCreate() {
    setEditing(null); setName(""); setImageFile(null); setImagePreview(null);
    setShowForm(true);
  }

  function openEdit(cat: CategoryWithImage) {
    setEditing(cat); setName(cat.name);
    setImageFile(null);
    setImagePreview(cat.image_url ?? null);
    setShowForm(false);
  }

  function cancelForm() {
    setShowForm(false); setEditing(null);
    setName(""); setImageFile(null); setImagePreview(null);
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function buildFormData() {
    const fd = new FormData();
    fd.append("name", name);
    if (imageFile) fd.append("image", imageFile);
    return fd;
  }

  const createMutation = useMutation({
    mutationFn: () => api.post("/admin/categories", buildFormData(), { headers: { "Content-Type": "multipart/form-data" } }),
    onSuccess: () => {
      toast.success("Category created!");
      qc.invalidateQueries({ queryKey: ["admin-categories"] });
      cancelForm();
    },
    onError: () => toast.error("Failed to create category."),
  });

  const updateMutation = useMutation({
    mutationFn: () => {
      const fd = buildFormData();
      fd.append("_method", "PUT");
      return api.post(`/admin/categories/${editing!.id}`, fd, { headers: { "Content-Type": "multipart/form-data" } });
    },
    onSuccess: () => {
      toast.success("Category updated!");
      qc.invalidateQueries({ queryKey: ["admin-categories"] });
      cancelForm();
    },
    onError: () => toast.error("Failed to update category."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/categories/${id}`),
    onSuccess: () => {
      toast.success("Category deleted.");
      setDeleteTarget(null);
      qc.invalidateQueries({ queryKey: ["admin-categories"] });
    },
    onError: () => toast.error("Failed to delete category."),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (editing) updateMutation.mutate();
    else createMutation.mutate();
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const isFormOpen = showForm || !!editing;

  return (
    <>
      <div className="flex justify-end mb-6">
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90">
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      {isFormOpen && (
        <form onSubmit={handleSubmit} className="bg-card border rounded-2xl p-5 mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm">{editing ? "Edit Category" : "New Category"}</h3>
            <button type="button" onClick={cancelForm} className="p-1.5 hover:bg-muted rounded-lg transition">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Image picker */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2">Category Image</p>
            <input ref={fileRef} type="file" accept="image/*" onChange={onFileChange} className="hidden" />
            {imagePreview ? (
              <div className="relative w-24 h-24">
                <img src={imagePreview} alt="preview" className="w-24 h-24 rounded-xl object-cover border" />
                <button type="button"
                  onClick={() => { setImageFile(null); setImagePreview(editing?.image_url ?? null); if (fileRef.current) fileRef.current.value = ""; }}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => fileRef.current?.click()}
                className="w-24 h-24 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-1.5 text-muted-foreground hover:bg-muted transition">
                <ImagePlus className="w-6 h-6" />
                <span className="text-[10px] font-medium">Upload</span>
              </button>
            )}
          </div>

          {/* Name */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-1">Name</p>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Category name"
              className="w-full px-4 py-2 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="flex gap-2 justify-end">
            <button type="button" onClick={cancelForm}
              className="px-4 py-2 bg-muted rounded-xl text-sm font-medium hover:bg-muted/80">
              Cancel
            </button>
            <button type="submit" disabled={isPending}
              className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
              {editing ? "Update" : "Create"}
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-muted rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="bg-card border rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4 font-medium">Image</th>
                <th className="text-left p-4 font-medium">Name</th>
                <th className="text-left p-4 font-medium">Slug</th>
                <th className="text-left p-4 font-medium">Status</th>
                <th className="text-left p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {categories?.map((cat) => (
                <tr key={cat.id} className="hover:bg-muted/30">
                  <td className="p-4">
                    {cat.image_url ? (
                      <img src={cat.image_url} alt={cat.name} className="w-16 h-16 rounded-xl object-cover border" />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
                        <ImagePlus className="w-5 h-5" />
                      </div>
                    )}
                  </td>
                  <td className="p-4 font-medium">{cat.name}</td>
                  <td className="p-4 text-muted-foreground text-xs">/{cat.slug}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      cat.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                    }`}>
                      {cat.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(cat)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-200">
                        <Pencil className="w-3 h-3" /> Edit
                      </button>
                      <button onClick={() => setDeleteTarget(cat)}
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
      )}
      {/* Delete confirm modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-card border rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4 mx-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base">Delete Category</h3>
              <button onClick={() => setDeleteTarget(null)} className="text-muted-foreground hover:text-foreground text-lg leading-none">✕</button>
            </div>
            <p className="text-sm text-muted-foreground">
              Permanently delete <span className="font-semibold text-foreground">{deleteTarget.name}</span>? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 border-2 rounded-xl text-sm font-semibold hover:bg-muted transition"
              >
                Cancel
              </button>
              <button
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(deleteTarget.id)}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition disabled:opacity-50"
              >
                {deleteMutation.isPending ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
