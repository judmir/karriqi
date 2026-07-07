"use client";

import { useEffect, type ReactNode } from "react";

import {
  selectApartmentReady,
  useApartmentStore,
} from "@/stores/apartment-store";

export function ApartmentStoreGate({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const ensureLoaded = useApartmentStore((state) => state.ensureLoaded);
  const ready = useApartmentStore(selectApartmentReady);
  const error = useApartmentStore((state) => state.error);

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
