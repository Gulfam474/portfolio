import { useAuthContext } from "@/context/AuthContext";
import { useAuthStore } from "@/store/useAuthStore";

export function useAuth() {
  const store = useAuthStore();
  const ctx = useAuthContext();
  return {
    ...ctx,
    user: store.user,
    accessToken: store.accessToken,
    permissions: store.permissions,
    isAuthenticated: Boolean(store.accessToken && store.user),
  };
}
