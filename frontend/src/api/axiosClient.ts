import axios from "axios";
import { API_BASE_URL } from "@/lib/constants";
import { useAuthStore } from "@/store/useAuthStore";

export const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

axiosClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  try {
    const { data } = await axios.post(
      `${API_BASE_URL}/auth/refresh`,
      {},
      { withCredentials: true }
    );
    useAuthStore.getState().setAccessToken(data.access_token);
    return data.access_token as string;
  } catch {
    useAuthStore.getState().logout();
    return null;
  }
}

axiosClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      refreshing = refreshing ?? refreshAccessToken();
      const token = await refreshing;
      refreshing = null;
      if (token) {
        original.headers.Authorization = `Bearer ${token}`;
        return axiosClient(original);
      }
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        const returnTo = encodeURIComponent(window.location.pathname + window.location.search);
        window.location.href = `/login?returnTo=${returnTo}`;
      }
    }
    return Promise.reject(error);
  }
);
