import { create } from "zustand";

import { isUuid } from "@/lib/shopping/is-uuid";
import { listRowToItem } from "@/lib/shopping/list-item-mapper";
import {
  insertUncheckedShoppingListItem,
  reorderShoppingListAfterToggle,
  sortShoppingListItems,
} from "@/lib/shopping/list-order";
import { newShoppingListItemId } from "@/lib/shopping/new-list-item-id";
import {
  clearShoppingList,
  createStaple,
  deleteShoppingListItem,
  dismissStapleFromSuggestions,
  recordPurchase,
  setAllShoppingListItemsChecked,
  upsertShoppingListItem,
} from "@/lib/shopping/shopping-actions";
import { loadShoppingStoreAction } from "@/stores/load-actions";
import { isStoreStale } from "@/stores/store-utils";
import type { Database } from "@/types/database";
import type { ShoppingListItem, StapleItem } from "@/types/shopping";

type ListRow = Database["public"]["Tables"]["shopping_list_items"]["Row"];

type ShoppingStoreState = {
  staples: StapleItem[];
  listItems: ShoppingListItem[];
  dismissedSuggestedIds: string[];
  purchasePersistence: boolean;
  listPersistence: boolean;
  medianIntervalByStapleId: Record<string, number>;
  householdOwnerId: string | null;
  loadedAt: number | null;
  loading: boolean;
  error: string | null;
};

type ShoppingStoreActions = {
  ensureLoaded: () => Promise<void>;
  invalidate: () => void;
  reset: () => void;
  replaceListItems: (
    next: ShoppingListItem[],
    toggledId?: string,
  ) => void;
  toggleListItem: (id: string) => void;
  addItemFromStaple: (staple: StapleItem) => boolean;
  addFreeTextItem: (name: string) => boolean;
  removeItem: (id: string) => void;
  setAllChecked: (checked: boolean) => void;
  clearAllItems: () => void;
  dismissSuggested: (stapleId: string) => void;
  promoteFreeTextToSuggested: (itemId: string) => Promise<void>;
  applyRemoteUpsert: (row: ListRow) => void;
  applyRemoteDelete: (id: string) => void;
  getPositionsRef: () => Map<string, number>;
  isItemPending: (id: string) => boolean;
};

export type ShoppingStore = ShoppingStoreState & ShoppingStoreActions;

const initialState: ShoppingStoreState = {
  staples: [],
  listItems: [],
  dismissedSuggestedIds: [],
  purchasePersistence: false,
  listPersistence: false,
  medianIntervalByStapleId: {},
  householdOwnerId: null,
  loadedAt: null,
  loading: false,
  error: null,
};

let loadPromise: Promise<void> | null = null;
const positionsRef = new Map<string, number>();
/** Blocks stale Realtime rows while a local write is in flight (+ grace period). */
const pendingItemIds = new Set<string>();
const pendingExpectedById = new Map<string, ShoppingListItem>();
const PENDING_RELEASE_MS = 700;

function markItemPending(item: ShoppingListItem) {
  pendingItemIds.add(item.id);
  pendingExpectedById.set(item.id, item);
}

function releaseItemPending(id: string, delayMs = PENDING_RELEASE_MS) {
  if (delayMs <= 0) {
    pendingItemIds.delete(id);
    pendingExpectedById.delete(id);
    return;
  }
  if (typeof window === "undefined") {
    pendingItemIds.delete(id);
    pendingExpectedById.delete(id);
    return;
  }
  window.setTimeout(() => {
    pendingItemIds.delete(id);
    pendingExpectedById.delete(id);
  }, delayMs);
}

function initPositions(items: ShoppingListItem[]) {
  positionsRef.clear();
  items.forEach((item, index) => {
    positionsRef.set(item.id, index);
  });
}

function dismissedFromStaples(staples: StapleItem[]): string[] {
  return staples.filter((s) => s.hiddenFromSuggestions).map((s) => s.id);
}

function rowsEqual(a: ShoppingListItem, b: ShoppingListItem): boolean {
  return (
    a.name === b.name &&
    a.checked === b.checked &&
    (a.quantity ?? null) === (b.quantity ?? null) &&
    (a.stapleId ?? null) === (b.stapleId ?? null)
  );
}

function nextPosition(): number {
  let max = -1;
  positionsRef.forEach((p) => {
    if (p > max) max = p;
  });
  return max + 1;
}

function normalizeItemLabel(label: string) {
  return label.trim().toLowerCase().replace(/\s+/g, " ");
}

function showStoreError(message: string) {
  if (typeof window !== "undefined") {
    void import("sonner").then(({ toast }) => {
      toast.error(message);
    });
  }
}

