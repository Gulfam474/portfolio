import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { authApi } from "@/api/authApi";
import { useAuthStore } from "@/store/useAuthStore";

type AuthContextValue = {
  ready: boolean;
  refreshSession: () => Promise<void>;
  loginWithToken: (token: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const { accessToken, setAccessToken, setUser, setPermissions, logout: clear } =
    useAuthStore();

  const refreshSession = useCallback(async () => {
    const token = useAuthStore.getState().accessToken;
    if (!token) {
      setUser(null);
      setPermissions({});
      return;
    }
    try {
      const [me, access] = await Promise.all([authApi.me(), authApi.myAccess()]);
      setUser(me.data);
      setPermissions(access.data.permissions);
    } catch {
      clear();
    }
  }, [setUser, setPermissions, clear]);

  const loginWithToken = useCallback(
    async (token: string) => {
      setAccessToken(token);
      await refreshSession();
    },
    [setAccessToken, refreshSession]
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      /* ignore */
    }
    clear();
  }, [clear]);

  useEffect(() => {
    (async () => {
      if (accessToken) await refreshSession();
      setReady(true);
    })();
  }, []); // bootstrap once

  const value = useMemo(
    () => ({ ready, refreshSession, loginWithToken, logout }),
    [ready, refreshSession, loginWithToken, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used within AuthProvider");
  return ctx;
}
