"use client";

import {
  Archive,
  ArchiveRestore,
  MoreHorizontal,
  Pin,
  PinOff,
  Trash2,
} from "lucide-react";

import { NoteLabelBadge } from "@/components/notes/note-label-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { notePreview } from "@/lib/notes/filter-notes";
import { cn } from "@/lib/utils";
import type { Note, NoteLabel } from "@/types/notes";

export function NoteCard({
  note,
  labels,
  onOpen,
  onArchive,
  onDelete,
  onTogglePin,
}: {
  note: Note;
  labels: NoteLabel[];
  onOpen: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onTogglePin: () => void;
}) {
  const noteLabels = labels.filter((label) => note.labelIds.includes(label.id));

  return (
    <Card
      size="sm"
      className={cn(
        "group relative cursor-pointer transition-shadow hover:shadow-md",
        note.pinned && "ring-primary/30 ring-2",
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
      <CardHeader className="gap-2 pb-0">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="line-clamp-2 pr-8">{note.title}</CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="absolute top-3 right-3 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 data-popup-open:opacity-100"
                  onClick={(event) => event.stopPropagation()}
                />
              }
            >
              <MoreHorizontal className="size-4" />
              <span className="sr-only">Note actions</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={onTogglePin}>
                {note.pinned ? (
                  <>
                    <PinOff className="size-4" />
                    Unpin
                  </>
                ) : (
                  <>
                    <Pin className="size-4" />
                    Pin
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onArchive}>
                {note.archived ? (
                  <>
                    <ArchiveRestore className="size-4" />
                    Unarchive
                  </>
                ) : (
                  <>
                    <Archive className="size-4" />
                    Archive
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={onDelete}>
                <Trash2 className="size-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {note.content.trim() ? (
          <p className="text-muted-foreground line-clamp-4 text-sm whitespace-pre-wrap">
            {notePreview(note.content, 220)}
          </p>
        ) : null}
        {noteLabels.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {noteLabels.map((label) => (
              <NoteLabelBadge key={label.id} label={label} />
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
