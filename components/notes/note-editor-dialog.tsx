"use client";

import { useState } from "react";
import { Archive, Pin, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { NoteLabelBadge } from "@/components/notes/note-label-badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Note, NoteDraft, NoteLabel } from "@/types/notes";

type NoteEditorDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note: Note | null;
  labels: NoteLabel[];
  onSave: (draft: NoteDraft) => void;
  onDelete?: () => void;
  onArchive?: () => void;
  onTogglePin?: () => void;
};

function NoteEditorForm({
  note,
  labels,
  onSave,
  onClose,
  onDelete,
  onArchive,
  onTogglePin,
}: {
  note: Note | null;
  labels: NoteLabel[];
  onSave: (draft: NoteDraft) => void;
  onClose: () => void;
  onDelete?: () => void;
  onArchive?: () => void;
  onTogglePin?: () => void;
}) {
  const [title, setTitle] = useState(note?.title ?? "");
  const [content, setContent] = useState(note?.content ?? "");
  const [labelIds, setLabelIds] = useState<string[]>(note?.labelIds ?? []);

  function toggleLabel(id: string) {
    setLabelIds((current) =>
      current.includes(id)
        ? current.filter((labelId) => labelId !== id)
        : [...current, id],
    );
  }

  function handleSave() {
    onSave({ title, content, labelIds });
    onClose();
    toast.success(note ? "Note updated" : "Note created");
  }

  return (
    <>
      <div className="space-y-4 px-6 py-4">
        <div className="space-y-2">
          <Label htmlFor="note-title">Title</Label>
          <Input
            id="note-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Note title"
            autoFocus
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="note-content">Content</Label>
          <Textarea
            id="note-content"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Write your note…"
            className="min-h-40 resize-y"
          />
        </div>
        {labels.length > 0 ? (
          <div className="space-y-2">
            <Label>Labels</Label>
            <div className="flex flex-wrap gap-2">
              {labels.map((label) => {
                const checked = labelIds.includes(label.id);
                return (
                  <label
                    key={label.id}
                    className="hover:bg-muted/60 flex cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-1.5 text-sm"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => toggleLabel(label.id)}
                    />
                    <NoteLabelBadge label={label} />
                  </label>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
      <DialogFooter className="border-t px-6 py-4 sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {note && onTogglePin ? (
            <Button type="button" variant="outline" size="sm" onClick={onTogglePin}>
              <Pin className="size-4" />
              {note.pinned ? "Unpin" : "Pin"}
            </Button>
          ) : null}
          {note && onArchive ? (
            <Button type="button" variant="outline" size="sm" onClick={onArchive}>
              <Archive className="size-4" />
              {note.archived ? "Unarchive" : "Archive"}
            </Button>
          ) : null}
          {note && onDelete ? (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => {
                onDelete();
                onClose();
                toast.success("Note deleted");
              }}
            >
              <Trash2 className="size-4" />
              Delete
            </Button>
          ) : null}
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave}>
            Save
          </Button>
        </div>
      </DialogFooter>
    </>
  );
}

export function NoteEditorDialog({
  open,
  onOpenChange,
  note,
  labels,
  onSave,
  onDelete,
  onArchive,
  onTogglePin,
}: NoteEditorDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 p-0 sm:max-w-xl">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle>{note ? "Edit note" : "New note"}</DialogTitle>
        </DialogHeader>
        {open ? (
          <NoteEditorForm
            key={note?.id ?? "new"}
            note={note}
            labels={labels}
            onSave={onSave}
            onClose={() => onOpenChange(false)}
            onDelete={onDelete}
            onArchive={onArchive}
            onTogglePin={onTogglePin}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
