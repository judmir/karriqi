import type { LucideIcon } from "lucide-react";
import {
  Activity,
  ClipboardList,
  Compass,
  Dumbbell,
  Footprints,
  Hand,
  Leaf,
  ListChecks,
  Mic,
  NotebookPen,
  Pill,
  Sparkles,
  Stethoscope,
  Trophy,
} from "lucide-react";

import {
  allEventSubtasksDone,
  resolveEventSubtasks,
} from "@/modules/rehab/neuro-rehab-2026/day0-checklist";
import type { CalendarEvent, CalendarEventColor } from "@/types/calendar";
import type { RehabEventKind, RehabPlanEvent } from "@/types/rehab";

/** Karriqi calendar palette (matches Google mapping in map-events.ts). */
export const CALENDAR_COLOR_HEX: Record<CalendarEventColor, string> = {
  blue: "#039be5",
  green: "#0b8043",
  orange: "#f4511e",
  purple: "#8e24aa",
  red: "#d50000",
};

export function hexToRgba(hex: string, alpha: number): string {
  const normalized = hex.replace("#", "");
  const value =
    normalized.length === 3
      ? normalized
          .split("")
          .map((c) => c + c)
          .join("")
      : normalized;
  const r = Number.parseInt(value.slice(0, 2), 16);
  const g = Number.parseInt(value.slice(2, 4), 16);
  const b = Number.parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function getRehabEventKind(
  event: CalendarEvent,
): RehabEventKind | null {
  if (!("eventKind" in event)) {
    return null;
  }
  const kind = (event as RehabPlanEvent).eventKind;
  return typeof kind === "string" ? kind : null;
}

export function isRehabPlanEvent(
  event: CalendarEvent,
): event is RehabPlanEvent {
  return getRehabEventKind(event) !== null;
}

export type RehabEventStatus = "completed" | "missed" | null;

/**
 * Completion state for a rehab calendar event: "completed" when done (directly
 * or via all subtasks), "missed" when it's past and still incomplete, otherwise
 * null. Non-rehab (e.g. Google) events always return null.
 */
export function getRehabEventStatus(
  event: CalendarEvent,
  past: boolean,
): RehabEventStatus {
  if (!isRehabPlanEvent(event)) {
    return null;
  }
  const { subtasks } = resolveEventSubtasks(event);
  const completed =
    subtasks.length > 0
      ? allEventSubtasksDone(subtasks)
      : Boolean(event.completedAt);
  if (completed) {
    return "completed";
  }
  return past ? "missed" : null;
}

/**
 * Unified status background for calendar events across all views: light green
 * when completed, light grey when missed (past & incomplete). Returns null for
 * pending/future or non-rehab events, which keep their normal colored
 * appearance. When non-null this fully replaces the event's color fill and the
 * past-dimming class so the status reads clearly.
 */
export function rehabEventStatusSurfaceClass(
  status: RehabEventStatus,
): string | null {
  if (status === "completed") {
    return "bg-emerald-400/40 text-foreground dark:bg-emerald-400/35";
  }
  if (status === "missed") {
    return "bg-muted/60 text-muted-foreground";
  }
  return null;
}

const KIND_ICON: Record<RehabEventKind, LucideIcon> = {
  gym_a: Dumbbell,
  gym_b: Dumbbell,
  gym_c: Dumbbell,
  gym_d: Dumbbell,
  run_walk: Footprints,
  hand: Hand,
  speech: Mic,
  football: Trophy,
  meditation: Sparkles,
  journal: NotebookPen,
  supplement: Pill,
  weekly_review: ClipboardList,
  retest: Stethoscope,
  day0: ListChecks,
  recovery: Leaf,
  stoic: Compass,
  custom: Activity,
};

const KIND_LABEL: Record<RehabEventKind, string> = {
  gym_a: "Gym",
  gym_b: "Gym",
  gym_c: "Gym",
  gym_d: "Gym",
  run_walk: "Run",
  hand: "Hand therapy",
  speech: "Speech",
  football: "Football",
  meditation: "Meditation",
  journal: "Journal",
  supplement: "Supplement",
  weekly_review: "Weekly review",
  retest: "Retest",
  day0: "Day 0",
  recovery: "Recovery",
  stoic: "Stoicism",
  custom: "Task",
};

export type RehabEventKindVisual = {
  kind: RehabEventKind;
  icon: LucideIcon;
  label: string;
  hex: string;
};

export function rehabEventKindVisual(
  event: CalendarEvent,
): RehabEventKindVisual | null {
  const kind = getRehabEventKind(event);
  if (!kind) {
    return null;
  }
  const hex = CALENDAR_COLOR_HEX[event.color] ?? CALENDAR_COLOR_HEX.blue;
  return {
    kind,
    icon: KIND_ICON[kind],
    label: KIND_LABEL[kind],
    hex,
  };
}

/** Kinds users can pick when creating or editing a custom rehab event. */
export const REHAB_EVENT_KIND_PICKER_OPTIONS: RehabEventKind[] = [
  "run_walk",
  "gym_a",
  "hand",
  "speech",
  "football",
  "meditation",
  "journal",
  "supplement",
  "stoic",
  "recovery",
  "custom",
];

const KIND_DEFAULT_COLOR: Record<RehabEventKind, CalendarEventColor> = {
  gym_a: "blue",
  gym_b: "blue",
  gym_c: "blue",
  gym_d: "blue",
  run_walk: "green",
  hand: "orange",
  speech: "red",
  football: "orange",
  meditation: "purple",
  journal: "red",
  supplement: "blue",
  weekly_review: "purple",
  retest: "purple",
  day0: "purple",
  recovery: "green",
  stoic: "purple",
  custom: "blue",
};

export function rehabEventKindPickerOptions(
  current?: RehabEventKind,
): RehabEventKind[] {
  if (!current || REHAB_EVENT_KIND_PICKER_OPTIONS.includes(current)) {
    return REHAB_EVENT_KIND_PICKER_OPTIONS;
  }
  return [current, ...REHAB_EVENT_KIND_PICKER_OPTIONS];
}

export function rehabEventKindDefaultColor(
  kind: RehabEventKind,
): CalendarEventColor {
  return KIND_DEFAULT_COLOR[kind] ?? "blue";
}

export type RehabEventKindPickerVisual = {
  kind: RehabEventKind;
  icon: LucideIcon;
  label: string;
  defaultColor: CalendarEventColor;
  hex: string;
};

export function rehabEventKindPickerVisual(
  kind: RehabEventKind,
): RehabEventKindPickerVisual {
  const defaultColor = rehabEventKindDefaultColor(kind);
  return {
    kind,
    icon: KIND_ICON[kind],
    label: KIND_LABEL[kind],
    defaultColor,
    hex: CALENDAR_COLOR_HEX[defaultColor],
  };
}
