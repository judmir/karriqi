"use client";

import { useEffect } from "react";

import { ListPlaceholder } from "@/components/patterns/list-placeholder";
import { selectHomeReady, useHomeStore } from "@/stores/home-store";

export function HomeStoreGate({ children }: { children: React.ReactNode }) {
  const ensureLoaded = useHomeStore((s) => s.ensureLoaded);
  const ready = useHomeStore(selectHomeReady);
  const loading = useHomeStore((s) => s.loading);

  useEffect(() => {
    if (ready) return;
    void ensureLoaded();
  }, [ensureLoaded, ready]);

  if (!ready && loading) {
    return <ListPlaceholder rows={4} className="mt-4" />;
  }

  return children;
}
