"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { useTheme } from "next-themes";

import {
  APPEARANCE_RADIUS_VALUES,
  DEFAULT_APPEARANCE,
  sanitizeAppearanceState,
  type AppearanceColorMode,
  type AppearanceState,
} from "@/lib/theme/appearance";
import { applyColorModeToDocument } from "@/lib/theme/color-mode-dom";

type AppearanceContextValue = {
  appearance: AppearanceState;
  hydrateAppearance: (next: AppearanceState) => void;
  setAppearance: (next: AppearanceState) => void;
  updateAppearance: (patch: Partial<AppearanceState>) => void;
  resetAppearance: () => void;
  sidebarOpen: boolean;
  setSidebarOpen: Dispatch<SetStateAction<boolean>>;
};

const AppearanceContext = createContext<AppearanceContextValue | null>(null);

function isSameAppearance(a: AppearanceState, b: AppearanceState) {
  return (
    a.preset === b.preset &&
    a.scale === b.scale &&
    a.radius === b.radius &&
    a.colorMode === b.colorMode &&
    a.contentLayout === b.contentLayout &&
    a.sidebarMode === b.sidebarMode
  );
}

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const [appearance, setAppearanceState] = useState(DEFAULT_APPEARANCE);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { setTheme, resolvedTheme } = useTheme();

  useEffect(() => {
    const root = document.documentElement;

    root.dataset.themePreset = appearance.preset;
    root.dataset.themeScale = appearance.scale;
    root.dataset.contentLayout = appearance.contentLayout;
    root.dataset.sidebarMode = appearance.sidebarMode;
    root.style.setProperty("--radius", APPEARANCE_RADIUS_VALUES[appearance.radius]);

    if (
      resolvedTheme !== undefined &&
      resolvedTheme !== appearance.colorMode
    ) {
      setTheme(appearance.colorMode);
    }
  }, [appearance, resolvedTheme, setTheme]);

  const syncColorMode = useCallback((colorMode: AppearanceColorMode) => {
    applyColorModeToDocument(colorMode);
  }, []);

  const hydrateAppearance = useCallback((next: AppearanceState) => {
    const sanitizedAppearance = sanitizeAppearanceState(next);
    syncColorMode(sanitizedAppearance.colorMode);
    setAppearanceState((current) =>
      isSameAppearance(current, sanitizedAppearance)
        ? current
        : sanitizedAppearance,
    );
    setSidebarOpen(sanitizedAppearance.sidebarMode !== "icon");
  }, [syncColorMode]);

  const resetAppearance = useCallback(() => {
    setAppearanceState((current) =>
      isSameAppearance(current, DEFAULT_APPEARANCE)
        ? current
        : DEFAULT_APPEARANCE,
    );
    setSidebarOpen(true);
  }, []);

  const setAppearance = useCallback((next: AppearanceState) => {
    const sanitizedAppearance = sanitizeAppearanceState(next);
    if (sanitizedAppearance.colorMode) {
      syncColorMode(sanitizedAppearance.colorMode);
    }
    setAppearanceState((current) =>
      isSameAppearance(current, sanitizedAppearance)
        ? current
        : sanitizedAppearance,
    );
    setSidebarOpen(sanitizedAppearance.sidebarMode !== "icon");
  }, [syncColorMode]);

  const updateAppearance = useCallback((patch: Partial<AppearanceState>) => {
    if (patch.colorMode) {
      syncColorMode(patch.colorMode);
    }
    setAppearanceState((current) => {
      const nextAppearance = sanitizeAppearanceState({
        ...current,
        ...patch,
      });

      if (patch.sidebarMode && patch.sidebarMode !== current.sidebarMode) {
        setSidebarOpen(nextAppearance.sidebarMode !== "icon");
      }

      return isSameAppearance(current, nextAppearance) ? current : nextAppearance;
    });
  }, [syncColorMode]);

  const value = useMemo<AppearanceContextValue>(
    () => ({
      appearance,
      hydrateAppearance,
      resetAppearance,
      setAppearance,
      setSidebarOpen,
      sidebarOpen,
      updateAppearance,
    }),
    [
      appearance,
      hydrateAppearance,
      resetAppearance,
      setAppearance,
      sidebarOpen,
      updateAppearance,
    ],
  );

  return (
    <AppearanceContext.Provider value={value}>
      {children}
    </AppearanceContext.Provider>
  );
}

export function useAppearance() {
  const context = useContext(AppearanceContext);
  if (!context) {
    throw new Error("useAppearance must be used within AppearanceProvider");
  }

  return context;
}
