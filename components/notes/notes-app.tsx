"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Plus, StickyNote } from "lucide-react";

import { NoteCard } from "@/components/notes/note-card";
import { NoteEditorDialog } from "@/components/notes/note-editor-dialog";
import { NotesSidebar } from "@/components/notes/notes-sidebar";
import { NotesToolbar } from "@/components/notes/notes-toolbar";
import { Button } from "@/components/ui/button";
import { toggleChecklistLine } from "@/lib/notes/checklist";
import { filterNotes } from "@/lib/notes/filter-notes";
import { cn } from "@/lib/utils";
import { useNotesStore } from "@/stores/notes-store";
import type { Note, NoteDraft, NotesLayoutMode } from "@/types/notes";

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
  const updateNoteContent = useNotesStore((s) => s.updateNoteContent);
  const deleteNote = useNotesStore((s) => s.deleteNote);
  const toggleArchive = useNotesStore((s) => s.toggleArchive);
  const createLabel = useNotesStore((s) => s.createLabel);
  const updateLabel = useNotesStore((s) => s.updateLabel);
  const deleteLabel = useNotesStore((s) => s.deleteLabel);

  const [layoutMode, setLayoutMode] = useState<NotesLayoutMode>("grid");
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync URL → store only
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

  function handleToggleChecklist(noteId: string, lineIndex: number) {
    const note = notes.find((n) => n.id === noteId);
    if (!note) return;
    updateNoteContent(noteId, toggleChecklistLine(note.content, lineIndex));
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
      <div className="animate-pulse p-4 md:p-6" role="status" aria-label="Loading notes">
        <div className="bg-muted mb-4 h-10 max-w-md rounded-lg" />
        <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="bg-muted mb-4 h-48 break-inside-avoid rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100dvh-4rem)] flex-col md:min-h-[calc(100dvh-3.5rem)] md:flex-row">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <NotesToolbar
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          layoutMode={layoutMode}
          onLayoutModeChange={setLayoutMode}
          onAddNote={openNewNote}
        />

        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          <NotesSidebar
            view={view}
            onViewChange={setView}
            labels={labels}
            selectedLabelId={selectedLabelId}
            onSelectLabel={setSelectedLabelId}
            onCreateLabel={createLabel}
            onUpdateLabel={updateLabel}
            onDeleteLabel={deleteLabel}
          />

          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            {view === "labels" ? (
              <div className="text-muted-foreground flex flex-col items-center justify-center gap-3 py-16 text-center">
                <StickyNote className="size-10 opacity-40" />
                <p className="max-w-sm text-sm">
                  Manage labels in the sidebar, then open{" "}
                  <button
                    type="button"
                    className="text-foreground font-medium underline underline-offset-2"
                    onClick={() => setView("notes")}
                  >
                    Notes
                  </button>{" "}
                  to see your cards.
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
              <div
                className={cn(
                  layoutMode === "grid"
                    ? "columns-1 gap-4 sm:columns-2 xl:columns-3 2xl:columns-4 [&>*]:mb-4"
                    : "mx-auto flex max-w-3xl flex-col gap-4",
                )}
              >
                {filteredNotes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    labels={labels}
                    onOpen={() => openNote(note)}
                    onToggleChecklistLine={(lineIndex) =>
                      handleToggleChecklist(note.id, lineIndex)
                    }
                  />
                ))}
              </div>
            )}
          </div>
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
      />
    </div>
  );
}
