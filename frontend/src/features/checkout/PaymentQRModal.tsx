"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { CheckCircle, XCircle, RefreshCw, Clock, Shield, X } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { formatCurrency } from "@/lib/utils";

interface ShopQrCode {
  id: number;
  bank_name: string;
  bank_label: string;
  currency: "usd" | "khr";
  qr_image_url: string;
  account_name: string | null;
}

const CURRENCY_SYMBOL: Record<string, string> = { usd: "$", khr: "៛" };
const EXPIRE_SECONDS = 15 * 60;

interface Props {
  orderId: number;
  orderRef: string;
  total: number;
  qrCode: ShopQrCode;       // the vendor's actual QR image (selected by customer)
  onSuccess: () => void;
  onCancel: () => void;
}

export default function PaymentQRModal({ orderId, orderRef, total, qrCode, onSuccess, onCancel }: Props) {
  const [stage, setStage] = useState<"pending" | "checking" | "success" | "failed">("pending");
  const [secondsLeft, setSecondsLeft] = useState(EXPIRE_SECONDS);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const confirmPayment = useCallback(async () => {
    setStage("checking");
    try {
      await api.post(`/customer/payments/${orderId}/confirm`, {
        gateway: qrCode.bank_name,
      });
      setStage("success");
      toast.success("Payment confirmed!");
      setTimeout(onSuccess, 1500);
    } catch {
      setStage("failed");
      toast.error("Payment confirmation failed. Contact support if money was deducted.");
    }
  }, [orderId, qrCode.bank_name, onSuccess]);

  useEffect(() => {
    const t = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) { clearInterval(t); setStage("failed"); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    pollRef.current = setInterval(async () => {
      try {
        const res = await api.get(`/customer/payments/${orderId}/status`);
        if (res.data.status === "completed") {
          clearInterval(pollRef.current!);
          setStage("success");
          setTimeout(onSuccess, 1500);
        }
      } catch {}
    }, 5000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [orderId, onSuccess]);

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");
  const sym = CURRENCY_SYMBOL[qrCode.currency] ?? "$";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-primary/80 p-5 text-white">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-bold">{qrCode.bank_label}</h2>
            {stage === "pending" && (
              <button onClick={onCancel} className="p-1 hover:bg-white/20 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <p className="text-white/70 text-xs">Order {orderRef}</p>
          <p className="text-2xl font-black mt-1">{sym}{total.toFixed(2)}</p>
        </div>

        <div className="p-5">
          {stage === "pending" && (
            <>
              {/* Real QR image from vendor */}
              <div className="flex justify-center mb-3">
                <div className="p-2 bg-white rounded-xl shadow border">
                  <img
                    src={qrCode.qr_image_url}
                    alt={`${qrCode.bank_label} QR`}
                    className="w-44 h-44 object-contain rounded-lg"
                    onError={(e) => { e.currentTarget.style.opacity = "0.3"; }}
                  />
                </div>
              </div>

              {qrCode.account_name && (
                <p className="text-center text-sm font-semibold mb-1">{qrCode.account_name}</p>
              )}

              {/* Timer */}
              <div className="flex items-center justify-center gap-1.5 mb-3">
                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                <span className={`font-mono text-xs font-bold ${secondsLeft < 60 ? "text-destructive" : "text-muted-foreground"}`}>
                  Expires {mm}:{ss}
                </span>
              </div>

              <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 rounded-xl p-2.5 mb-4">
                <Shield className="w-3.5 h-3.5 text-green-600 shrink-0 mt-0.5" />
                Open your {qrCode.bank_label} app → Scan QR → Confirm amount → Pay. Do not share this QR with anyone.
              </div>

              <div className="flex gap-2">
                <button onClick={onCancel} className="flex-1 py-2.5 border rounded-xl text-xs font-medium hover:bg-muted">
                  Cancel
                </button>
                <button
                  onClick={confirmPayment}
                  className="flex-1 py-2.5 bg-primary text-white rounded-xl text-xs font-semibold hover:bg-primary/90"
                >
                  I've paid ✓
                </button>
              </div>
            </>
          )}

          {stage === "checking" && (
            <div className="text-center py-8">
              <RefreshCw className="w-10 h-10 mx-auto mb-3 animate-spin text-primary" />
              <p className="font-semibold text-sm">Verifying payment…</p>
            </div>
          )}

          {stage === "success" && (
            <div className="text-center py-8">
              <CheckCircle className="w-14 h-14 mx-auto mb-3 text-green-500" />
              <p className="font-bold text-lg text-green-700">Payment Successful!</p>
              <p className="text-xs text-muted-foreground mt-1">Redirecting…</p>
            </div>
          )}

          {stage === "failed" && (
            <div className="text-center py-8">
              <XCircle className="w-14 h-14 mx-auto mb-3 text-destructive" />
              <p className="font-bold text-lg">Payment Failed</p>
              <p className="text-xs text-muted-foreground mt-2 mb-4">
                {secondsLeft === 0 ? "QR code expired." : "Could not confirm."} Try again or contact support.
              </p>
              <button onClick={onCancel} className="px-5 py-2 border rounded-xl text-sm font-medium hover:bg-muted">
                Go back
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export type { ShopQrCode };
