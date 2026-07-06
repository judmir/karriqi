import { beforeEach, describe, expect, it, vi } from "vitest";

import type { RoomDesign } from "@/types/home";

vi.mock("@/lib/home/home-actions", () => ({
  renameDesign: vi.fn(),
  deleteDesign: vi.fn(),
  setDesignStatus: vi.fn(),
}));

vi.mock("@/lib/home/ai-design-actions", () => ({
  generateRoomDesign: vi.fn(),
  generateDesignRender: vi.fn(),
}));

vi.mock("@/stores/load-actions", () => ({
  loadHomeStoreAction: vi.fn(),
}));

import { deleteDesign, renameDesign } from "@/lib/home/home-actions";
import { useHomeStore } from "@/stores/home-store";

function makeDesign(id: string, title: string): RoomDesign {
  return {
    id,
    roomId: "kueche",
    apartmentId: "cicerostrasse-we28",
    title,
    stylePrompt: "test",
    layout: { styleSummary: "test", furniture: [] },
    warnings: [],
    status: "draft",
    createdAt: "2026-07-06T10:00:00.000Z",
    updatedAt: "2026-07-06T10:00:00.000Z",
  };
}

describe("home-store optimistic mutations", () => {
  beforeEach(() => {
    useHomeStore.getState().reset();
    useHomeStore.setState({
      designs: [makeDesign("d1", "Original"), makeDesign("d2", "Second")],
      renders: [],
      persistence: true,
      loadedAt: Date.now(),
    });
  });

  it("renames optimistically and rolls back on failure", async () => {
    vi.mocked(renameDesign).mockResolvedValue({
      ok: false,
      message: "nope",
    });

    const promise = useHomeStore.getState().renameDesign("d1", "Renamed");
    // Optimistic update applied immediately.
    expect(
      useHomeStore.getState().designs.find((d) => d.id === "d1")?.title,
    ).toBe("Renamed");

    await promise;
    // Rolled back after failure.
    expect(
      useHomeStore.getState().designs.find((d) => d.id === "d1")?.title,
    ).toBe("Original");
  });

  it("keeps rename when the server succeeds", async () => {
    vi.mocked(renameDesign).mockResolvedValue({ ok: true });
    await useHomeStore.getState().renameDesign("d1", "Renamed");
    expect(
      useHomeStore.getState().designs.find((d) => d.id === "d1")?.title,
    ).toBe("Renamed");
  });

  it("removes optimistically and rolls back on failure", async () => {
    vi.mocked(deleteDesign).mockResolvedValue({ ok: false, message: "nope" });

    const promise = useHomeStore.getState().removeDesign("d1");
    expect(useHomeStore.getState().designs.some((d) => d.id === "d1")).toBe(
      false,
    );

    await promise;
    expect(useHomeStore.getState().designs.some((d) => d.id === "d1")).toBe(
      true,
    );
  });
});
