"use client";

import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import axios from "axios";
import { CamCartIcon } from "@/components/CamCartLogo";

interface Props {
  className?: string;
  imgClassName?: string;
  textClassName?: string;
  size?: number;
  darkBg?: boolean;
}

async function fetchSiteSettings() {
  const res = await axios.get("/api/v1/site-settings");
  return res.data as { site_name: string; logo_url: string | null };
}

export default function SiteLogo({
  className = "",
  imgClassName = "",
  textClassName = "",
  size = 36,
  darkBg = false,
}: Props) {
  const { data } = useQuery({
    queryKey: ["site-settings-public"],
    queryFn: fetchSiteSettings,
    staleTime: 5 * 60 * 1000,
  });

  const name = data?.site_name ?? "CamCart";
  const logo = data?.logo_url ?? null;
  const textColor = darkBg
    ? "text-white"
    : "text-[#0D47A1] dark:text-white";

  return (
    <span className={`inline-flex items-center gap-2 select-none ${className}`} aria-label={name}>
      {logo ? (
        <Image
          src={logo}
          alt={name}
          width={size}
          height={size}
          className={`object-contain ${imgClassName}`}
          unoptimized
        />
      ) : (
        <CamCartIcon size={size} className={imgClassName} />
      )}
      <span
        className={`font-inter font-black tracking-tight ${textColor} ${textClassName}`}
        style={{ fontSize: size * 0.55, lineHeight: 1 }}
      >
        {name}
      </span>
    </span>
  );
}
