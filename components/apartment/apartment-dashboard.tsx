"use client";

import { ApartmentDocumentsSection } from "@/components/apartment/apartment-documents-section";
import { ApartmentFloorplanViewer } from "@/components/apartment/apartment-floorplan-viewer";
import { ApartmentHeroCarousel } from "@/components/apartment/apartment-hero-carousel";
import { ApartmentLoanSummary } from "@/components/apartment/apartment-loan-summary";
import { ApartmentNotes } from "@/components/apartment/apartment-notes";
import { ApartmentProgressBoard } from "@/components/apartment/apartment-progress-board";
import { ApartmentPropertySummary } from "@/components/apartment/apartment-property-summary";

export function ApartmentDashboard() {
  return (
    <div className="flex flex-col gap-6 pb-10">
      <ApartmentHeroCarousel />
      <ApartmentPropertySummary />
      <ApartmentProgressBoard />

      <div className="grid gap-6 lg:grid-cols-2">
        <ApartmentLoanSummary />
        <ApartmentNotes />
      </div>

      <ApartmentFloorplanViewer />
      <ApartmentDocumentsSection />
    </div>
  );
}
