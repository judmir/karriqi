import { create } from "zustand";

import {
  createRehabPlanEvent,
  deleteRehabPlanEvent,
  deleteRehabSeries,
  splitRehabSeries,
  toggleRehabPlanEventCompleted,
  updateRehabPlanEvent,
  upsertRehabOccurrenceOverride,
} from "@/lib/rehab/rehab-plan-actions";
import { parseOccurrenceId } from "@/lib/rehab/expand-rehab-events";
import type { RecurrenceRule } from "@/lib/rehab/recurrence";
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
  recurrence?: RecurrenceRule | null;
};

type UpdateEventInput = {
  id: string;
  title?: string;
  description?: string | null;
  startAt?: string;
  endAt?: string;
  allDay?: boolean;
  color?: CalendarEventColor;
  recurrence?: RecurrenceRule | null;
};

/** Fields editable on a single occurrence or whole series via the form. */
type OccurrenceEdit = {
  title: string;
  description?: string | null;
  startAt: string;
  endAt: string;
  allDay?: boolean;
  color?: CalendarEventColor;
};

export type SeriesEditScope = "occurrence" | "following" | "all";

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
  /** Completion that routes recurring occurrences to override rows. */
  toggleOccurrenceCompleted: (
    event: RehabPlanEvent,
    completed: boolean,
  ) => Promise<{ ok: true } | { ok: false; message: string }>;
  /** Delete a single occurrence ("occurrence") or a whole series ("series"). */
  deleteOccurrence: (
    event: RehabPlanEvent,
    mode: "occurrence" | "series",
  ) => Promise<{ ok: true } | { ok: false; message: string }>;
  /** Apply form edits to a recurring occurrence at the chosen scope. */
  editSeries: (
    event: RehabPlanEvent,
    edit: OccurrenceEdit,
    recurrence: RecurrenceRule | null,
    scope: SeriesEditScope,
  ) => Promise<{ ok: true } | { ok: false; message: string }>;
  refresh: () => Promise<void>;
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
  const recurrence = input.recurrence ?? null;
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
    seriesId: recurrence ? tempId : null,
    recurrence,
    recurrenceAt: null,
    recurrenceCancelled: false,
    createdAt: now,
    updatedAt: now,
  };
}

