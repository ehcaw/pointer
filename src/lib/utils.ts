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

// Source - https://stackoverflow.com/a
// Posted by Alan Wootton
// Retrieved 2025-11-15, License - CC BY-SA 4.0

export function toHash(input: string) {
  let hash = 0;

  if (input.length == 0) return hash;

  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }

  return hash;
}
