import { create } from "zustand";

import { mockStaples } from "@/lib/shopping/mock-staples";
import { loadShoppingStoreAction } from "@/stores/load-actions";
import { isStoreStale } from "@/stores/store-utils";
import type { ShoppingListItem, StapleItem } from "@/types/shopping";

type ShoppingStoreState = {
  staples: StapleItem[];
  listItems: ShoppingListItem[];
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
  patch: (partial: Partial<Omit<ShoppingStoreState, "loadedAt" | "loading" | "error">>) => void;
  reset: () => void;
};

export type ShoppingStore = ShoppingStoreState & ShoppingStoreActions;

const initialState: ShoppingStoreState = {
  staples: mockStaples,
  listItems: [],
  purchasePersistence: false,
  listPersistence: false,
  medianIntervalByStapleId: {},
  householdOwnerId: null,
  loadedAt: null,
  loading: false,
  error: null,
};

let loadPromise: Promise<void> | null = null;

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
        set({
          staples: result.staples,
          listItems: result.listItems,
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

  patch(partial) {
    set({ ...partial, loadedAt: Date.now() });
  },

  reset() {
    loadPromise = null;
    set(initialState);
  },
}));

export function selectShoppingReady(state: ShoppingStore): boolean {
  return state.loadedAt !== null;
}
