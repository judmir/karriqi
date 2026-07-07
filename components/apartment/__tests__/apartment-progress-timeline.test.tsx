import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/apartment/apartment-actions", () => ({
  upsertApartmentStepStateAction: vi.fn(),
  saveApartmentNotesAction: vi.fn(),
  upsertApartmentRoomAction: vi.fn(),
  deleteApartmentRoomAction: vi.fn(),
}));

vi.mock("@/lib/apartment/apartment-image-client", () => ({
  uploadApartmentImageClient: vi.fn(),
  updateApartmentImageClient: vi.fn(),
  setApartmentCoverImageClient: vi.fn(),
  reorderApartmentImagesClient: vi.fn(),
  deleteApartmentImageClient: vi.fn(),
}));

vi.mock("@/stores/load-actions", () => ({
  loadApartmentStoreAction: vi.fn(),
}));

import { ApartmentProgressTimeline } from "@/components/apartment/apartment-progress-timeline";
import { APARTMENT_PROGRESS_STEPS } from "@/lib/apartment/cicerostrasse-we28-data";
import { useApartmentStore } from "@/stores/apartment-store";

describe("ApartmentProgressTimeline", () => {
  beforeEach(() => {
    useApartmentStore.setState({ progressSteps: APARTMENT_PROGRESS_STEPS });
  });

  it("shows the waiting/spinner icon on the current step", () => {
    render(<ApartmentProgressTimeline />);
    expect(screen.getByTestId("step-waiting-icon")).toBeInTheDocument();
    expect(
      screen.getByText("Wait for Fälligkeitsmitteilung from notary"),
    ).toBeInTheDocument();
    expect(screen.getByText("Waiting")).toBeInTheDocument();
  });

  it("shows progress percentage from completed steps", () => {
    render(<ApartmentProgressTimeline />);
    expect(screen.getByText(/7 of 20 steps done · 35%/)).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "35",
    );
  });

  it("marks completed steps as done", () => {
    render(<ApartmentProgressTimeline />);
    expect(screen.getAllByLabelText("Done").length).toBe(7);
  });
});
