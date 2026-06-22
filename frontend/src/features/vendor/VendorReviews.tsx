"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import VendorLayout from "@/components/layout/dashboards/VendorLayout";

export default function VendorReviews() {
  const qc = useQueryClient();
  const [replyId, setReplyId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["vendor-reviews"],
    queryFn: async () => (await api.get("/vendor/reviews")).data,
  });

  const replyMutation = useMutation({
    mutationFn: ({ id, reply }: { id: number; reply: string }) =>
      api.post(`/vendor/reviews/${id}/reply`, { reply }),
    onSuccess: () => {
      toast.success("Reply posted!");
      qc.invalidateQueries({ queryKey: ["vendor-reviews"] });
      setReplyId(null);
      setReplyText("");
    },
    onError: () => toast.error("Failed to post reply."),
  });

  const stars = (rating: number) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={`w-3.5 h-3.5 ${s <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`} />
      ))}
    </div>
  );

  return (
    <VendorLayout title="Reviews">
      {isLoading ? (
        <div className="space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-muted rounded-2xl animate-pulse" />)}</div>
      ) : (
        <div className="space-y-4">
          {data?.data?.length === 0 && (
            <div className="text-center py-20 text-muted-foreground">No reviews yet.</div>
          )}
          {data?.data?.map((review: any) => (
            <div key={review.id} className="bg-card border rounded-2xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <p className="font-medium text-sm">{review.user?.name ?? "Customer"}</p>
                    {stars(review.rating)}
                    <span className="text-xs text-muted-foreground">{new Date(review.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{review.comment}</p>

                  {review.reply && (
                    <div className="mt-3 pl-4 border-l-2 border-primary/30">
                      <p className="text-xs font-medium text-primary mb-1">Your reply</p>
                      <p className="text-sm text-muted-foreground">{review.reply}</p>
                    </div>
                  )}

                  {replyId === review.id ? (
                    <div className="mt-3 space-y-2">
                      <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)}
                        rows={3} placeholder="Write your reply..."
                        className="w-full border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
                      <div className="flex gap-2">
                        <button onClick={() => replyMutation.mutate({ id: review.id, reply: replyText })}
                          className="px-4 py-2 bg-primary text-white rounded-xl text-sm hover:bg-primary/90">Post Reply</button>
                        <button onClick={() => { setReplyId(null); setReplyText(""); }}
                          className="px-4 py-2 bg-muted rounded-xl text-sm hover:bg-muted/80">Cancel</button>
                      </div>
                    </div>
                  ) : !review.reply && (
                    <button onClick={() => setReplyId(review.id)}
                      className="mt-3 text-xs text-primary font-medium hover:underline">
                      Reply
                    </button>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-muted-foreground">{review.product?.name}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </VendorLayout>
  );
}
