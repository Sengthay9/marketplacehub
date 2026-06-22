"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, AlertTriangle, Clock, Ban, RotateCcw } from "lucide-react";
import api from "@/lib/axios";
import AdminLayout from "@/components/layout/dashboards/AdminLayout";
import ModerationModal, { type ModerationAction } from "./ModerationModal";
import type { User, PaginatedResponse } from "@/types";

type UserRow = User & { ban_type?: string | null; ban_reason?: string | null; banned_until?: string | null };
type ModalState = { user: UserRow; action: ModerationAction } | null;

const statusBadge = (user: UserRow) => {
  if (!user.deleted_at && !user.ban_type) return <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Active</span>;
  if (user.ban_type === "warn")    return <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">Warned</span>;
  if (user.ban_type === "ban")     return <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">Banned</span>;
  if (user.ban_type === "suspend") return <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">Suspended</span>;
  return <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">Restricted</span>;
};

export default function AdminUsers() {
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<ModalState>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", search],
    queryFn: async () => {
      const res = await api.get("/admin/users", { params: { q: search || undefined } });
      return res.data as PaginatedResponse<UserRow>;
    },
  });

  const isSuspendedOrBanned = (u: UserRow) => !!u.deleted_at;

  return (
    <AdminLayout title="Users">
      <div className="flex items-center gap-2 bg-muted rounded-xl px-4 py-2.5 mb-6 max-w-sm">
        <Search className="w-4 h-4 text-muted-foreground shrink-0" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email…"
          className="bg-transparent text-sm focus:outline-none flex-1"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="bg-card border rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4 font-medium">User</th>
                <th className="text-left p-4 font-medium">Joined</th>
                <th className="text-left p-4 font-medium">Status</th>
                <th className="text-left p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data?.data.map((user) => (
                <tr key={user.id} className="hover:bg-muted/30">
                  <td className="p-4">
                    <p className="font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                    {user.ban_reason && (
                      <p className="text-xs text-muted-foreground mt-0.5 italic">"{user.ban_reason}"</p>
                    )}
                  </td>
                  <td className="p-4 text-muted-foreground text-xs">
                    {new Date(user.created_at).toLocaleDateString()}
                    {user.banned_until && (
                      <p className="mt-0.5 text-orange-600">Until {new Date(user.banned_until).toLocaleDateString()}</p>
                    )}
                  </td>
                  <td className="p-4">{statusBadge(user)}</td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1.5">
                      {!isSuspendedOrBanned(user) && (
                        <>
                          <button onClick={() => setModal({ user, action: "warn" })}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-yellow-100 text-yellow-700 rounded-lg text-xs font-medium hover:bg-yellow-200 transition">
                            <AlertTriangle className="w-3 h-3" /> Warn
                          </button>
                          <button onClick={() => setModal({ user, action: "suspend" })}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-orange-100 text-orange-700 rounded-lg text-xs font-medium hover:bg-orange-200 transition">
                            <Clock className="w-3 h-3" /> Suspend
                          </button>
                          <button onClick={() => setModal({ user, action: "ban" })}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-medium hover:bg-red-200 transition">
                            <Ban className="w-3 h-3" /> Ban
                          </button>
                        </>
                      )}
                      {isSuspendedOrBanned(user) && (
                        <button onClick={() => setModal({ user, action: "unban" })}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-medium hover:bg-green-200 transition">
                          <RotateCcw className="w-3 h-3" /> Restore
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {data?.data.length === 0 && (
                <tr><td colSpan={4} className="p-8 text-center text-muted-foreground text-sm">No users found.</td></tr>
              )}
            </tbody>
          </table>
          {data && data.total > 0 && (
            <div className="p-4 border-t text-xs text-muted-foreground">
              Showing {data.from}–{data.to} of {data.total} users
            </div>
          )}
        </div>
      )}

      {modal && (
        <ModerationModal
          target={{ id: modal.user.id, name: modal.user.name }}
          action={modal.action}
          queryKey="admin-users"
          onClose={() => setModal(null)}
        />
      )}
    </AdminLayout>
  );
}