/** Build an optimistic override row for a single recurring occurrence. */
function buildOptimisticOverride(
  occurrence: RehabPlanEvent,
  edit: Partial<OccurrenceEdit>,
  flags: { completedAt?: string | null; cancelled?: boolean },
  existing: RehabPlanEvent | undefined,
  tempId: string,
): RehabPlanEvent {
  const now = new Date().toISOString();
  const base = existing ?? occurrence;
  return {
    id: existing?.id ?? tempId,
    userId: existing?.userId ?? "optimistic",
    title: (edit.title ?? base.title).trim() || "Untitled",
    description:
      edit.description !== undefined
        ? edit.description?.trim() || null
        : base.description,
    startAt: edit.startAt ?? base.startAt,
    endAt: edit.endAt ?? base.endAt,
    allDay: edit.allDay ?? base.allDay,
    color: edit.color ?? base.color,
    source: "local",
    completedAt:
      flags.completedAt !== undefined ? flags.completedAt : base.completedAt,
    eventKind: occurrence.eventKind,
    programId: null,
    planWeek: null,
    seriesId: occurrence.seriesId,
    recurrence: null,
    recurrenceAt: occurrence.recurrenceAt,
    recurrenceCancelled: flags.cancelled ?? existing?.recurrenceCancelled ?? false,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
}

/** Find the raw (persisted/temp) override row for an occurrence, if any. */
function findRawOverride(
  events: RehabPlanEvent[],
  seriesId: string,
  recurrenceAt: string,
): RehabPlanEvent | undefined {
  return events.find(
    (item) =>
      item.seriesId === seriesId &&
      item.recurrenceAt === recurrenceAt &&
      parseOccurrenceId(item.id) === null,
  );
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
          item.id === tempId
            ? {
                ...item,
                id: result.id,
                userId: "server",
                seriesId: item.recurrence ? result.id : item.seriesId,
              }
            : item,
        ),
      ),
      loadedAt: Date.now(),
    });

    return result;
  },

  async updateEvent(input) {
    const { events } = get();

    // A synthetic occurrence id (e.g. drag-reschedule on the calendar) edits a
    // single occurrence of a series via an override row.
    const parsed = parseOccurrenceId(input.id);
    if (parsed) {
      const master = events.find((item) => item.id === parsed.masterId);
      if (!master) {
        return { ok: false, message: "Series not found." };
      }
      const recurrenceAt = new Date(parsed.occurrenceMs).toISOString();
      const occurrence: RehabPlanEvent = {
        ...master,
        id: input.id,
        seriesId: master.seriesId ?? master.id,
        recurrence: null,
        recurrenceAt,
        recurrenceMasterId: master.id,
      };
      return upsertOccurrence(
        set,
        get,
        occurrence,
        {
          title: input.title,
          description: input.description,
          startAt: input.startAt,
          endAt: input.endAt,
          allDay: input.allDay,
          color: input.color,
        },
        {},
      );
    }

    const { persistence } = get();
    const prev = events.find((item) => item.id === input.id);
    if (!prev) {
      return { ok: false, message: "Event not found." };
    }

    const nextRecurrence =
      input.recurrence !== undefined ? input.recurrence : prev.recurrence;
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
      recurrence: nextRecurrence,
      // Converting a plain event into a series: it becomes its own master.
      seriesId:
        nextRecurrence && !prev.seriesId ? prev.id : prev.seriesId,
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

  async refresh() {
    const { persistence } = get();
    if (!persistence) {
      return;
    }
    const result = await loadRehabPlanStoreAction();
    if (result.ok) {
      set({
        events: sortEvents(result.events),
        persistence: result.persistence,
        loadedAt: Date.now(),
      });
    }
  },

  async toggleOccurrenceCompleted(event, completed) {
    const isVirtual = parseOccurrenceId(event.id) !== null;
    // Standalone events and persisted override rows toggle their own row.
    if (!isVirtual || !event.seriesId || !event.recurrenceAt) {
      return get().toggleCompleted(event.id, completed);
    }
    return upsertOccurrence(
      set,
      get,
      event,
      {},
      { completedAt: completed ? new Date().toISOString() : null },
    );
  },

  async deleteOccurrence(event, mode) {
    if (mode === "series" && event.seriesId) {
      return deleteSeriesLocal(set, get, event.seriesId);
    }
    // Single occurrence of a series -> cancel (EXDATE) via an override row.
    if (event.seriesId && event.recurrenceAt) {
      return upsertOccurrence(set, get, event, {}, { cancelled: true });
    }
    return get().deleteEvent(event.id);
  },

  async editSeries(event, edit, recurrence, scope) {
    const masterId = event.recurrenceMasterId ?? event.seriesId ?? event.id;

    if (scope === "occurrence") {
      return upsertOccurrence(set, get, event, edit, {});
    }

    if (scope === "following" && event.seriesId && event.recurrenceAt) {
      const { persistence } = get();
      if (!persistence) {
        await get().refresh();
        return { ok: true };
      }
      const result = await splitRehabSeries({
        seriesId: event.seriesId,
        masterId,
        splitAt: event.recurrenceAt,
        title: edit.title,
        description: edit.description ?? null,
        startAt: edit.startAt,
        endAt: edit.endAt,
        allDay: edit.allDay,
        color: edit.color,
        eventKind: event.eventKind,
        recurrence: recurrence ?? { freq: "daily", interval: 1 },
      });
      if (!result.ok) {
        showStoreError(result.message);
        return result;
      }
      await get().refresh();
      return { ok: true };
    }

    // "all": update the master row. Keep the master's date, adopt the edited
    // time-of-day and duration, and apply the other fields + rule.
    const master = get().events.find((item) => item.id === masterId);
    const editedStart = new Date(edit.startAt);
    const editedEnd = new Date(edit.endAt);
    const durationMs = editedEnd.getTime() - editedStart.getTime();
    let masterStart = editedStart;
    if (master) {
      const d = new Date(master.startAt);
      d.setHours(
        editedStart.getHours(),
        editedStart.getMinutes(),
        editedStart.getSeconds(),
        0,
      );
      masterStart = d;
    }
    const masterEnd = new Date(masterStart.getTime() + durationMs);

    return get().updateEvent({
      id: masterId,
      title: edit.title,
      description: edit.description ?? null,
      startAt: masterStart.toISOString(),
      endAt: masterEnd.toISOString(),
      allDay: edit.allDay,
      color: edit.color,
      recurrence,
    });
  },
}));

