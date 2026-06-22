"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import AdminLayout from "@/components/layout/dashboards/AdminLayout";
import type { Category } from "@/types";

export default function AdminCategories() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [showForm, setShowForm] = useState(false);

  const { data: categories, isLoading } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const res = await api.get("/admin/categories");
      return res.data.data as Category[];
    },
  });

  const createMutation = useMutation({
    mutationFn: (n: string) => api.post("/admin/categories", { name: n }),
    onSuccess: () => {
      toast.success("Category created!");
      qc.invalidateQueries({ queryKey: ["admin-categories"] });
      setName(""); setShowForm(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, n }: { id: number; n: string }) => api.put(`/admin/categories/${id}`, { name: n }),
    onSuccess: () => {
      toast.success("Category updated!");
      qc.invalidateQueries({ queryKey: ["admin-categories"] });
      setEditing(null); setName("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/categories/${id}`),
    onSuccess: () => { toast.success("Category deleted."); qc.invalidateQueries({ queryKey: ["admin-categories"] }); },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (editing) updateMutation.mutate({ id: editing.id, n: name });
    else createMutation.mutate(name);
  };

  return (
    <AdminLayout title="Categories">
      <div className="flex justify-between items-center mb-6">
        <p className="text-sm text-muted-foreground">{categories?.length ?? 0} categories</p>
        <button onClick={() => { setShowForm(true); setEditing(null); setName(""); }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90">
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      {(showForm || editing) && (
        <form onSubmit={handleSubmit} className="bg-card border rounded-2xl p-5 mb-6 flex gap-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Category name"
            className="flex-1 px-4 py-2 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button type="submit"
            className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90">
            {editing ? "Update" : "Create"}
          </button>
          <button type="button" onClick={() => { setShowForm(false); setEditing(null); setName(""); }}
            className="px-4 py-2 bg-muted rounded-xl text-sm font-medium hover:bg-muted/80">
            Cancel
          </button>
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
                <th className="text-left p-4 font-medium">Name</th>
                <th className="text-left p-4 font-medium">Slug</th>
                <th className="text-left p-4 font-medium">Status</th>
                <th className="text-left p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {categories?.map((cat) => (
                <tr key={cat.id} className="hover:bg-muted/30">
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
                      <button onClick={() => { setEditing(cat); setName(cat.name); setShowForm(false); }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-200">
                        <Pencil className="w-3 h-3" /> Edit
                      </button>
                      <button onClick={() => { if (confirm("Delete this category?")) deleteMutation.mutate(cat.id); }}
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
    </AdminLayout>
  );
}
