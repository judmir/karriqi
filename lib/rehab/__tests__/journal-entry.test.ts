import { describe, expect, it } from "vitest";

import {
  emptyJournalEntry,
  JOURNAL_PROGRAM_EVENT_HINT,
  normalizeJournalNotes,
  parseJournalDescription,
  serializeJournalDescription,
  type JournalEntryData,
} from "@/lib/rehab/journal-entry";

describe("journal-entry serialization", () => {
  it("returns null when nothing is filled in", () => {
    expect(serializeJournalDescription(emptyJournalEntry())).toBeNull();
  });

  it("returns plain notes when only notes are filled in", () => {
    const data: JournalEntryData = {
      ratings: {},
      rehabDone: null,
      notes: "Slept poorly, lots of caffeine.",
    };
    expect(serializeJournalDescription(data)).toBe(
      "Slept poorly, lots of caffeine.",
    );
  });

  it("round-trips ratings, rehab status, and notes", () => {
    const data: JournalEntryData = {
      ratings: { sleep: 7, stress: 3, typing: 0 },
      rehabDone: "partial",
      notes: "Felt some hand stiffness.",
    };

    const serialized = serializeJournalDescription(data);
    expect(serialized).toContain("Felt some hand stiffness.");
    expect(serialized).toContain("karriqi-journal:");

    const parsed = parseJournalDescription(serialized);
    expect(parsed).toEqual(data);
  });

  it("serializes meta with no notes as a bare marker", () => {
    const serialized = serializeJournalDescription({
      ratings: { fatigue: 5 },
      rehabDone: "yes",
      notes: "",
    });
    expect(serialized).toBe(
      '<!-- karriqi-journal:{"ratings":{"fatigue":5},"rehabDone":"yes"} -->',
    );
  });

  it("ignores out-of-range and unknown rating keys", () => {
    const raw =
      '<!-- karriqi-journal:{"ratings":{"sleep":12,"bogus":4,"stress":2},"rehabDone":"maybe"} -->';
    const parsed = parseJournalDescription(raw);
    expect(parsed.ratings).toEqual({ stress: 2 });
    expect(parsed.rehabDone).toBeNull();
  });

  it("treats a description without a marker as notes only", () => {
    const parsed = parseJournalDescription("Just a plain note.");
    expect(parsed).toEqual({
      ratings: {},
      rehabDone: null,
      notes: "Just a plain note.",
    });
  });

  it("returns an empty entry for null/undefined input", () => {
    expect(parseJournalDescription(null)).toEqual(emptyJournalEntry());
    expect(parseJournalDescription(undefined)).toEqual(emptyJournalEntry());
  });

  it("strips legacy program hint from notes", () => {
    expect(normalizeJournalNotes(JOURNAL_PROGRAM_EVENT_HINT)).toBe("");
    expect(normalizeJournalNotes("  actual note  ")).toBe("  actual note  ");
  });
});
