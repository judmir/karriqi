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
    {
      id: "a",
      label: "Warm up",
      done: false,
      referenceLabel: "GIF",
      referenceUrl: "https://example.com/warm-up.gif",
    },
    { id: "b", label: "Stretch", done: true },
  ];

  it("round-trips description and subtasks", () => {
    const stored = serializeEventDescription("Notes here", subtasks);
    expect(parseEventDescription(stored)).toEqual({
      description: "Notes here",
      subtasks,
      myNotes: "",
    });
  });

  it("round-trips my notes with description and subtasks", () => {
    const stored = serializeEventDescription(
      "Run/walk session then speech practice.",
      subtasks,
      "Legs felt heavy. Speech was clearer than last week.",
    );
    expect(parseEventDescription(stored)).toEqual({
      description: "Run/walk session then speech practice.",
      subtasks,
      myNotes: "Legs felt heavy. Speech was clearer than last week.",
    });
    expect(getEventDescriptionPlainText(stored)).toBe(
      "Run/walk session then speech practice.",
    );
  });

  it("stores my notes without description", () => {
    const stored = serializeEventDescription("", [], "Felt good today.");
    expect(parseEventDescription(stored)).toEqual({
      description: "",
      subtasks: [],
      myNotes: "Felt good today.",
    });
    expect(getEventDescriptionPlainText(stored)).toBeNull();
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
      myNotes: "",
    });
  });

  it("compares subtask lists", () => {
    expect(subtasksEqual(subtasks, [...subtasks])).toBe(true);
    expect(
      subtasksEqual(subtasks, [{ ...subtasks[0], done: true }, subtasks[1]]),
    ).toBe(false);
  });
});
