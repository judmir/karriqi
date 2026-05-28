"use client";

import { NoteCardBody } from "@/components/notes/note-card-body";
import { NoteLabelBadge } from "@/components/notes/note-label-badge";
import { cn } from "@/lib/utils";
import type { Note, NoteLabel } from "@/types/notes";

export function NoteCard({
  note,
  labels,
  onOpen,
  onToggleChecklistLine,
}: {
  note: Note;
  labels: NoteLabel[];
  onOpen: () => void;
  onToggleChecklistLine?: (lineIndex: number) => void;
}) {
  const noteLabels = labels.filter((label) => note.labelIds.includes(label.id));

  return (
    <article
      className={cn(
        "group bg-card break-inside-avoid rounded-xl border border-border p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5",
        note.pinned && "ring-primary/25 ring-1",
      )}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen();
        }
      }}
      role="button"
      tabIndex={0}
    >
      <NoteCardBody
        title={note.title}
        content={note.content}
        imageUrl={note.imageUrl}
        onToggleChecklistLine={onToggleChecklistLine}
      />
      {noteLabels.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {noteLabels.map((label) => (
            <NoteLabelBadge key={label.id} label={label} />
          ))}
        </div>
      ) : null}
    </article>
  );
}
