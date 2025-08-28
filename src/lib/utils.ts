import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function ensureJSONString(value: unknown): string {
  if (typeof value === "string") {
    // keep as-is if it already looks like JSON
    try {
      JSON.parse(value);
      return value;
    } catch {
      /* not JSON, fall through */
    }
  }
  return JSON.stringify(value); // proper JSON serialization (NOT String(value))
}
