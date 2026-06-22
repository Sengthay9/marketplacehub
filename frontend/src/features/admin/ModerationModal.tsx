"use client";

import { useState } from "react";
import { X, AlertTriangle, Clock, Ban, RotateCcw } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/axios";

export type ModerationAction = "warn" | "suspend" | "ban" | "unban";

interface Target { id: number; name: string; role?: string }

interface Props {
  target: Target;
  action: ModerationAction;
  queryKey: string;
  onClose: () => void;
}

const SUSPEND_OPTIONS = [
  { label: "1 day",    days: 1   },
  { label: "3 days",   days: 3   },
  { label: "1 week",   days: 7   },
  { label: "2 weeks",  days: 14  },
  { label: "1 month",  days: 30  },
  { label: "3 months", days: 90  },
];

const CONFIG = {
  warn: {
    icon: AlertTriangle,
    color: "text-yellow-600",
    bg: "bg-yellow-50",
    border: "border-yellow-200",
    title: "Send Warning",
    btnClass: "bg-yellow-500 hover:bg-yellow-600 text-white",
    btnLabel: "Send Warning",
  },
  suspend: {
    icon: Clock,
    color: "text-orange-600",
    bg: "bg-orange-50",
    border: "border-orange-200",
    title: "Suspend Account",
    btnClass: "bg-orange-500 hover:bg-orange-600 text-white",
    btnLabel: "Suspend",
  },
  ban: {
    icon: Ban,
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-200",
    title: "Permanently Ban",
    btnClass: "bg-red-600 hover:bg-red-700 text-white",
    btnLabel: "Ban Permanently",
  },
  unban: {
    icon: RotateCcw,
    color: "text-green-600",
    bg: "bg-green-50",
    border: "border-green-200",
    title: "Restore Account",
    btnClass: "bg-green-600 hover:bg-green-700 text-white",
    btnLabel: "Restore Account",
  },
};

export default function ModerationModal({ target, action, queryKey, onClose }: Props) {
  const [reason, setReason] = useState("");
  const [days, setDays] = useState(7);
  const [banConfirm, setBanConfirm] = useState("");
  const qc = useQueryClient();
  const cfg = CONFIG[action];
  const Icon = cfg.icon;

  const baseUrl = target.role === "vendor" ? `/admin/shops` : `/admin/users`;

  const mutation = useMutation({
    mutationFn: () => {
      if (action === "warn")    return api.post(`${baseUrl}/${target.id}/warn`,    { reason });
      if (action === "suspend") return api.post(`${baseUrl}/${target.id}/suspend`, { reason, days });
      if (action === "ban")     return api.post(`${baseUrl}/${target.id}/ban`,     { reason });
      return api.post(`${baseUrl}/${target.id}/unban`);
    },
    onSuccess: (res) => {
      toast.success(res.data.message);
      qc.invalidateQueries({ queryKey: [queryKey] });
      onClose();
    },
    onError: () => toast.error("Action failed. Please try again."),
  });

  const canSubmit = () => {
    if (action === "unban")   return true;
    if (action === "ban")     return reason.trim().length > 0 && banConfirm === "BAN";
    return reason.trim().length > 0;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-card border rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className={`flex items-center gap-3 p-5 border-b rounded-t-2xl ${cfg.bg} ${cfg.border} border`}>
          <div className={`w-10 h-10 rounded-xl ${cfg.bg} border ${cfg.border} flex items-center justify-center shrink-0`}>
            <Icon className={`w-5 h-5 ${cfg.color}`} />
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-base">{cfg.title}</h2>
            <p className="text-sm text-muted-foreground">{target.name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-black/10 rounded-lg transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Unban — simple confirmation */}
          {action === "unban" && (
            <p className="text-sm text-muted-foreground">
              This will restore <strong>{target.name}</strong>'s account. They will be able to log in again and all restrictions will be lifted.
            </p>
          )}

          {/* Warn / Suspend / Ban — reason input */}
          {action !== "unban" && (
            <div>
              <label className="block text-sm font-medium mb-1.5">
                {action === "warn" ? "Warning message" : "Reason"}
                <span className="text-destructive ml-1">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder={
                  action === "warn"
                    ? "Explain the warning to the user…"
                    : action === "suspend"
                    ? "Why is this account being suspended?"
                    : "Why is this account being permanently banned?"
                }
                className="w-full border rounded-xl px-3 py-2.5 text-sm bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          )}

          {/* Suspend — duration picker */}
          {action === "suspend" && (
            <div>
              <label className="block text-sm font-medium mb-1.5">Suspension duration</label>
              <div className="grid grid-cols-3 gap-2">
                {SUSPEND_OPTIONS.map((opt) => (
                  <button
                    key={opt.days}
                    onClick={() => setDays(opt.days)}
                    className={`py-2 rounded-xl text-sm font-medium border transition ${
                      days === opt.days
                        ? "bg-orange-500 text-white border-orange-500"
                        : "border hover:bg-muted"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Account will auto-restore on {new Date(Date.now() + days * 86400000).toLocaleDateString()}.
              </p>
            </div>
          )}

          {/* Ban — type BAN to confirm */}
          {action === "ban" && (
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Type <strong className="text-red-600">BAN</strong> to confirm permanent ban
              </label>
              <input
                value={banConfirm}
                onChange={(e) => setBanConfirm(e.target.value)}
                placeholder="Type BAN"
                className="w-full border border-red-200 rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-red-300"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-5 pb-5">
          <button onClick={onClose}
            className="flex-1 py-2.5 border rounded-xl text-sm font-medium hover:bg-muted transition">
            Cancel
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={!canSubmit() || mutation.isPending}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-40 ${cfg.btnClass}`}
          >
            {mutation.isPending ? "Processing…" : cfg.btnLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
