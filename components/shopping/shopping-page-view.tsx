"use client";

import { useEffect } from "react";

import { ShoppingTripClient } from "@/components/shopping/shopping-trip-client";
import { ListPlaceholder } from "@/components/patterns/list-placeholder";
import { selectShoppingReady, useShoppingStore } from "@/stores/shopping-store";

function ShoppingPageSkeleton() {
  return (
    <div
      className="animate-pulse space-y-6"
      role="status"
      aria-label="Loading shopping list"
    >
      <div className="space-y-3">
        <div className="bg-muted h-3 w-24 rounded-md" />
        <div className="bg-muted h-7 w-44 rounded-lg" />
      </div>
      <ListPlaceholder rows={5} />
    </div>
  );
}

export function ShoppingPageView() {
  const ready = useShoppingStore(selectShoppingReady);
  const ensureLoaded = useShoppingStore((s) => s.ensureLoaded);

  useEffect(() => {
    void ensureLoaded();
  }, [ensureLoaded]);

  if (!ready) {
    return <ShoppingPageSkeleton />;
  }

  return <ShoppingTripClient />;
}
