"use client";

import { useMemo, useState } from "react";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";

import {
  LabelColorBulletButton,
  LabelColorPicker,
} from "@/components/notes/label-color-picker";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { Note, NoteLabel, NoteLabelColor } from "@/types/notes";

function LabelRow({
  label,
  noteCount,
  editing,
  editName,
  onEditNameChange,
  onStartEdit,
  onConfirmEdit,
  onCancelEdit,
  onColorChange,
  onDelete,
}: {
  label: NoteLabel;
  noteCount: number;
  editing: boolean;
  editName: string;
  onEditNameChange: (name: string) => void;
  onStartEdit: () => void;
  onConfirmEdit: () => void;
  onCancelEdit: () => void;
  onColorChange: (color: NoteLabelColor) => void;
  onDelete: () => void;
}) {
  if (editing) {
    return (
      <div className="flex items-center gap-2 py-2">
        <LabelColorBulletButton
          color={label.color}
          onColorChange={onColorChange}
          aria-label={`Color for ${label.name}`}
        />
        <Input
          value={editName}
          onChange={(event) => onEditNameChange(event.target.value)}
          className="h-9 flex-1"
          autoFocus
          onKeyDown={(event) => {
            if (event.key === "Enter") onConfirmEdit();
            if (event.key === "Escape") onCancelEdit();
          }}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Save label name"
          onClick={onConfirmEdit}
        >
          <Check className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Cancel editing"
          onClick={onCancelEdit}
        >
          <X className="size-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 py-2">
      <LabelColorBulletButton
        color={label.color}
        onColorChange={onColorChange}
        aria-label={`Color for ${label.name}`}
      />
      <div className="min-w-0 flex-1">
        <span className="text-sm font-medium">{label.name}</span>
        <span className="text-muted-foreground ml-2 text-sm tabular-nums">
          {noteCount}
        </span>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={`Edit ${label.name}`}
        onClick={onStartEdit}
      >
        <Pencil className="size-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="text-destructive hover:text-destructive"
        aria-label={`Delete ${label.name}`}
        onClick={onDelete}
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}

export function EditLabelsDialog({
  open,
  onOpenChange,
  labels,
  notes,
  onCreate,
  onUpdate,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  labels: NoteLabel[];
  notes: Note[];
  onCreate: (name: string, color: NoteLabelColor) => void;
  onUpdate: (
    id: string,
    patch: Partial<Pick<NoteLabel, "name" | "color">>,
  ) => void;
  onDelete: (id: string) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState<NoteLabelColor>("red");

  const countsByLabelId = useMemo(() => {
    const map = new Map<string, number>();
    for (const label of labels) {
      map.set(label.id, 0);
    }
    for (const note of notes) {
      for (const labelId of note.labelIds) {
        map.set(labelId, (map.get(labelId) ?? 0) + 1);
      }
    }
    return map;
  }, [labels, notes]);

  function startEdit(label: NoteLabel) {
    setEditingId(label.id);
    setEditName(label.name);
  }

  function confirmEdit(labelId: string) {
    const name = editName.trim();
    if (name) onUpdate(labelId, { name });
    setEditingId(null);
    setEditName("");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName("");
  }

  function handleAddLabel() {
    const name = newName.trim();
    if (!name) return;
    onCreate(name, newColor);
    setNewName("");
    setNewColor("red");
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      cancelEdit();
    }
    onOpenChange(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
        <DialogHeader className="border-b border-border px-6 py-4">
          <DialogTitle>Edit Labels</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[min(60vh,420px)] px-6">
          <div className="divide-y divide-border">
            {labels.length === 0 ? (
              <p className="text-muted-foreground py-6 text-sm">
                No labels yet. Add one below.
              </p>
            ) : (
              labels.map((label) => (
                <LabelRow
                  key={label.id}
                  label={label}
                  noteCount={countsByLabelId.get(label.id) ?? 0}
                  editing={editingId === label.id}
                  editName={editName}
                  onEditNameChange={setEditName}
                  onStartEdit={() => startEdit(label)}
                  onConfirmEdit={() => confirmEdit(label.id)}
                  onCancelEdit={cancelEdit}
                  onColorChange={(color) => onUpdate(label.id, { color })}
                  onDelete={() => onDelete(label.id)}
                />
              ))
            )}
          </div>
        </ScrollArea>

        <Separator />

        <div className="space-y-3 px-6 py-4">
          <p className="text-sm font-medium">Add New Label</p>
          <div className="flex items-center gap-2">
            <LabelColorBulletButton
              color={newColor}
              onColorChange={setNewColor}
              aria-label="Color for new label"
            />
            <Input
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              placeholder="New label name"
              className="h-10 min-w-0 flex-1"
              onKeyDown={(event) => {
                if (event.key === "Enter") handleAddLabel();
              }}
            />
            <Button
              type="button"
              size="icon"
              className={cn(
                "size-10 shrink-0 bg-white text-black hover:bg-white/90",
              )}
              aria-label="Add label"
              onClick={handleAddLabel}
              disabled={!newName.trim()}
            >
              <Plus className="size-5" />
            </Button>
          </div>
          <div className="space-y-2">
            <p className="text-muted-foreground text-xs">Select color</p>
            <LabelColorPicker value={newColor} onChange={setNewColor} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
