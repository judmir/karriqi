import { create } from "zustand";

import {
  clearStoicRehabCompletion,
  saveStoicRehabCompletion,
  type SaveStoicRehabCompletionInput,
} from "@/lib/rehab/stoic-rehab-actions";
import { loadStoicRehabStoreAction } from "@/stores/load-actions";
import { isStoreStale } from "@/stores/store-utils";
import type { StoicRehabCompletion } from "@/types/stoic-rehab";

type StoicRehabStoreState = {
  completions: StoicRehabCompletion[];
  persistence: boolean;
  loadedAt: number | null;
  loading: boolean;
  error: string | null;
};

type StoicRehabStoreActions = {
  ensureLoaded: () => Promise<void>;
  hydrate: (completions: StoicRehabCompletion[], persistence: boolean) => void;
  invalidate: () => void;
  reset: () => void;
  getCompletionForExercise: (exerciseId: string) => StoicRehabCompletion | null;
  saveCompletion: (
    input: SaveStoicRehabCompletionInput,
  ) => Promise<{ ok: true } | { ok: false; message: string }>;
  clearCompletion: (
    exerciseId: string,
  ) => Promise<{ ok: true } | { ok: false; message: string }>;
};

export type StoicRehabStore = StoicRehabStoreState & StoicRehabStoreActions;

const initialState: StoicRehabStoreState = {
  completions: [],
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

function upsertCompletion(
  completions: StoicRehabCompletion[],
  next: StoicRehabCompletion,
): StoicRehabCompletion[] {
  const without = completions.filter(
    (item) => item.exerciseId !== next.exerciseId,
  );
  return [next, ...without];
}

export const useStoicRehabStore = create<StoicRehabStore>((set, get) => ({
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
        const result = await loadStoicRehabStoreAction();
        if (!result.ok) {
          set({
            loading: false,
            error:
              result.reason === "signed_out"
                ? "Sign in to view the Stoic Path."
                : "Stoic Path is not available.",
          });
          return;
        }
        set({
          completions: result.completions,
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
              : "Failed to load Stoic Path.",
        });
      } finally {
        loadPromise = null;
      }
    })();

    await loadPromise;
  },

  hydrate(completions, persistence) {
    set({
      completions,
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

  getCompletionForExercise(exerciseId) {
    return (
      get().completions.find((item) => item.exerciseId === exerciseId) ?? null
    );
  },

  async saveCompletion(input) {
    const { completions, persistence } = get();
    const previous = completions.find(
      (item) => item.exerciseId === input.exerciseId,
    );
    const optimistic: StoicRehabCompletion = {
      id: previous?.id ?? `temp-${input.exerciseId}`,
      userId: previous?.userId ?? "local",
      exerciseId: input.exerciseId,
      completedAt: new Date().toISOString(),
      journalText: input.journalText,
      processScore: input.processScore,
      adapted: input.adapted,
    };

    set({ completions: upsertCompletion(completions, optimistic) });

    if (!persistence) {
      return { ok: true };
    }

    const result = await saveStoicRehabCompletion(input);
    if (!result.ok) {
      set({
        completions: previous
          ? upsertCompletion(completions, previous)
          : completions.filter((item) => item.exerciseId !== input.exerciseId),
      });
      showStoreError(result.message);
      return result;
    }

    set({
      completions: upsertCompletion(completions, {
        ...optimistic,
        id: result.id,
        completedAt: result.completedAt,
      }),
    });

    return { ok: true };
  },

  async clearCompletion(exerciseId) {
    const { completions, persistence } = get();
    const previous = completions.find((item) => item.exerciseId === exerciseId);
    if (!previous) {
      return { ok: true };
    }

    set({
      completions: completions.filter((item) => item.exerciseId !== exerciseId),
    });

    if (!persistence) {
      return { ok: true };
    }

    const result = await clearStoicRehabCompletion(exerciseId);
    if (!result.ok) {
      set({ completions: upsertCompletion(completions, previous) });
      showStoreError(result.message);
      return result;
    }

    return { ok: true };
  },
}));

export function selectStoicRehabReady(state: StoicRehabStore): boolean {
  return state.loadedAt != null && !state.loading;
}
