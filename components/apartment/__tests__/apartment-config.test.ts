import { describe, expect, it } from "vitest";

import { mainNavItems } from "@/config/navigation";
import { isProtectedPath, ROUTES } from "@/config/routes";

describe("apartment route & nav config", () => {
  it("registers /apartment as a route constant", () => {
    expect(ROUTES.apartment).toBe("/apartment");
  });

  it("protects /apartment behind authentication", () => {
    expect(isProtectedPath("/apartment")).toBe(true);
    expect(isProtectedPath("/apartment/anything")).toBe(true);
  });

  it("appears in the main navigation", () => {
    const item = mainNavItems.find((nav) => nav.href === ROUTES.apartment);
    expect(item).toBeDefined();
    expect(item?.label).toBe("Apartment");
  });
});
