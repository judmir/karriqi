"use client";

import { Search } from "lucide-react";

import { NotesLabelsPanel } from "@/components/notes/notes-labels-panel";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { labelDotClass } from "@/lib/notes/label-styles";
import { cn } from "@/lib/utils";
import type { NoteLabel, NoteLabelColor, NotesView } from "@/types/notes";

export function NotesSidebar({
  view,
  onViewChange,
  searchQuery,
  onSearchChange,
  labels,
  selectedLabelId,
  onSelectLabel,
  onCreateLabel,
  onUpdateLabel,
  onDeleteLabel,
}: {
  view: NotesView;
  onViewChange: (view: NotesView) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
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
    <aside className="flex w-full shrink-0 flex-col border-b md:w-64 md:border-r md:border-b-0 lg:w-72">
      <div className="space-y-4 p-4">
        <div className="relative">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search notes…"
            className="pl-8"
            aria-label="Search notes"
          />
        </div>

        <Tabs
          value={view}
          onValueChange={(value) => onViewChange(value as NotesView)}
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="notes">Notes</TabsTrigger>
            <TabsTrigger value="archive">Archive</TabsTrigger>
            <TabsTrigger value="labels">Edit Labels</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <ScrollArea className="min-h-0 flex-1 px-4 pb-4">
        {editingLabels ? (
          <NotesLabelsPanel
            labels={labels}
            onCreate={onCreateLabel}
            onUpdate={onUpdateLabel}
            onDelete={onDeleteLabel}
          />
        ) : (
          <div className="space-y-2">
            <p className="text-muted-foreground px-1 text-xs font-medium tracking-wide uppercase">
              Labels
            </p>
            <button
              type="button"
              onClick={() => onSelectLabel(null)}
              className={cn(
                "hover:bg-muted flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition",
                selectedLabelId === null && "bg-muted font-medium",
              )}
            >
              All notes
            </button>
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
                  "hover:bg-muted flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition",
                  selectedLabelId === label.id && "bg-muted font-medium",
                )}
              >
                <span
                  className={cn("size-2.5 shrink-0 rounded-full", labelDotClass[label.color])}
                  aria-hidden
                />
                {label.name}
              </button>
            ))}
            {labels.length === 0 ? (
              <p className="text-muted-foreground px-2 text-sm">
                No labels yet. Use Edit Labels to add some.
              </p>
            ) : null}
          </div>
        )}
      </ScrollArea>
    </aside>
  );
}
