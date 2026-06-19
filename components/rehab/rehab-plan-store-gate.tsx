"use client";

import { useEffect } from "react";

import { ListPlaceholder } from "@/components/patterns/list-placeholder";
import { useRehabPlanSync } from "@/hooks/use-rehab-plan-sync";
import {
  selectRehabPlanReady,
  useRehabPlanStore,
} from "@/stores/rehab-plan-store";

function RehabPlanStoreSkeleton() {
  return (
    <div
      className="flex h-full min-h-0 flex-1 animate-pulse flex-col px-4 md:px-6"
      role="status"
      aria-label="Loading rehab events"
    >
      <div className="border-border flex items-center justify-between border-b py-3">
        <div className="bg-muted h-7 w-28 rounded-md" />
        <div className="bg-muted h-8 w-16 rounded-lg" />
        <div className="size-8" />
      </div>
      <ListPlaceholder rows={8} className="mt-4" />
    </div>
  );
}

export function RehabPlanStoreGate({ children }: { children: React.ReactNode }) {
  const ensureLoaded = useRehabPlanStore((state) => state.ensureLoaded);
  const ready = useRehabPlanStore(selectRehabPlanReady);
  const loading = useRehabPlanStore((state) => state.loading);
  const persistence = useRehabPlanStore((state) => state.persistence);

  useEffect(() => {
    void ensureLoaded();
  }, [ensureLoaded]);

  useRehabPlanSync({ enabled: ready && persistence });

  if (!ready && loading) {
    return <RehabPlanStoreSkeleton />;
  }

  return children;
}
