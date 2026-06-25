"use client";

import { useState, Fragment } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle, XCircle, Clock, Ban, RotateCcw, AlertTriangle,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { formatDate } from "@/lib/utils";
import ModerationModal, { type ModerationAction } from "./ModerationModal";

const VENDOR_TABS = [
  { key: "all",       label: "All"       },
  { key: "pending",   label: "Pending"   },
  { key: "approved",  label: "Approved"  },
  { key: "rejected",  label: "Rejected"  },
  { key: "suspended", label: "Suspended" },
  { key: "banned",    label: "Banned"    },
];

function tabClass(key: string, active: string) {
  if (active !== key) return "bg-muted text-foreground hover:bg-muted/80";
  if (key === "pending")   return "bg-yellow-500 text-white";
  if (key === "approved")  return "bg-green-600 text-white";
  if (key === "rejected")  return "bg-red-500 text-white";
  if (key === "suspended") return "bg-orange-500 text-white";
  if (key === "banned")    return "bg-red-700 text-white";
  return "bg-primary text-white";
}

const STATUS_BADGE: Record<string, string> = {
  pending:   "bg-yellow-100 text-yellow-700",
  approved:  "bg-green-100 text-green-700",
  rejected:  "bg-red-100 text-red-700",
  suspended: "bg-orange-100 text-orange-700",
  banned:    "bg-red-200 text-red-800",
};

type ModalState = { vendor: any; action: ModerationAction } | null;
type RejectState = { vendor: any; reason: string } | null;

