"use client";

import {
  ApartmentPostClosingChecklist,
  ApartmentRentalNotice,
} from "@/components/apartment/apartment-checklists";
import { ApartmentDocumentsSection } from "@/components/apartment/apartment-documents-section";
import { ApartmentFloorplanViewer } from "@/components/apartment/apartment-floorplan-viewer";
import { ApartmentHeroCarousel } from "@/components/apartment/apartment-hero-carousel";
import { ApartmentLoanSummary } from "@/components/apartment/apartment-loan-summary";
import { ApartmentNotes } from "@/components/apartment/apartment-notes";
import { ApartmentProgressTimeline } from "@/components/apartment/apartment-progress-timeline";
import { ApartmentPropertySummary } from "@/components/apartment/apartment-property-summary";

export function ApartmentDashboard() {
  return (
    <div className="flex flex-col gap-6 pb-10">
      <ApartmentHeroCarousel />
      <ApartmentPropertySummary />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-6">
          <ApartmentProgressTimeline />
        </div>
        <div className="flex flex-col gap-6">
          <ApartmentLoanSummary />
          <ApartmentNotes />
          <ApartmentRentalNotice />
        </div>
      </div>

      <ApartmentFloorplanViewer />
      <ApartmentDocumentsSection />
      <ApartmentPostClosingChecklist />
    </div>
  );
}
