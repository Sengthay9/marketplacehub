"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Star, MessageSquare, Trash2, Pencil, X, Reply, Store, Package } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { formatDate } from "@/lib/utils";
import VendorLayout from "@/components/layout/dashboards/VendorLayout";

type Section   = "shop" | "product";
type SubFilter = "all" | "newest" | "replied";

const SUB_FILTERS: { value: SubFilter; label: string }[] = [
  { value: "all",     label: "All" },
  { value: "newest",  label: "Newest" },
  { value: "replied", label: "Replied" },
];

/* ── Shared star row ── */
function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={`w-3.5 h-3.5 ${s <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`} />
      ))}
    </div>
  );
}

/* ── Single review card (used by both sections) ── */
function ReviewCard({
  review,
  badge,
  onReply,
  onDelete,
  replyId,
  replyText,
  setReplyText,
  replyPending,
  deletePending,
}: {
  review:       any;
  badge:        React.ReactNode;
  onReply:      (r: any) => void;
  onDelete:     (id: number) => void;
  replyId:      number | null;
  replyText:    string;
  setReplyText: (t: string) => void;
  replyPending: boolean;
  deletePending: boolean;
}) {
  const isEditing = replyId === review.id;

  return (
    <div className="bg-card border rounded-2xl p-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
            {(review.user?.name ?? "?")[0].toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-sm leading-snug">{review.user?.name ?? "Customer"}</p>
            <p className="text-xs text-muted-foreground">{formatDate(review.created_at)}</p>
          </div>
          <Stars rating={review.rating} />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {badge}
          <button
            onClick={() => onReply(review)}
            title={review.vendor_reply ? "Edit reply" : "Reply"}
            className="p-1.5 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition"
          >
            {review.vendor_reply ? <Pencil className="w-3.5 h-3.5" /> : <Reply className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => { if (confirm("Remove this review?")) onDelete(review.id); }}
            disabled={deletePending}
            title="Remove"
            className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Comment */}
      {review.comment
        ? <p className="text-sm text-foreground/80 leading-relaxed">{review.comment}</p>
        : <p className="text-sm text-muted-foreground italic">No comment left.</p>
      }

      {/* Existing reply */}
      {review.vendor_reply && !isEditing && (
        <div className="mt-3 pl-4 border-l-2 border-primary/40 bg-primary/5 rounded-r-xl py-2 pr-3">
          <p className="text-xs font-semibold text-primary mb-1">Your reply</p>
          <p className="text-sm text-foreground/80">{review.vendor_reply}</p>
        </div>
      )}

      {/* Reply / edit box */}
      {isEditing && (
        <div className="mt-4 space-y-2">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            rows={3}
            placeholder="Write your reply to the customer…"
            className="w-full border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={() => onReply({ ...review, _submit: true })}
              disabled={replyPending || !replyText.trim()}
              className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 disabled:opacity-60"
            >
              {replyPending ? "Posting…" : review.vendor_reply ? "Update Reply" : "Post Reply"}
            </button>
            <button
              onClick={() => onReply(null)}
              className="px-4 py-2 bg-muted rounded-xl text-sm font-medium hover:bg-muted/80 flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" /> Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Review list panel (shared by both tabs) ── */
function ReviewPanel({
  queryKey,
  fetchUrl,
  replyUrl,
  deleteUrl,
  emptyLabel,
  getBadge,
}: {
  queryKey:   string;
  fetchUrl:   string;
  replyUrl:   (id: number) => string;
  deleteUrl:  (id: number) => string;
  emptyLabel: string;
  getBadge:   (r: any) => React.ReactNode;
}) {
  const qc = useQueryClient();
  const [subFilter, setSubFilter] = useState<SubFilter>("all");
  const [replyId,   setReplyId]   = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: [queryKey],
    queryFn:  async () => (await api.get(fetchUrl)).data,
  });

  const replyMutation = useMutation({
    mutationFn: ({ id, text }: { id: number; text: string }) =>
      api.post(replyUrl(id), { reply: text }),
    onSuccess: () => {
      toast.success("Reply posted!");
      qc.invalidateQueries({ queryKey: [queryKey] });
      setReplyId(null);
      setReplyText("");
    },
    onError: () => toast.error("Failed to post reply."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(deleteUrl(id)),
    onSuccess: () => {
      toast.success("Review removed.");
      qc.invalidateQueries({ queryKey: [queryKey] });
    },
    onError: () => toast.error("Failed to remove review."),
  });

  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const all: any[] = data?.data ?? [];

  const filtered = all.filter((r) => {
    if (subFilter === "newest")  return new Date(r.created_at).getTime() >= thirtyDaysAgo;
    if (subFilter === "replied") return !!r.vendor_reply;
    return true;
  });

  const countFor = (f: SubFilter) => {
    if (f === "newest")  return all.filter((r) => new Date(r.created_at).getTime() >= thirtyDaysAgo).length;
    if (f === "replied") return all.filter((r) => !!r.vendor_reply).length;
    return all.length;
  };

  const handleReply = (review: any) => {
    if (review === null) { setReplyId(null); setReplyText(""); return; }
    if (review._submit)  { replyMutation.mutate({ id: review.id, text: replyText }); return; }
    setReplyId(review.id);
    setReplyText(review.vendor_reply ?? "");
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-muted rounded-2xl animate-pulse" />)}
      </div>
    );
  }

  return (
    <div>
      {/* Sub-filters */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {SUB_FILTERS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setSubFilter(value)}
            className={`px-3 py-1.5 rounded-xl text-sm font-medium transition flex items-center gap-1.5 ${
              subFilter === value ? "bg-primary text-white" : "bg-muted hover:bg-muted/80"
            }`}
          >
            {label}
            {countFor(value) > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                subFilter === value ? "bg-white/20 text-white" : "bg-background text-muted-foreground"
              }`}>
                {countFor(value)}
              </span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="border rounded-2xl flex flex-col items-center justify-center gap-3 py-20 text-center">
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
            <MessageSquare className="w-7 h-7 text-muted-foreground" />
          </div>
          <p className="font-semibold">{emptyLabel}</p>
          <p className="text-sm text-muted-foreground">Reviews will appear here once customers leave feedback.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((review: any) => (
            <ReviewCard
              key={review.id}
              review={review}
              badge={getBadge(review)}
              onReply={handleReply}
              onDelete={(id) => deleteMutation.mutate(id)}
              replyId={replyId}
              replyText={replyText}
              setReplyText={setReplyText}
              replyPending={replyMutation.isPending}
              deletePending={deleteMutation.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Main page ── */
export default function VendorReviews() {
  const [section, setSection] = useState<Section>("shop");

  return (
    <VendorLayout title="Reviews">
      {/* Section tabs */}
      <div className="flex gap-1 mb-6 bg-muted p-1 rounded-xl w-fit">
        <button
          onClick={() => setSection("shop")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
            section === "shop"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Store className="w-4 h-4" /> Shop Reviews
        </button>
        <button
          onClick={() => setSection("product")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
            section === "product"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Package className="w-4 h-4" /> Product Reviews
        </button>
      </div>

      {section === "shop" ? (
        <ReviewPanel
          key="shop"
          queryKey="vendor-shop-reviews"
          fetchUrl="/vendor/shop-reviews"
          replyUrl={(id) => `/vendor/shop-reviews/${id}/reply`}
          deleteUrl={(id) => `/vendor/shop-reviews/${id}`}
          emptyLabel="No shop reviews yet"
          getBadge={() => (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 flex items-center gap-1">
              <Store className="w-2.5 h-2.5" /> Shop
            </span>
          )}
        />
      ) : (
        <ReviewPanel
          key="product"
          queryKey="vendor-product-reviews"
          fetchUrl="/vendor/reviews"
          replyUrl={(id) => `/vendor/reviews/${id}/reply`}
          deleteUrl={(id) => `/vendor/reviews/${id}`}
          emptyLabel="No product reviews yet"
          getBadge={(r) => (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 flex items-center gap-1">
              <Package className="w-2.5 h-2.5" /> {r.product?.name ?? "Product"}
            </span>
          )}
        />
      )}
    </VendorLayout>
  );
}
