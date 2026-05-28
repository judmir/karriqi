import { describe, expect, it } from "vitest";

import { isChecklistNote, parseChecklistLines, toggleChecklistLine } from "@/lib/notes/checklist";

describe("checklist", () => {
  it("parses checklist lines", () => {
    const content = "- [x] Done\n- [ ] Todo";
    expect(parseChecklistLines(content)).toHaveLength(2);
    expect(isChecklistNote(content)).toBe(true);
  });

  it("toggles a line", () => {
    const content = "- [ ] Milk";
    const next = toggleChecklistLine(content, 0);
    expect(next).toBe("- [x] Milk");
  });
});
