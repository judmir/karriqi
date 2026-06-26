"use client";

import { useEffect, type ReactNode } from "react";

import { selectPulseReady, usePulseStore } from "@/stores/pulse-store";

export function PulseStoreGate({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const ensureLoaded = usePulseStore((state) => state.ensureLoaded);
  const ready = usePulseStore(selectPulseReady);
  const error = usePulseStore((state) => state.error);

  useEffect(() => {
    if (ready) {
      return;
    }
    void ensureLoaded();
  }, [ensureLoaded, ready]);

  if (error) {
    return (
      <div className="text-muted-foreground flex items-center justify-center px-4 py-8 text-sm">
        {error}
      </div>
    );
  }

  if (!ready) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
