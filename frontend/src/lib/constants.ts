export const BRAND_NAME = "gulfam.sh";
export const BRAND_TAG = "systems · agents · apis";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "/api/v1";

/** Absolute API origin for flows that cannot go through the Vite proxy (OAuth). */
export function apiOrigin(): string {
  const explicit = import.meta.env.VITE_API_ORIGIN;
  if (explicit) return explicit.replace(/\/$/, "");
  if (API_BASE_URL.startsWith("http")) {
    return API_BASE_URL.replace(/\/api\/v1\/?$/, "");
  }
  return "http://localhost:8001";
}

export const MODULES = ["profile", "cv", "posts", "admin"] as const;
export type ModuleName = (typeof MODULES)[number];

export type ModulePermission = {
  can_view: boolean;
  can_edit: boolean;
  can_delete: boolean;
};

export type PermissionsMap = Record<string, ModulePermission>;
