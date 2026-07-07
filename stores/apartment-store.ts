import { create } from "zustand";

import {
  deleteApartmentRoomAction,
  saveApartmentNotesAction,
  upsertApartmentRoomAction,
  upsertApartmentStepStateAction,
} from "@/lib/apartment/apartment-actions";
import {
  deleteApartmentImageClient,
  reorderApartmentImagesClient,
  setApartmentCoverImageClient,
  updateApartmentImageClient,
  uploadApartmentImageClient,
} from "@/lib/apartment/apartment-image-client";
import {
  APARTMENT_CLOSING_CHECKLIST,
  APARTMENT_PROGRESS_STEPS,
  APARTMENT_RENTAL_CHECKLIST,
  APARTMENT_ROOMS_SEED,
} from "@/lib/apartment/cicerostrasse-we28-data";
import { mergeStepStates } from "@/lib/apartment/apartment-utils";
import { loadApartmentStoreAction } from "@/stores/load-actions";
import { isStoreStale } from "@/stores/store-utils";
import type {
  ApartmentImage,
  ApartmentProgressStep,
  ApartmentRoom,
  ApartmentStepKind,
  ApartmentStepStatus,
} from "@/types/apartment";

type MutationResult = { ok: true } | { ok: false; message: string };

type StepPatch = {
  status: ApartmentStepStatus;
  date?: string | null;
  notes?: string | null;
};

type ApartmentStoreState = {
  images: ApartmentImage[];
  notes: string;
  progressSteps: ApartmentProgressStep[];
  closingSteps: ApartmentProgressStep[];
  rentalSteps: ApartmentProgressStep[];
  rooms: ApartmentRoom[];
  persistence: boolean;
  loadedAt: number | null;
  loading: boolean;
  error: string | null;
};

type ApartmentStoreActions = {
  ensureLoaded: () => Promise<void>;
  invalidate: () => void;
  reset: () => void;
  setStepState: (
    kind: ApartmentStepKind,
    stepKey: string,
    patch: StepPatch,
  ) => Promise<MutationResult>;
  saveNotes: (content: string) => Promise<MutationResult>;
  uploadImages: (files: File[]) => Promise<MutationResult>;
  updateImage: (
    id: string,
    patch: { title?: string; caption?: string | null },
  ) => Promise<MutationResult>;
  setCoverImage: (id: string) => Promise<MutationResult>;
  reorderImages: (orderedIds: string[]) => Promise<MutationResult>;
  deleteImage: (id: string) => Promise<MutationResult>;
  upsertRoom: (
    room: Omit<ApartmentRoom, "id" | "sortOrder"> & {
      id?: string;
      sortOrder?: number;
    },
  ) => Promise<MutationResult>;
  deleteRoom: (id: string) => Promise<MutationResult>;
};

export type ApartmentStore = ApartmentStoreState & ApartmentStoreActions;

const seedRooms = (): ApartmentRoom[] =>
  APARTMENT_ROOMS_SEED.map((room, index) => ({
    ...room,
    id: `seed-${index}`,
  }));

const initialState: ApartmentStoreState = {
  images: [],
  notes: "",
  progressSteps: APARTMENT_PROGRESS_STEPS,
  closingSteps: APARTMENT_CLOSING_CHECKLIST,
  rentalSteps: APARTMENT_RENTAL_CHECKLIST,
  rooms: seedRooms(),
  persistence: false,
  loadedAt: null,
  loading: false,
  error: null,
};

let loadPromise: Promise<void> | null = null;

const stateKeyByKind = {
  progress: "progressSteps",
  closing: "closingSteps",
  rental: "rentalSteps",
} as const;

function patchStep(
  steps: ApartmentProgressStep[],
  stepKey: string,
  patch: StepPatch,
): ApartmentProgressStep[] {
  return steps.map((step) =>
    step.id === stepKey
      ? {
          ...step,
          status: patch.status,
          date: patch.date === undefined ? step.date : (patch.date ?? undefined),
          notes:
            patch.notes === undefined ? step.notes : (patch.notes ?? undefined),
        }
      : step,
  );
}

/** True for images/rooms that only exist client-side (no Supabase row). */
function isLocalOnlyId(id: string): boolean {
  return id.startsWith("local-") || id.startsWith("seed-");
}

