"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

import { COLOR_MODE_STORAGE_KEY } from "@/lib/theme/color-mode-dom";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
      storageKey={COLOR_MODE_STORAGE_KEY}
      themes={["dark", "light"]}
    >
      {children}
    </NextThemesProvider>
  );
}
