"use client";

import { useEffect, useState, useCallback } from "react";
import { CheckCircle, XCircle, CreditCard, Shield } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";

interface Props {
  orderId: number;
  savedCardId?: number;
  onSuccess: () => void;
  onFailure: () => void;
}

export default function CardProcessingModal({ orderId, savedCardId, onSuccess, onFailure }: Props) {
  const [stage, setStage] = useState<"processing" | "success" | "failed">("processing");
  const [dots, setDots] = useState("");

  const processPayment = useCallback(async () => {
    try {
      await api.post(`/customer/payments/${orderId}/confirm`, {
        gateway: "card",
        saved_card_id: savedCardId ?? null,
      });
      setStage("success");
      toast.success("Payment processed!");
      setTimeout(onSuccess, 1800);
    } catch {
      setStage("failed");
      toast.error("Card payment failed. Please try another method.");
    }
  }, [orderId, savedCardId, onSuccess]);

  useEffect(() => {
    const timer = setTimeout(processPayment, 2000); // simulate processing delay
    return () => clearTimeout(timer);
  }, [processPayment]);

  useEffect(() => {
    if (stage !== "processing") return;
    const t = setInterval(() => setDots((d) => (d.length >= 3 ? "" : d + ".")), 500);
    return () => clearInterval(t);
  }, [stage]);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center">

        {stage === "processing" && (
          <>
            <div className="relative w-20 h-20 mx-auto mb-5">
              <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
              <div className="absolute inset-0 rounded-full border-4 border-t-primary animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <CreditCard className="w-8 h-8 text-primary" />
              </div>
            </div>
            <p className="font-bold text-lg">Processing Payment{dots}</p>
            <p className="text-sm text-muted-foreground mt-2">Please do not close this window</p>
            <div className="flex items-center justify-center gap-2 mt-4 text-xs text-muted-foreground">
              <Shield className="w-3.5 h-3.5 text-green-600" />
              Secured with 256-bit AES encryption
            </div>
          </>
        )}

        {stage === "success" && (
          <>
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
            <p className="font-bold text-xl text-green-700">Payment Successful!</p>
            <p className="text-sm text-muted-foreground mt-2">Redirecting to your order…</p>
          </>
        )}

        {stage === "failed" && (
          <>
            <XCircle className="w-16 h-16 mx-auto mb-4 text-destructive" />
            <p className="font-bold text-xl">Payment Failed</p>
            <p className="text-sm text-muted-foreground mt-2 mb-6">
              Your card could not be charged. Please check your card details and try again.
            </p>
            <button
              onClick={onFailure}
              className="px-6 py-2.5 border rounded-xl text-sm font-medium hover:bg-muted"
            >
              Try Again
            </button>
          </>
        )}
      </div>
    </div>
  );
}
