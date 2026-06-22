import { beforeEach, describe, expect, it, vi } from "vitest";

import { useStoicRehabStore } from "@/stores/stoic-rehab-store";

vi.mock("@/lib/rehab/stoic-rehab-actions", () => ({
  saveStoicRehabCompletion: vi.fn(async () => ({
    ok: true,
    id: "saved-1",
    completedAt: "2026-06-14T12:00:00.000Z",
  })),
  clearStoicRehabCompletion: vi.fn(async () => ({ ok: true })),
}));

describe("useStoicRehabStore", () => {
  beforeEach(() => {
    useStoicRehabStore.getState().reset();
  });

  it("saves a completion with journal and process score", async () => {
    useStoicRehabStore.getState().hydrate([], true);

    const result = await useStoicRehabStore.getState().saveCompletion({
      exerciseId: "stoic-day-01-evening",
      journalText: "Calm rep.",
      processScore: 3,
      adapted: true,
    });

    expect(result.ok).toBe(true);
    const saved = useStoicRehabStore
      .getState()
      .getCompletionForExercise("stoic-day-01-evening");
    expect(saved?.journalText).toBe("Calm rep.");
    expect(saved?.processScore).toBe(3);
    expect(saved?.adapted).toBe(true);
  });
});
