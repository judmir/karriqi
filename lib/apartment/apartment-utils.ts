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

const stepDeadlineFormatter = new Intl.DateTimeFormat("de-DE", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

/** Display an ISO yyyy-mm-dd step deadline in the UI. */
export function formatStepDeadline(isoDate: string): string {
  const parsed = parseIsoDate(isoDate);
  if (!parsed) {
    return isoDate;
  }
  return stepDeadlineFormatter.format(parsed);
}

function parseIsoDate(isoDate: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) {
    return null;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(year, month - 1, day);
  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }
  return parsed;
}

/** True when a non-done step has a deadline before today (local). */
export function isStepDeadlineOverdue(
  isoDate: string | undefined,
  status: ApartmentStepStatus,
): boolean {
  if (!isoDate || status === "done") {
    return false;
  }
  const deadline = parseIsoDate(isoDate);
  if (!deadline) {
    return false;
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return deadline < today;
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
