"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Inbox, Clock, Eye, CheckCircle, XCircle, Trash2, ChevronLeft,
  Flag, User, Store, ShoppingBag, Package, Circle, Send, CornerDownRight,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import AdminLayout from "@/components/layout/dashboards/AdminLayout";

type ReportStatus = "pending" | "reviewing" | "resolved" | "dismissed";

interface Reporter { id: number; name: string; email: string; role: string }
interface Report {
  id: number;
  reporter: Reporter;
  reportable_type: string | null;
  reportable_id: number | null;
  subject?: string;
  reason: string;
  description: string;
  status: ReportStatus;
  is_read: boolean;
  admin_note?: string;
  admin_reply?: string;
  replied_at?: string;
  resolved_at?: string;
  created_at: string;
}

const REASON_LABELS: Record<string, { label: string; color: string }> = {
  fraud:         { label: "Fraud",         color: "bg-red-100 text-red-700" },
  spam:          { label: "Spam",          color: "bg-orange-100 text-orange-700" },
  inappropriate: { label: "Inappropriate", color: "bg-pink-100 text-pink-700" },
  misleading:    { label: "Misleading",    color: "bg-yellow-100 text-yellow-700" },
  scam:          { label: "Scam",          color: "bg-red-100 text-red-800" },
  poor_quality:  { label: "Poor Quality",  color: "bg-gray-100 text-gray-600" },
  other:         { label: "Other",         color: "bg-muted text-muted-foreground" },
};

const STATUS_META: Record<ReportStatus, { label: string; color: string }> = {
  pending:   { label: "New Mail",  color: "bg-yellow-100 text-yellow-700" },
  reviewing: { label: "Reviewing", color: "bg-blue-100 text-blue-700" },
  resolved:  { label: "Resolved",  color: "bg-green-100 text-green-700" },
  dismissed: { label: "Dismissed", color: "bg-gray-100 text-gray-500" },
};

function reportableIcon(type: string | null) {
  if (!type) return <Flag className="w-3.5 h-3.5" />;
  if (type.includes("Product")) return <Package className="w-3.5 h-3.5" />;
  if (type.includes("Shop"))    return <Store className="w-3.5 h-3.5" />;
  if (type.includes("Order"))   return <ShoppingBag className="w-3.5 h-3.5" />;
  return <User className="w-3.5 h-3.5" />;
}

