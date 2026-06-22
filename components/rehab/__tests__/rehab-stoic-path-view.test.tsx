import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RehabStoicPathDailyPanel } from "@/components/rehab/rehab-stoic-path-daily-panel";

vi.mock("@/stores/stoic-rehab-store", () => ({
  useStoicRehabStore: (selector: (state: unknown) => unknown) =>
    selector({
      saveCompletion: vi.fn(async () => ({ ok: true })),
      getCompletionForExercise: () => null,
    }),
}));

describe("RehabStoicPathDailyPanel", () => {
  it("renders morning intention with theory and task", () => {
    render(
      <RehabStoicPathDailyPanel
        date={new Date(2026, 5, 14)}
        exerciseId="stoic-day-01-morning"
      />,
    );

    expect(screen.getByText("Why this matters")).toBeInTheDocument();
    expect(
      screen.getByText("Morning Stoic Intention · Separate Control from Noise"),
    ).toBeInTheDocument();
    expect(screen.queryByText("Train the response")).not.toBeInTheDocument();
    expect(screen.queryByText("Process score")).not.toBeInTheDocument();
  });

  it("renders midday practice with train the response", () => {
    render(
      <RehabStoicPathDailyPanel
        date={new Date(2026, 5, 14)}
        exerciseId="stoic-day-01-midday"
      />,
    );

    expect(screen.getByText("Train the response")).toBeInTheDocument();
    expect(screen.getByText("Journal prompt")).toBeInTheDocument();
    expect(screen.queryByText("Process score")).not.toBeInTheDocument();
  });

  it("renders evening reflection with process score", () => {
    render(
      <RehabStoicPathDailyPanel
        date={new Date(2026, 5, 14)}
        exerciseId="stoic-day-01-evening"
      />,
    );

    expect(screen.getByText("Evening reflection")).toBeInTheDocument();
    expect(screen.getByText("Process score")).toBeInTheDocument();
  });
});
