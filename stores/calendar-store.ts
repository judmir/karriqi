import { create } from "zustand";

import { loadCalendarStoreAction } from "@/stores/load-actions";
import { isStoreStale } from "@/stores/store-utils";
import type { CalendarEvent } from "@/types/calendar";

type CalendarStoreState = {
  events: CalendarEvent[];
  persistence: boolean;
  loadedAt: number | null;
  loading: boolean;
  error: string | null;
};

type CalendarStoreActions = {
  ensureLoaded: () => Promise<void>;
  invalidate: () => void;
  setEvents: (events: CalendarEvent[]) => void;
  reset: () => void;
};

export type CalendarStore = CalendarStoreState & CalendarStoreActions;

const initialState: CalendarStoreState = {
  events: [],
  persistence: false,
  loadedAt: null,
  loading: false,
  error: null,
};

let loadPromise: Promise<void> | null = null;

export const useCalendarStore = create<CalendarStore>((set, get) => ({
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
        const result = await loadCalendarStoreAction();
        if (!result.ok) {
          set({
            loading: false,
            error:
              result.reason === "signed_out"
                ? null
                : "Could not load calendar.",
            loadedAt: hasCache ? get().loadedAt : null,
          });
          return;
        }
        set({
          events: result.events,
          persistence: result.persistence,
          loadedAt: Date.now(),
          loading: false,
          error: null,
        });
      } catch (err) {
        set({
          loading: false,
          error:
            err instanceof Error ? err.message : "Could not load calendar.",
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

  setEvents(events) {
    set({ events, loadedAt: Date.now() });
  },

  reset() {
    loadPromise = null;
    set(initialState);
  },
}));

export function selectCalendarReady(state: CalendarStore): boolean {
  return state.loadedAt !== null;
}
