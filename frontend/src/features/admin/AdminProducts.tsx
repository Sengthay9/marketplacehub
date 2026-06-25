"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ShieldOff, Ban, ImageOff, RotateCcw, Search } from "lucide-react";
import api from "@/lib/axios";
import { formatCurrency } from "@/lib/utils";
import ModerationModal, { type ModerationAction } from "./ModerationModal";
import type { Product, PaginatedResponse } from "@/types";

const TABS = [
  { key: "all",       label: "All",       apiStatus: undefined,   isNew: false },
  { key: "new",       label: "New",       apiStatus: undefined,   isNew: true  },
  { key: "suspended", label: "Suspended", apiStatus: "suspended", isNew: false },
  { key: "banned",    label: "Banned",    apiStatus: "banned",    isNew: false },
];

function tabClass(key: string, active: string) {
  if (active !== key) return "bg-muted text-foreground hover:bg-muted/80";
  if (key === "new")       return "bg-yellow-500 text-white";
  if (key === "suspended") return "bg-orange-500 text-white";
  if (key === "banned")    return "bg-red-700 text-white";
  return "bg-primary text-white";
}


type ModalState = { product: Product; action: ModerationAction } | null;

function primaryImage(product: Product): string | null {
  const imgs = product.images ?? [];
  return (imgs.find((i) => i.is_primary) ?? imgs[0])?.url ?? null;
}

export default function AdminProducts() {
  const [tab, setTab]       = useState("all");
  const [search, setSearch] = useState("");
  const [modal, setModal]   = useState<ModalState>(null);

  const currentTab = TABS.find((t) => t.key === tab)!;
  const changeTab  = (t: string) => { setTab(t); setSearch(""); };

  const { data, isLoading } = useQuery({
    queryKey: ["admin-products", tab, search],
    queryFn: async () => {
      const res = await api.get("/admin/products", {
        params: {
          status: currentTab.apiStatus,
          new:    currentTab.isNew ? true : undefined,
          q:      search || undefined,
        },
      });
      return res.data as PaginatedResponse<Product>;
    },
    placeholderData: (prev) => prev,
  });

  return (
    <>
      {/* Search */}
      <div className="flex items-center gap-2 bg-muted rounded-xl px-4 py-2.5 max-w-sm mb-4">
        <Search className="w-4 h-4 text-muted-foreground shrink-0" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by product name or shop…"
          className="bg-transparent text-sm focus:outline-none flex-1"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {TABS.map((t) => (
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
        <div className="bg-card border rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4 font-medium">Image</th>
                <th className="text-left p-4 font-medium">Product</th>
                <th className="text-left px-8 py-4 font-medium">Shop</th>
                <th className="text-left px-8 py-4 font-medium">Price</th>
                <th className="text-left px-8 py-4 font-medium">Status</th>
                <th className="text-left px-8 py-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data?.data.map((product) => {
                const imgUrl = primaryImage(product);
                return (
                  <tr key={product.id} className="hover:bg-muted/30">
                    {/* Image */}
                    <td className="p-4">
                      {imgUrl ? (
                        <img src={imgUrl} alt={product.name}
                          className="w-20 h-20 rounded-xl object-cover border" />
                      ) : (
                        <div className="w-20 h-20 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
                          <ImageOff className="w-5 h-5" />
                        </div>
                      )}
                    </td>

                    {/* Name */}
                    <td className="p-4">
                      <p className="font-medium">{product.name}</p>
                      <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
                    </td>

                    <td className="px-8 py-4 text-sm text-muted-foreground">{product.shop?.name ?? "—"}</td>
                    <td className="px-8 py-4 font-semibold">{formatCurrency(product.effective_price)}</td>
                    <td className="px-8 py-4">
                      <ProductStatusBadge status={product.status} />
                    </td>

                    {/* Actions */}
                    <td className="px-8 py-4">
                      <div className="flex gap-1.5 flex-wrap">
                        {(tab === "all" || tab === "new") && (
                          <>
                            <ActionBtn icon={<AlertTriangle className="w-3 h-3" />} label="Warn"
                              cls="bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                              onClick={() => setModal({ product, action: "warn" })} />
                            <ActionBtn icon={<ShieldOff className="w-3 h-3" />} label="Suspend"
                              cls="bg-orange-100 text-orange-700 hover:bg-orange-200"
                              onClick={() => setModal({ product, action: "suspend" })} />
                            <ActionBtn icon={<Ban className="w-3 h-3" />} label="Ban"
                              cls="bg-red-100 text-red-700 hover:bg-red-200"
                              onClick={() => setModal({ product, action: "ban" })} />
                          </>
                        )}
                        {tab === "suspended" && (
                          <>
                            <ActionBtn icon={<RotateCcw className="w-3 h-3" />} label="Restore"
                              cls="bg-green-100 text-green-700 hover:bg-green-200"
                              onClick={() => setModal({ product, action: "unban" })} />
                            <ActionBtn icon={<Ban className="w-3 h-3" />} label="Ban"
                              cls="bg-red-100 text-red-700 hover:bg-red-200"
                              onClick={() => setModal({ product, action: "ban" })} />
                          </>
                        )}
                        {tab === "banned" && (
                          <span className="text-xs text-muted-foreground italic">Permanently banned</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!data?.data.length && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground text-sm">
                    No products found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <ModerationModal
          target={{ id: modal.product.id, name: modal.product.name, type: "product" }}
          action={modal.action}
          queryKey="admin-products"
          onClose={() => setModal(null)}
          onActionSuccess={(a) => {
            if (a === "suspend") setTab("suspended");
            else if (a === "ban") setTab("banned");
          }}
        />
      )}
    </>
  );
}

const PRODUCT_STATUS_STYLE: Record<string, string> = {
  active:    "bg-green-100 text-green-700",
  inactive:  "bg-gray-100 text-gray-600",
  pending:   "bg-yellow-100 text-yellow-700",
  suspended: "bg-orange-100 text-orange-700",
  banned:    "bg-red-100 text-red-700",
};

function ProductStatusBadge({ status }: { status?: string }) {
  const s = status ?? "active";
  return (
    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium capitalize ${PRODUCT_STATUS_STYLE[s] ?? "bg-muted text-muted-foreground"}`}>
      {s}
    </span>
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
