import { describe, expect, it } from "vitest";

import { getEventDescriptionPlainText } from "@/lib/calendar/event-subtasks";
import {
  collectStoicResponseHistory,
  getStoicResponseData,
  hasStoicResponse,
  isStoicEvent,
  parseStoicResponse,
  serializeStoicResponse,
  summarizeStoicResponse,
  type StoicResponseData,
} from "@/lib/rehab/stoic-response";
import type { RehabPlanEvent } from "@/types/rehab";

const PROMPT = "Theme (weeks 1–2): Control vs non-control.\n\nDaily line.";

function answer(overrides: Partial<StoicResponseData>): StoicResponseData {
  return { checks: {}, note: "", ...overrides };
}

function stoicEvent(overrides: Partial<RehabPlanEvent>): RehabPlanEvent {
  return {
    id: "id",
    userId: "u1",
    title: "Stoic intention",
    description: PROMPT,
    startAt: "2026-06-09T05:40:00.000Z",
    endAt: "2026-06-09T05:43:00.000Z",
    allDay: false,
    color: "purple",
    source: "local",
    completedAt: null,
    eventKind: "stoic",
    programId: null,
    planWeek: null,
    seriesId: "series",
    recurrence: null,
    recurrenceAt: null,
    recurrenceCancelled: false,
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-06-01T00:00:00.000Z",
    ...overrides,
  } as RehabPlanEvent;
}

describe("stoic-response serialization", () => {
  it("keeps only the prompt when nothing is logged", () => {
    expect(serializeStoicResponse(PROMPT, answer({}))).toBe(PROMPT);
  });

  it("round-trips checks and a note containing newlines and -->", () => {
    const data = answer({
      checks: { trained: "yes", discipline: "partial", responded: "no" },
      note: "Pushed through --> calm.\nNext: rest.",
    });
    const serialized = serializeStoicResponse(PROMPT, data);
    const parsed = parseStoicResponse(serialized);
    expect(parsed.prompt).toBe(PROMPT);
    expect(parsed.data.checks).toEqual({
      trained: "yes",
      discipline: "partial",
      responded: "no",
    });
    expect(parsed.data.note).toBe("Pushed through --> calm.\nNext: rest.");
    expect(hasStoicResponse(serialized)).toBe(true);
  });

  it("reads a legacy plain-text response as a note", () => {
    const legacy = `${PROMPT}\n\n<!-- karriqi-stoic-response:${encodeURIComponent("old free text")} -->`;
    expect(getStoicResponseData(legacy)).toEqual({
      checks: {},
      note: "old free text",
    });
  });

  it("hides the response marker from the plain-text description", () => {
    const serialized = serializeStoicResponse(
      PROMPT,
      answer({ checks: { trained: "yes" }, note: "private note" }),
    );
    const plain = getEventDescriptionPlainText(serialized);
    expect(plain).not.toContain("karriqi-stoic-response");
    expect(plain).not.toContain("private note");
    expect(plain).toContain("Control vs non-control");
  });

  it("summarizes counts and note", () => {
    expect(
      summarizeStoicResponse(
        answer({ checks: { a: "yes", b: "yes", c: "partial" }, note: "ok" }),
      ),
    ).toBe("2 yes · 1 partial — ok");
    expect(summarizeStoicResponse(answer({ note: "just a note" }))).toBe(
      "just a note",
    );
  });

  it("treats only the stoic kind as a stoic event", () => {
    expect(isStoicEvent({ eventKind: "stoic" })).toBe(true);
    expect(isStoicEvent({ eventKind: "journal" })).toBe(false);
  });
});

describe("collectStoicResponseHistory", () => {
  it("returns same-titled stoic answers newest first, skipping empty ones", () => {
    const events: RehabPlanEvent[] = [
      stoicEvent({ id: "master", recurrenceAt: null }),
      stoicEvent({
        id: "older",
        recurrenceAt: "2026-06-08T05:40:00.000Z",
        description: serializeStoicResponse(
          PROMPT,
          answer({ checks: { trained: "yes" }, note: "older entry" }),
        ),
        completedAt: "2026-06-08T06:00:00.000Z",
      }),
      stoicEvent({
        id: "newer",
        recurrenceAt: "2026-06-10T05:40:00.000Z",
        description: serializeStoicResponse(
          PROMPT,
          answer({ checks: { trained: "no" }, note: "newer entry" }),
        ),
      }),
      // Completed but nothing logged — excluded.
      stoicEvent({
        id: "completed-only",
        recurrenceAt: "2026-06-09T05:40:00.000Z",
        description: PROMPT,
        completedAt: "2026-06-09T06:00:00.000Z",
      }),
      // Different stoic series (weekly review) — excluded by title.
      stoicEvent({
        id: "weekly",
        title: "Stoic weekly review",
        recurrenceAt: "2026-06-07T17:30:00.000Z",
        description: serializeStoicResponse(
          PROMPT,
          answer({ note: "weekly entry" }),
        ),
      }),
    ];

    const history = collectStoicResponseHistory(events, {
      title: "Stoic intention",
      eventKind: "stoic",
    });

    expect(history.map((entry) => entry.id)).toEqual(["newer", "older"]);
    expect(history[0].data.note).toBe("newer entry");
    expect(history[1].completed).toBe(true);
  });
});
