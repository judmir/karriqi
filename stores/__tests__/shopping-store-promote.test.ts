import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ShoppingListItem } from "@/types/shopping";

vi.mock("@/lib/shopping/shopping-actions", () => ({
  clearShoppingList: vi.fn(),
  createStaple: vi.fn(),
  deleteShoppingListItem: vi.fn(),
  dismissStapleFromSuggestions: vi.fn(),
  recordPurchase: vi.fn(),
  setAllShoppingListItemsChecked: vi.fn(),
  upsertShoppingListItem: vi.fn(),
}));

vi.mock("@/stores/load-actions", () => ({
  loadShoppingStoreAction: vi.fn(),
}));

import {
  createStaple,
  upsertShoppingListItem,
} from "@/lib/shopping/shopping-actions";
import { useShoppingStore } from "@/stores/shopping-store";

const itemA: ShoppingListItem = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Milk",
  checked: false,
  addedAt: "2026-05-05T18:00:00.000Z",
};

const itemB: ShoppingListItem = {
  id: "22222222-2222-4222-8222-222222222222",
  name: "Eggs",
  checked: false,
  addedAt: "2026-05-05T18:01:00.000Z",
};

const stapleId = "33333333-3333-4333-8333-333333333333";

describe("promoteFreeTextToSuggested", () => {
  beforeEach(() => {
    useShoppingStore.getState().reset();
    vi.mocked(upsertShoppingListItem).mockResolvedValue({ ok: true });
  });

  it("keeps other list items when promoting one item", async () => {
    vi.mocked(createStaple).mockResolvedValue({ ok: true, id: stapleId });

    useShoppingStore.setState({
      listItems: [itemA, itemB],
      staples: [],
      listPersistence: true,
      purchasePersistence: true,
      loadedAt: Date.now(),
    });

    await useShoppingStore.getState().promoteFreeTextToSuggested(itemA.id);

    const items = useShoppingStore.getState().listItems;
    expect(items).toHaveLength(2);
    expect(items.find((item) => item.id === itemB.id)?.name).toBe("Eggs");
    expect(items.find((item) => item.id === itemA.id)?.stapleId).toBe(stapleId);
  });

  it("keeps items added while createStaple is in flight", async () => {
    let resolveCreate!: (value: { ok: true; id: string }) => void;
    vi.mocked(createStaple).mockReturnValue(
      new Promise((resolve) => {
        resolveCreate = resolve;
      }),
    );

    useShoppingStore.setState({
      listItems: [itemA],
      staples: [],
      listPersistence: true,
      purchasePersistence: true,
      loadedAt: Date.now(),
    });

    const promotePromise =
      useShoppingStore.getState().promoteFreeTextToSuggested(itemA.id);
    useShoppingStore.getState().addFreeTextItem("Eggs");

    resolveCreate({ ok: true, id: stapleId });
    await promotePromise;

    const items = useShoppingStore.getState().listItems;
    expect(items).toHaveLength(2);
    expect(items.some((item) => item.name === "Eggs")).toBe(true);
    expect(items.find((item) => item.id === itemA.id)?.stapleId).toBe(stapleId);
  });
});
