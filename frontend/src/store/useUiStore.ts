import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemeMode = "dark" | "light";
export type ViewMode = "editor" | "preview";

type UiState = {
  theme: ThemeMode;
  viewMode: ViewMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  setViewMode: (mode: ViewMode) => void;
  toggleViewMode: () => void;
};

export const useUiStore = create<UiState>()(
  persist(
    (set, get) => ({
      theme: "dark",
      viewMode: "editor",
      setTheme: (theme) => set({ theme }),
      toggleTheme: () =>
        set({ theme: get().theme === "dark" ? "light" : "dark" }),
      setViewMode: (viewMode) => set({ viewMode }),
      toggleViewMode: () =>
        set({
          viewMode: get().viewMode === "editor" ? "preview" : "editor",
        }),
    }),
    { name: "ui-preferences" },
  ),
);

export function applyTheme(theme: ThemeMode) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
}
