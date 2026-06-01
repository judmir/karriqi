import { create } from "zustand";

import {
  toggleRehabPlanListItemCompleted,
  updateRehabPlanListItemNotes,
} from "@/lib/rehab/rehab-plan-list-actions";
import { loadRehabPlanListStoreAction } from "@/stores/load-actions";
import { isStoreStale } from "@/stores/store-utils";
import type { RehabPlanListItem } from "@/types/rehab";

type RehabPlanListStoreState = {
  items: RehabPlanListItem[];
  persistence: boolean;
  loadedAt: number | null;
  loading: boolean;
  error: string | null;
};

type RehabPlanListStoreActions = {
  ensureLoaded: () => Promise<void>;
  hydrate: (items: RehabPlanListItem[], persistence: boolean) => void;
  invalidate: () => void;
  reset: () => void;
  toggleCompleted: (
    itemId: string,
    completed: boolean,
  ) => Promise<{ ok: true } | { ok: false; message: string }>;
  updateNotes: (
    itemId: string,
    notes: string,
  ) => Promise<{ ok: true } | { ok: false; message: string }>;
};

export type RehabPlanListStore = RehabPlanListStoreState & RehabPlanListStoreActions;

const initialState: RehabPlanListStoreState = {
  items: [],
  persistence: false,
  loadedAt: null,
  loading: false,
  error: null,
};

let loadPromise: Promise<void> | null = null;

function showStoreError(message: string) {
  if (typeof window === "undefined") {
    return;
  }
  void import("sonner").then(({ toast }) => {
    toast.error(message);
  });
}

function patchItem(
  items: RehabPlanListItem[],
  itemId: string,
  patch: Partial<Pick<RehabPlanListItem, "completedAt" | "notes">>,
): RehabPlanListItem[] {
  return items.map((item) =>
    item.id === itemId ? { ...item, ...patch } : item,
  );
}

export const useRehabPlanListStore = create<RehabPlanListStore>((set, get) => ({
  ...initialState,

  async ensureLoaded() {
    const state = get();
    if (state.loadedAt && !isStoreStale(state.loadedAt)) {
      return;
    }
    if (loadPromise) {
      await loadPromise;
      return;
    }

    set({ loading: true, error: null });
    loadPromise = (async () => {
      try {
        const result = await loadRehabPlanListStoreAction();
        if (!result.ok) {
          set({
            loading: false,
            error:
              result.reason === "signed_out"
                ? "Sign in to view your plan."
                : "Plan is not available.",
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
          error: error instanceof Error ? error.message : "Failed to load plan.",
        });
      } finally {
        loadPromise = null;
      }
    })();

    await loadPromise;
  },

  hydrate(items, persistence) {
    set({
      items,
      persistence,
      loadedAt: Date.now(),
      loading: false,
      error: null,
    });
  },

  invalidate() {
    set({ loadedAt: null });
  },

  reset() {
    set(initialState);
  },

  async toggleCompleted(itemId, completed) {
    const { items, persistence } = get();
    const previous = items.find((item) => item.id === itemId);
    if (!previous) {
      return { ok: false, message: "Item not found." };
    }

    const completedAt = completed ? new Date().toISOString() : null;
    set({ items: patchItem(items, itemId, { completedAt }) });

    if (!persistence) {
      return { ok: true };
    }

    const result = await toggleRehabPlanListItemCompleted(itemId, completed);
    if (!result.ok) {
      set({ items: patchItem(items, itemId, { completedAt: previous.completedAt }) });
      showStoreError(result.message);
      return result;
    }

    return { ok: true };
  },

  async updateNotes(itemId, notes) {
    const { items, persistence } = get();
    const previous = items.find((item) => item.id === itemId);
    if (!previous) {
      return { ok: false, message: "Item not found." };
    }

    set({ items: patchItem(items, itemId, { notes }) });

    if (!persistence) {
      return { ok: true };
    }

    const result = await updateRehabPlanListItemNotes(itemId, notes);
    if (!result.ok) {
      set({ items: patchItem(items, itemId, { notes: previous.notes }) });
      showStoreError(result.message);
      return result;
    }

    return { ok: true };
  },
}));

export function selectRehabPlanListReady(state: RehabPlanListStore): boolean {
  return state.loadedAt !== null;
}

export function selectRehabPlanListTasks(state: RehabPlanListStore) {
  return state.items.filter((item) => item.kind === "task");
}

export function selectRehabPlanListProgress(state: RehabPlanListStore): number {
  const tasks = selectRehabPlanListTasks(state);
  if (tasks.length === 0) {
    return 0;
  }
  const done = tasks.filter((task) => task.completedAt).length;
  return Math.round((done / tasks.length) * 100);
}
