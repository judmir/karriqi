"use client";

import { ApartmentStepTrack } from "@/components/apartment/apartment-step-track";
import { useApartmentStore } from "@/stores/apartment-store";

export function ApartmentProgressTimeline({ compact = false }: { compact?: boolean }) {
  const steps = useApartmentStore((state) => state.progressSteps);

  return (
    <ApartmentStepTrack
      title="Progress to keys"
      steps={steps}
      kind="progress"
      compact={compact}
      waitingTestId
    />
  );
}
