import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(decimals)}%`;
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "…";
}

export function getRiskColor(risk: "low" | "medium" | "high" | "critical"): string {
  const map = {
    low: "text-success",
    medium: "text-warning",
    high: "text-danger",
    critical: "text-danger",
  };
  return map[risk];
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    verified: "badge-success",
    unverified: "badge-warning",
    flagged: "badge-danger",
    pending: "badge-info",
    correct: "badge-success",
    incorrect: "badge-danger",
    partial: "badge-warning",
  };
  return map[status.toLowerCase()] || "badge-info";
}
