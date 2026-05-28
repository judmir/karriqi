import { describe, expect, it } from "vitest";

import { filterNotes } from "@/lib/notes/filter-notes";
import type { Note } from "@/types/notes";

const sample: Note[] = [
  {
    id: "1",
    title: "Tire change Köhrich",
    content: "Book summer tires at koehrich.com",
    labelIds: ["l1"],
    archived: false,
    pinned: false,
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
  },
  {
    id: "2",
    title: "Archived note",
    content: "old",
    labelIds: [],
    archived: true,
    pinned: false,
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
  },
];

describe("filterNotes", () => {
  it("filters active notes and search query", () => {
    const result = filterNotes({
      notes: sample,
      view: "notes",
      searchQuery: "tire",
      labelId: null,
    });
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("1");
  });

  it("shows only archived in archive view", () => {
    const result = filterNotes({
      notes: sample,
      view: "archive",
      searchQuery: "",
      labelId: null,
    });
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("2");
  });
});
