"use client";

import { Archive, StickyNote, Tags } from "lucide-react";

import { NotesLabelsPanel } from "@/components/notes/notes-labels-panel";
import { ScrollArea } from "@/components/ui/scroll-area";
import { labelDotClass } from "@/lib/notes/label-styles";
import { cn } from "@/lib/utils";
import type { NoteLabel, NoteLabelColor, NotesView } from "@/types/notes";

const NAV_ITEMS: {
  view: NotesView;
  label: string;
  icon: typeof StickyNote;
}[] = [
  { view: "notes", label: "Notes", icon: StickyNote },
  { view: "archive", label: "Archive", icon: Archive },
  { view: "labels", label: "Edit Labels", icon: Tags },
];

export function NotesSidebar({
  view,
  onViewChange,
  labels,
  selectedLabelId,
  onSelectLabel,
  onCreateLabel,
  onUpdateLabel,
  onDeleteLabel,
}: {
  view: NotesView;
  onViewChange: (view: NotesView) => void;
  labels: NoteLabel[];
  selectedLabelId: string | null;
  onSelectLabel: (labelId: string | null) => void;
  onCreateLabel: (name: string, color: NoteLabelColor) => void;
  onUpdateLabel: (
    id: string,
    patch: Partial<Pick<NoteLabel, "name" | "color">>,
  ) => void;
  onDeleteLabel: (id: string) => void;
}) {
  const editingLabels = view === "labels";

  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-border md:w-56 md:border-r md:border-b-0 lg:w-60">
      <nav className="flex flex-row gap-1 p-3 md:flex-col md:gap-0.5 md:p-4">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = view === item.view;
          return (
            <button
              key={item.view}
              type="button"
              onClick={() => onViewChange(item.view)}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition md:flex-none md:justify-start",
                active
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
              )}
            >
              <Icon className="size-4 shrink-0" />
              <span className="hidden sm:inline md:inline">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <ScrollArea className="min-h-0 flex-1 px-4 pb-4">
        {editingLabels ? (
          <NotesLabelsPanel
            labels={labels}
            onCreate={onCreateLabel}
            onUpdate={onUpdateLabel}
            onDelete={onDeleteLabel}
          />
        ) : (
          <div className="space-y-1">
            <p className="text-muted-foreground mb-2 px-2 text-xs font-medium">
              Labels
            </p>
            {labels.map((label) => (
              <button
                key={label.id}
                type="button"
                onClick={() =>
                  onSelectLabel(
                    selectedLabelId === label.id ? null : label.id,
                  )
                }
                className={cn(
                  "hover:bg-muted flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm transition",
                  selectedLabelId === label.id && "bg-muted font-medium",
                )}
              >
                <span
                  className={cn(
                    "size-2.5 shrink-0 rounded-full",
                    labelDotClass[label.color],
                  )}
                  aria-hidden
                />
                {label.name}
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </aside>
  );
}
