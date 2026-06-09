import {
  parseEventDescription,
  serializeEventDescription,
  type EventSubtask,
} from "@/lib/calendar/event-subtasks";
import type { RehabEventKind, RehabPlanEvent } from "@/types/rehab";

export const DAY0_DESCRIPTION = `## Day 0 checklist

### Equipment
- Apple Watch or wearable ready
- Polar H10 paired, if using
- Tripod/phone camera ready
- Journal/app ready
- Gym access or dumbbells/bands ready
- Cones/markers or wall-passing spot ready
- Waking Up app ready
- Supplements bought and doses agreed with doctor/pharmacist

### Videos (save as YYYY-MM-DD_week0_task.mp4)
- 60 sec typing, buttons, shoelaces, bottle caps, coins
- stair descent, single-leg stance, sit-to-stand, heel raises
- 6-minute walk, football wall passes, cone dribble
- reading + spontaneous speech samples

See Wiki: Day 0 for full clinical checklist.`;

export const DAY0_SUBTASK_SECTIONS = [
  {
    label: "Equipment",
    prefix: "equipment.",
  },
  {
    label: "Videos (save as YYYY-MM-DD_week0_task.mp4)",
    prefix: "videos.",
  },
] as const;

export const DAY0_SUBTASKS: EventSubtask[] = [
  { id: "equipment.watch", label: "Apple Watch or wearable ready", done: false },
  { id: "equipment.polar", label: "Polar H10 paired, if using", done: false },
  { id: "equipment.camera", label: "Tripod/phone camera ready", done: false },
  { id: "equipment.journal", label: "Journal/app ready", done: false },
  {
    id: "equipment.gym",
    label: "Gym access or dumbbells/bands ready",
    done: false,
  },
  {
    id: "equipment.cones",
    label: "Cones/markers or wall-passing spot ready",
    done: false,
  },
  { id: "equipment.waking-up", label: "Waking Up app ready", done: false },
  {
    id: "equipment.supplements",
    label: "Supplements bought and doses agreed with doctor/pharmacist",
    done: false,
  },
  {
    id: "videos.hands",
    label: "60 sec typing, buttons, shoelaces, bottle caps, coins",
    done: false,
  },
  {
    id: "videos.legs",
    label: "Stair descent, single-leg stance, sit-to-stand, heel raises",
    done: false,
  },
  {
    id: "videos.walk-football",
    label: "6-minute walk, football wall passes, cone dribble",
    done: false,
  },
  {
    id: "videos.speech",
    label: "Reading + spontaneous speech samples",
    done: false,
  },
];

export function defaultDay0Subtasks(): EventSubtask[] {
  return DAY0_SUBTASKS.map((item) => ({ ...item }));
}

export function buildDay0EventDescription(): string {
  return serializeEventDescription(DAY0_DESCRIPTION, defaultDay0Subtasks())!;
}

export function allEventSubtasksDone(subtasks: EventSubtask[]): boolean {
  return subtasks.length > 0 && subtasks.every((item) => item.done);
}

export function countEventSubtasksDone(subtasks: EventSubtask[]): number {
  return subtasks.filter((item) => item.done).length;
}

export function resolveEventSubtasks(
  event: Pick<RehabPlanEvent, "description" | "eventKind">,
): { description: string; subtasks: EventSubtask[]; myNotes: string } {
  const parsed = parseEventDescription(event.description);
  if (parsed.subtasks.length > 0) {
    return parsed;
  }

  if (event.eventKind === "day0") {
    return {
      description: parsed.description.trim() || DAY0_DESCRIPTION,
      subtasks: defaultDay0Subtasks(),
      myNotes: parsed.myNotes,
    };
  }

  return parsed;
}

export function groupEventSubtasks(
  subtasks: EventSubtask[],
  eventKind: RehabEventKind,
): { label: string | null; items: EventSubtask[] }[] {
  if (eventKind !== "day0") {
    return [{ label: null, items: subtasks }];
  }

  const groups = DAY0_SUBTASK_SECTIONS.map((section) => ({
    label: section.label,
    items: subtasks.filter((item) => item.id.startsWith(section.prefix)),
  })).filter((group) => group.items.length > 0);

  const groupedIds = new Set(groups.flatMap((group) => group.items.map((item) => item.id)));
  const ungrouped = subtasks.filter((item) => !groupedIds.has(item.id));
  if (ungrouped.length > 0) {
    groups.push({ label: null, items: ungrouped });
  }

  return groups;
}
