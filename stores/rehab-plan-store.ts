import { create } from "zustand";

import {
  createRehabPlanEvent,
  deleteRehabPlanEvent,
  toggleRehabPlanEventCompleted,
  updateRehabPlanEvent,
} from "@/lib/rehab/rehab-plan-actions";
import { loadRehabPlanStoreAction } from "@/stores/load-actions";
import { isStoreStale } from "@/stores/store-utils";
import type { CalendarEventColor } from "@/types/calendar";
import type { RehabPlanEvent } from "@/types/rehab";

type RehabPlanStoreState = {
  events: RehabPlanEvent[];
  persistence: boolean;
  loadedAt: number | null;
  loading: boolean;
  error: string | null;
};

type CreateEventInput = {
  title: string;
  description?: string | null;
  startAt: string;
  endAt: string;
  allDay?: boolean;
  color?: CalendarEventColor;
};

type UpdateEventInput = {
  id: string;
  title?: string;
  description?: string | null;
  startAt?: string;
  endAt?: string;
  allDay?: boolean;
  color?: CalendarEventColor;
};

type RehabPlanStoreActions = {
  ensureLoaded: () => Promise<void>;
  hydrate: (events: RehabPlanEvent[], persistence: boolean) => void;
  invalidate: () => void;
  reset: () => void;
  createEvent: (
    input: CreateEventInput,
  ) => Promise<{ ok: true; id: string } | { ok: false; message: string }>;
  updateEvent: (
    input: UpdateEventInput,
  ) => Promise<{ ok: true } | { ok: false; message: string }>;
  updateEventSchedule: (
    event: Pick<RehabPlanEvent, "id" | "startAt" | "endAt" | "allDay">,
  ) => Promise<{ ok: true } | { ok: false; message: string }>;
  deleteEvent: (
    id: string,
  ) => Promise<{ ok: true } | { ok: false; message: string }>;
  toggleCompleted: (
    id: string,
    completed: boolean,
  ) => Promise<{ ok: true } | { ok: false; message: string }>;
  upsertLocalEvent: (event: RehabPlanEvent) => void;
  removeLocalEvent: (id: string) => void;
};

export type RehabPlanStore = RehabPlanStoreState & RehabPlanStoreActions;

const initialState: RehabPlanStoreState = {
  events: [],
  persistence: false,
  loadedAt: null,
  loading: false,
  error: null,
};

let loadPromise: Promise<void> | null = null;

