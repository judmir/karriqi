"use client";

import { useEffect } from "react";

import { ListPlaceholder } from "@/components/patterns/list-placeholder";
import {
  selectRehabClinicalReady,
  useRehabClinicalStore,
} from "@/stores/rehab-clinical-store";

function RehabClinicalStoreSkeleton() {
  return (
    <div
      className="flex h-full min-h-0 flex-1 animate-pulse flex-col px-4 md:px-6"
      role="status"
      aria-label="Loading clinical checks"
    >
      <div className="border-border flex items-center justify-between border-b py-3">
        <div className="bg-muted h-7 w-32 rounded-md" />
      </div>
      <ListPlaceholder rows={6} className="mt-4" />
    </div>
  );
}

export function RehabClinicalStoreGate({ children }: { children: React.ReactNode }) {
  const ensureLoaded = useRehabClinicalStore((state) => state.ensureLoaded);
  const ready = useRehabClinicalStore(selectRehabClinicalReady);
  const error = useRehabClinicalStore((state) => state.error);

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
    return <RehabClinicalStoreSkeleton />;
  }

  return children;
}
