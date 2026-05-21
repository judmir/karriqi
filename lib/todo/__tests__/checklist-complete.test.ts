import { describe, expect, it } from "vitest";

import { isTodoChecklistComplete } from "@/lib/todo/checklist-complete";

describe("isTodoChecklistComplete", () => {
  it("allows done when there is no checklist", () => {
    expect(isTodoChecklistComplete([])).toBe(true);
  });

  it("requires every checklist step to be done", () => {
    expect(
      isTodoChecklistComplete([
        { done: true },
        { done: true },
      ]),
    ).toBe(true);
    expect(
      isTodoChecklistComplete([
        { done: true },
        { done: false },
      ]),
    ).toBe(false);
  });
});
