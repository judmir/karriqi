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
  run_walk: "Run / walk",
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
