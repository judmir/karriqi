import { describe, expect, it } from "vitest";

import { generateNeuroRehabProgramEvents } from "@/modules/rehab/neuro-rehab-2026/generate-program-events";

describe("generateNeuroRehabProgramEvents dedupe keys", () => {
  it("has no duplicate (event_kind, start_at) pairs", () => {
    const rows = generateNeuroRehabProgramEvents("test-user");
    const keys = new Map<string, string>();
    for (const row of rows) {
      const key = `${row.event_kind}\u0000${new Date(row.start_at).getTime()}`;
      expect(
        keys.has(key),
        `duplicate ${row.event_kind} at ${row.start_at}: ${keys.get(key)} vs ${row.title}`,
      ).toBe(false);
      keys.set(key, row.title);
    }
  });
});
