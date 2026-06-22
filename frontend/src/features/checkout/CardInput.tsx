"use client";

import { useState, useRef } from "react";
import { CreditCard, Lock } from "lucide-react";

export interface CardData {
  number: string;       // raw digits only
  holder: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
}

interface Props {
  value: CardData;
  onChange: (d: CardData) => void;
  errors?: Partial<Record<keyof CardData, string>>;
}

function detectBrand(number: string): { label: string; color: string } {
  if (/^4/.test(number))        return { label: "VISA",       color: "text-blue-600" };
  if (/^5[1-5]/.test(number))   return { label: "MASTERCARD", color: "text-red-600" };
  if (/^3[47]/.test(number))    return { label: "AMEX",       color: "text-green-600" };
  if (/^6/.test(number))        return { label: "DISCOVER",   color: "text-orange-500" };
  return { label: "", color: "" };
}

function formatCardDisplay(raw: string): string {
  return raw.replace(/(.{4})/g, "$1 ").trim();
}

const inputClass = "w-full border rounded-xl px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 font-mono";

export default function CardInput({ value, onChange, errors }: Props) {
  const [showCvv, setShowCvv] = useState(false);
  const numberRef = useRef<HTMLInputElement>(null);

  const set = (key: keyof CardData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...value, [key]: e.target.value });
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 16);
    onChange({ ...value, number: raw });
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 4);
    const month = raw.slice(0, 2);
    const year = raw.slice(2, 4);
    onChange({
      ...value,
      expiryMonth: month,
      expiryYear:  year ? "20" + year : "",
    });
  };

  const expiryDisplay = value.expiryMonth
    ? value.expiryMonth + (value.expiryYear ? "/" + value.expiryYear.slice(2) : "/")
    : "";

  const brand = detectBrand(value.number);

  return (
    <div className="space-y-3">
      {/* Card preview strip */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-2xl p-5 text-white relative overflow-hidden">
        <div className="absolute top-3 right-4 opacity-20 text-5xl font-black select-none">{brand.label}</div>
        <CreditCard className="w-7 h-7 mb-3 opacity-70" />
        <p className="text-lg font-mono tracking-widest mb-1">
          {value.number
            ? formatCardDisplay(value.number.padEnd(16, "·"))
            : "···· ···· ···· ····"}
        </p>
        <div className="flex justify-between text-xs mt-3 text-white/70">
          <span>{value.holder || "CARD HOLDER NAME"}</span>
          <span>{value.expiryMonth && value.expiryYear
            ? `${value.expiryMonth}/${value.expiryYear.slice(2)}`
            : "MM/YY"}
          </span>
        </div>
        {brand.label && (
          <span className={`absolute bottom-4 right-5 text-xs font-black tracking-widest ${brand.color}`}>
            {brand.label}
          </span>
        )}
      </div>

      {/* Card number */}
      <div>
        <label className="block text-sm font-medium mb-1">Card Number</label>
        <div className="relative">
          <input
            ref={numberRef}
            type="text"
            inputMode="numeric"
            placeholder="1234 5678 9012 3456"
            value={formatCardDisplay(value.number)}
            onChange={handleNumberChange}
            className={inputClass}
            maxLength={19}
          />
          {brand.label && (
            <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black ${brand.color}`}>
              {brand.label}
            </span>
          )}
        </div>
        {errors?.number && <p className="text-destructive text-xs mt-1">{errors.number}</p>}
      </div>

      {/* Card holder */}
      <div>
        <label className="block text-sm font-medium mb-1">Cardholder Name</label>
        <input
          type="text"
          placeholder="JOHN DOE"
          value={value.holder}
          onChange={set("holder")}
          className={inputClass + " uppercase"}
          maxLength={60}
        />
        {errors?.holder && <p className="text-destructive text-xs mt-1">{errors.holder}</p>}
      </div>

      {/* Expiry + CVV */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Expiry Date</label>
          <input
            type="text"
            inputMode="numeric"
            placeholder="MM/YY"
            value={expiryDisplay}
            onChange={handleExpiryChange}
            className={inputClass}
            maxLength={5}
          />
          {errors?.expiryMonth && <p className="text-destructive text-xs mt-1">{errors.expiryMonth}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 flex items-center gap-1">
            CVV <Lock className="w-3 h-3 text-muted-foreground" />
          </label>
          <div className="relative">
            <input
              type={showCvv ? "text" : "password"}
              inputMode="numeric"
              placeholder="•••"
              value={value.cvv}
              onChange={(e) => onChange({ ...value, cvv: e.target.value.replace(/\D/g, "").slice(0, 4) })}
              className={inputClass}
              maxLength={4}
            />
            <button
              type="button"
              onClick={() => setShowCvv((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
            >
              {showCvv ? "Hide" : "Show"}
            </button>
          </div>
          {errors?.cvv && <p className="text-destructive text-xs mt-1">{errors.cvv}</p>}
        </div>
      </div>

      {/* Security note */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-xl px-3 py-2">
        <Lock className="w-3.5 h-3.5 shrink-0 text-green-600" />
        Your card number is encrypted end-to-end. CVV is never stored.
      </div>
    </div>
  );
}
