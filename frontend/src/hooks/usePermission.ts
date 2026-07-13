import { useAuthStore } from "@/store/useAuthStore";
import type { ModuleName } from "@/lib/constants";

export function usePermission(module: ModuleName, action: "view" | "edit" | "delete") {
  const permissions = useAuthStore((s) => s.permissions);
  const perm = permissions[module];
  if (!perm) return false;
  if (action === "view") return perm.can_view;
  if (action === "edit") return perm.can_edit;
  return perm.can_delete;
}
