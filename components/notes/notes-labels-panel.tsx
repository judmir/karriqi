"use client";

import { useState } from "react";
import { Plus, Tag, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { labelDotClass } from "@/lib/notes/label-styles";
import { cn } from "@/lib/utils";
import { NOTE_LABEL_COLORS, type NoteLabel, type NoteLabelColor } from "@/types/notes";

export function NotesLabelsPanel({
  labels,
  onCreate,
  onUpdate,
  onDelete,
}: {
  labels: NoteLabel[];
  onCreate: (name: string, color: NoteLabelColor) => void;
  onUpdate: (id: string, patch: Partial<Pick<NoteLabel, "name" | "color">>) => void;
  onDelete: (id: string) => void;
}) {
  const [draftName, setDraftName] = useState("");
  const [draftColor, setDraftColor] = useState<NoteLabelColor>("blue");

  function handleAdd() {
    const name = draftName.trim();
    if (!name) return;
    onCreate(name, draftColor);
    setDraftName("");
  }

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-xs">
        Create, rename, or remove labels. Deleting a label removes it from all notes.
      </p>
      <div className="space-y-2">
        {labels.map((label) => (
          <div
            key={label.id}
            className="flex items-center gap-2 rounded-lg border bg-card p-2"
          >
            <Tag className="text-muted-foreground size-4 shrink-0" />
            <Input
              value={label.name}
              onChange={(event) =>
                onUpdate(label.id, { name: event.target.value })
              }
              className="h-8 flex-1"
            />
            <div className="flex shrink-0 gap-1">
              {NOTE_LABEL_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  aria-label={`Set color ${color}`}
                  className={cn(
                    "size-5 rounded-full ring-offset-2 transition",
                    labelDotClass[color],
                    label.color === color
                      ? "ring-primary ring-2"
                      : "opacity-60 hover:opacity-100",
                  )}
                  onClick={() => onUpdate(label.id, { color })}
                />
              ))}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => onDelete(label.id)}
              aria-label={`Delete ${label.name}`}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
      </div>
      <div className="space-y-2 rounded-lg border border-dashed p-3">
        <p className="text-sm font-medium">New label</p>
        <Input
          value={draftName}
          onChange={(event) => setDraftName(event.target.value)}
          placeholder="Label name"
          onKeyDown={(event) => {
            if (event.key === "Enter") handleAdd();
          }}
        />
        <div className="flex flex-wrap gap-1.5">
          {NOTE_LABEL_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              aria-label={`New label color ${color}`}
              className={cn(
                "size-6 rounded-full ring-offset-2",
                labelDotClass[color],
                draftColor === color
                  ? "ring-primary ring-2"
                  : "opacity-60 hover:opacity-100",
              )}
              onClick={() => setDraftColor(color)}
            />
          ))}
        </div>
        <Button type="button" size="sm" className="w-full" onClick={handleAdd}>
          <Plus className="size-4" />
          Add label
        </Button>
      </div>
    </div>
  );
}
