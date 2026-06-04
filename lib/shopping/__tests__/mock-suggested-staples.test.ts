import { describe, expect, it } from "vitest";

import {
  mergeDevSuggestedStaples,
  MOCK_SUGGESTED_STAPLES,
} from "@/lib/shopping/mock-suggested-staples";
import type { StapleItem } from "@/types/shopping";

const baseStaple: StapleItem = {
  id: "staple-qumesht",
  name: "Qumësht",
  createdAt: "2026-01-01T12:00:00.000Z",
};

describe("mergeDevSuggestedStaples", () => {
  it("adds mock suggested staples in development", () => {
    const merged = mergeDevSuggestedStaples([baseStaple], {
      includeMockSuggested: true,
    });
    expect(merged.length).toBe(1 + MOCK_SUGGESTED_STAPLES.length);
    expect(merged.some((staple) => staple.id === "mock-suggested-domate")).toBe(
      true,
    );
  });

  it("does not duplicate staples already in the catalog", () => {
    const merged = mergeDevSuggestedStaples(
      [baseStaple, ...MOCK_SUGGESTED_STAPLES],
      { includeMockSuggested: true },
    );
    expect(merged.length).toBe(1 + MOCK_SUGGESTED_STAPLES.length);
  });
});
