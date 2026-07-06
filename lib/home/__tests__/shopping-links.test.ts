import { describe, expect, it } from "vitest";

import { furnitureShoppingUrl, shoppingLinkLabel } from "@/lib/home/shopping-links";
import type { FurnitureItem } from "@/types/home";

function item(overrides: Partial<FurnitureItem>): FurnitureItem {
  return {
    type: "sofa",
    label: "3-seat sofa",
    widthCm: 228,
    depthCm: 95,
    xCm: 0,
    yCm: 0,
    rotationDeg: 0,
    ...overrides,
  };
}

describe("furnitureShoppingUrl", () => {
  it("links IKEA products to the German IKEA search", () => {
    const url = furnitureShoppingUrl(
      item({ product: "KIVIK 3-seat sofa", retailer: "IKEA" }),
    );
    expect(url).toBe(
      "https://www.ikea.com/de/de/search/?q=KIVIK%203-seat%20sofa",
    );
  });

  it("falls back to a shopping search for other retailers", () => {
    const url = furnitureShoppingUrl(
      item({ product: "Strandmon chair", retailer: "Wayfair" }),
    );
    expect(url).toContain("google.com/search?tbm=shop");
    expect(url).toContain("Wayfair");
    expect(url).toContain("Strandmon");
  });

  it("returns null without a product suggestion", () => {
    expect(furnitureShoppingUrl(item({ product: null }))).toBeNull();
    expect(furnitureShoppingUrl(item({}))).toBeNull();
  });
});

describe("shoppingLinkLabel", () => {
  it("names the retailer when known", () => {
    expect(shoppingLinkLabel(item({ retailer: "IKEA" }))).toBe("View at IKEA");
    expect(shoppingLinkLabel(item({}))).toBe("Shop");
  });
});
