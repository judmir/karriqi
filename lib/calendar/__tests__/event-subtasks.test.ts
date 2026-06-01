import { describe, expect, it } from "vitest";

import {
  getEventDescriptionPlainText,
  parseEventDescription,
  serializeEventDescription,
  subtasksEqual,
  type EventSubtask,
} from "@/lib/calendar/event-subtasks";

describe("event-subtasks", () => {
  const subtasks: EventSubtask[] = [
    { id: "a", label: "Warm up", done: false },
    { id: "b", label: "Stretch", done: true },
  ];

  it("round-trips description and subtasks", () => {
    const stored = serializeEventDescription("Notes here", subtasks);
    expect(parseEventDescription(stored)).toEqual({
      description: "Notes here",
      subtasks,
    });
  });

  it("stores subtasks-only payloads", () => {
    const stored = serializeEventDescription("", subtasks);
    expect(getEventDescriptionPlainText(stored)).toBeNull();
    expect(parseEventDescription(stored).subtasks).toEqual(subtasks);
  });

  it("ignores invalid subtask payloads", () => {
    const raw = "Hello\n\n<!-- karriqi-subtasks:not-json -->";
    expect(parseEventDescription(raw)).toEqual({
      description: "Hello",
      subtasks: [],
    });
  });

  it("compares subtask lists", () => {
    expect(subtasksEqual(subtasks, [...subtasks])).toBe(true);
    expect(
      subtasksEqual(subtasks, [{ ...subtasks[0], done: true }, subtasks[1]]),
    ).toBe(false);
  });
});
