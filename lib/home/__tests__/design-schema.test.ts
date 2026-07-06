import { describe, expect, it } from "vitest";

import { normalizeLayout, parseRoomLayout } from "@/lib/home/design-schema";

describe("parseRoomLayout", () => {
  it("parses a valid layout and normalizes numbers", () => {
    const parsed = parseRoomLayout({
      styleSummary: "  warm minimalist  ",
      furniture: [
        {
          type: "sofa",
          label: "3-seat sofa",
          widthCm: 220.4,
          depthCm: 95.6,
          xCm: 12.2,
          yCm: 30.9,
          rotationDeg: 88,
          material: " oak ",
          color: null,
          product: " KIVIK 3-seat sofa ",
          retailer: "IKEA",
        },
      ],
    });
    expect(parsed).not.toBeNull();
    expect(parsed!.styleSummary).toBe("warm minimalist");
    const f = parsed!.furniture[0];
    expect(f.widthCm).toBe(220);
    expect(f.rotationDeg).toBe(90);
    expect(f.material).toBe("oak");
    expect(f.product).toBe("KIVIK 3-seat sofa");
    expect(f.retailer).toBe("IKEA");
  });

  it("accepts layouts without product suggestions (older rows)", () => {
    const parsed = parseRoomLayout({
      styleSummary: "x",
      furniture: [
        {
          type: "t",
          label: "t",
          widthCm: 10,
          depthCm: 10,
          xCm: 0,
          yCm: 0,
          rotationDeg: 0,
          material: null,
          color: null,
        },
      ],
    });
    expect(parsed).not.toBeNull();
    expect(parsed!.furniture[0].product).toBeNull();
    expect(parsed!.furniture[0].retailer).toBeNull();
  });

  it("returns null for invalid input", () => {
    expect(parseRoomLayout({ nope: true })).toBeNull();
    expect(parseRoomLayout(null)).toBeNull();
  });

  it("normalizes negative and >=360 rotations to 0-270", () => {
    const normalized = normalizeLayout({
      styleSummary: "x",
      furniture: [
        {
          type: "t",
          label: "t",
          widthCm: 10,
          depthCm: 10,
          xCm: 0,
          yCm: 0,
          rotationDeg: -90,
        },
      ],
    });
    expect(normalized.furniture[0].rotationDeg).toBe(270);
  });
});
