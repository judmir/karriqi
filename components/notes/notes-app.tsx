"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Plus, StickyNote } from "lucide-react";

import { NoteCard } from "@/components/notes/note-card";
import { NoteEditorDialog } from "@/components/notes/note-editor-dialog";
import { NotesSidebar } from "@/components/notes/notes-sidebar";
import { Button } from "@/components/ui/button";
import { filterNotes } from "@/lib/notes/filter-notes";
import { useNotesStore } from "@/stores/notes-store";
import type { Note, NoteDraft } from "@/types/notes";

export function NotesApp() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const hydrated = useNotesStore((s) => s.hydrated);
  const setHydrated = useNotesStore((s) => s.setHydrated);
  const notes = useNotesStore((s) => s.notes);
  const labels = useNotesStore((s) => s.labels);
  const view = useNotesStore((s) => s.view);
  const setView = useNotesStore((s) => s.setView);
  const selectedLabelId = useNotesStore((s) => s.selectedLabelId);
  const setSelectedLabelId = useNotesStore((s) => s.setSelectedLabelId);
  const searchQuery = useNotesStore((s) => s.searchQuery);
  const setSearchQuery = useNotesStore((s) => s.setSearchQuery);
  const createNote = useNotesStore((s) => s.createNote);
  const updateNote = useNotesStore((s) => s.updateNote);
  const deleteNote = useNotesStore((s) => s.deleteNote);
  const toggleArchive = useNotesStore((s) => s.toggleArchive);
  const togglePin = useNotesStore((s) => s.togglePin);
  const createLabel = useNotesStore((s) => s.createLabel);
  const updateLabel = useNotesStore((s) => s.updateLabel);
  const deleteLabel = useNotesStore((s) => s.deleteLabel);

  const [editorOpen, setEditorOpen] = useState(false);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);

  const activeNote = useMemo(
    () => notes.find((note) => note.id === activeNoteId) ?? null,
    [notes, activeNoteId],
  );

  const filteredNotes = useMemo(
    () =>
      filterNotes({
        notes,
        view: view === "labels" ? "notes" : view,
        searchQuery,
        labelId: selectedLabelId,
      }),
    [notes, view, searchQuery, selectedLabelId],
  );

  const syncSearchToUrl = useCallback(
    (query: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (query.trim()) {
        params.set("title", query.trim());
      } else {
        params.delete("title");
      }
      const next = params.toString();
      router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    if (!hydrated) {
      setHydrated();
    }
  }, [hydrated, setHydrated]);

  useEffect(() => {
    const titleParam = searchParams.get("title") ?? "";
    if (titleParam !== searchQuery) {
      setSearchQuery(titleParam);
    }
    // Only sync URL → store when the query string changes (e.g. back/forward).
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: avoid fighting with handleSearchChange
  }, [searchParams]);

  function handleSearchChange(query: string) {
    setSearchQuery(query);
    syncSearchToUrl(query);
  }

  function openNewNote() {
    setActiveNoteId(null);
    setEditorOpen(true);
  }

  function openNote(note: Note) {
    setActiveNoteId(note.id);
    setEditorOpen(true);
  }

  function handleSave(draft: NoteDraft) {
    if (activeNote) {
      updateNote(activeNote.id, draft);
      return;
    }
    const id = createNote(draft);
    setActiveNoteId(id);
  }

  const emptyTitle =
    view === "archive"
      ? "No archived notes"
      : searchQuery.trim()
        ? "No notes match your search"
        : selectedLabelId
          ? "No notes with this label"
          : "No notes yet";

  if (!hydrated) {
    return (
      <div className="animate-pulse space-y-4 p-4 md:p-6" role="status" aria-label="Loading notes">
        <div className="bg-muted h-8 w-32 rounded-lg" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="bg-muted h-40 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100dvh-4rem)] flex-col md:min-h-[calc(100dvh-3.5rem)] md:flex-row">
      <NotesSidebar
        view={view}
        onViewChange={setView}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        labels={labels}
        selectedLabelId={selectedLabelId}
        onSelectLabel={setSelectedLabelId}
        onCreateLabel={createLabel}
        onUpdateLabel={updateLabel}
        onDeleteLabel={deleteLabel}
      />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-4 md:px-6">
          <div className="space-y-0.5">
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              Notes
            </h1>
            <p className="text-muted-foreground text-sm">
              {view === "archive"
                ? "Archived notes"
                : view === "labels"
                  ? "Pick a note or switch to Notes"
                  : "Capture ideas, lists, and places to revisit"}
            </p>
          </div>
          <Button type="button" onClick={openNewNote}>
            <Plus className="size-4" />
            Add Note
          </Button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {view === "labels" ? (
            <div className="text-muted-foreground flex flex-col items-center justify-center gap-3 py-16 text-center">
              <StickyNote className="size-10 opacity-40" />
              <p className="max-w-sm text-sm">
                Label editing is in the sidebar. Switch to{" "}
                <button
                  type="button"
                  className="text-foreground font-medium underline underline-offset-2"
                  onClick={() => setView("notes")}
                >
                  Notes
                </button>{" "}
                to browse and search your cards.
              </p>
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="text-muted-foreground flex flex-col items-center justify-center gap-3 py-16 text-center">
              <StickyNote className="size-10 opacity-40" />
              <p className="text-sm">{emptyTitle}</p>
              {view === "notes" ? (
                <Button type="button" variant="outline" onClick={openNewNote}>
                  <Plus className="size-4" />
                  Add your first note
                </Button>
              ) : null}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {filteredNotes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  labels={labels}
                  onOpen={() => openNote(note)}
                  onArchive={() => toggleArchive(note.id)}
                  onDelete={() => deleteNote(note.id)}
                  onTogglePin={() => togglePin(note.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <NoteEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        note={activeNote}
        labels={labels}
        onSave={handleSave}
        onDelete={
          activeNote
            ? () => {
                deleteNote(activeNote.id);
                setActiveNoteId(null);
              }
            : undefined
        }
        onArchive={
          activeNote ? () => toggleArchive(activeNote.id) : undefined
        }
        onTogglePin={
          activeNote ? () => togglePin(activeNote.id) : undefined
        }
      />
    </div>
  );
}
