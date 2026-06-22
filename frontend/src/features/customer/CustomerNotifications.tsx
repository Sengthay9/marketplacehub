"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Check, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { formatDate } from "@/lib/utils";

export default function CustomerNotifications() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => (await api.get("/customer/notifications")).data,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: number) => api.post(`/customer/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markAllMutation = useMutation({
    mutationFn: () => api.post("/customer/notifications/read-all"),
    onSuccess: () => {
      toast.success("All notifications marked as read.");
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const notifications = data?.data ?? [];
  const unread = notifications.filter((n: any) => !n.read_at).length;

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="w-6 h-6" /> Notifications
          </h1>
          {unread > 0 && (
            <p className="text-sm text-muted-foreground mt-0.5">{unread} unread</p>
          )}
        </div>
        {unread > 0 && (
          <button
            onClick={() => markAllMutation.mutate()}
            disabled={markAllMutation.isPending}
            className="flex items-center gap-1.5 text-sm text-primary hover:underline disabled:opacity-50"
          >
            <CheckCheck className="w-4 h-4" />
            Mark all read
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 bg-muted rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : !notifications.length ? (
        <div className="text-center py-20 text-muted-foreground">
          <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No notifications yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n: any) => (
            <div
              key={n.id}
              className={`flex items-start gap-4 p-4 rounded-2xl border transition ${
                n.read_at ? "bg-card" : "bg-primary/5 border-primary/20"
              }`}
            >
              <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${n.read_at ? "bg-muted" : "bg-primary"}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{n.data?.title ?? "Notification"}</p>
                {n.data?.message && (
                  <p className="text-sm text-muted-foreground mt-0.5">{n.data.message}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">{formatDate(n.created_at)}</p>
              </div>
              {!n.read_at && (
                <button
                  onClick={() => markReadMutation.mutate(n.id)}
                  className="shrink-0 p-1.5 hover:bg-muted rounded-lg"
                  title="Mark as read"
                >
                  <Check className="w-4 h-4 text-primary" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