function reportableLabel(type: string | null) {
  if (!type) return "General";
  return type.split("\\").pop() ?? type;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)   return "just now";
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7)   return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function roleAvatar(role: string, name: string) {
  const initials = name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  const colors = role === "vendor"
    ? "bg-violet-100 text-violet-700"
    : "bg-sky-100 text-sky-700";
  return (
    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${colors}`}>
      {initials}
    </div>
  );
}

// ─── Mail Detail Panel ──────────────────────────────────────────────────────
function MailDetail({
  report,
  onBack,
  onDeleted,
}: {
  report: Report;
  onBack: () => void;
  onDeleted: () => void;
}) {
  const [status, setStatus]   = useState<ReportStatus>(report.status);
  const [note, setNote]       = useState(report.admin_note ?? "");
  const [reply, setReply]     = useState("");
  const qc = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: (data: object) => api.patch(`/admin/reports/${report.id}/status`, data),
    onSuccess: () => {
      toast.success("Report updated.");
      qc.invalidateQueries({ queryKey: ["admin-reports"] });
    },
    onError: () => toast.error("Update failed."),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/admin/reports/${report.id}`),
    onSuccess: () => {
      toast.success("Deleted.");
      qc.invalidateQueries({ queryKey: ["admin-reports"] });
      onDeleted();
    },
  });

  const handleSend = () => {
    updateMutation.mutate({
      status,
      admin_note: note,
      admin_reply: reply.trim() || undefined,
    });
    setReply("");
  };

  const reason = REASON_LABELS[report.reason] ?? { label: report.reason, color: "bg-muted text-muted-foreground" };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b bg-card">
        <button
          onClick={onBack}
          className="p-1.5 hover:bg-muted rounded-lg transition md:hidden"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-base truncate">
            {report.subject || `${reportableLabel(report.reportable_type)} Report`}
          </h2>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${reason.color}`}>
              {reason.label}
            </span>
            <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${STATUS_META[status].color}`}>
              {STATUS_META[status].label}
            </span>
          </div>
        </div>

        <button
          onClick={() => { if (confirm("Delete this report?")) deleteMutation.mutate(); }}
          disabled={deleteMutation.isPending}
          className="p-2 hover:bg-destructive/10 hover:text-destructive rounded-lg transition text-muted-foreground"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Body — scrollable */}
      <div className="flex-1 overflow-y-auto">
        {/* Sender info */}
        <div className="p-5 border-b">
          <div className="flex items-start gap-3">
            {roleAvatar(report.reporter.role, report.reporter.name)}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm">{report.reporter.name}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold capitalize ${
                  report.reporter.role === "vendor"
                    ? "bg-violet-100 text-violet-700"
                    : "bg-sky-100 text-sky-700"
                }`}>{report.reporter.role}</span>
              </div>
              <p className="text-xs text-muted-foreground">{report.reporter.email}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {new Date(report.created_at).toLocaleString()}
              </p>
            </div>
            {report.reportable_type && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-2.5 py-1.5 rounded-lg flex-shrink-0">
                {reportableIcon(report.reportable_type)}
                <span>{reportableLabel(report.reportable_type)}</span>
                {report.reportable_id && <span className="text-muted-foreground/60">#{report.reportable_id}</span>}
              </div>
            )}
          </div>
        </div>

        {/* Message body */}
        <div className="p-5">
          <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
            {report.description}
          </p>
        </div>

        {/* Previous admin reply */}
        {report.admin_reply && (
          <div className="mx-5 mb-5 rounded-xl border bg-muted/30 p-4">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-2">
              <CornerDownRight className="w-3.5 h-3.5" />
              Admin reply · {report.replied_at ? new Date(report.replied_at).toLocaleString() : ""}
            </div>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{report.admin_reply}</p>
          </div>
        )}

        {/* Admin note */}
        {report.admin_note && (
          <div className="mx-5 mb-5 rounded-xl border border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 p-4">
            <p className="text-xs font-semibold text-yellow-700 mb-1">Internal note</p>
            <p className="text-sm text-yellow-900 dark:text-yellow-200 leading-relaxed">{report.admin_note}</p>
          </div>
        )}
      </div>

      {/* Action footer */}
      <div className="border-t bg-card p-4 space-y-3">
        {/* Status row */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-muted-foreground mr-1">Status:</span>
          {(["pending", "reviewing", "resolved", "dismissed"] as ReportStatus[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`px-3 py-1 rounded-lg text-xs font-medium border transition ${
                status === s
                  ? "bg-primary text-white border-primary"
                  : "border hover:bg-muted"
              }`}
            >
              {STATUS_META[s].label}
            </button>
          ))}
        </div>

        {/* Internal note */}
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={1}
          placeholder="Internal note (not sent to user)…"
          className="w-full border rounded-xl px-3 py-2 text-xs bg-muted/30 resize-none focus:outline-none focus:ring-2 focus:ring-yellow-400/40 placeholder-muted-foreground/50"
        />

        {/* Reply box */}
        <div className="relative">
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            rows={2}
            placeholder="Write a reply to the user…"
            className="w-full border rounded-xl px-3 py-2 pr-12 text-sm bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button
            onClick={handleSend}
            disabled={updateMutation.isPending}
            className="absolute right-2 bottom-2 p-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Mail Row ────────────────────────────────────────────────────────────────
function MailRow({ report, isActive, onClick }: { report: Report; isActive: boolean; onClick: () => void }) {
  const reason = REASON_LABELS[report.reason] ?? { label: report.reason, color: "bg-muted text-muted-foreground" };

  return (
    <button
      onClick={onClick}
      className={`w-full text-left flex items-start gap-3 px-4 py-3 border-b transition hover:bg-muted/40 ${
        isActive ? "bg-primary/5 border-l-2 border-l-primary" : ""
      } ${!report.is_read ? "bg-muted/20" : ""}`}
    >
      {/* Unread dot */}
      <div className="flex-shrink-0 mt-2">
        {!report.is_read
          ? <Circle className="w-2 h-2 fill-primary text-primary" />
          : <span className="w-2 h-2 inline-block" />
        }
      </div>

      {roleAvatar(report.reporter.role, report.reporter.name)}

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className={`text-sm truncate ${!report.is_read ? "font-bold" : "font-medium"}`}>
            {report.reporter.name}
          </span>
          <span className="text-[10px] text-muted-foreground flex-shrink-0">{timeAgo(report.created_at)}</span>
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          {reportableIcon(report.reportable_type)}
          <span className={`text-xs truncate ${!report.is_read ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
            {report.subject || `${reportableLabel(report.reportable_type)} Report`}
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground truncate mt-0.5 leading-snug">
          {report.description}
        </p>
        <div className="flex items-center gap-1.5 mt-1.5">
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${reason.color}`}>
            {reason.label}
          </span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${STATUS_META[report.status].color}`}>
            {STATUS_META[report.status].label}
          </span>
          {report.reporter.role === "vendor" && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-700 font-semibold">
              Vendor
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminReports() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter]     = useState<string>("all");
  const [selected, setSelected]         = useState<Report | null>(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-reports", statusFilter, roleFilter],
    queryFn: async () => {
      const res = await api.get("/admin/reports", {
        params: {
          status: statusFilter !== "all" ? statusFilter : undefined,
          role:   roleFilter   !== "all" ? roleFilter   : undefined,
        },
      });
      return res.data as {
        reports: { data: Report[]; total: number; from: number; to: number };
        counts: Record<string, number>;
      };
    },
  });

  const counts  = data?.counts ?? {};
  const reports = data?.reports?.data ?? [];

  const totalUnread = counts.unread ?? 0;
  const totalAll    = Object.values(counts).reduce((a, b) => a + b, 0) - (counts.unread ?? 0);

  const FOLDERS = [
    { key: "all",       label: "All mail",   icon: Inbox,        count: data?.reports?.total ?? totalAll },
    { key: "pending",   label: "New Mail",   icon: Clock,        count: counts.pending   ?? 0 },
    { key: "reviewing", label: "Reviewing",  icon: Eye,          count: counts.reviewing ?? 0 },
    { key: "resolved",  label: "Resolved",   icon: CheckCircle,  count: counts.resolved  ?? 0 },
    { key: "dismissed", label: "Dismissed",  icon: XCircle,      count: counts.dismissed ?? 0 },
  ];

  const handleSelect = (report: Report) => {
    setSelected(report);
    // Optimistically mark as read in cache
    if (!report.is_read) {
      qc.setQueryData(["admin-reports", statusFilter, roleFilter], (old: typeof data) => {
        if (!old) return old;
        return {
          ...old,
          reports: {
            ...old.reports,
            data: old.reports.data.map(r =>
              r.id === report.id ? { ...r, is_read: true } : r
            ),
          },
          counts: { ...old.counts, unread: Math.max(0, (old.counts.unread ?? 1) - 1) },
        };
      });
    }
  };

  return (
    <AdminLayout title="Reports Inbox">
      <div className="flex h-[calc(100vh-10rem)] rounded-2xl border bg-card overflow-hidden shadow-sm">

        {/* ── Sidebar ── */}
        <div className="w-52 flex-shrink-0 border-r flex flex-col bg-muted/20">
          <div className="p-4 border-b">
            <div className="flex items-center gap-2">
              <Inbox className="w-4 h-4 text-primary" />
              <h1 className="font-bold text-sm">Inbox</h1>
              {totalUnread > 0 && (
                <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-primary text-white font-bold">
                  {totalUnread}
                </span>
              )}
            </div>
          </div>

          <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
            {FOLDERS.map(({ key, label, icon: Icon, count }) => (
              <button
                key={key}
                onClick={() => { setStatusFilter(key); setSelected(null); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition ${
                  statusFilter === key
                    ? "bg-primary text-white font-semibold"
                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="flex-1 text-left">{label}</span>
                {count > 0 && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    statusFilter === key ? "bg-white/20" : "bg-muted-foreground/20"
                  }`}>{count}</span>
                )}
              </button>
            ))}

            {/* ── Sender filter ── */}
            <div className="pt-3 pb-1 px-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">From</p>
            </div>
            {[
              { key: "all",      label: "Everyone",  icon: Inbox },
              { key: "customer", label: "Customers", icon: User  },
              { key: "vendor",   label: "Vendors",   icon: Store },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => { setRoleFilter(key); setSelected(null); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition ${
                  roleFilter === key
                    ? "bg-primary/15 text-primary font-semibold"
                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="flex-1 text-left">{label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* ── Message List ── */}
        <div className={`${selected ? "hidden md:flex" : "flex"} flex-col w-80 flex-shrink-0 border-r overflow-hidden`}>
          <div className="p-3 border-b bg-card flex items-center gap-2">
            <p className="text-xs text-muted-foreground font-medium flex-1">
              {isLoading ? "Loading…" : `${data?.reports?.total ?? 0} messages`}
            </p>
            {roleFilter !== "all" && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold capitalize ${
                roleFilter === "vendor"
                  ? "bg-violet-100 text-violet-700"
                  : "bg-sky-100 text-sky-700"
              }`}>
                {roleFilter}s only
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="space-y-px">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="flex gap-3 p-4 border-b">
                    <div className="w-9 h-9 rounded-full bg-muted animate-pulse flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-muted rounded animate-pulse w-3/4" />
                      <div className="h-2.5 bg-muted rounded animate-pulse w-1/2" />
                      <div className="h-2 bg-muted rounded animate-pulse w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : reports.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <Inbox className="w-12 h-12 text-muted-foreground/30 mb-3" />
                <p className="text-sm font-medium text-muted-foreground">No messages</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Reports from vendors and customers appear here.</p>
              </div>
            ) : (
              reports.map((r) => (
                <MailRow
                  key={r.id}
                  report={r}
                  isActive={selected?.id === r.id}
                  onClick={() => handleSelect(r)}
                />
              ))
            )}
          </div>
        </div>

        {/* ── Detail Panel ── */}
        <div className={`${selected ? "flex" : "hidden md:flex"} flex-1 flex-col overflow-hidden`}>
          {selected ? (
            <MailDetail
              key={selected.id}
              report={selected}
              onBack={() => setSelected(null)}
              onDeleted={() => setSelected(null)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <Inbox className="w-16 h-16 text-muted-foreground/20 mb-4" />
              <p className="font-semibold text-muted-foreground">Select a message</p>
              <p className="text-sm text-muted-foreground/60 mt-1">
                Click a report from the list to read it here.
              </p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
