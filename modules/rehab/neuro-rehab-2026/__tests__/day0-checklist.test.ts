import { describe, expect, it } from "vitest";

import { parseEventDescription } from "@/lib/calendar/event-subtasks";
import {
  DAY0_SUBTASKS,
  allEventSubtasksDone,
  buildDay0EventDescription,
  defaultDay0Subtasks,
  groupEventSubtasks,
  resolveEventSubtasks,
} from "@/modules/rehab/neuro-rehab-2026/day0-checklist";

describe("day0-checklist", () => {
  it("builds a stored description with embedded subtasks", () => {
    const stored = buildDay0EventDescription();
    const parsed = parseEventDescription(stored);
    expect(parsed.subtasks).toHaveLength(DAY0_SUBTASKS.length);
    expect(parsed.subtasks.map((item) => item.label)).toEqual(
      DAY0_SUBTASKS.map((item) => item.label),
    );
    expect(parsed.description).toContain("Day 0 checklist");
  });

  it("falls back to default day0 subtasks for legacy events", () => {
    const resolved = resolveEventSubtasks({
      eventKind: "day0",
      description: "## Day 0 checklist\n\nLegacy markdown only.",
    });
    expect(resolved.subtasks).toHaveLength(DAY0_SUBTASKS.length);
    expect(resolved.subtasks.every((item) => !item.done)).toBe(true);
  });

  it("groups day0 subtasks into equipment and videos", () => {
    const groups = groupEventSubtasks(defaultDay0Subtasks(), "day0");
    expect(groups).toHaveLength(2);
    expect(groups[0]?.label).toBe("Equipment");
    expect(groups[0]?.items).toHaveLength(8);
    expect(groups[1]?.label).toContain("Videos");
    expect(groups[1]?.items).toHaveLength(4);
  });

  it("tracks all-done state", () => {
    const subtasks = defaultDay0Subtasks();
    expect(allEventSubtasksDone(subtasks)).toBe(false);
    expect(
      allEventSubtasksDone(subtasks.map((item) => ({ ...item, done: true }))),
    ).toBe(true);
  });
});
