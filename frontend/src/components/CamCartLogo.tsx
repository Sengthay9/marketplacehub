"use client";

interface Props {
  size?: number;
  className?: string;
  variant?: "full" | "icon";
  darkBg?: boolean;
}

export function CamCartIcon({ size = 40, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="CamCart logo icon"
    >
      {/* Cart handle */}
      <path
        d="M3 7 Q3 3 7 3 L11 3"
        stroke="#0D47A1"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Cart basket */}
      <path
        d="M11 3 L37 3 L33 23 H9 Z"
        fill="#0D47A1"
      />
      {/* Angkor-inspired 3 peaks inside basket (simplified temple silhouette) */}
      <g>
        {/* Left small peak */}
        <path
          d="M12 19 L12 13 Q14 10 16 13 L16 19"
          fill="white"
          opacity="0.88"
        />
        {/* Center tall peak */}
        <path
          d="M17 19 L17 10 Q20 6 23 10 L23 19"
          fill="white"
          opacity="0.88"
        />
        {/* Right small peak */}
        <path
          d="M24 19 L24 13 Q26 10 28 13 L28 19"
          fill="white"
          opacity="0.88"
        />
      </g>
      {/* Cart axle */}
      <line x1="9" y1="23" x2="33" y2="23" stroke="#0B3D91" strokeWidth="2" strokeLinecap="round" />
      {/* Left wheel — brand blue */}
      <circle cx="15" cy="30" r="4.5" fill="#0D47A1" />
      <circle cx="15" cy="30" r="2"   fill="white" opacity="0.4" />
      {/* Right wheel — brand orange (dynamism + Cambodian sun) */}
      <circle cx="29" cy="30" r="4.5" fill="#FF6B00" />
      <circle cx="29" cy="30" r="2"   fill="white" opacity="0.4" />
      {/* Speed lines */}
      <path d="M1 13 L5 13" stroke="#FF6B00" strokeWidth="2"   strokeLinecap="round" />
      <path d="M1 17 L4 17" stroke="#FF6B00" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M1 21 L3.5 21" stroke="#FF6B00" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

export default function CamCartLogo({ size = 40, className = "", variant = "full", darkBg = false }: Props) {
  const textColor = darkBg ? "text-white" : "text-[#0D47A1]";

  if (variant === "icon") return <CamCartIcon size={size} className={className} />;

  return (
    <span className={`inline-flex items-center gap-2 select-none ${className}`} aria-label="CamCart">
      <CamCartIcon size={size} />
      <span
        className={`font-inter font-black tracking-tight ${textColor}`}
        style={{ fontSize: size * 0.55, lineHeight: 1 }}
      >
        CamCart
      </span>
    </span>
  );
}
