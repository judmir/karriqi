import type { Note, NotesView } from "@/types/notes";

export type FilterNotesInput = {
  notes: Note[];
  view: NotesView;
  searchQuery: string;
  labelId: string | null;
};

export function filterNotes({
  notes,
  view,
  searchQuery,
  labelId,
}: FilterNotesInput): Note[] {
  const query = searchQuery.trim().toLowerCase();

  let result = notes.filter((note) => {
    if (view === "archive") return note.archived;
    if (view === "notes") return !note.archived;
    return !note.archived;
  });

  if (labelId) {
    result = result.filter((note) => note.labelIds.includes(labelId));
  }

  if (query) {
    result = result.filter((note) => {
      const haystack = `${note.title}\n${note.content}`.toLowerCase();
      return haystack.includes(query);
    });
  }

  return [...result].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return b.updatedAt.localeCompare(a.updatedAt);
  });
}

export function notePreview(content: string, maxLength = 160): string {
  const singleLine = content.replace(/\s+/g, " ").trim();
  if (singleLine.length <= maxLength) return singleLine;
  return `${singleLine.slice(0, maxLength).trimEnd()}…`;
}
