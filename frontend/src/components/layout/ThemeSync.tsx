import { useEffect } from "react";
import { applyTheme, useUiStore } from "@/store/useUiStore";

/** Syncs persisted theme to <html data-theme> before paint-sensitive UI. */
export function ThemeSync() {
  const theme = useUiStore((s) => s.theme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    applyTheme(useUiStore.getState().theme);
  }, []);

  return null;
}
