"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Send, MessageSquare, Clock, CheckCircle, CornerDownRight, Plus, X } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import VendorLayout from "@/components/layout/dashboards/VendorLayout";

const REASONS = [
  { value: "support",  label: "Support Request" },
  { value: "question", label: "Question" },
  { value: "feedback", label: "Feedback" },
  { value: "other",    label: "Other" },
];

const STATUS_META: Record<string, { label: string; color: string }> = {
  pending:   { label: "Pending",   color: "bg-yellow-100 text-yellow-700" },
  reviewing: { label: "Reviewing", color: "bg-blue-100 text-blue-700" },
  resolved:  { label: "Resolved",  color: "bg-green-100 text-green-700" },
  dismissed: { label: "Dismissed", color: "bg-gray-100 text-gray-500" },
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function VendorSupport() {
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject]   = useState("");
  const [reason, setReason]     = useState("support");
  const [message, setMessage]   = useState("");
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["my-reports"],
    queryFn: async () => (await api.get("/reports/mine")).data,
  });

  const sendMutation = useMutation({
    mutationFn: () => api.post("/reports", { subject, reason, description: message }),
    onSuccess: () => {
      toast.success("Message sent to admin.");
      setSubject(""); setReason("support"); setMessage("");
      setShowForm(false);
      qc.invalidateQueries({ queryKey: ["my-reports"] });
    },
    onError: () => toast.error("Failed to send message."),
  });

  const reports = data?.data ?? [];

  return (
    <VendorLayout title="Contact Admin">
      <div className="max-w-2xl mx-auto space-y-4">

        {/* New message button */}
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition"
          >
            <Plus className="w-4 h-4" /> New Message
          </button>
        )}

        {/* Compose form */}
        {showForm && (
          <div className="bg-card border rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-base">New Message to Admin</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-muted rounded-lg transition">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Subject</label>
              <input
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="Brief subject…"
                className="w-full border rounded-xl px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Type</label>
              <div className="flex flex-wrap gap-2">
                {REASONS.map(r => (
                  <button
                    key={r.value}
                    onClick={() => setReason(r.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                      reason === r.value ? "bg-primary text-white border-primary" : "hover:bg-muted"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Message</label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={5}
                placeholder="Describe your question or issue…"
                className="w-full border rounded-xl px-3 py-2 text-sm bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm rounded-xl border hover:bg-muted transition">
                Cancel
              </button>
              <button
                onClick={() => sendMutation.mutate()}
                disabled={!message.trim() || sendMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" /> Send
              </button>
            </div>
          </div>
        )}

        {/* Message history */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">Your Messages</h3>

          {isLoading ? (
            [...Array(3)].map((_, i) => <div key={i} className="h-20 bg-muted rounded-2xl animate-pulse" />)
          ) : reports.length === 0 ? (
            <div className="bg-card border rounded-2xl p-10 text-center text-muted-foreground">
              <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="font-medium">No messages yet</p>
              <p className="text-xs mt-1">Send a message to the admin using the button above.</p>
            </div>
          ) : (
            reports.map((r: any) => {
              const meta = STATUS_META[r.status] ?? STATUS_META.pending;
              return (
                <div key={r.id} className="bg-card border rounded-2xl p-5">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="font-semibold text-sm">{r.subject || "Message to Admin"}</p>
                      <p className="text-xs text-muted-foreground">{timeAgo(r.created_at)}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0 ${meta.color}`}>
                      {meta.label}
                    </span>
                  </div>
                  <p className="text-sm text-foreground/80 leading-relaxed">{r.description}</p>

                  {r.admin_reply && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
                        <CornerDownRight className="w-3.5 h-3.5" />
                        <span className="font-semibold">Admin reply</span>
                        {r.replied_at && <span>· {timeAgo(r.replied_at)}</span>}
                      </div>
                      <p className="text-sm leading-relaxed bg-muted/40 rounded-xl px-3 py-2">{r.admin_reply}</p>
                    </div>
                  )}

                  {r.status === "resolved" && !r.admin_reply && (
                    <div className="mt-3 flex items-center gap-1.5 text-xs text-green-600">
                      <CheckCircle className="w-3.5 h-3.5" /> Resolved by admin
                    </div>
                  )}
                  {r.status === "reviewing" && (
                    <div className="mt-3 flex items-center gap-1.5 text-xs text-blue-600">
                      <Clock className="w-3.5 h-3.5" /> Admin is reviewing your message
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </VendorLayout>
  );
}
