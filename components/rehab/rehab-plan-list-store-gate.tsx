"use client";

import { useEffect } from "react";

import { ListPlaceholder } from "@/components/patterns/list-placeholder";
import {
  selectRehabPlanListReady,
  useRehabPlanListStore,
} from "@/stores/rehab-plan-list-store";

function RehabPlanListStoreSkeleton() {
  return (
    <div
      className="flex h-full min-h-0 flex-1 animate-pulse flex-col px-4 md:px-6"
      role="status"
      aria-label="Loading rehab plan"
    >
      <div className="border-border flex items-center justify-between border-b py-3">
        <div className="bg-muted h-7 w-28 rounded-md" />
        <div className="bg-muted h-8 w-24 rounded-lg" />
      </div>
      <ListPlaceholder rows={10} className="mt-4" />
    </div>
  );
}

export function RehabPlanListStoreGate({ children }: { children: React.ReactNode }) {
  const ensureLoaded = useRehabPlanListStore((state) => state.ensureLoaded);
  const ready = useRehabPlanListStore(selectRehabPlanListReady);
  const error = useRehabPlanListStore((state) => state.error);

  useEffect(() => {
    void ensureLoaded();
  }, [ensureLoaded]);

  if (error) {
    return (
      <div className="text-muted-foreground flex flex-1 items-center justify-center px-4 py-8 text-sm">
        {error}
      </div>
    );
  }

  if (!ready) {
    return <RehabPlanListStoreSkeleton />;
  }

  return children;
}
