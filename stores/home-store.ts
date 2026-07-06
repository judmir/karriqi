import { create } from "zustand";

import {
  generateDesignRender,
  generateRoomDesign,
} from "@/lib/home/ai-design-actions";
import { deleteDesign, renameDesign } from "@/lib/home/home-actions";
import { loadHomeStoreAction } from "@/stores/load-actions";
import { isStoreStale } from "@/stores/store-utils";
import type { DesignRender, RoomDesign } from "@/types/home";

type HomeStoreState = {
  designs: RoomDesign[];
  renders: DesignRender[];
  persistence: boolean;
  loadedAt: number | null;
  loading: boolean;
  error: string | null;
};

type MutationResult = { ok: true } | { ok: false; message: string };

type HomeStoreActions = {
  ensureLoaded: () => Promise<void>;
  invalidate: () => void;
  reset: () => void;
  generateDesign: (
    roomId: string,
    prompt: string,
  ) => Promise<{ ok: true; design: RoomDesign } | { ok: false; message: string }>;
  renameDesign: (id: string, title: string) => Promise<MutationResult>;
  removeDesign: (id: string) => Promise<MutationResult>;
  generateRender: (
    designId: string,
  ) => Promise<{ ok: true; render: DesignRender } | { ok: false; message: string }>;
};

export type HomeStore = HomeStoreState & HomeStoreActions;

const initialState: HomeStoreState = {
  designs: [],
  renders: [],
  persistence: false,
  loadedAt: null,
  loading: false,
  error: null,
};

let loadPromise: Promise<void> | null = null;

function showError(message: string) {
  if (typeof window === "undefined") return;
  void import("sonner").then(({ toast }) => toast.error(message));
}

export const useHomeStore = create<HomeStore>((set, get) => ({
  ...initialState,

  async ensureLoaded() {
    const { loadedAt, loading } = get();
    if (loadedAt !== null && !isStoreStale(loadedAt)) {
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
        const result = await loadHomeStoreAction();
        if (!result.ok) {
          set({
            loading: false,
            error:
              result.reason === "signed_out" ? null : "Could not load designs.",
            loadedAt: hasCache ? get().loadedAt : null,
          });
          return;
        }
        set({
          designs: result.designs,
          renders: result.renders,
          persistence: result.persistence,
          loadedAt: Date.now(),
          loading: false,
          error: null,
        });
      } catch (err) {
        set({
          loading: false,
          error: err instanceof Error ? err.message : "Could not load designs.",
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

  reset() {
    loadPromise = null;
    set(initialState);
  },

  async generateDesign(roomId, prompt) {
    const result = await generateRoomDesign(roomId, prompt);
    if (!result.ok) {
      showError(result.message);
      return result;
    }
    set((state) => ({
      designs: [result.design, ...state.designs],
      loadedAt: Date.now(),
    }));
    return result;
  },

  async renameDesign(id, title) {
    const { designs } = get();
    const prev = designs.find((d) => d.id === id);
    if (!prev) return { ok: false, message: "Design not found." };

    set({
      designs: designs.map((d) => (d.id === id ? { ...d, title } : d)),
      loadedAt: Date.now(),
    });

    const result = await renameDesign(id, title);
    if (!result.ok) {
      set({
        designs: get().designs.map((d) => (d.id === id ? prev : d)),
        loadedAt: Date.now(),
      });
      showError(result.message);
    }
    return result;
  },

  async removeDesign(id) {
    const { designs, renders } = get();
    const prevDesigns = designs;
    const prevRenders = renders;

    set({
      designs: designs.filter((d) => d.id !== id),
      renders: renders.filter((r) => r.designId !== id),
      loadedAt: Date.now(),
    });

    const result = await deleteDesign(id);
    if (!result.ok) {
      set({ designs: prevDesigns, renders: prevRenders, loadedAt: Date.now() });
      showError(result.message);
    }
    return result;
  },

  async generateRender(designId) {
    const result = await generateDesignRender(designId);
    if (!result.ok) {
      showError(result.message);
      return result;
    }
    set((state) => ({
      renders: [result.render, ...state.renders],
      loadedAt: Date.now(),
    }));
    return result;
  },
}));

export function selectHomeReady(state: HomeStore): boolean {
  return state.loadedAt !== null || state.designs.length > 0;
}
