"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, X, AlertTriangle, Ban, ShieldOff, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { formatCurrency } from "@/lib/utils";
import AdminLayout from "@/components/layout/dashboards/AdminLayout";
import type { Product, PaginatedResponse } from "@/types";

const TABS = [
  { key: "all",       label: "All" },
  { key: "pending",   label: "New Products" },
  { key: "published", label: "Published" },
  { key: "suspended", label: "Suspended" },
  { key: "banned",    label: "Banned" },
];

const STATUS_BADGE: Record<string, string> = {
  published:  "bg-green-100 text-green-700",
  pending:    "bg-yellow-100 text-yellow-700",
  rejected:   "bg-red-100 text-red-700",
  suspended:  "bg-orange-100 text-orange-700",
  banned:     "bg-red-200 text-red-800",
  draft:      "bg-gray-100 text-gray-700",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "New Product",
};

export default function AdminProducts() {
  const [tab, setTab] = useState("all");
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-products", tab],
    queryFn: async () => {
      const res = await api.get("/admin/products", {
        params: { status: tab !== "all" ? tab : undefined },
      });
      return res.data as PaginatedResponse<Product>;
    },
  });

  const mutation = (endpoint: string, successMsg: string) =>
    useMutation({
      mutationFn: (payload: { id: number; reason?: string }) =>
        api.post(`/admin/products/${payload.id}/${endpoint}`, payload.reason ? { reason: payload.reason } : {}),
      onSuccess: () => {
        toast.success(successMsg);
        qc.invalidateQueries({ queryKey: ["admin-products"] });
      },
      onError: (err: any) => toast.error(err?.response?.data?.message ?? "Action failed."),
    });

  const approveMut  = mutation("approve",  "Product approved and published.");
  const rejectMut   = mutation("reject",   "Product rejected.");
  const warnMut     = mutation("warn",     "Warning sent to vendor.");
  const suspendMut  = mutation("suspend",  "Product suspended.");
  const banMut      = mutation("ban",      "Product banned.");
  const unbanMut    = mutation("unban",    "Product restored to published.");

  const promptAction = (
    label: string,
    onConfirm: (reason: string) => void,
    requireReason = true,
  ) => {
    const reason = requireReason ? prompt(`${label} reason:`) : "";
    if (requireReason && !reason) return;
    onConfirm(reason ?? "");
  };

  return (
    <AdminLayout title="Products">
      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
              tab === t.key ? "bg-primary text-white" : "bg-muted hover:bg-muted/80"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="bg-card border rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4 font-medium">Product</th>
                <th className="text-left p-4 font-medium">Shop</th>
                <th className="text-left p-4 font-medium">Price</th>
                <th className="text-left p-4 font-medium">Status</th>
                <th className="text-left p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data?.data.map((product) => (
                <tr key={product.id} className="hover:bg-muted/30">
                  <td className="p-4">
                    <p className="font-medium">{product.name}</p>
                    <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">{product.shop?.name ?? "—"}</td>
                  <td className="p-4 font-semibold">{formatCurrency(product.effective_price)}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                      STATUS_BADGE[product.status] ?? "bg-gray-100 text-gray-700"
                    }`}>
                      {STATUS_LABEL[product.status] ?? product.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-1.5 flex-wrap">
                      {/* Pending (New Products) → approve / reject / warn / suspend / ban */}
                      {product.status === "pending" && (
                        <>
                          <ActionBtn
                            icon={<Check className="w-3 h-3" />}
                            label="Approve"
                            className="bg-green-100 text-green-700 hover:bg-green-200"
                            onClick={() => approveMut.mutate({ id: product.id })}
                          />
                          <ActionBtn
                            icon={<X className="w-3 h-3" />}
                            label="Reject"
                            className="bg-red-100 text-red-700 hover:bg-red-200"
                            onClick={() => promptAction("Rejection", (reason) => rejectMut.mutate({ id: product.id, reason }))}
                          />
                          <ActionBtn
                            icon={<AlertTriangle className="w-3 h-3" />}
                            label="Warn"
                            className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                            onClick={() => promptAction("Warning", (reason) => warnMut.mutate({ id: product.id, reason }))}
                          />
                          <ActionBtn
                            icon={<ShieldOff className="w-3 h-3" />}
                            label="Suspend"
                            className="bg-orange-100 text-orange-700 hover:bg-orange-200"
                            onClick={() => promptAction("Suspension", (reason) => suspendMut.mutate({ id: product.id, reason }))}
                          />
                          <ActionBtn
                            icon={<Ban className="w-3 h-3" />}
                            label="Ban"
                            className="bg-red-100 text-red-700 hover:bg-red-200"
                            onClick={() => promptAction("Ban", (reason) => banMut.mutate({ id: product.id, reason }))}
                          />
                        </>
                      )}

                      {/* Published → warn / suspend / ban */}
                      {product.status === "published" && (
                        <>
                          <ActionBtn
                            icon={<AlertTriangle className="w-3 h-3" />}
                            label="Warn"
                            className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                            onClick={() => promptAction("Warning", (reason) => warnMut.mutate({ id: product.id, reason }))}
                          />
                          <ActionBtn
                            icon={<ShieldOff className="w-3 h-3" />}
                            label="Suspend"
                            className="bg-orange-100 text-orange-700 hover:bg-orange-200"
                            onClick={() => promptAction("Suspension", (reason) => suspendMut.mutate({ id: product.id, reason }))}
                          />
                          <ActionBtn
                            icon={<Ban className="w-3 h-3" />}
                            label="Ban"
                            className="bg-red-100 text-red-700 hover:bg-red-200"
                            onClick={() => promptAction("Ban", (reason) => banMut.mutate({ id: product.id, reason }))}
                          />
                        </>
                      )}

                      {/* Suspended → restore or ban */}
                      {product.status === "suspended" && (
                        <>
                          <ActionBtn
                            icon={<ShieldCheck className="w-3 h-3" />}
                            label="Restore"
                            className="bg-green-100 text-green-700 hover:bg-green-200"
                            onClick={() => unbanMut.mutate({ id: product.id })}
                          />
                          <ActionBtn
                            icon={<Ban className="w-3 h-3" />}
                            label="Ban"
                            className="bg-red-100 text-red-700 hover:bg-red-200"
                            onClick={() => promptAction("Ban", (reason) => banMut.mutate({ id: product.id, reason }))}
                          />
                        </>
                      )}

                      {/* Banned → restore */}
                      {product.status === "banned" && (
                        <ActionBtn
                          icon={<ShieldCheck className="w-3 h-3" />}
                          label="Restore"
                          className="bg-green-100 text-green-700 hover:bg-green-200"
                          onClick={() => unbanMut.mutate({ id: product.id })}
                        />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!data?.data.length && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground text-sm">
                    No products found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {data && !!data.total && (
            <div className="p-4 border-t text-xs text-muted-foreground">
              Showing {data.from}–{data.to} of {data.total} products
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  );
}

function ActionBtn({
  icon, label, onClick, className,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  className: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition ${className}`}
    >
      {icon} {label}
    </button>
  );
}
