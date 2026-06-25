import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric", month: "short", day: "numeric",
  }).format(new Date(date));
}

export function formatRelativeTime(date: string | Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1)  return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24)   return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function truncate(text: string, length = 100): string {
  return text.length > length ? text.slice(0, length) + "…" : text;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .trim();
}

export function getOrderStatusColor(status: string): string {
  const map: Record<string, string> = {
    pending:    "bg-yellow-100 text-yellow-800",
    confirmed:  "bg-blue-100 text-blue-800",
    processing: "bg-indigo-100 text-indigo-800",
    delivered:  "bg-green-100 text-green-800",
    cancelled:  "bg-red-100 text-red-800",
    refunded:   "bg-gray-100 text-gray-800",
  };
  return map[status] ?? "bg-gray-100 text-gray-800";
}

export function getShopStatusColor(status: string): string {
  const map: Record<string, string> = {
    pending:   "bg-yellow-100 text-yellow-800",
    approved:  "bg-green-100 text-green-800",
    rejected:  "bg-red-100 text-red-800",
    suspended: "bg-orange-100 text-orange-800",
  };
  return map[status] ?? "bg-gray-100 text-gray-800";
}
