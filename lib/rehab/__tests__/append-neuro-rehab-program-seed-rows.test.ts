import { describe, expect, it } from "vitest";

import { missingProgramSeedRows } from "@/lib/rehab/append-neuro-rehab-program-seed-rows";
import { generateNeuroRehabProgramEvents } from "@/modules/rehab/neuro-rehab-2026/generate-program-events";

describe("missingProgramSeedRows", () => {
  it("returns Day 0 and deferred tail rows when absent", () => {
    const generated = generateNeuroRehabProgramEvents("user-1");
    const existing = generated.filter(
      (row) =>
        row.event_kind !== "day0" &&
        !row.start_at.startsWith("2026-09-"),
    );

    const missing = missingProgramSeedRows(
      "user-1",
      existing.map((row) => ({
        event_kind: row.event_kind,
        start_at: row.start_at,
      })),
    );

    expect(missing.some((row) => row.event_kind === "day0")).toBe(true);
    expect(missing.some((row) => row.start_at.startsWith("2026-09-"))).toBe(
      true,
    );
    expect(missing.length).toBeGreaterThan(1);
  });
});
