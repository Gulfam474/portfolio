import type { ReactNode } from "react";
import { usePermission } from "@/hooks/usePermission";
import type { ModuleName } from "@/lib/constants";
import { useUiStore } from "@/store/useUiStore";

export function PermissionGate({
  module,
  action = "view",
  children,
  fallback = null,
}: {
  module: ModuleName;
  action?: "view" | "edit" | "delete";
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const allowed = usePermission(module, action);
  const viewMode = useUiStore((s) => s.viewMode);

  // Preview / read-only: hide edit & delete chrome so the site looks public.
  if (viewMode === "preview" && (action === "edit" || action === "delete")) {
    return <>{fallback}</>;
  }

  if (!allowed) return <>{fallback}</>;
  return <>{children}</>;
}