/**
 * Optimistically upsert an occurrence override row, then persist. Shared by
 * single-occurrence edit, completion, and cancel (skip) flows.
 */
async function upsertOccurrence(
  set: (
    partial:
      | Partial<RehabPlanStore>
      | ((state: RehabPlanStore) => Partial<RehabPlanStore>),
  ) => void,
  get: () => RehabPlanStore,
  occurrence: RehabPlanEvent,
  edit: Partial<OccurrenceEdit>,
  flags: { completedAt?: string | null; cancelled?: boolean },
): Promise<{ ok: true } | { ok: false; message: string }> {
  const { persistence, events } = get();
  const seriesId = occurrence.seriesId;
  const recurrenceAt = occurrence.recurrenceAt;
  if (!seriesId || !recurrenceAt) {
    return { ok: false, message: "Not a recurring occurrence." };
  }

  const existing = findRawOverride(events, seriesId, recurrenceAt);
  const tempId =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `temp-${Date.now()}`;
  const optimistic = buildOptimisticOverride(
    occurrence,
    edit,
    flags,
    existing,
    tempId,
  );
  const prevEvents = events;

  set({
    events: sortEvents(
      existing
        ? events.map((item) => (item.id === existing.id ? optimistic : item))
        : [...events, optimistic],
    ),
    loadedAt: Date.now(),
  });

  if (!persistence) {
    return { ok: true };
  }

  const result = await upsertRehabOccurrenceOverride({
    seriesId,
    recurrenceAt,
    title: optimistic.title,
    description: optimistic.description,
    startAt: optimistic.startAt,
    endAt: optimistic.endAt,
    allDay: optimistic.allDay,
    color: optimistic.color,
    eventKind: optimistic.eventKind,
    completedAt: optimistic.completedAt,
    cancelled: optimistic.recurrenceCancelled,
  });

  if (!result.ok) {
    set({ events: prevEvents, loadedAt: Date.now() });
    showStoreError(result.message);
    return result;
  }

  // Reconcile the temp override id with the server id.
  if (!existing) {
    set({
      events: sortEvents(
        get().events.map((item) =>
          item.id === tempId
            ? { ...item, id: result.id, userId: "server" }
            : item,
        ),
      ),
      loadedAt: Date.now(),
    });
  }

  return { ok: true };
}

async function deleteSeriesLocal(
  set: (
    partial:
      | Partial<RehabPlanStore>
      | ((state: RehabPlanStore) => Partial<RehabPlanStore>),
  ) => void,
  get: () => RehabPlanStore,
  seriesId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const { persistence, events } = get();
  const prevEvents = events;

  set({
    events: events.filter((item) => item.seriesId !== seriesId),
    loadedAt: Date.now(),
  });

  if (!persistence) {
    return { ok: true };
  }

  const result = await deleteRehabSeries(seriesId);
  if (!result.ok) {
    set({ events: prevEvents, loadedAt: Date.now() });
    showStoreError(result.message);
  }
  return result;
}

export function selectRehabPlanReady(state: RehabPlanStore): boolean {
  return state.loadedAt !== null || state.events.length > 0;
}
