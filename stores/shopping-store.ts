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
  refreshing: boolean;
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
  refreshing: false,
  error: null,
};

let loadPromise: Promise<void> | null = null;
const positionsRef = new Map<string, number>();
/** Blocks stale Realtime rows while a local write is in flight (+ grace period). */
const pendingItemIds = new Set<string>();
const pendingExpectedById = new Map<string, ShoppingListItem>();
const pendingReleaseTimers = new Map<string, ReturnType<typeof setTimeout>>();
const persistDebounceTimers = new Map<string, ReturnType<typeof setTimeout>>();
const persistGenerationById = new Map<string, number>();
/** Last checked state successfully synced to Supabase (for purchase recording). */
const lastSyncedCheckedById = new Map<string, boolean>();
const PENDING_MAX_MS = 3_000;
const PERSIST_DEBOUNCE_MS = 450;

type StoreGet = () => ShoppingStore;

function markItemPending(item: ShoppingListItem) {
  pendingItemIds.add(item.id);
  pendingExpectedById.set(item.id, item);

  const existingTimer = pendingReleaseTimers.get(item.id);
  if (existingTimer) {
    clearTimeout(existingTimer);
  }

  if (typeof window === "undefined") {
    return;
  }

  pendingReleaseTimers.set(
    item.id,
    window.setTimeout(() => {
      releaseItemPending(item.id, 0);
    }, PENDING_MAX_MS),
  );
}

function releaseItemPending(id: string, delayMs = 0) {
  const clearNow = () => {
    pendingItemIds.delete(id);
    pendingExpectedById.delete(id);
    const timer = pendingReleaseTimers.get(id);
    if (timer) {
      clearTimeout(timer);
      pendingReleaseTimers.delete(id);
    }
  };

  if (delayMs <= 0) {
    clearNow();
    return;
  }

  if (typeof window === "undefined") {
    clearNow();
    return;
  }

  const existingTimer = pendingReleaseTimers.get(id);
  if (existingTimer) {
    clearTimeout(existingTimer);
  }

  pendingReleaseTimers.set(
    id,
    window.setTimeout(clearNow, delayMs),
  );
}

function confirmPendingIfMatched(id: string, incoming: ShoppingListItem) {
  const expected = pendingExpectedById.get(id);
  if (!expected || expected.checked !== incoming.checked) {
    return false;
  }
  releaseItemPending(id, 0);
  return true;
}

function initSyncedCheckedState(items: ShoppingListItem[]) {
  lastSyncedCheckedById.clear();
  for (const item of items) {
    lastSyncedCheckedById.set(item.id, item.checked);
  }
}

function clearPersistDebounce(id: string) {
  const timer = persistDebounceTimers.get(id);
  if (timer) {
    clearTimeout(timer);
    persistDebounceTimers.delete(id);
  }
}

function clearAllPersistDebounces() {
  for (const timer of persistDebounceTimers.values()) {
    clearTimeout(timer);
  }
  persistDebounceTimers.clear();
}

function scheduleItemPersist(id: string, get: StoreGet) {
  const { listPersistence } = get();
  if (!listPersistence) return;

  const item = get().listItems.find((entry) => entry.id === id);
  if (!item) return;

  markItemPending(item);
  clearPersistDebounce(id);

  if (typeof window === "undefined") {
    return;
  }

  persistDebounceTimers.set(
    id,
    window.setTimeout(() => {
      persistDebounceTimers.delete(id);
      void flushItemPersist(id, get);
    }, PERSIST_DEBOUNCE_MS),
  );
}

async function flushItemPersist(id: string, get: StoreGet) {
  const { listPersistence, listItems, purchasePersistence } = get();
  if (!listPersistence) return;

  const item = listItems.find((entry) => entry.id === id);
  if (!item) return;

  const position = listItems.findIndex((entry) => entry.id === id);
  const generation = (persistGenerationById.get(id) ?? 0) + 1;
  persistGenerationById.set(id, generation);

  const snapshot = { ...item };
  const wasChecked = lastSyncedCheckedById.get(id) ?? false;
  markItemPending(snapshot);
  positionsRef.set(id, position);

  const result = await upsertShoppingListItem({
    id: snapshot.id,
    stapleId: snapshot.stapleId ?? null,
    name: snapshot.name,
    quantity: snapshot.quantity ?? null,
    checked: snapshot.checked,
    position,
  });

  if (persistGenerationById.get(id) !== generation) {
    return;
  }

  if (!result.ok) {
    releaseItemPending(id, 0);
    return;
  }

  lastSyncedCheckedById.set(id, snapshot.checked);

  if (purchasePersistence && snapshot.checked && !wasChecked) {
    const rawId = snapshot.stapleId ?? null;
    const stapleId = rawId && isUuid(rawId) ? rawId : null;
    void recordPurchase({
      stapleId,
      itemName: snapshot.name,
    }).then((r) => {
      if (r.ok && r.stapleIdForCatalog && r.purchasedAt) {
        useShoppingStore.setState((state) => ({
          staples: state.staples.map((s) =>
            s.id === r.stapleIdForCatalog
              ? { ...s, lastPurchasedAt: r.purchasedAt! }
              : s,
          ),
          loadedAt: Date.now(),
        }));
      }
    });
  }
}

