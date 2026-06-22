"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Check, X, AlertTriangle, Clock, Ban, RotateCcw,
  CheckCircle, XCircle, ChevronRight, FileText,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { getShopStatusColor, formatDate } from "@/lib/utils";
import AdminLayout from "@/components/layout/dashboards/AdminLayout";
import ModerationModal, { type ModerationAction } from "./ModerationModal";
import type { Shop, PaginatedResponse } from "@/types";

type ShopRow = Shop & { owner: { name: string; email: string } };
type ModalState = { shop: ShopRow; action: ModerationAction } | null;

const SHOP_TABS = [
  { key: "approved",  label: "Approved" },
  { key: "suspended", label: "Suspended" },
  { key: "banned",    label: "Banned" },
  { key: "rejected",  label: "Rejected" },
];

// ── Vendor KYC panel ─────────────────────────────────
function KycPanel() {
  const [selected, setSelected]         = useState<any>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-vendor-kyc", "pending"],
    queryFn: async () => (await api.get("/admin/vendor-kyc", { params: { status: "pending" } })).data,
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
      toast.success("Application rejected.");
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
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}
          </div>
        ) : !kycs.length ? (
          <div className="bg-card border rounded-2xl p-12 text-center text-muted-foreground">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No pending applications</p>
            <p className="text-sm mt-1">New vendor applications will appear here for review.</p>
          </div>
        ) : (
          <div className="bg-card border rounded-2xl overflow-hidden">
            <div className="divide-y">
              {kycs.map((kyc: any) => (
                <button
                  key={kyc.id}
                  onClick={() => { setSelected(kyc); setShowRejectForm(false); setRejectReason(""); }}
                  className={`w-full text-left px-5 py-4 flex items-center justify-between hover:bg-muted/30 transition ${
                    selected?.id === kyc.id ? "bg-primary/5 border-l-2 border-l-primary" : ""
                  }`}
                >
                  <div>
                    <p className="font-semibold text-sm">{kyc.full_name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {kyc.user?.email} · Applied {formatDate(kyc.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-yellow-100 text-yellow-700">
                      Pending Review
                    </span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="w-96 shrink-0 bg-card border rounded-2xl p-6 h-fit sticky top-6">
          {detailLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => <div key={i} className="h-10 bg-muted rounded animate-pulse" />)}
            </div>
          ) : detail ? (
            <>
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold">KYC Application</h3>
                <button
                  onClick={() => { setSelected(null); setShowRejectForm(false); }}
                  className="text-muted-foreground hover:text-foreground text-sm transition"
                >✕</button>
              </div>

              {/* Info rows */}
              <div className="space-y-0 text-sm mb-5">
                {([
                  ["Full Name",  detail.full_name],
                  ["Email",      detail.user?.email],
                  ["DOB",        detail.date_of_birth],
                  ["Gender",     detail.gender],
                  ["ID Number",  detail.id_number],
                  ["Address",    detail.address],
                  ["City",       detail.city],
                  ["Province",   detail.province || "—"],
                  ["Applied",    formatDate(detail.created_at)],
                ] as [string, string][]).map(([label, value]) => (
                  <div key={label} className="flex justify-between border-b py-2 last:border-0">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium capitalize text-right max-w-[60%] break-words">{value}</span>
                  </div>
                ))}
              </div>

              {/* ID images */}
              {(detail.id_card_front || detail.id_card_back) && (
                <div className="grid grid-cols-2 gap-2 mb-5">
                  {detail.id_card_front && (
                    <a href={detail.id_card_front} target="_blank" rel="noopener"
                      className="block rounded-xl overflow-hidden border hover:opacity-90 transition">
                      <img src={detail.id_card_front} alt="ID Front" className="w-full h-28 object-cover" />
                      <p className="text-xs text-center py-1.5 text-muted-foreground font-medium">Front</p>
                    </a>
                  )}
                  {detail.id_card_back && (
                    <a href={detail.id_card_back} target="_blank" rel="noopener"
                      className="block rounded-xl overflow-hidden border hover:opacity-90 transition">
                      <img src={detail.id_card_back} alt="ID Back" className="w-full h-28 object-cover" />
                      <p className="text-xs text-center py-1.5 text-muted-foreground font-medium">Back</p>
                    </a>
                  )}
                </div>
              )}

              {/* Actions */}
              {!showRejectForm ? (
                <div className="flex gap-3">
                  <button
                    onClick={() => approveMutation.mutate(detail.id)}
                    disabled={approveMutation.isPending}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4" /> Approve
                  </button>
                  <button
                    onClick={() => setShowRejectForm(true)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition"
                  >
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <label className="block text-sm font-medium">Rejection reason</label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    rows={3}
                    placeholder="Explain why this application is rejected…"
                    className="w-full border rounded-xl px-3 py-2.5 text-sm bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => setShowRejectForm(false)}
                      className="flex-1 py-2.5 border rounded-xl text-sm hover:bg-muted transition">Cancel</button>
                    <button
                      onClick={() => rejectMutation.mutate({ id: detail.id, reason: rejectReason })}
                      disabled={!rejectReason.trim() || rejectMutation.isPending}
                      className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50 transition"
                    >
                      Confirm Reject
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}

// ── Shops panel ──────────────────────────────────────
function ShopsPanel({ status }: { status: string }) {
  const [modal, setModal] = useState<ModalState>(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-vendors", status],
    queryFn: async () => {
      const res = await api.get("/admin/shops", { params: { status } });
      return res.data as PaginatedResponse<ShopRow>;
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      api.post(`/admin/shops/${id}/reject`, { reason }),
    onSuccess: () => { toast.success("Shop rejected."); qc.invalidateQueries({ queryKey: ["admin-vendors"] }); },
  });

  const shops = data?.data ?? [];

  return (
    <>
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="bg-card border rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4 font-medium">Shop</th>
                <th className="text-left p-4 font-medium">Owner</th>
                <th className="text-left p-4 font-medium">Status</th>
                <th className="text-left p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {shops.map((shop) => (
                <tr key={shop.id} className="hover:bg-muted/30">
                  <td className="p-4">
                    <p className="font-medium">{shop.name}</p>
                    <p className="text-xs text-muted-foreground">/{shop.slug}</p>
                  </td>
                  <td className="p-4">
                    <p className="text-sm">{shop.owner?.name}</p>
                    <p className="text-xs text-muted-foreground">{shop.owner?.email}</p>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getShopStatusColor(shop.status)}`}>
                      {shop.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-1.5 flex-wrap">
                      {shop.status === "approved" && (
                        <>
                          <Btn icon={<AlertTriangle className="w-3 h-3" />} label="Warn"
                            cls="bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                            onClick={() => setModal({ shop, action: "warn" })} />
                          <Btn icon={<Clock className="w-3 h-3" />} label="Suspend"
                            cls="bg-orange-100 text-orange-700 hover:bg-orange-200"
                            onClick={() => setModal({ shop, action: "suspend" })} />
                          <Btn icon={<Ban className="w-3 h-3" />} label="Ban"
                            cls="bg-red-100 text-red-700 hover:bg-red-200"
                            onClick={() => setModal({ shop, action: "ban" })} />
                        </>
                      )}
                      {shop.status === "suspended" && (
                        <>
                          <Btn icon={<RotateCcw className="w-3 h-3" />} label="Restore"
                            cls="bg-green-100 text-green-700 hover:bg-green-200"
                            onClick={() => setModal({ shop, action: "unban" })} />
                          <Btn icon={<Ban className="w-3 h-3" />} label="Ban"
                            cls="bg-red-100 text-red-700 hover:bg-red-200"
                            onClick={() => setModal({ shop, action: "ban" })} />
                        </>
                      )}
                      {shop.status === "banned" && (
                        <Btn icon={<RotateCcw className="w-3 h-3" />} label="Restore"
                          cls="bg-green-100 text-green-700 hover:bg-green-200"
                          onClick={() => setModal({ shop, action: "unban" })} />
                      )}
                      {shop.status === "rejected" && (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!shops.length && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-muted-foreground text-sm">
                    No vendors found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {data && !!data.total && (
            <div className="p-4 border-t text-xs text-muted-foreground">
              Showing {data.from}–{data.to} of {data.total} vendors
            </div>
          )}
        </div>
      )}

      {modal && (
        <ModerationModal
          target={{ id: modal.shop.id, name: modal.shop.name, role: "vendor" }}
          action={modal.action}
          queryKey="admin-vendors"
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}

function Btn({ icon, label, onClick, cls }: { icon: React.ReactNode; label: string; onClick: () => void; cls: string }) {
  return (
    <button onClick={onClick}
      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${cls}`}>
      {icon} {label}
    </button>
  );
}

// ── Main page ─────────────────────────────────────────
export default function AdminVendors() {
  const [tab, setTab] = useState<string>("pending");

  const ALL_TABS = [
    { key: "pending",   label: "Pending" },
    ...SHOP_TABS,
  ];

  return (
    <AdminLayout title="Vendors">
      <div className="flex gap-2 mb-6 flex-wrap">
        {ALL_TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
              tab === t.key ? "bg-primary text-white" : "bg-muted hover:bg-muted/80"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "pending"
        ? <KycPanel />
        : <ShopsPanel status={tab} />
      }
    </AdminLayout>
  );
}
