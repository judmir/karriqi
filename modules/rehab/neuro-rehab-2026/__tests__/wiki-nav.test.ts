import { describe, expect, it } from "vitest";

import { REHAB_WIKI_PAGES } from "@/modules/rehab/neuro-rehab-2026/wiki-content";
import { REHAB_WIKI_NAV_ITEMS } from "@/modules/rehab/neuro-rehab-2026/wiki-nav";

describe("REHAB_WIKI_NAV_ITEMS", () => {
  it("mirrors slug/title pairs of REHAB_WIKI_PAGES (shell bundle must not import bodies)", () => {
    expect(REHAB_WIKI_NAV_ITEMS).toEqual(
      REHAB_WIKI_PAGES.map((page) => ({ slug: page.slug, title: page.title })),
    );
  });
});
