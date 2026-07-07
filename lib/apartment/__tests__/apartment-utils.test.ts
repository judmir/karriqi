import { describe, expect, it } from "vitest";

import {
  calcProgressPercent,
  findCurrentStep,
  formatEuro,
  formatEuroWhole,
  formatStepDeadline,
  isStepDeadlineOverdue,
  mergeStepStates,
} from "@/lib/apartment/apartment-utils";
import {
  APARTMENT_PROGRESS_STEPS,
  APARTMENT_TOTAL_CASH_NEEDED_EUR,
} from "@/lib/apartment/cicerostrasse-we28-data";
import type { ApartmentProgressStep } from "@/types/apartment";

const steps = (statuses: ApartmentProgressStep["status"][]) =>
  statuses.map((status, index) => ({
    id: `step-${index}`,
    title: `Step ${index}`,
    status,
  }));

describe("calcProgressPercent", () => {
  it("returns 0 for an empty list", () => {
    expect(calcProgressPercent([])).toBe(0);
  });

  it("returns the rounded share of done steps", () => {
    expect(calcProgressPercent(steps(["done", "done", "todo", "todo"]))).toBe(50);
    expect(calcProgressPercent(steps(["done", "todo", "todo"]))).toBe(33);
    expect(calcProgressPercent(steps(["done", "done", "done"]))).toBe(100);
  });

  it("does not count current or blocked steps as done", () => {
    expect(calcProgressPercent(steps(["done", "current", "blocked", "todo"]))).toBe(
      25,
    );
  });

  it("matches the seeded WE28 plan (7 of 18 done = 39%)", () => {
    expect(calcProgressPercent(APARTMENT_PROGRESS_STEPS)).toBe(39);
  });
});

describe("findCurrentStep", () => {
  it("finds the seeded waiting step (Fälligkeitsmitteilung)", () => {
    const current = findCurrentStep(APARTMENT_PROGRESS_STEPS);
    expect(current?.id).toBe("wait-faelligkeitsmitteilung");
  });

  it("returns null when nothing is current", () => {
    expect(findCurrentStep(steps(["done", "todo"]))).toBeNull();
  });
});

describe("mergeStepStates", () => {
  it("overlays DB status, date and notes onto seed steps", () => {
    const merged = mergeStepStates(APARTMENT_PROGRESS_STEPS, [
      {
        kind: "progress",
        stepKey: "handover-appointment",
        status: "done",
        date: "2026-08-01",
        notes: "Booked with seller",
      },
    ]);
    const step = merged.find((s) => s.id === "handover-appointment");
    expect(step?.status).toBe("done");
    expect(step?.date).toBe("2026-08-01");
    expect(step?.notes).toBe("Booked with seller");
    // Untouched steps keep seed values.
    expect(merged.find((s) => s.id === "postident")?.status).toBe("done");
  });
});

describe("formatStepDeadline", () => {
  it("formats ISO dates for display", () => {
    expect(formatStepDeadline("2026-08-15")).toMatch(/15/);
    expect(formatStepDeadline("2026-08-15")).toMatch(/2026/);
  });

  it("flags overdue deadlines for open steps", () => {
    expect(isStepDeadlineOverdue("2020-01-01", "todo")).toBe(true);
    expect(isStepDeadlineOverdue("2020-01-01", "done")).toBe(false);
    expect(isStepDeadlineOverdue(undefined, "todo")).toBe(false);
  });
});

describe("euro formatting", () => {
  it("formats cash summary values in German locale", () => {
    const formatted = formatEuro(APARTMENT_TOTAL_CASH_NEEDED_EUR);
    expect(formatted).toContain("100.160");
    expect(formatted).toContain("€");
    expect(formatted).toContain(",00");
  });

  it("formats whole euros without cents", () => {
    const formatted = formatEuroWhole(545_000);
    expect(formatted).toContain("545.000");
    expect(formatted).not.toContain(",00");
  });

  it("formats the monthly loan payment with cents", () => {
    expect(formatEuro(2359.59)).toContain("2.359,59");
  });
});
