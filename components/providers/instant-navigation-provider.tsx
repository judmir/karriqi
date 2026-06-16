"use client";

import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  pathnameFromHref,
  RouteInstantFallback,
} from "@/components/layout/route-fallbacks";

type InstantNavigationContextValue = {
  pendingHref: string | null;
  startNavigation: (href: string) => void;
};

const InstantNavigationContext =
  createContext<InstantNavigationContextValue | null>(null);

export function useInstantNavigation() {
  const value = useContext(InstantNavigationContext);
  if (!value) {
    throw new Error(
      "useInstantNavigation must be used within InstantNavigationProvider",
    );
  }
  return value;
}

export function InstantNavigationProvider({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  const startNavigation = useCallback((href: string) => {
    const nextPath = pathnameFromHref(href);
    if (nextPath === pathname) {
      return;
    }
    setPendingHref(href);
  }, [pathname]);

  useEffect(() => {
    if (!pendingHref) {
      return;
    }

    const pendingPath = pathnameFromHref(pendingHref);
    if (pathname === pendingPath) {
      setPendingHref(null);
    }
  }, [pathname, pendingHref]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      const anchor = (event.target as Element | null)?.closest("a[href]");
      if (!anchor) return;
      if (anchor.getAttribute("target") === "_blank") return;
      if (anchor.hasAttribute("download")) return;

      const href = anchor.getAttribute("href");
      if (!href || !href.startsWith("/") || href.startsWith("//")) return;

      const nextPath = pathnameFromHref(href);
      if (nextPath === pathname) return;

      startNavigation(href);
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [pathname, startNavigation]);

  const showInstantFallback = useMemo(() => {
    if (!pendingHref) {
      return false;
    }
    return pathnameFromHref(pendingHref) !== pathname;
  }, [pathname, pendingHref]);

  const value = useMemo(
    () => ({ pendingHref, startNavigation }),
    [pendingHref, startNavigation],
  );

  return (
    <InstantNavigationContext.Provider value={value}>
      {showInstantFallback && pendingHref ? (
        <RouteInstantFallback href={pendingHref} />
      ) : (
        children
      )}
    </InstantNavigationContext.Provider>
  );
}