function persistItem(
  item: ShoppingListItem,
  position: number,
  listPersistence: boolean,
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!listPersistence) return Promise.resolve({ ok: true });
  positionsRef.set(item.id, position);
  markItemPending(item);
  return upsertShoppingListItem({
    id: item.id,
    stapleId: item.stapleId ?? null,
    name: item.name,
    quantity: item.quantity ?? null,
    checked: item.checked,
    position,
  }).then((result) => {
    if (result.ok) {
      releaseItemPending(item.id);
    } else {
      releaseItemPending(item.id, 0);
    }
    return result;
  });
}

function recordCheckedPurchases(
  ordered: ShoppingListItem[],
  prevById: Map<string, ShoppingListItem>,
  purchasePersistence: boolean,
  patchCatalog: (stapleId: string, purchasedAt: string) => void,
) {
  if (!purchasePersistence) return;

  for (const item of ordered) {
    const prev = prevById.get(item.id);
    if (prev && !prev.checked && item.checked) {
      const rawId = item.stapleId ?? null;
      const stapleId = rawId && isUuid(rawId) ? rawId : null;
      void recordPurchase({
        stapleId,
        itemName: item.name,
      }).then((r) => {
        if (r.ok && r.stapleIdForCatalog && r.purchasedAt) {
          patchCatalog(r.stapleIdForCatalog, r.purchasedAt);
        }
      });
    }
  }
}

