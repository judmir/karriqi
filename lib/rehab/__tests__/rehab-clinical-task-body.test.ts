import { describe, expect, it } from "vitest";

import { REHAB_CLINICAL_ITEMS } from "@/modules/rehab/neuro-rehab-2026/clinical-content";
import {
  allSubtasksDone,
  countSubtasksDone,
  parseClinicalTaskBody,
} from "@/lib/rehab/rehab-clinical-task-body";

describe("parseClinicalTaskBody", () => {
  it("splits intro text and bullet subtasks", () => {
    const hands = REHAB_CLINICAL_ITEMS.find((item) => item.id === "before.videos-hands");
    expect(hands).toBeDefined();

    const parsed = parseClinicalTaskBody(hands!.body);
    expect(parsed.description).toContain("Film in the same place");
    expect(parsed.subtasks).toEqual([
      "60 sec typing",
      "buttons/unbuttons",
      "shoelace tie/untie",
      "bottle cap open/close",
      "coin pickup/transfer",
    ]);
  });

  it("supports subtask-only bodies", () => {
    const speech = REHAB_CLINICAL_ITEMS.find((item) => item.id === "before.videos-speech");
    expect(parseClinicalTaskBody(speech!.body).subtasks.length).toBeGreaterThan(0);
    expect(parseClinicalTaskBody(speech!.body).description).toBe("");
  });

  it("returns plain description when there are no bullets", () => {
    const parsed = parseClinicalTaskBody("Book GP for baseline bloodwork.");
    expect(parsed.description).toBe("Book GP for baseline bloodwork.");
    expect(parsed.subtasks).toEqual([]);
  });
});

describe("clinical subtask progress", () => {
  it("tracks done count and completion", () => {
    expect(countSubtasksDone([0, 2], 4)).toBe(2);
    expect(allSubtasksDone([0, 1, 2, 3], 4)).toBe(true);
    expect(allSubtasksDone([0, 1], 4)).toBe(false);
  });
});