export const useApartmentStore = create<ApartmentStore>((set, get) => {
  /**
   * Seed rooms only exist client-side. Before the first persisted room
   * mutation, insert them all so a partial edit doesn't drop the rest of the
   * list on the next load. Returns a map from seed id to DB id.
   */
  async function materializeSeedRooms(): Promise<
    { ok: true; idMap: Map<string, string> } | { ok: false; message: string }
  > {
    const idMap = new Map<string, string>();
    const seeds = get().rooms.filter((room) => room.id.startsWith("seed-"));
    for (const seed of seeds) {
      const result = await upsertApartmentRoomAction({
        name: seed.name,
        areaM2: seed.areaM2,
        widthM: seed.widthM,
        lengthM: seed.lengthM,
        notes: seed.notes,
        sortOrder: seed.sortOrder,
      });
      if (!result.ok) {
        return result;
      }
      idMap.set(seed.id, result.id);
    }
    if (idMap.size > 0) {
      set((state) => ({
        rooms: state.rooms.map((room) =>
          idMap.has(room.id) ? { ...room, id: idMap.get(room.id)! } : room,
        ),
      }));
    }
    return { ok: true, idMap };
  }

  return {
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
        const result = await loadApartmentStoreAction();
        if (!result.ok) {
          set({
            loading: false,
            error: "Sign in to view the apartment dashboard.",
            loadedAt: hasCache ? get().loadedAt : null,
          });
          return;
        }
        const rooms = result.rooms.length > 0 ? result.rooms : seedRooms();
        set({
          images: result.images,
          notes: result.notes,
          progressSteps: mergeStepStates(
            APARTMENT_PROGRESS_STEPS,
            result.stepStates.filter((s) => s.kind === "progress"),
          ),
          closingSteps: mergeStepStates(
            APARTMENT_CLOSING_CHECKLIST,
            result.stepStates.filter((s) => s.kind === "closing"),
          ),
          rentalSteps: mergeStepStates(
            APARTMENT_RENTAL_CHECKLIST,
            result.stepStates.filter((s) => s.kind === "rental"),
          ),
          rooms,
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
              : "Could not load the apartment dashboard.",
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

  async setStepState(kind, stepKey, patch) {
    const key = stateKeyByKind[kind];
    const previous = get()[key];
    set({ [key]: patchStep(previous, stepKey, patch) } as Partial<ApartmentStoreState>);

    if (!get().persistence) {
      return { ok: true };
    }

    const result = await upsertApartmentStepStateAction({
      kind,
      stepKey,
      status: patch.status,
      date: patch.date,
      notes: patch.notes,
    });
    if (!result.ok) {
      set({ [key]: previous } as Partial<ApartmentStoreState>);
    }
    return result;
  },

  async saveNotes(content) {
    const previous = get().notes;
    set({ notes: content });

    if (!get().persistence) {
      return { ok: true };
    }

    const result = await saveApartmentNotesAction(content);
    if (!result.ok) {
      set({ notes: previous });
    }
    return result;
  },

  async uploadImages(files) {
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));
    if (imageFiles.length === 0) {
      return { ok: false, message: "No image files selected." };
    }

    if (!get().persistence) {
      // TODO: local-only fallback — object URLs are lost on reload. Real
      // persistence requires Supabase (apartment-images bucket).
      const startOrder = get().images.length;
      const localImages: ApartmentImage[] = imageFiles.map((file, index) => ({
        id: `local-${crypto.randomUUID()}`,
        storagePath: "",
        src: URL.createObjectURL(file),
        title: file.name.replace(/\.[^.]+$/, ""),
        isCover: get().images.length === 0 && index === 0,
        sortOrder: startOrder + index,
      }));
      set((state) => ({ images: [...state.images, ...localImages] }));
      return { ok: true };
    }

    const failures: string[] = [];
    for (const file of imageFiles) {
      const isFirstImage = get().images.length === 0;
      const result = await uploadApartmentImageClient({
        file,
        title: file.name.replace(/\.[^.]+$/, ""),
        sortOrder: get().images.length,
        isCover: isFirstImage,
      });
      if (result.ok) {
        set((state) => ({ images: [...state.images, result.image] }));
      } else {
        failures.push(result.message);
      }
    }

    if (failures.length > 0) {
      return { ok: false, message: failures[0] };
    }
    return { ok: true };
  },

  async updateImage(id, patch) {
    const previous = get().images;
    set({
      images: previous.map((image) =>
        image.id === id
          ? {
              ...image,
              title: patch.title ?? image.title,
              caption:
                patch.caption === undefined
                  ? image.caption
                  : (patch.caption ?? undefined),
            }
          : image,
      ),
    });

    if (!get().persistence || isLocalOnlyId(id)) {
      return { ok: true };
    }

    const result = await updateApartmentImageClient({ id, ...patch });
    if (!result.ok) {
      set({ images: previous });
    }
    return result;
  },

  async setCoverImage(id) {
    const previous = get().images;
    set({
      images: previous.map((image) => ({ ...image, isCover: image.id === id })),
    });

    if (!get().persistence || isLocalOnlyId(id)) {
      return { ok: true };
    }

    const result = await setApartmentCoverImageClient(id);
    if (!result.ok) {
      set({ images: previous });
    }
    return result;
  },

  async reorderImages(orderedIds) {
    const previous = get().images;
    const byId = new Map(previous.map((image) => [image.id, image]));
    const reordered = orderedIds
      .map((id, index) => {
        const image = byId.get(id);
        return image ? { ...image, sortOrder: index } : null;
      })
      .filter((image): image is ApartmentImage => image !== null);
    set({ images: reordered });

    if (!get().persistence) {
      return { ok: true };
    }

    const result = await reorderApartmentImagesClient(
      orderedIds.filter((id) => !isLocalOnlyId(id)),
    );
    if (!result.ok) {
      set({ images: previous });
    }
    return result;
  },

  async deleteImage(id) {
    const previous = get().images;
    const target = previous.find((image) => image.id === id);
    if (!target) {
      return { ok: false, message: "Image not found." };
    }
    set({ images: previous.filter((image) => image.id !== id) });

    if (!get().persistence || isLocalOnlyId(id)) {
      return { ok: true };
    }

    const result = await deleteApartmentImageClient({
      id,
      storagePath: target.storagePath,
    });
    if (!result.ok) {
      set({ images: previous });
    }
    return result;
  },

  async upsertRoom(room) {
    const snapshot = get().rooms;

    let targetId = room.id;
    if (get().persistence) {
      const materialized = await materializeSeedRooms();
      if (!materialized.ok) {
        return materialized;
      }
      if (targetId && materialized.idMap.has(targetId)) {
        targetId = materialized.idMap.get(targetId);
      }
    }

    const previous = get().rooms;
    const isExisting = targetId !== undefined;
    const localId = targetId ?? `local-${crypto.randomUUID()}`;
    const sortOrder =
      room.sortOrder ??
      (isExisting
        ? (previous.find((r) => r.id === targetId)?.sortOrder ?? previous.length)
        : previous.length);

    const nextRoom: ApartmentRoom = {
      id: localId,
      name: room.name,
      areaM2: room.areaM2,
      widthM: room.widthM,
      lengthM: room.lengthM,
      notes: room.notes,
      sortOrder,
      isApproximate: true,
    };

    set({
      rooms: isExisting
        ? previous.map((r) => (r.id === targetId ? nextRoom : r))
        : [...previous, nextRoom],
    });

    if (!get().persistence) {
      return { ok: true };
    }

    const result = await upsertApartmentRoomAction({
      id: isExisting && !isLocalOnlyId(localId) ? localId : undefined,
      name: room.name,
      areaM2: room.areaM2,
      widthM: room.widthM,
      lengthM: room.lengthM,
      notes: room.notes,
      sortOrder,
    });

    if (!result.ok) {
      set({ rooms: snapshot });
      return result;
    }

    if (result.id !== localId) {
      set((state) => ({
        rooms: state.rooms.map((r) =>
          r.id === localId ? { ...r, id: result.id } : r,
        ),
      }));
    }
    return { ok: true };
  },

  async deleteRoom(id) {
    const snapshot = get().rooms;

    let targetId = id;
    if (get().persistence && !id.startsWith("local-")) {
      const materialized = await materializeSeedRooms();
      if (!materialized.ok) {
        return materialized;
      }
      if (materialized.idMap.has(id)) {
        targetId = materialized.idMap.get(id)!;
      }
    }

    set((state) => ({
      rooms: state.rooms.filter((room) => room.id !== targetId),
    }));

    if (!get().persistence || isLocalOnlyId(targetId)) {
      return { ok: true };
    }

    const result = await deleteApartmentRoomAction(targetId);
    if (!result.ok) {
      set({ rooms: snapshot });
    }
    return result;
  },
  };
});

export function selectApartmentReady(state: ApartmentStore): boolean {
  return state.loadedAt !== null;
}

/** Slideshow order: cover first, then by sortOrder. */
export function selectOrderedImages(state: ApartmentStore): ApartmentImage[] {
  return [...state.images].sort((a, b) => {
    if (Boolean(a.isCover) !== Boolean(b.isCover)) {
      return a.isCover ? -1 : 1;
    }
    return a.sortOrder - b.sortOrder;
  });
}
