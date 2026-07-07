import { describe, expect, it } from "vitest";

import {
  buildMobileNavTabs,
  mainNavItems,
  rehabNavItems,
} from "@/config/navigation";
import { ROUTES } from "@/config/routes";

describe("buildMobileNavTabs", () => {
  it("returns Rehab and Family tabs when rehab nav is enabled", () => {
    const tabs = buildMobileNavTabs({
      includeDevNav: false,
      includeRehabNav: true,
    });

    expect(tabs.map((tab) => tab.label)).toEqual(["Rehab", "Family"]);
    expect(tabs[0]?.items).toEqual(rehabNavItems);
    expect(tabs[1]?.items).toEqual(mainNavItems);
  });

  it("groups family-only navigation into Home, Tasks, and Plan tabs", () => {
    const tabs = buildMobileNavTabs({
      includeDevNav: false,
      includeRehabNav: false,
    });

    expect(tabs.map((tab) => tab.label)).toEqual(["Home", "Tasks", "Plan"]);
    expect(tabs[0]?.items.map((item) => item.href)).toEqual([
      ROUTES.dashboard,
      ROUTES.pulse,
      ROUTES.apartment,
    ]);
    expect(tabs[1]?.items.map((item) => item.href)).toEqual([
      ROUTES.todo,
      ROUTES.ruleOfThree,
      ROUTES.shopping,
    ]);
    expect(tabs[2]?.items.map((item) => item.href)).toEqual([
      ROUTES.calendar,
      ROUTES.notes,
    ]);
  });

  it("adds Dev tab when dev nav is enabled without rehab", () => {
    const tabs = buildMobileNavTabs({
      includeDevNav: true,
      includeRehabNav: false,
    });

    expect(tabs.at(-1)?.label).toBe("Dev");
    expect(tabs.at(-1)?.items.map((item) => item.href)).toEqual([ROUTES.dev]);
  });
});
