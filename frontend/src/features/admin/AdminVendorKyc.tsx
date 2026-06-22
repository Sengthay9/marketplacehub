"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CheckCircle, XCircle, Eye, Clock } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import api from "@/lib/axios";

type KycStatus = "all" | "pending" | "approved" | "rejected";

const statusColors: Record<string, string> = {
  pending:  "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

export default function AdminVendorKyc() {
  const [filter, setFilter] = useState<KycStatus>("pending");
  const [selected, setSelected] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-vendor-kyc", filter],
    queryFn: async () => {
      const params = filter !== "all" ? { status: filter } : {};
      return (await api.get("/admin/vendor-kyc", { params })).data;
    },
  });

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ["admin-vendor-kyc-detail", selected?.id],
    queryFn: async () => (await api.get(`/admin/vendor-kyc/${selected.id}`)).data,
    enabled: !!selected,
  });

  const approveMutation = useMutation({
    mutationFn: (id: number) => api.post(`/admin/vendor-kyc/${id}/approve`),
    onSuccess: () => {
      toast.success("Vendor approved. Credentials sent by email.");
      setSelected(null);
      qc.invalidateQueries({ queryKey: ["admin-vendor-kyc"] });
    },
    onError: () => toast.error("Failed to approve."),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      api.post(`/admin/vendor-kyc/${id}/reject`, { reason }),
    onSuccess: () => {
      toast.success("Vendor application rejected.");
      setSelected(null);
      setShowRejectForm(false);
      setRejectReason("");
      qc.invalidateQueries({ queryKey: ["admin-vendor-kyc"] });
    },
    onError: () => toast.error("Failed to reject."),
  });

  const kycs = data?.data ?? [];

  return (
    <div className="flex gap-6">
      {/* List */}
      <div className="flex-1 min-w-0">
        {/* Filter */}
        <div className="flex gap-2 mb-4">
          {(["pending", "approved", "rejected", "all"] as KycStatus[]).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border capitalize transition ${
                filter === s ? "bg-primary text-white border-primary" : "border hover:bg-muted"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}</div>
        ) : !kycs.length ? (
          <div className="text-center py-20 text-muted-foreground">
            <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No {filter !== "all" ? filter : ""} applications.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {kycs.map((kyc: any) => (
              <button
                key={kyc.id}
                onClick={() => setSelected(kyc)}
                className={`w-full text-left p-4 rounded-xl border hover:shadow-sm transition ${
                  selected?.id === kyc.id ? "border-primary bg-primary/5" : "bg-card"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm">{kyc.full_name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{kyc.user?.email} · {formatDate(kyc.created_at)}</p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${statusColors[kyc.status]}`}>
                    {kyc.status}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="w-96 shrink-0 bg-card border rounded-2xl p-6 h-fit sticky top-6">
          {detailLoading ? (
            <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-10 bg-muted rounded animate-pulse" />)}</div>
          ) : detail ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold">KYC Application</h3>
                <button onClick={() => { setSelected(null); setShowRejectForm(false); }} className="text-muted-foreground hover:text-foreground text-sm">✕</button>
              </div>

              <div className="space-y-2 text-sm mb-4">
                {[
                  ["Full Name", detail.full_name],
                  ["Email", detail.user?.email],
                  ["DOB", detail.date_of_birth],
                  ["Gender", detail.gender],
                  ["ID Number", detail.id_number],
                  ["Address", detail.address],
                  ["City", detail.city],
                  ["Province", detail.province || "—"],
                  ["Applied", formatDate(detail.created_at)],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between border-b py-1.5 last:border-0">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium capitalize">{value}</span>
                  </div>
                ))}
              </div>

              {/* ID Images */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                {detail.id_card_front && (
                  <a href={detail.id_card_front} target="_blank" rel="noopener" className="block rounded-lg overflow-hidden border">
                    <img src={detail.id_card_front} alt="ID Front" className="w-full h-28 object-cover" />
                    <p className="text-xs text-center py-1 text-muted-foreground">Front</p>
                  </a>
                )}
                {detail.id_card_back && (
                  <a href={detail.id_card_back} target="_blank" rel="noopener" className="block rounded-lg overflow-hidden border">
                    <img src={detail.id_card_back} alt="ID Back" className="w-full h-28 object-cover" />
                    <p className="text-xs text-center py-1 text-muted-foreground">Back</p>
                  </a>
                )}
              </div>

              {detail.status === "pending" && (
                <>
                  {!showRejectForm ? (
                    <div className="flex gap-3">
                      <button
                        onClick={() => approveMutation.mutate(detail.id)}
                        disabled={approveMutation.isPending}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition disabled:opacity-50"
                      >
                        <CheckCircle className="w-4 h-4" /> Approve
                      </button>
                      <button
                        onClick={() => setShowRejectForm(true)}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition"
                      >
                        <XCircle className="w-4 h-4" /> Reject
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <label className="block text-sm font-medium">Rejection Reason</label>
                      <textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        rows={3}
                        placeholder="Explain why this application is rejected…"
                        className="w-full border rounded-xl px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                      />
                      <div className="flex gap-2">
                        <button onClick={() => setShowRejectForm(false)} className="flex-1 py-2.5 border rounded-xl text-sm hover:bg-muted">Cancel</button>
                        <button
                          onClick={() => rejectMutation.mutate({ id: detail.id, reason: rejectReason })}
                          disabled={!rejectReason.trim() || rejectMutation.isPending}
                          className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium disabled:opacity-50"
                        >
                          Confirm Reject
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {detail.status !== "pending" && (
                <div className={`rounded-xl p-3 text-sm ${statusColors[detail.status]}`}>
                  <p className="font-semibold capitalize">{detail.status}</p>
                  {detail.rejection_reason && <p className="mt-1">{detail.rejection_reason}</p>}
                  {detail.reviewed_at && <p className="text-xs mt-1 opacity-70">on {formatDate(detail.reviewed_at)}</p>}
                </div>
              )}
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
