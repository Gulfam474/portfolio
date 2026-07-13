import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/api/authApi";
import type { PermissionsMap } from "@/lib/constants";

type AuthState = {
  accessToken: string | null;
  user: User | null;
  permissions: PermissionsMap;
  setAccessToken: (token: string | null) => void;
  setUser: (user: User | null) => void;
  setPermissions: (permissions: PermissionsMap) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      permissions: {},
      setAccessToken: (accessToken) => set({ accessToken }),
      setUser: (user) => set({ user }),
      setPermissions: (permissions) => set({ permissions }),
      logout: () => set({ accessToken: null, user: null, permissions: {} }),
    }),
    {
      name: "auth-store",
      partialize: (s) => ({ accessToken: s.accessToken }),
    }
  )
);
