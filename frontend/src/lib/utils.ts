import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function mediaUrl(path?: string | null) {
  if (!path) return undefined;
  if (path.startsWith("http")) return path;
  const base = import.meta.env.VITE_API_BASE_URL?.replace(/\/api\/v1$/, "") || "";
  return `${base}${path}`;
}
