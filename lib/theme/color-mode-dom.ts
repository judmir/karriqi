import type { AppearanceColorMode } from "@/lib/theme/appearance";

export const COLOR_MODE_STORAGE_KEY = "karriqi.color-mode";

/** Apply color mode to `<html>` immediately (before React / next-themes mount). */
export function applyColorModeToDocument(colorMode: AppearanceColorMode) {
  if (typeof document === "undefined") {
    return;
  }

  const root = document.documentElement;
  if (colorMode === "light") {
    root.classList.remove("dark");
    root.classList.add("light");
  } else {
    root.classList.add("dark");
    root.classList.remove("light");
  }

  try {
    localStorage.setItem(COLOR_MODE_STORAGE_KEY, colorMode);
  } catch {
    // Private browsing / blocked storage — DOM classes still apply.
  }
}
