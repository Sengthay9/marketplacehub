"use client";

import { QRCodeSVG } from "qrcode.react";

interface KhqrCardProps {
  khqrString: string;
  merchantName: string;
  bankName?: string;
  amount?: number;
  currency?: string;
  accountNumber?: string;
  size?: number;
}

export default function KhqrCard({
  khqrString,
  merchantName,
  bankName,
  amount,
  currency = "USD",
  accountNumber,
  size = 200,
}: KhqrCardProps) {
  const sym = currency.toUpperCase() === "KHR" ? "៛" : "$";

  return (
    <div
      className="bg-white rounded-2xl overflow-hidden shadow-md border border-gray-100 w-full mx-auto"
      style={{ maxWidth: size + 80 }}
    >
      {/* Red KHQR header */}
      <div className="px-4 py-2.5" style={{ backgroundColor: "#C8102E" }}>
        <span
          className="text-white font-black tracking-widest select-none"
          style={{ fontSize: 18, fontFamily: "Arial Black, Arial, sans-serif", letterSpacing: "0.15em" }}
        >
          KH<span style={{ letterSpacing: "-0.05em" }}>@</span>R
        </span>
      </div>

      {/* White card body */}
      <div className="bg-white px-4 pb-4">
        {/* Merchant name */}
        <p
          className="text-gray-800 font-bold pt-3 tracking-wider"
          style={{ fontSize: 13, fontFamily: "Arial, sans-serif", letterSpacing: "0.08em" }}
        >
          {merchantName.toUpperCase()}
        </p>

        {/* Amount — only for dynamic QR */}
        {amount !== undefined && amount > 0 && (
          <p className="text-gray-500 text-sm mt-0.5">
            {sym}{amount.toFixed(2)}
          </p>
        )}

        {/* Dashed separator */}
        <div className="my-3 border-t border-dashed border-gray-300" />

        {/* QR code with center KHQR logo */}
        <div className="flex justify-center">
          <QRCodeSVG
            value={khqrString}
            size={size}
            level="H"
            includeMargin={false}
            imageSettings={{
              src: "/khqr-icon.svg",
              height: Math.round(size * 0.18),
              width: Math.round(size * 0.18),
              excavate: true,
            }}
          />
        </div>

        {/* Bank name + account */}
        {(bankName || accountNumber) && (
          <div className="mt-3 text-center space-y-0.5">
            {bankName && (
              <p className="text-xs font-semibold text-gray-600 tracking-wide uppercase">
                {bankName}
              </p>
            )}
            {accountNumber && (
              <p className="text-[10px] text-gray-400 font-mono tracking-widest">
                {accountNumber}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
