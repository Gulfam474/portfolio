import { axiosClient } from "./axiosClient";
import { apiOrigin, type PermissionsMap } from "@/lib/constants";

export type User = {
  id: number;
  username: string;
  email: string;
  is_verified: boolean;
  is_active: boolean;
  avatar_url?: string | null;
  role?: { id: number; name: string; description?: string | null } | null;
  created_at: string;
};

export const authApi = {
  register: (data: { username: string; email: string; password: string }) =>
    axiosClient.post("/auth/register", data),
  verifyOtp: (data: { email: string; otp: string }) =>
    axiosClient.post<{ access_token: string }>("/auth/verify-otp", data),
  resendOtp: (email: string) => axiosClient.post("/auth/resend-otp", { email }),
  login: (data: { username_or_email: string; password: string }) =>
    axiosClient.post<{ access_token: string }>("/auth/login", data),
  logout: () => axiosClient.post("/auth/logout"),
  me: () => axiosClient.get<User>("/auth/me"),
  myAccess: () =>
    axiosClient.get<{ permissions: PermissionsMap }>("/auth/my-access"),
  /**
   * Must hit the API host directly (not the Vite proxy) so the OAuth CSRF
   * session cookie is set on the same origin as the Google callback.
   */
  googleLoginUrl: (next?: string) => {
    const url = new URL(`${apiOrigin()}/api/v1/auth/google/login`);
    if (next?.startsWith("/")) url.searchParams.set("next", next);
    return url.toString();
  },
};
