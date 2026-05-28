"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import { DEFAULT_NOTE_LABELS, DEFAULT_NOTES } from "@/lib/notes/seed-data";
import type { Note, NoteDraft, NoteLabel, NoteLabelColor, NotesView } from "@/types/notes";

type NotesStoreState = {
  notes: Note[];
  labels: NoteLabel[];
  view: NotesView;
  selectedLabelId: string | null;
  searchQuery: string;
  hydrated: boolean;
};

type NotesStoreActions = {
  setHydrated: () => void;
  setView: (view: NotesView) => void;
  setSelectedLabelId: (labelId: string | null) => void;
  setSearchQuery: (query: string) => void;
  createNote: (draft: NoteDraft) => string;
  updateNote: (id: string, draft: NoteDraft) => void;
  deleteNote: (id: string) => void;
  toggleArchive: (id: string) => void;
  togglePin: (id: string) => void;
  createLabel: (name: string, color: NoteLabelColor) => string;
  updateLabel: (id: string, patch: Partial<Pick<NoteLabel, "name" | "color">>) => void;
  deleteLabel: (id: string) => void;
  reset: () => void;
};

export type NotesStore = NotesStoreState & NotesStoreActions;

function newId(prefix: string): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const initialState: NotesStoreState = {
  notes: DEFAULT_NOTES,
  labels: DEFAULT_NOTE_LABELS,
  view: "notes",
  selectedLabelId: null,
  searchQuery: "",
  hydrated: false,
};

export const useNotesStore = create<NotesStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setHydrated() {
        set({ hydrated: true });
      },

      setView(view) {
        set({
          view,
          selectedLabelId: view === "labels" ? get().selectedLabelId : get().selectedLabelId,
        });
      },

      setSelectedLabelId(labelId) {
        set({ selectedLabelId: labelId });
      },

      setSearchQuery(query) {
        set({ searchQuery: query });
      },

      createNote(draft) {
        const id = newId("note");
        const timestamp = new Date().toISOString();
        const note: Note = {
          id,
          title: draft.title.trim() || "Untitled",
          content: draft.content,
          labelIds: draft.labelIds,
          archived: false,
          pinned: false,
          createdAt: timestamp,
          updatedAt: timestamp,
        };
        set((state) => ({ notes: [note, ...state.notes] }));
        return id;
      },

      updateNote(id, draft) {
        const timestamp = new Date().toISOString();
        set((state) => ({
          notes: state.notes.map((note) =>
            note.id === id
              ? {
                  ...note,
                  title: draft.title.trim() || "Untitled",
                  content: draft.content,
                  labelIds: draft.labelIds,
                  updatedAt: timestamp,
                }
              : note,
          ),
        }));
      },

      deleteNote(id) {
        set((state) => ({
          notes: state.notes.filter((note) => note.id !== id),
        }));
      },

      toggleArchive(id) {
        const timestamp = new Date().toISOString();
        set((state) => ({
          notes: state.notes.map((note) =>
            note.id === id
              ? { ...note, archived: !note.archived, updatedAt: timestamp }
              : note,
          ),
          selectedLabelId: get().selectedLabelId,
        }));
      },

      togglePin(id) {
        const timestamp = new Date().toISOString();
        set((state) => ({
          notes: state.notes.map((note) =>
            note.id === id
              ? { ...note, pinned: !note.pinned, updatedAt: timestamp }
              : note,
          ),
        }));
      },

      createLabel(name, color) {
        const id = newId("label");
        const label: NoteLabel = { id, name: name.trim() || "Label", color };
        set((state) => ({ labels: [...state.labels, label] }));
        return id;
      },

      updateLabel(id, patch) {
        set((state) => ({
          labels: state.labels.map((label) =>
            label.id === id ? { ...label, ...patch } : label,
          ),
        }));
      },

      deleteLabel(id) {
        set((state) => ({
          labels: state.labels.filter((label) => label.id !== id),
          notes: state.notes.map((note) => ({
            ...note,
            labelIds: note.labelIds.filter((labelId) => labelId !== id),
          })),
          selectedLabelId:
            state.selectedLabelId === id ? null : state.selectedLabelId,
        }));
      },

      reset() {
        set({ ...initialState, hydrated: true });
      },
    }),
    {
      name: "karriqi-notes-v1",
      partialize: (state) => ({
        notes: state.notes,
        labels: state.labels,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    },
  ),
);
