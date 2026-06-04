import { create } from "zustand";

import {
  saveRuleOf3Item,
  setRuleOf3ItemBlockedReason,
  setRuleOf3ItemCompleted,
  setRuleOf3Reflection,
} from "@/lib/rule-of-3/rule-of-3-actions";
import { findDay, upsertItem } from "@/lib/rule-of-3/rule-of-3-utils";
import { loadRuleOf3StoreAction } from "@/stores/load-actions";
import { isStoreStale } from "@/stores/store-utils";
import type { RuleOf3Day, RuleOf3Position } from "@/types/rule-of-3";

type RuleOf3StoreState = {
  days: RuleOf3Day[];
  persistence: boolean;
  loadedAt: number | null;
  loading: boolean;
  error: string | null;
};

type MutationResult = { ok: true } | { ok: false; message: string };

type RuleOf3StoreActions = {
  ensureLoaded: () => Promise<void>;
  hydrate: (days: RuleOf3Day[], persistence: boolean) => void;
  invalidate: () => void;
  reset: () => void;
  setItemTitle: (
    planDate: string,
    position: RuleOf3Position,
    title: string,
  ) => Promise<MutationResult>;
  setItemCompleted: (
    planDate: string,
    position: RuleOf3Position,
    completed: boolean,
  ) => Promise<MutationResult>;
  setItemBlockedReason: (
    planDate: string,
    position: RuleOf3Position,
    blockedReason: string,
  ) => Promise<MutationResult>;
  setReflection: (
    planDate: string,
    reflection: string,
  ) => Promise<MutationResult>;
};

export type RuleOf3Store = RuleOf3StoreState & RuleOf3StoreActions;

const initialState: RuleOf3StoreState = {
  days: [],
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

export const useRuleOf3Store = create<RuleOf3Store>((set, get) => ({
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
        const result = await loadRuleOf3StoreAction();
        if (!result.ok) {
          set({
            loading: false,
            error:
              result.reason === "signed_out"
                ? "Sign in to view your Rule of 3."
                : "Rule of 3 is not available.",
          });
          return;
        }
        set({
          days: result.days,
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
              : "Failed to load Rule of 3.",
        });
      } finally {
        loadPromise = null;
      }
    })();

    await loadPromise;
  },

  hydrate(days, persistence) {
    set({
      days,
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

  async setItemTitle(planDate, position, title) {
    const { days, persistence } = get();
    const previous = days;
    set({ days: upsertItem(days, planDate, position, { title: title.trim() }) });

    if (!persistence) {
      return { ok: true };
    }

    const result = await saveRuleOf3Item({ planDate, position, title });
    if (!result.ok) {
      set({ days: previous });
      showStoreError(result.message);
      return result;
    }
    return { ok: true };
  },

  async setItemCompleted(planDate, position, completed) {
    const { days, persistence } = get();
    const previous = days;
    const completedAt = completed ? new Date().toISOString() : null;
    set({
      days: upsertItem(days, planDate, position, {
        completedAt,
        ...(completed ? { blockedReason: "" } : {}),
      }),
    });

    if (!persistence) {
      return { ok: true };
    }

    const result = await setRuleOf3ItemCompleted({
      planDate,
      position,
      completed,
    });
    if (!result.ok) {
      set({ days: previous });
      showStoreError(result.message);
      return result;
    }
    return { ok: true };
  },

  async setItemBlockedReason(planDate, position, blockedReason) {
    const { days, persistence } = get();
    const previous = days;
    const reason = blockedReason.trim();
    set({
      days: upsertItem(days, planDate, position, {
        blockedReason: reason,
        ...(reason.length > 0 ? { completedAt: null } : {}),
      }),
    });

    if (!persistence) {
      return { ok: true };
    }

    const result = await setRuleOf3ItemBlockedReason({
      planDate,
      position,
      blockedReason,
    });
    if (!result.ok) {
      set({ days: previous });
      showStoreError(result.message);
      return result;
    }
    return { ok: true };
  },

  async setReflection(planDate, reflection) {
    const { days, persistence } = get();
    const previous = days;
    const existing = findDay(days, planDate);
    const trimmed = reflection.trim();
    if (existing) {
      set({
        days: days.map((day) =>
          day.planDate === planDate ? { ...day, reflection: trimmed } : day,
        ),
      });
    } else {
      set({
        days: [
          {
            id: planDate,
            planDate,
            reflection: trimmed,
            items: [],
            createdAt: null,
            updatedAt: null,
          },
          ...days,
        ],
      });
    }

    if (!persistence) {
      return { ok: true };
    }

    const result = await setRuleOf3Reflection({ planDate, reflection });
    if (!result.ok) {
      set({ days: previous });
      showStoreError(result.message);
      return result;
    }
    return { ok: true };
  },
}));

export function selectRuleOf3Ready(state: RuleOf3Store): boolean {
  return state.loadedAt !== null;
}