export const useShoppingStore = create<ShoppingStore>((set, get) => ({
  ...initialState,

  async ensureLoaded() {
    const { loadedAt, loading } = get();
    if (!isStoreStale(loadedAt) && loadedAt !== null) {
      return;
    }
    if (loading && loadPromise) {
      await loadPromise;
      return;
    }

    const hasCache = loadedAt !== null;
    if (!hasCache) {
      set({ loading: true, error: null });
    }

    loadPromise = (async () => {
      try {
        const result = await loadShoppingStoreAction();
        if (!result.ok) {
          set({
            loading: false,
            error:
              result.reason === "signed_out"
                ? null
                : "Could not load shopping.",
            loadedAt: hasCache ? get().loadedAt : null,
          });
          return;
        }
        const sortedItems = sortShoppingListItems(result.listItems);
        initPositions(sortedItems);
        set({
          staples: result.staples,
          listItems: sortedItems,
          dismissedSuggestedIds: dismissedFromStaples(result.staples),
          purchasePersistence: result.purchasePersistence,
          listPersistence: result.listPersistence,
          medianIntervalByStapleId: result.medianIntervalByStapleId,
          householdOwnerId: result.householdOwnerId,
          loadedAt: Date.now(),
          loading: false,
          error: null,
        });
      } catch (err) {
        set({
          loading: false,
          error:
            err instanceof Error ? err.message : "Could not load shopping.",
          loadedAt: hasCache ? get().loadedAt : null,
        });
      } finally {
        loadPromise = null;
      }
    })();

    await loadPromise;
  },

  invalidate() {
    set({ loadedAt: null });
  },

  reset() {
    loadPromise = null;
    positionsRef.clear();
    pendingItemIds.clear();
    pendingExpectedById.clear();
    set(initialState);
  },

  getPositionsRef() {
    return positionsRef;
  },

  isItemPending(id: string) {
    return pendingItemIds.has(id);
  },

  replaceListItems(next, toggledId) {
    const { listItems, listPersistence, purchasePersistence } = get();
    const ordered = toggledId
      ? reorderShoppingListAfterToggle(next, toggledId)
      : sortShoppingListItems(next);

    const prevById = new Map(listItems.map((i) => [i.id, i]));
    const nextById = new Map(ordered.map((i) => [i.id, i]));
    const removed: ShoppingListItem[] = [];
    for (const prev of listItems) {
      if (!nextById.has(prev.id)) removed.push(prev);
    }

    if (listPersistence) {
      for (const item of removed) {
        markItemPending(item);
      }
      ordered.forEach((item) => {
        const prev = prevById.get(item.id);
        const fieldsChanged =
          prev &&
          (prev.name !== item.name ||
            prev.checked !== item.checked ||
            (prev.quantity ?? null) !== (item.quantity ?? null) ||
            (prev.stapleId ?? null) !== (item.stapleId ?? null));
        if (!prev || fieldsChanged) {
          markItemPending(item);
        }
      });
    }

    set({ listItems: ordered, loadedAt: Date.now() });

    recordCheckedPurchases(ordered, prevById, purchasePersistence, (stapleId, purchasedAt) => {
      set((state) => ({
        staples: state.staples.map((s) =>
          s.id === stapleId ? { ...s, lastPurchasedAt: purchasedAt } : s,
        ),
        loadedAt: Date.now(),
      }));
    });

    if (!listPersistence) return;

    ordered.forEach((item, index) => {
      const prev = prevById.get(item.id);
      const fieldsChanged =
        prev &&
        (prev.name !== item.name ||
          prev.checked !== item.checked ||
          (prev.quantity ?? null) !== (item.quantity ?? null) ||
          (prev.stapleId ?? null) !== (item.stapleId ?? null));
      if (!prev || fieldsChanged) {
        void persistItem(item, index, listPersistence).then((r) => {
          if (!r.ok && prev) {
            set((state) => ({
              listItems: sortShoppingListItems(
                state.listItems.map((i) => (i.id === item.id ? prev : i)),
              ),
              loadedAt: Date.now(),
            }));
            showStoreError(`Couldn't save "${item.name}": ${r.message}`);
          }
        });
      }
    });

    for (const item of removed) {
      positionsRef.delete(item.id);
      void deleteShoppingListItem(item.id).then((r) => {
        releaseItemPending(item.id, 0);
        if (!r.ok) {
          set((state) => ({
            listItems: sortShoppingListItems([...state.listItems, item]),
            loadedAt: Date.now(),
          }));
          showStoreError(`Couldn't remove "${item.name}": ${r.message}`);
        }
      });
    }
  },

  toggleListItem(id) {
    const { listItems, listPersistence, purchasePersistence } = get();
    const prev = listItems.find((i) => i.id === id);
    if (!prev) return;

    const toggled = listItems.map((i) =>
      i.id === id ? { ...i, checked: !i.checked } : i,
    );
    const ordered = reorderShoppingListAfterToggle(toggled, id);
    const updated = ordered.find((i) => i.id === id);
    if (!updated) return;

    const position = ordered.findIndex((i) => i.id === id);
    const prevById = new Map([[id, prev]]);

    if (listPersistence) {
      markItemPending(updated);
    }

    set({ listItems: ordered, loadedAt: Date.now() });

    recordCheckedPurchases(
      ordered,
      prevById,
      purchasePersistence,
      (stapleId, purchasedAt) => {
        set((state) => ({
          staples: state.staples.map((s) =>
            s.id === stapleId ? { ...s, lastPurchasedAt: purchasedAt } : s,
          ),
          loadedAt: Date.now(),
        }));
      },
    );

    if (!listPersistence) return;

    void persistItem(updated, position, listPersistence).then((r) => {
      if (!r.ok) {
        set((state) => ({
          listItems: reorderShoppingListAfterToggle(
            state.listItems.map((i) =>
              i.id === id ? { ...i, checked: prev.checked } : i,
            ),
            id,
          ),
          loadedAt: Date.now(),
        }));
        showStoreError(`Couldn't save "${updated.name}": ${r.message}`);
      }
    });
  },

  addItemFromStaple(staple) {
    const { listItems } = get();
    const labelSet = new Set(listItems.map((i) => normalizeItemLabel(i.name)));
    if (labelSet.has(normalizeItemLabel(staple.name))) {
      return false;
    }
    const next: ShoppingListItem = {
      id: newShoppingListItemId(),
      stapleId: staple.id,
      name: staple.name,
      checked: false,
      addedAt: new Date().toISOString(),
    };
    const itemsNext = insertUncheckedShoppingListItem(listItems, next);
    get().replaceListItems(itemsNext);
    return true;
  },

  addFreeTextItem(name) {
    const trimmed = name.trim();
    if (!trimmed) return false;
    const { listItems } = get();
    const labelSet = new Set(listItems.map((i) => normalizeItemLabel(i.name)));
    if (labelSet.has(normalizeItemLabel(trimmed))) {
      return false;
    }
    const next: ShoppingListItem = {
      id: newShoppingListItemId(),
      name: trimmed,
      checked: false,
      addedAt: new Date().toISOString(),
    };
    const itemsNext = insertUncheckedShoppingListItem(listItems, next);
    get().replaceListItems(itemsNext);
    return true;
  },

  removeItem(id) {
    const { listItems } = get();
    get().replaceListItems(listItems.filter((i) => i.id !== id));
  },

  setAllChecked(checked) {
    const { listItems, listPersistence } = get();
    if (listItems.every((item) => item.checked === checked)) return;
    const nextItems = sortShoppingListItems(
      listItems.map((item) => ({ ...item, checked })),
    );
    set({ listItems: nextItems, loadedAt: Date.now() });

    if (listPersistence) {
      nextItems.forEach((item, index) => {
        void persistItem(item, index, listPersistence).then((r) => {
          if (!r.ok) {
            set({ listItems, loadedAt: Date.now() });
            showStoreError(`Couldn't update list: ${r.message}`);
          }
        });
      });
      void setAllShoppingListItemsChecked(checked).then((r) => {
        if (!r.ok) {
          set({ listItems, loadedAt: Date.now() });
          showStoreError(`Couldn't update list: ${r.message}`);
        }
      });
    }
  },

  clearAllItems() {
    const { listItems, listPersistence } = get();
    const previous = listItems;
    positionsRef.clear();
    set({ listItems: [], loadedAt: Date.now() });

    if (listPersistence) {
      void clearShoppingList().then((r) => {
        if (!r.ok) {
          set({ listItems: previous, loadedAt: Date.now() });
          initPositions(previous);
          showStoreError(`Couldn't clear list: ${r.message}`);
        }
      });
    }
  },

  dismissSuggested(stapleId) {
    const { dismissedSuggestedIds, purchasePersistence, listPersistence, staples } =
      get();
    if (dismissedSuggestedIds.includes(stapleId)) return;

    set({
      dismissedSuggestedIds: [...dismissedSuggestedIds, stapleId],
      loadedAt: Date.now(),
    });

    if (!purchasePersistence || !listPersistence || !isUuid(stapleId)) return;

    void dismissStapleFromSuggestions(stapleId).then((r) => {
      if (r.ok) {
        set((state) => ({
          staples: state.staples.map((s) =>
            s.id === stapleId ? { ...s, hiddenFromSuggestions: true } : s,
          ),
          loadedAt: Date.now(),
        }));
        return;
      }
      set((state) => ({
        dismissedSuggestedIds: state.dismissedSuggestedIds.filter(
          (id) => id !== stapleId,
        ),
        loadedAt: Date.now(),
      }));
      const name = staples.find((s) => s.id === stapleId)?.name ?? "item";
      showStoreError(`Couldn't remove "${name}": ${r.message}`);
    });
  },

  async promoteFreeTextToSuggested(itemId) {
    const initial = get();
    const target = initial.listItems.find((i) => i.id === itemId);
    if (!target || target.stapleId) return;
    const name = target.name.trim();
    if (!name) return;

    let stapleId: string;

    if (initial.purchasePersistence) {
      const r = await createStaple({
        name,
        unit: target.quantity,
      });
      if (!r.ok) {
        showStoreError(`Couldn't add "${name}" to suggestions: ${r.message}`);
        return;
      }
      stapleId = r.id;
    } else {
      const existing = initial.staples.find(
        (s) => s.name.trim().toLowerCase() === name.toLowerCase(),
      );
      stapleId = existing?.id ?? `staple-${newShoppingListItemId()}`;
    }

    const current = get();
    const currentTarget = current.listItems.find((i) => i.id === itemId);
    if (!currentTarget || currentTarget.stapleId) return;

    const existingMeta = current.staples.find((s) => s.id === stapleId);
    const catalogNext = existingMeta
      ? current.staples
      : [
          ...current.staples,
          {
            id: stapleId,
            name,
            unit: currentTarget.quantity,
            createdAt: new Date().toISOString(),
          },
        ];

    const updated: ShoppingListItem = { ...currentTarget, stapleId };
    const itemsNext = current.listItems.map((i) =>
      i.id === itemId ? updated : i,
    );

    set({ staples: catalogNext, loadedAt: Date.now() });

    if (current.listPersistence) {
      get().replaceListItems(itemsNext);
      return;
    }

    set({ listItems: itemsNext, loadedAt: Date.now() });
  },

  applyRemoteUpsert(row) {
    if (pendingItemIds.has(row.id)) return;

    const incoming = listRowToItem(row);
    const expected = pendingExpectedById.get(row.id);
    if (expected && expected.checked !== incoming.checked) return;

    positionsRef.set(row.id, row.position);

    set((state) => {
      const idx = state.listItems.findIndex((i) => i.id === incoming.id);
      let merged: ShoppingListItem[];
      if (idx >= 0) {
        const existing = state.listItems[idx];
        if (rowsEqual(existing, incoming)) return state;
        merged = state.listItems.slice();
        merged[idx] = { ...existing, ...incoming };
        const listItems =
          existing.checked !== incoming.checked
            ? reorderShoppingListAfterToggle(merged, incoming.id)
            : sortShoppingListItems(merged);
        return { listItems, loadedAt: Date.now() };
      }
      merged = [...state.listItems, incoming];
      return {
        listItems: sortShoppingListItems(merged),
        loadedAt: Date.now(),
      };
    });
  },

  applyRemoteDelete(id) {
    if (pendingItemIds.has(id)) return;

    set((state) => {
      if (!state.listItems.some((i) => i.id === id)) return state;
      positionsRef.delete(id);
      return {
        listItems: state.listItems.filter((i) => i.id !== id),
        loadedAt: Date.now(),
      };
    });
  },
}));

export function selectShoppingReady(state: ShoppingStore): boolean {
  return state.loadedAt !== null;
}