function isItemLocallyAuthoritative(id: string): boolean {
  return pendingItemIds.has(id) || persistDebounceTimers.has(id);
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

let bulkCheckPersistTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleBulkCheckedPersist(checked: boolean) {
  if (bulkCheckPersistTimer) {
    clearTimeout(bulkCheckPersistTimer);
  }

  if (typeof window === "undefined") {
    return;
  }

  bulkCheckPersistTimer = window.setTimeout(() => {
    bulkCheckPersistTimer = null;
    void setAllShoppingListItemsChecked(checked);
  }, PERSIST_DEBOUNCE_MS);
}

function clearBulkCheckPersist() {
  if (bulkCheckPersistTimer) {
    clearTimeout(bulkCheckPersistTimer);
    bulkCheckPersistTimer = null;
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
    } else {
      set({ refreshing: true, error: null });
    }

    loadPromise = (async () => {
      try {
        const result = await loadShoppingStoreAction();
        if (!result.ok) {
          set({
            loading: false,
            refreshing: false,
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
        initSyncedCheckedState(sortedItems);
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
          refreshing: false,
          error: null,
        });
      } catch (err) {
        set({
          loading: false,
          refreshing: false,
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
    for (const timer of pendingReleaseTimers.values()) {
      clearTimeout(timer);
    }
    pendingReleaseTimers.clear();
    clearAllPersistDebounces();
    clearBulkCheckPersist();
    persistGenerationById.clear();
    lastSyncedCheckedById.clear();
    set(initialState);
  },

  getPositionsRef() {
    return positionsRef;
  },

  isItemPending(id: string) {
    return pendingItemIds.has(id);
  },

  replaceListItems(next, toggledId) {
    const { listItems, listPersistence } = get();
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
    }

    set({ listItems: ordered, loadedAt: Date.now() });

    if (!listPersistence) return;

    for (const item of ordered) {
      const prev = prevById.get(item.id);
      const fieldsChanged =
        prev &&
        (prev.name !== item.name ||
          prev.checked !== item.checked ||
          (prev.quantity ?? null) !== (item.quantity ?? null) ||
          (prev.stapleId ?? null) !== (item.stapleId ?? null));
      if (!prev || fieldsChanged) {
        scheduleItemPersist(item.id, get);
      }
    }

    for (const item of removed) {
      clearPersistDebounce(item.id);
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
    const { listItems, listPersistence } = get();
    const prev = listItems.find((i) => i.id === id);
    if (!prev) return;

    const toggled = listItems.map((i) =>
      i.id === id ? { ...i, checked: !i.checked } : i,
    );
    const ordered = reorderShoppingListAfterToggle(toggled, id);

    set({ listItems: ordered, loadedAt: Date.now() });

    if (listPersistence) {
      scheduleItemPersist(id, get);
    }
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
      for (const item of nextItems) {
        scheduleItemPersist(item.id, get);
      }
      scheduleBulkCheckedPersist(checked);
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
    const incoming = listRowToItem(row);
    confirmPendingIfMatched(row.id, incoming);

    if (pendingItemIds.has(row.id)) return;

    const expected = pendingExpectedById.get(row.id);
    if (expected && expected.checked !== incoming.checked) return;

    positionsRef.set(row.id, row.position);

    set((state) => {
      const idx = state.listItems.findIndex((i) => i.id === incoming.id);
      let merged: ShoppingListItem[];
      if (idx >= 0) {
        const existing = state.listItems[idx];
        if (rowsEqual(existing, incoming)) return state;
        if (
          existing.checked !== incoming.checked &&
          isItemLocallyAuthoritative(incoming.id)
        ) {
          return state;
        }
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
  return state.loadedAt !== null && !state.loading && !state.refreshing;
}
