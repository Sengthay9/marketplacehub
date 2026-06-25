"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, AlertTriangle, Clock, Ban, RotateCcw, Users } from "lucide-react";
import api from "@/lib/axios";
import ModerationModal, { type ModerationAction } from "./ModerationModal";
import type { User, PaginatedResponse } from "@/types";

type UserRow = User & {
  ban_type?: "warn" | "suspend" | "ban" | null;
  ban_reason?: string | null;
  banned_until?: string | null;
};

type Filter = "all" | "new" | "suspended" | "banned";
type ModalState = { user: UserRow; action: ModerationAction } | null;

function isActive(u: UserRow) {
  return u.ban_type !== "suspend" && u.ban_type !== "ban";
}

function UserStatusBadge({ user }: { user: UserRow }) {
  if (user.ban_type === "ban")
    return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700"><Ban className="w-3 h-3" /> Banned</span>;
  if (user.ban_type === "suspend")
    return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700"><Clock className="w-3 h-3" /> Suspended</span>;
  if (user.ban_type === "warn")
    return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700"><AlertTriangle className="w-3 h-3" /> Warned</span>;
  return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">Active</span>;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all",       label: "All" },
  { value: "new",       label: "New" },
  { value: "suspended", label: "Suspended" },
  { value: "banned",    label: "Banned" },
];

export default function AdminUsers() {
  const [search, setSearch]   = useState("");
  const [filter, setFilter]   = useState<Filter>("all");
  const [modal, setModal]     = useState<ModalState>(null);
  const [page, setPage]       = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", search, filter, page],
    queryFn: async () => {
      const res = await api.get("/admin/users", {
        params: {
          q:      search || undefined,
          filter: filter !== "all" ? filter : undefined,
          page,
        },
      });
      return res.data as PaginatedResponse<UserRow>;
    },
    placeholderData: (prev) => prev,
  });

  const users       = data?.data ?? [];
  const isBanned    = (u: UserRow) => u.ban_type === "ban";
  const isSuspended = (u: UserRow) => u.ban_type === "suspend";
  const hasStatus   = (u: UserRow) => !!u.ban_type;

  const changeFilter = (f: Filter) => { setFilter(f); setPage(1); };

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-col gap-3 mb-6">
        {/* Search */}
        <div className="flex items-center gap-2 bg-muted rounded-xl px-4 py-2.5 max-w-sm">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name or email…"
            className="bg-transparent text-sm focus:outline-none flex-1"
          />
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => changeFilter(f.value)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                filter === f.value
                  ? f.value === "banned"
                    ? "bg-red-600 text-white"
                    : f.value === "suspended"
                    ? "bg-orange-500 text-white"
                    : f.value === "new"
                    ? "bg-emerald-500 text-white"
                    : "bg-primary text-white"
                  : "bg-muted hover:bg-muted/80 text-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-14 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="bg-card border rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground">Name</th>
                <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground">Username</th>
                <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground">Gmail</th>
                <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground">Phone</th>
                <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground">Join Date</th>
                <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground">Status</th>
                <th className="text-left px-5 py-3.5 font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-14 text-center text-muted-foreground">
                    <Users className="w-10 h-10 mx-auto mb-3 opacity-20" />
                    <p className="font-medium">No {filter === "all" ? "" : filter === "new" ? "new" : filter} customers found</p>
                  </td>
                </tr>
              )}
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-muted/30 transition-colors">

                  {/* Name */}
                  <td className="px-5 py-4">
                    <p className="font-semibold">{user.name}</p>
                  </td>

                  {/* Username */}
                  <td className="px-5 py-4 text-sm text-muted-foreground">
                    {user.username ?? "—"}
                  </td>

                  {/* Gmail */}
                  <td className="px-5 py-4 text-sm text-muted-foreground">
                    {user.email ?? "—"}
                  </td>

                  {/* Phone */}
                  <td className="px-5 py-4 text-sm text-muted-foreground">
                    {user.phone ?? "—"}
                  </td>

                  {/* Join date */}
                  <td className="px-5 py-4">
                    <p className="text-sm">{formatDate(user.created_at)}</p>
                  </td>

                  {/* Status */}
                  <td className="px-5 py-4">
                    <UserStatusBadge user={user} />
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {(filter === "all" || filter === "new") && (
                        <>
                          <button onClick={() => setModal({ user, action: "warn" })}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-yellow-100 text-yellow-700 rounded-lg text-xs font-medium hover:bg-yellow-200 transition">
                            <AlertTriangle className="w-3 h-3" /> Warning
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
                      {filter === "suspended" && (
                        <>
                          <button onClick={() => setModal({ user, action: "unban" })}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-medium hover:bg-green-200 transition">
                            <RotateCcw className="w-3 h-3" /> Restore
                          </button>
                          <button onClick={() => setModal({ user, action: "ban" })}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-medium hover:bg-red-200 transition">
                            <Ban className="w-3 h-3" /> Ban
                          </button>
                        </>
                      )}
                      {filter === "banned" && (
                        <button onClick={() => setModal({ user, action: "unban" })}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-medium hover:bg-green-200 transition">
                          <RotateCcw className="w-3 h-3" /> Restore
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {data && data.last_page > 1 && (
            <div className="px-5 py-3 border-t flex items-center justify-between text-xs text-muted-foreground">
              <span>Showing {data.from}–{data.to} of {data.total}</span>
              <div className="flex gap-1">
                <button onClick={() => setPage((p) => p - 1)} disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg border text-xs font-medium hover:bg-muted disabled:opacity-40">
                  Previous
                </button>
                <button onClick={() => setPage((p) => p + 1)} disabled={page === data.last_page}
                  className="px-3 py-1.5 rounded-lg border text-xs font-medium hover:bg-muted disabled:opacity-40">
                  Next
                </button>
              </div>
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
          onActionSuccess={(a) => {
            if (a === "suspend") changeFilter("suspended");
            else if (a === "ban") changeFilter("banned");
            else if (a === "unban") changeFilter(filter === "new" ? "new" : "all");
          }}
        />
      )}
    </>
  );
}
