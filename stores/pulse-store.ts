import { create } from "zustand";

import {
  createTaskFromPulseItemAction,
  updatePulseItemStatusAction,
} from "@/lib/pulse/pulse-actions";
import { loadPulseStoreAction } from "@/stores/load-actions";
import { isStoreStale } from "@/stores/store-utils";
import type { PulseFilter, PulseItem, PulseStatus } from "@/types/pulse";

type PulseStoreState = {
  items: PulseItem[];
  filter: PulseFilter;
  persistence: boolean;
  loadedAt: number | null;
  loading: boolean;
  error: string | null;
};

type MutationResult = { ok: true } | { ok: false; message: string };

type PulseStoreActions = {
  ensureLoaded: () => Promise<void>;
  setFilter: (filter: PulseFilter) => void;
  invalidate: () => void;
  reset: () => void;
  setItemStatus: (itemId: string, status: PulseStatus) => Promise<MutationResult>;
  createTaskFromItem: (
    itemId: string,
  ) => Promise<{ ok: true; taskId: string } | { ok: false; message: string }>;
};

export type PulseStore = PulseStoreState & PulseStoreActions;

const initialState: PulseStoreState = {
  items: [],
  filter: "all",
  persistence: false,
  loadedAt: null,
  loading: false,
  error: null,
};

let loadPromise: Promise<void> | null = null;

function patchItemStatus(items: PulseItem[], itemId: string, status: PulseStatus) {
  return items.map((item) =>
    item.id === itemId ? { ...item, status, updatedAt: new Date().toISOString() } : item,
  );
}

export const usePulseStore = create<PulseStore>((set, get) => ({
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
        const result = await loadPulseStoreAction();
        if (!result.ok) {
          set({
            loading: false,
            error:
              result.reason === "signed_out"
                ? "Sign in to view Pulse."
                : "Pulse is not available.",
            loadedAt: hasCache ? get().loadedAt : null,
          });
          return;
        }
        set({
          items: result.items,
          persistence: result.persistence,
          loadedAt: Date.now(),
          loading: false,
          error: null,
        });
      } catch (error) {
        set({
          loading: false,
          error:
            error instanceof Error ? error.message : "Could not load Pulse.",
          loadedAt: hasCache ? get().loadedAt : null,
        });
      } finally {
        loadPromise = null;
      }
    })();

    await loadPromise;
  },

  setFilter(filter) {
    set({ filter });
  },

  invalidate() {
    set({ loadedAt: null });
  },

  reset() {
    loadPromise = null;
    set(initialState);
  },

  async setItemStatus(itemId, status) {
    set((state) => ({ items: patchItemStatus(state.items, itemId, status) }));
    const result = await updatePulseItemStatusAction(itemId, status);
    if (!result.ok) {
      get().invalidate();
      await get().ensureLoaded();
    }
    return result;
  },

  async createTaskFromItem(itemId) {
    const result = await createTaskFromPulseItemAction(itemId);
    if (result.ok) {
      set((state) => ({
        items: patchItemStatus(state.items, itemId, "acted"),
      }));
    }
    return result;
  },
}));

export function selectPulseReady(state: PulseStore): boolean {
  return state.loadedAt !== null;
}
