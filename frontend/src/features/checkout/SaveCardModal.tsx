"use client";

import { useState } from "react";
import { CreditCard, Shield, X } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";

interface Props {
  cardData: {
    number: string;
    holder: string;
    expiryMonth: string;
    expiryYear: string;
  };
  onClose: () => void;
}

export default function SaveCardModal({ cardData, onClose }: Props) {
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await api.post("/customer/cards", {
        card_number:      cardData.number,
        card_holder_name: cardData.holder,
        expiry_month:     cardData.expiryMonth,
        expiry_year:      cardData.expiryYear,
        set_default:      true,
      });
      toast.success("Card saved securely for future purchases.");
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Could not save card.";
      toast.error(msg);
      setSaving(false);
    }
  };

  const last4 = cardData.number.slice(-4);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-primary" />
          </div>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-lg">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <h3 className="font-bold text-lg mb-1">Save this card?</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Save card ending in <span className="font-mono font-semibold">•••• {last4}</span> for faster checkout next time.
        </p>

        <div className="bg-muted/50 border rounded-xl p-3 flex items-start gap-3 mb-5">
          <Shield className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            Your card number is encrypted with AES-256. Your CVV is <strong>never</strong> stored. Only the last 4 digits are visible to you. Our team cannot see your full card number.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border rounded-xl text-sm font-medium hover:bg-muted transition"
          >
            No, thanks
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save securely"}
          </button>
        </div>
      </div>
    </div>
  );
}