export default function AdminVendors() {
  const [tab, setTab]         = useState("pending");
  const [search, setSearch]   = useState("");
  const [modal, setModal]     = useState<ModalState>(null);
  const [rejectModal, setRejectModal] = useState<RejectState>(null);
  const [deleteModal, setDeleteModal] = useState<any>(null);
  const [expandedShop, setExpandedShop] = useState<number | null>(null);
  const qc = useQueryClient();

  const changeTab = (t: string) => { setTab(t); setSearch(""); };

  const { data, isLoading } = useQuery({
    queryKey: ["admin-vendors", tab, search],
    queryFn: async () =>
      (await api.get("/admin/vendors", {
        params: {
          vendor_status: tab !== "all" ? tab : undefined,
          q: search || undefined,
        },
      })).data,
    placeholderData: (prev) => prev,
  });

  const approve = useMutation({
    mutationFn: (id: number) => api.post(`/admin/vendors/${id}/approve`),
    onSuccess: () => { toast.success("Vendor approved."); qc.invalidateQueries({ queryKey: ["admin-vendors"] }); },
    onError: () => toast.error("Failed to approve."),
  });

  const deleteVendor = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/users/${id}`),
    onSuccess: () => {
      toast.success("Vendor deleted.");
      setDeleteModal(null);
      qc.invalidateQueries({ queryKey: ["admin-vendors"] });
    },
    onError: () => toast.error("Failed to delete vendor."),
  });

  const reject = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      api.post(`/admin/vendors/${id}/reject`, { reason }),
    onSuccess: () => {
      toast.success("Vendor rejected. Email sent.");
      setRejectModal(null);
      qc.invalidateQueries({ queryKey: ["admin-vendors"] });
    },
    onError: () => toast.error("Failed to reject."),
  });

  const vendors = data?.data ?? [];

  return (
    <>
      <div className="flex items-center gap-2 bg-muted rounded-xl px-4 py-2.5 max-w-sm mb-4">
        <Search className="w-4 h-4 text-muted-foreground shrink-0" />
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, username or shop…"
          className="bg-transparent text-sm focus:outline-none flex-1" />
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {VENDOR_TABS.map((t) => (
          <button key={t.key} onClick={() => changeTab(t.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${tabClass(t.key, tab)}`}>
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="bg-card border rounded-2xl overflow-x-auto">
          <table className="w-full text-sm min-w-[1100px]">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground whitespace-nowrap">Name</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground whitespace-nowrap">Username</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground whitespace-nowrap">Phone</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground whitespace-nowrap">Gmail</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground whitespace-nowrap">Join Date</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground whitespace-nowrap">Shop</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground whitespace-nowrap">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {!vendors.length && (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-muted-foreground">
                    No {tab === "all" ? "" : tab} vendors found.
                  </td>
                </tr>
              )}
              {vendors.map((v: any) => (
                <Fragment key={v.id}>
                <tr
                  className={`transition cursor-pointer hover:bg-muted/40`}
                  onClick={() => setExpandedShop(expandedShop === v.id ? null : v.id)}
                >

                  {/* Name */}
                  <td className="px-4 py-3 font-semibold whitespace-nowrap">{v.name ?? "—"}</td>

                  {/* Username */}
                  <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                    {v.username ?? "—"}
                  </td>

                  {/* Phone */}
                  <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">{v.phone ?? "—"}</td>

                  {/* Gmail */}
                  <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">{v.email ?? "—"}</td>

                  {/* Join Date */}
                  <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                    {v.created_at ? formatDate(v.created_at) : "—"}
                  </td>

                  {/* Shop */}
                  <td className="px-4 py-3 text-xs whitespace-nowrap">
                    {v.shop
                      ? <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 font-medium">Active</span>
                      : <span className="px-2 py-1 rounded-full bg-muted text-muted-foreground font-medium">None</span>
                    }
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize whitespace-nowrap ${STATUS_BADGE[v.vendor_status] ?? "bg-muted text-muted-foreground"}`}>
                      {v.vendor_status ?? "—"}
                    </span>
                  </td>

                  {/* Action */}
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-1.5 flex-wrap">
                      {v.vendor_status === "pending" && (
                        <>
                          <ActionBtn icon={<CheckCircle className="w-3 h-3" />} label="Approve"
                            cls="bg-green-100 text-green-700 hover:bg-green-200"
                            onClick={() => approve.mutate(v.id)} />
                          <ActionBtn icon={<XCircle className="w-3 h-3" />} label="Reject"
                            cls="bg-red-100 text-red-700 hover:bg-red-200"
                            onClick={() => setRejectModal({ vendor: v, reason: "" })} />
                        </>
                      )}
                      {v.vendor_status === "approved" && (
                        <>
                          <ActionBtn icon={<AlertTriangle className="w-3 h-3" />} label="Warn"
                            cls="bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                            onClick={() => setModal({ vendor: v, action: "warn" })} />
                          <ActionBtn icon={<Clock className="w-3 h-3" />} label="Suspend"
                            cls="bg-orange-100 text-orange-700 hover:bg-orange-200"
                            onClick={() => setModal({ vendor: v, action: "suspend" })} />
                          <ActionBtn icon={<Ban className="w-3 h-3" />} label="Ban"
                            cls="bg-red-100 text-red-700 hover:bg-red-200"
                            onClick={() => setModal({ vendor: v, action: "ban" })} />
                        </>
                      )}
                      {v.vendor_status === "rejected" && (
                        <ActionBtn icon={<XCircle className="w-3 h-3" />} label="Delete"
                          cls="bg-red-100 text-red-700 hover:bg-red-200"
                          onClick={() => setDeleteModal(v)} />
                      )}
                      {v.vendor_status === "suspended" && (
                        <>
                          <ActionBtn icon={<RotateCcw className="w-3 h-3" />} label="Restore"
                            cls="bg-green-100 text-green-700 hover:bg-green-200"
                            onClick={() => setModal({ vendor: v, action: "unban" })} />
                          <ActionBtn icon={<Ban className="w-3 h-3" />} label="Ban"
                            cls="bg-red-100 text-red-700 hover:bg-red-200"
                            onClick={() => setModal({ vendor: v, action: "ban" })} />
                        </>
                      )}
                      {v.vendor_status === "banned" && (
                        <ActionBtn icon={<RotateCcw className="w-3 h-3" />} label="Restore"
                          cls="bg-green-100 text-green-700 hover:bg-green-200"
                          onClick={() => setModal({ vendor: v, action: "unban" })} />
                      )}
                    </div>
                  </td>
                </tr>

                {/* Expanded info row */}
                {expandedShop === v.id && (
                  <tr className="bg-muted/20 border-t">
                    <td colSpan={8} className="px-6 py-5">

                      {/* ── Shop info (approved vendors with a shop) ── */}
                      {v.shop && (
                        <div className="flex gap-8 items-start">
                          {v.shop.logo && (
                            <div className="shrink-0 flex flex-col items-center gap-1.5">
                              <div className="w-64 h-36 rounded-xl border-2 border-border overflow-hidden">
                                <img src={v.shop.logo} alt="logo" className="w-full h-full object-cover" />
                              </div>
                              <span className="text-xs text-muted-foreground font-medium">Logo</span>
                            </div>
                          )}
                          {v.shop.banner && (
                            <div className="shrink-0 flex flex-col items-center gap-1.5">
                              <div className="w-64 h-36 rounded-xl border overflow-hidden">
                                <img src={v.shop.banner} alt="banner" className="w-full h-full object-cover" />
                              </div>
                              <span className="text-xs text-muted-foreground font-medium">Background</span>
                            </div>
                          )}
                          <div className="flex flex-col gap-2 text-sm pt-1">
                            <p><span className="font-semibold text-muted-foreground">Shop Name: </span><span className="font-semibold">{v.shop.name}</span></p>
                            {v.shop.address && <p><span className="font-semibold text-muted-foreground">Location: </span><span>{v.shop.address}</span></p>}
                            {v.shop.contact_number && <p><span className="font-semibold text-muted-foreground">Phone: </span><span>{v.shop.contact_number}</span></p>}
                            {v.shop.email && <p><span className="font-semibold text-muted-foreground">Gmail: </span><span>{v.shop.email}</span></p>}
                          </div>
                        </div>
                      )}

                      {/* ── KYC info (pending / no shop vendors) ── */}
                      {!v.shop && v.vendor_kyc && (
                        <div className="flex gap-6 items-start">
                          {/* Col 1 – ID Front */}
                          <div className="flex flex-col items-center gap-1.5 shrink-0">
                            <a href={v.vendor_kyc.id_card_front} target="_blank" rel="noopener">
                              <div className="w-40 h-28 rounded-xl border-2 border-border overflow-hidden hover:opacity-90 transition">
                                <img src={v.vendor_kyc.id_card_front} alt="ID Front" className="w-full h-full object-cover" />
                              </div>
                            </a>
                            <span className="text-xs text-muted-foreground font-medium">ID Front</span>
                          </div>

                          {/* Col 2 – ID Back */}
                          <div className="flex flex-col items-center gap-1.5 shrink-0">
                            <a href={v.vendor_kyc.id_card_back} target="_blank" rel="noopener">
                              <div className="w-40 h-28 rounded-xl border-2 border-border overflow-hidden hover:opacity-90 transition">
                                <img src={v.vendor_kyc.id_card_back} alt="ID Back" className="w-full h-full object-cover" />
                              </div>
                            </a>
                            <span className="text-xs text-muted-foreground font-medium">ID Back</span>
                          </div>

                          {/* Col 3 – Selfie */}
                          <div className="flex flex-col items-center gap-1.5 shrink-0">
                            <a href={v.vendor_kyc.selfie_with_id} target="_blank" rel="noopener">
                              <div className="w-40 h-28 rounded-xl border-2 border-border overflow-hidden hover:opacity-90 transition">
                                <img src={v.vendor_kyc.selfie_with_id} alt="Selfie" className="w-full h-full object-cover" />
                              </div>
                            </a>
                            <span className="text-xs text-muted-foreground font-medium">Selfie</span>
                          </div>

                          {/* Col 4 – Gender / DOB / Purpose */}
                          <div className="flex flex-col gap-2 text-sm pt-1 shrink-0">
                            <p><span className="font-semibold text-muted-foreground">Gender: </span><span className="capitalize">{v.vendor_kyc.gender || "—"}</span></p>
                            <p><span className="font-semibold text-muted-foreground">Date of Birth: </span><span>{v.vendor_kyc.date_of_birth ? v.vendor_kyc.date_of_birth.slice(0, 10) : "—"}</span></p>
                            <p><span className="font-semibold text-muted-foreground">Purpose: </span><span>{v.vendor_kyc.purpose || "—"}</span></p>
                          </div>

                          {/* Col 5 – City / Province / Address */}
                          <div className="flex flex-col gap-2 text-sm pt-1">
                            <p><span className="font-semibold text-muted-foreground">City: </span><span>{v.vendor_kyc.city || "—"}</span></p>
                            <p><span className="font-semibold text-muted-foreground">Province: </span><span>{v.vendor_kyc.province || "—"}</span></p>
                            <p><span className="font-semibold text-muted-foreground">Address: </span><span>{v.vendor_kyc.address || "—"}</span></p>
                          </div>
                        </div>
                      )}

                      {/* No info available */}
                      {!v.shop && !v.vendor_kyc && (
                        <p className="text-sm text-muted-foreground">No KYC application on file.</p>
                      )}

                    </td>
                  </tr>
                )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <ModerationModal
          target={{ id: modal.vendor.id, name: modal.vendor.name, role: "vendor" }}
          action={modal.action}
          queryKey="admin-vendors"
          onClose={() => setModal(null)}
          onActionSuccess={(a) => {
            if (a === "suspend") changeTab("suspended");
            else if (a === "ban") changeTab("banned");
            else if (a === "unban") changeTab("approved");
          }}
        />
      )}

      {/* Delete confirm modal */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-card border rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4 mx-4">
            <h3 className="font-bold text-base">Delete Vendor Account</h3>
            <p className="text-sm text-muted-foreground">
              Permanently delete <span className="font-semibold text-foreground">{deleteModal.name}</span>? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteModal(null)} className="flex-1 py-2.5 border-2 rounded-xl text-sm font-semibold hover:bg-muted transition">Cancel</button>
              <button
                disabled={deleteVendor.isPending}
                onClick={() => deleteVendor.mutate(deleteModal.id)}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition disabled:opacity-50"
              >
                {deleteVendor.isPending ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject reason modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-card border rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4 mx-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base">Reject Vendor Application</h3>
              <button onClick={() => setRejectModal(null)} className="text-muted-foreground hover:text-foreground text-lg leading-none">✕</button>
            </div>
            <p className="text-sm text-muted-foreground">
              Rejecting <span className="font-semibold text-foreground">{rejectModal.vendor.name}</span>.
              An email with your reason will be sent to them automatically.
            </p>

            {/* Preset reason chips */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">Quick reasons — click to add:</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "ID card blurry",        text: "Your ID card photo is blurry or unclear. Please resubmit with a clear, high-quality image." },
                  { label: "ID card expired",        text: "Your ID card appears to be expired. Please provide a valid, non-expired ID." },
                  { label: "Selfie mismatch",        text: "Your selfie does not clearly match the ID card photo. Please retake the selfie holding your ID next to your face." },
                  { label: "Selfie unclear",         text: "Your selfie photo is unclear or does not show both your face and ID card at the same time." },
                  { label: "Purpose insufficient",   text: "Your stated business purpose does not provide enough detail. Please describe what products you plan to sell." },
                  { label: "Address incomplete",     text: "The address provided is incomplete or cannot be verified. Please provide your full address." },
                  { label: "Date of birth mismatch", text: "The date of birth on your application does not match what is shown on your ID card." },
                  { label: "Phone number invalid",   text: "The phone number provided appears to be invalid or unreachable. Please provide a valid contact number." },
                  { label: "Name mismatch",          text: "The name on your application does not match the name shown on your ID card." },
                ].map(({ label, text }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setRejectModal({
                      ...rejectModal,
                      reason: rejectModal.reason
                        ? rejectModal.reason.trimEnd() + "\n" + text
                        : text,
                    })}
                    className="px-3 py-1.5 rounded-full border text-xs font-medium hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1.5">Reason for rejection</label>
              <textarea
                rows={4}
                value={rejectModal.reason}
                onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
                placeholder="Select a reason above or type a custom reason…"
                className="w-full border-2 rounded-xl px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400 resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setRejectModal(null)}
                className="flex-1 py-2.5 border-2 rounded-xl text-sm font-semibold hover:bg-muted transition"
              >
                Cancel
              </button>
              <button
                disabled={!rejectModal.reason.trim() || reject.isPending}
                onClick={() => reject.mutate({ id: rejectModal.vendor.id, reason: rejectModal.reason.trim() })}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition disabled:opacity-50"
              >
                {reject.isPending ? "Rejecting…" : "Confirm Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ActionBtn({ icon, label, onClick, cls }: {
  icon: React.ReactNode; label: string; onClick: () => void; cls: string;
}) {
  return (
    <button onClick={onClick}
      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${cls}`}>
      {icon} {label}
    </button>
  );
}
