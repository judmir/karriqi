import type { ApartmentProgressStep, ApartmentStepState, ApartmentStepStatus } from "@/types/apartment";

const euroFormatter = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const euroWholeFormatter = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatEuro(amount: number): string {
  return euroFormatter.format(amount);
}

/** Whole-euro display for large figures (e.g. €545.000). */
export function formatEuroWhole(amount: number): string {
  return euroWholeFormatter.format(amount);
}

export function formatAreaM2(area: number): string {
  return `${new Intl.NumberFormat("de-DE", { maximumFractionDigits: 2 }).format(area)} m²`;
}

export function formatPercent(pct: number): string {
  return `${new Intl.NumberFormat("de-DE", { maximumFractionDigits: 2 }).format(pct)}%`;
}

/** Share of steps completed, rounded to whole percent (0–100). */
export function calcProgressPercent(steps: ApartmentProgressStep[]): number {
  if (steps.length === 0) {
    return 0;
  }
  const done = steps.filter((step) => step.status === "done").length;
  return Math.round((done / steps.length) * 100);
}

export function findCurrentStep(
  steps: ApartmentProgressStep[],
): ApartmentProgressStep | null {
  return steps.find((step) => step.status === "current") ?? null;
}

/** Overlay DB step-state overrides onto seed defaults (seed order preserved). */
export function mergeStepStates(
  seedSteps: ApartmentProgressStep[],
  states: ApartmentStepState[],
): ApartmentProgressStep[] {
  const byKey = new Map(states.map((state) => [state.stepKey, state]));
  return seedSteps.map((step) => {
    const state = byKey.get(step.id);
    if (!state) {
      return step;
    }
    return {
      ...step,
      status: state.status,
      date: state.date ?? step.date,
      notes: state.notes ?? step.notes,
    };
  });
}

export const APARTMENT_STEP_STATUS_LABELS: Record<ApartmentStepStatus, string> = {
  done: "Done",
  current: "In progress",
  todo: "To do",
  blocked: "Blocked",
};
