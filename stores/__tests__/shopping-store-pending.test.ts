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

import { upsertShoppingListItem } from "@/lib/shopping/shopping-actions";
import { useShoppingStore } from "@/stores/shopping-store";

const item: ShoppingListItem = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Milk",
  checked: false,
  addedAt: "2026-05-05T18:00:00.000Z",
};

const staleRow = {
  id: item.id,
  user_id: "user",
  staple_id: null,
  name: item.name,
  quantity: null,
  checked: false,
  position: 0,
  created_at: item.addedAt,
  updated_at: item.addedAt,
};

describe("shopping store pending guards", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useShoppingStore.getState().reset();
    vi.mocked(upsertShoppingListItem).mockResolvedValue({ ok: true });
  });

  it("blocks stale realtime while a toggle write is pending", async () => {
    useShoppingStore.setState({
      listItems: [item],
      listPersistence: true,
      loadedAt: Date.now(),
    });

    useShoppingStore.getState().toggleListItem(item.id);
    await Promise.resolve();

    useShoppingStore.getState().applyRemoteUpsert(staleRow);
    expect(useShoppingStore.getState().listItems[0]?.checked).toBe(true);
    expect(upsertShoppingListItem).not.toHaveBeenCalled();
  });

  it("debounces rapid toggles into one background upsert with the final state", async () => {
    useShoppingStore.setState({
      listItems: [item],
      listPersistence: true,
      loadedAt: Date.now(),
    });

    useShoppingStore.getState().toggleListItem(item.id);
    useShoppingStore.getState().toggleListItem(item.id);
    useShoppingStore.getState().toggleListItem(item.id);
    await Promise.resolve();

    expect(upsertShoppingListItem).not.toHaveBeenCalled();
    expect(useShoppingStore.getState().listItems[0]?.checked).toBe(true);

    await vi.advanceTimersByTimeAsync(450);
    await Promise.resolve();

    expect(upsertShoppingListItem).toHaveBeenCalledTimes(1);
    expect(upsertShoppingListItem).toHaveBeenCalledWith(
      expect.objectContaining({
        id: item.id,
        checked: true,
      }),
    );
  });

  it("releases pending after realtime confirms the expected checked state", async () => {
    useShoppingStore.setState({
      listItems: [item],
      listPersistence: true,
      loadedAt: Date.now(),
    });

    useShoppingStore.getState().toggleListItem(item.id);
    await vi.advanceTimersByTimeAsync(450);
    await Promise.resolve();

    useShoppingStore.getState().applyRemoteUpsert({
      ...staleRow,
      checked: true,
    });

    expect(useShoppingStore.getState().isItemPending(item.id)).toBe(false);
    expect(useShoppingStore.getState().listItems[0]?.checked).toBe(true);
  });
});
