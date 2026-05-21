import { create } from "zustand";

import { loadKanbanStoreAction } from "@/stores/load-actions";
import { isStoreStale } from "@/stores/store-utils";
import type { TodoAssignableMember, TodoBoardItem } from "@/types/todo";

type TodoStoreState = {
  boardItems: TodoBoardItem[];
  assignableUsers: TodoAssignableMember[];
  persistence: boolean;
  loadedAt: number | null;
  loading: boolean;
  error: string | null;
};

type TodoStoreActions = {
  ensureLoaded: () => Promise<void>;
  invalidate: () => void;
  setBoardItems: (items: TodoBoardItem[]) => void;
  reset: () => void;
};

export type TodoStore = TodoStoreState & TodoStoreActions;

const initialState: TodoStoreState = {
  boardItems: [],
  assignableUsers: [],
  persistence: false,
  loadedAt: null,
  loading: false,
  error: null,
};

let loadPromise: Promise<void> | null = null;

export const useTodoStore = create<TodoStore>((set, get) => ({
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
        const result = await loadKanbanStoreAction();
        if (!result.ok) {
          set({
            loading: false,
            error:
              result.reason === "signed_out"
                ? null
                : "Could not load tasks.",
            loadedAt: hasCache ? get().loadedAt : null,
          });
          return;
        }
        set({
          boardItems: result.todos,
          assignableUsers: result.assignableUsers,
          persistence: result.persistence,
          loadedAt: Date.now(),
          loading: false,
          error: null,
        });
      } catch (err) {
        set({
          loading: false,
          error: err instanceof Error ? err.message : "Could not load tasks.",
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

  setBoardItems(items) {
    set({ boardItems: items, loadedAt: Date.now() });
  },

  reset() {
    loadPromise = null;
    set(initialState);
  },
}));

export function selectKanbanReady(state: TodoStore): boolean {
  return state.loadedAt !== null || state.boardItems.length > 0;
}
