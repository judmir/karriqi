import { describe, expect, it } from "vitest";

import { parseEventDescription } from "@/lib/calendar/event-subtasks";
import {
  MOBILITY_DESCRIPTION,
  MOBILITY_SUBTASKS,
} from "@/modules/rehab/neuro-rehab-2026/mobility-routine";
import { GYM_A_DESCRIPTION } from "@/modules/rehab/neuro-rehab-2026/gym-templates";

describe("mobility routine", () => {
  it("defines five YouTube timestamp links labeled Link", () => {
    expect(MOBILITY_SUBTASKS).toHaveLength(5);
    expect(MOBILITY_SUBTASKS[0]?.label).toBe("Hamstrings");
    expect(MOBILITY_SUBTASKS[0]?.referenceLabel).toBe("Link");
    expect(MOBILITY_SUBTASKS[0]?.referenceUrl).toBe(
      "https://youtu.be/WL6VSc5XQ-8?t=78",
    );
    expect(MOBILITY_SUBTASKS[4]?.referenceUrl).toBe(
      "https://youtu.be/WL6VSc5XQ-8?t=279",
    );
  });

  it("serializes a standalone mobility checklist", () => {
    const parsed = parseEventDescription(MOBILITY_DESCRIPTION);
    expect(parsed.subtasks).toHaveLength(5);
    expect(parsed.subtasks.every((item) => item.referenceLabel === "Link")).toBe(
      true,
    );
  });

  it("appends mobility subtasks to gym templates", () => {
    const parsed = parseEventDescription(GYM_A_DESCRIPTION);
    const labels = parsed.subtasks.map((item) => item.label);
    expect(labels.at(-5)).toBe("Hamstrings");
    expect(labels.at(-1)).toBe("Cossack squat");
  });
});