function sortEvents(events: RehabPlanEvent[]): RehabPlanEvent[] {
  return [...events].sort(
    (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
  );
}

function showStoreError(message: string) {
  if (typeof window === "undefined") {
    return;
  }
  void import("sonner").then(({ toast }) => {
    toast.error(message);
  });
}

function buildOptimisticCreate(
  tempId: string,
  input: CreateEventInput,
): RehabPlanEvent {
  const now = new Date().toISOString();
  return {
    id: tempId,
    userId: "optimistic",
    title: input.title.trim(),
    description: input.description?.trim() || null,
    startAt: input.startAt,
    endAt: input.endAt,
    allDay: input.allDay ?? false,
    color: input.color ?? "blue",
    source: "local",
    completedAt: null,
    eventKind: "custom",
    programId: null,
    planWeek: null,
    createdAt: now,
    updatedAt: now,
  };
}

export const useRehabPlanStore = create<RehabPlanStore>((set, get) => ({
  ...initialState,

  async ensureLoaded() {
    const { loadedAt, loading, events } = get();
    if (events.length > 0 && loadedAt !== null && !isStoreStale(loadedAt)) {
      return;
    }
    if (loading && loadPromise) {
      await loadPromise;
      return;
    }

    const hasCache = loadedAt !== null && events.length > 0;
    if (!hasCache) {
      set({ loading: true, error: null });
    }

    loadPromise = (async () => {
      try {
        const result = await loadRehabPlanStoreAction();
        if (!result.ok) {
          set({
            loading: false,
            error:
              result.reason === "signed_out"
                ? null
                : "Could not load rehab events.",
            loadedAt: hasCache ? get().loadedAt : null,
          });
          return;
        }
        set({
          events: sortEvents(result.events),
          persistence: result.persistence,
          loadedAt: Date.now(),
          loading: false,
          error: null,
        });
      } catch (err) {
        set({
          loading: false,
          error:
            err instanceof Error ? err.message : "Could not load rehab events.",
          loadedAt: hasCache ? get().loadedAt : null,
        });
      } finally {
        loadPromise = null;
      }
    })();

    await loadPromise;
  },

  hydrate(events, persistence) {
    const { loadedAt, events: current } = get();
    if (loadedAt !== null && current.length > 0) {
      return;
    }
    set({
      events: sortEvents(events),
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
    loadPromise = null;
    set(initialState);
  },

  upsertLocalEvent(event) {
    set((state) => {
      const exists = state.events.some((item) => item.id === event.id);
      const events = exists
        ? state.events.map((item) =>
            item.id === event.id ? { ...event, completedAt: item.completedAt } : item,
          )
        : [...state.events, event];
      return { events: sortEvents(events), loadedAt: Date.now() };
    });
  },

  removeLocalEvent(id) {
    set((state) => ({
      events: state.events.filter((item) => item.id !== id),
      loadedAt: Date.now(),
    }));
  },

  async createEvent(input) {
    const { persistence, events } = get();
    const tempId =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `temp-${Date.now()}`;
    const optimistic = buildOptimisticCreate(tempId, input);

    set({ events: sortEvents([...events, optimistic]), loadedAt: Date.now() });

    if (!persistence) {
      return { ok: true, id: tempId };
    }

    const result = await createRehabPlanEvent(input);
    if (!result.ok) {
      set({
        events: get().events.filter((item) => item.id !== tempId),
        loadedAt: Date.now(),
      });
      showStoreError(result.message);
      return result;
    }

    set({
      events: sortEvents(
        get().events.map((item) =>
          item.id === tempId ? { ...item, id: result.id, userId: "server" } : item,
        ),
      ),
      loadedAt: Date.now(),
    });

    return result;
  },

  async updateEvent(input) {
    const { persistence, events } = get();
    const prev = events.find((item) => item.id === input.id);
    if (!prev) {
      return { ok: false, message: "Event not found." };
    }

    const next: RehabPlanEvent = {
      ...prev,
      title: input.title !== undefined ? input.title.trim() : prev.title,
      description:
        input.description !== undefined
          ? input.description?.trim() || null
          : prev.description,
      startAt: input.startAt ?? prev.startAt,
      endAt: input.endAt ?? prev.endAt,
      allDay: input.allDay ?? prev.allDay,
      color: input.color ?? prev.color,
      updatedAt: new Date().toISOString(),
    };

    set({
      events: sortEvents(
        events.map((item) => (item.id === input.id ? next : item)),
      ),
      loadedAt: Date.now(),
    });

    if (!persistence) {
      return { ok: true };
    }

    const result = await updateRehabPlanEvent(input);
    if (!result.ok) {
      set({
        events: sortEvents(
          get().events.map((item) => (item.id === input.id ? prev : item)),
        ),
        loadedAt: Date.now(),
      });
      showStoreError(result.message);
    }
    return result;
  },

  async updateEventSchedule(event) {
    return get().updateEvent({
      id: event.id,
      startAt: event.startAt,
      endAt: event.endAt,
      allDay: event.allDay,
    });
  },

  async deleteEvent(id) {
    const { persistence, events } = get();
    const prev = events.find((item) => item.id === id);
    if (!prev) {
      return { ok: true };
    }

    set({
      events: events.filter((item) => item.id !== id),
      loadedAt: Date.now(),
    });

    if (!persistence) {
      return { ok: true };
    }

    const result = await deleteRehabPlanEvent(id);
    if (!result.ok) {
      set({
        events: sortEvents([...get().events, prev]),
        loadedAt: Date.now(),
      });
      showStoreError(result.message);
    }
    return result;
  },

  async toggleCompleted(id, completed) {
    const { persistence, events } = get();
    const prev = events.find((item) => item.id === id);
    if (!prev) {
      return { ok: false, message: "Event not found." };
    }

    const completedAt = completed ? new Date().toISOString() : null;
    const next = { ...prev, completedAt };

    set({
      events: events.map((item) => (item.id === id ? next : item)),
      loadedAt: Date.now(),
    });

    if (!persistence) {
      return { ok: true };
    }

    const result = await toggleRehabPlanEventCompleted({ id, completed });
    if (!result.ok) {
      set({
        events: get().events.map((item) => (item.id === id ? prev : item)),
        loadedAt: Date.now(),
      });
      showStoreError(result.message);
    }
    return result;
  },
}));

export function selectRehabPlanReady(state: RehabPlanStore): boolean {
  return state.loadedAt !== null || state.events.length > 0;
}
