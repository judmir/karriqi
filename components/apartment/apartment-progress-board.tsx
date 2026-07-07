"use client";

import { Mail } from "lucide-react";

import { ApartmentProgressTimeline } from "@/components/apartment/apartment-progress-timeline";
import { ApartmentStepTrack } from "@/components/apartment/apartment-step-track";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useApartmentStore } from "@/stores/apartment-store";

/** Three progress tracks in one row: keys · rental notice · move-in. */
export function ApartmentProgressBoard() {
  const rentalSteps = useApartmentStore((state) => state.rentalSteps);
  const moveInSteps = useApartmentStore((state) => state.moveInSteps);

  return (
    <section aria-label="Purchase progress" className="flex flex-col gap-3">
      <h2 className="font-heading text-lg font-semibold">Progress</h2>
      <div className="grid gap-4 xl:grid-cols-3">
        <div className="min-h-0 xl:col-span-1">
          <ApartmentProgressTimeline compact />
        </div>

        <ApartmentStepTrack
          title="Rental apartment — Kündigung"
          steps={rentalSteps}
          kind="rental"
          compact
          headerExtra={
            <Alert variant="warning" className="py-2">
              <Mail aria-hidden />
              <AlertTitle className="text-sm">Schriftform check</AlertTitle>
              <AlertDescription className="text-xs">
                Signed letter may be required — not email alone. Keep delivery
                proof.
              </AlertDescription>
            </Alert>
          }
        />

        <ApartmentStepTrack
          title="Move-in & relocation"
          steps={moveInSteps}
          kind="movein"
          compact
        />
      </div>
    </section>
  );
}
