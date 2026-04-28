import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Tailwind class merger (standard shadcn/ui pattern)
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Risk colour — matches the dashboard's risk-tier colour scale
export function riskColor(risk: number): string {
  if (risk >= 0.8) return "#ef4444"; // red   — critical
  if (risk >= 0.6) return "#f97316"; // orange — high
  if (risk >= 0.4) return "#eab308"; // yellow — moderate
  return "#22c55e";                  // green  — nominal
}

// Short text label for a risk probability
export function riskLabel(risk: number): string {
  if (risk >= 0.8) return "CRITICAL";
  if (risk >= 0.6) return "HIGH";
  if (risk >= 0.4) return "MODERATE";
  return "NOMINAL";
}

// Tailwind text-colour class for risk tiers
export function riskTextClass(risk: number): string {
  if (risk >= 0.8) return "text-risk-red";
  if (risk >= 0.6) return "text-risk-orange";
  if (risk >= 0.4) return "text-risk-yellow";
  return "text-risk-green";
}

// Format a 0-1 probability as a percentage string e.g. "87%"
export function pct(value: number, decimals = 0): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

// Format INR values compactly e.g. "₹20L", "₹2.5Cr"
export function formatInr(value: number): string {
  if (value >= 10_000_000) return `₹${(value / 10_000_000).toFixed(1)}Cr`;
  if (value >= 100_000)    return `₹${(value / 100_000).toFixed(1)}L`;
  return `₹${value.toLocaleString("en-IN")}`;
}