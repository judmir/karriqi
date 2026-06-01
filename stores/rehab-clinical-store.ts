import { create } from "zustand";

import {
  toggleRehabClinicalItemCompleted,
  updateRehabClinicalItemNotes,
  updateRehabClinicalSubtasksDone,
} from "@/lib/rehab/rehab-clinical-actions";
import {
  allClinicalSubtaskIndices,
  allSubtasksDone,
  toggleClinicalSubtaskDone,
} from "@/lib/rehab/rehab-clinical-task-body";
import { loadRehabClinicalStoreAction } from "@/stores/load-actions";
import { isStoreStale } from "@/stores/store-utils";
import type { RehabClinicalItem } from "@/types/rehab";

type RehabClinicalStoreState = {
  items: RehabClinicalItem[];
  persistence: boolean;
  loadedAt: number | null;
  loading: boolean;
  error: string | null;
};

type RehabClinicalStoreActions = {
  ensureLoaded: () => Promise<void>;
  hydrate: (items: RehabClinicalItem[], persistence: boolean) => void;
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
  toggleSubtask: (
    itemId: string,
    subtaskIndex: number,
    completed: boolean,
    subtaskCount: number,
  ) => Promise<{ ok: true } | { ok: false; message: string }>;
  toggleAllSubtasks: (
    itemId: string,
    completed: boolean,
    subtaskCount: number,
  ) => Promise<{ ok: true } | { ok: false; message: string }>;
};

export type RehabClinicalStore = RehabClinicalStoreState & RehabClinicalStoreActions;

const initialState: RehabClinicalStoreState = {
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
  items: RehabClinicalItem[],
  itemId: string,
  patch: Partial<Pick<RehabClinicalItem, "completedAt" | "notes" | "subtasksDone">>,
): RehabClinicalItem[] {
  return items.map((item) =>
    item.id === itemId ? { ...item, ...patch } : item,
  );
}

export const useRehabClinicalStore = create<RehabClinicalStore>((set, get) => ({
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
        const result = await loadRehabClinicalStoreAction();
        if (!result.ok) {
          set({
            loading: false,
            error:
              result.reason === "signed_out"
                ? "Sign in to view clinical checks."
                : "Clinical checks are not available.",
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
            error instanceof Error
              ? error.message
              : "Failed to load clinical checks.",
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

    const result = await toggleRehabClinicalItemCompleted(itemId, completed);
    if (!result.ok) {
      set({
        items: patchItem(items, itemId, { completedAt: previous.completedAt }),
      });
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

    const result = await updateRehabClinicalItemNotes(itemId, notes);
    if (!result.ok) {
      set({ items: patchItem(items, itemId, { notes: previous.notes }) });
      showStoreError(result.message);
      return result;
    }

    return { ok: true };
  },

  async toggleSubtask(itemId, subtaskIndex, completed, subtaskCount) {
    const { items, persistence } = get();
    const previous = items.find((item) => item.id === itemId);
    if (!previous) {
      return { ok: false, message: "Item not found." };
    }

    const subtasksDone = toggleClinicalSubtaskDone(
      previous.subtasksDone,
      subtaskIndex,
      completed,
      subtaskCount,
    );
    const parentComplete = allSubtasksDone(subtasksDone, subtaskCount);
    const completedAt = parentComplete ? new Date().toISOString() : null;

    set({
      items: patchItem(items, itemId, { subtasksDone, completedAt }),
    });

    if (!persistence) {
      return { ok: true };
    }

    const result = await updateRehabClinicalSubtasksDone(
      itemId,
      subtasksDone,
      parentComplete,
    );
    if (!result.ok) {
      set({
        items: patchItem(items, itemId, {
          subtasksDone: previous.subtasksDone,
          completedAt: previous.completedAt,
        }),
      });
      showStoreError(result.message);
      return result;
    }

    return { ok: true };
  },

  async toggleAllSubtasks(itemId, completed, subtaskCount) {
    const { items, persistence } = get();
    const previous = items.find((item) => item.id === itemId);
    if (!previous) {
      return { ok: false, message: "Item not found." };
    }

    const subtasksDone = completed
      ? allClinicalSubtaskIndices(subtaskCount)
      : [];
    const completedAt = completed ? new Date().toISOString() : null;

    set({
      items: patchItem(items, itemId, { subtasksDone, completedAt }),
    });

    if (!persistence) {
      return { ok: true };
    }

    const result = await updateRehabClinicalSubtasksDone(
      itemId,
      subtasksDone,
      completed,
    );
    if (!result.ok) {
      set({
        items: patchItem(items, itemId, {
          subtasksDone: previous.subtasksDone,
          completedAt: previous.completedAt,
        }),
      });
      showStoreError(result.message);
      return result;
    }

    return { ok: true };
  },
}));

export function selectRehabClinicalReady(state: RehabClinicalStore): boolean {
  return state.loadedAt !== null;
}
