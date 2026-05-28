"use client";

import { LayoutGrid, List, Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { NotesLayoutMode } from "@/types/notes";

export function NotesToolbar({
  searchQuery,
  onSearchChange,
  layoutMode,
  onLayoutModeChange,
  onAddNote,
}: {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  layoutMode: NotesLayoutMode;
  onLayoutModeChange: (mode: NotesLayoutMode) => void;
  onAddNote: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-border px-4 py-4 sm:flex-row sm:items-center sm:gap-4 md:px-6">
      <Button
        type="button"
        className="h-10 shrink-0 gap-2 rounded-lg px-4 shadow-sm sm:min-w-[140px]"
        onClick={onAddNote}
      >
        <span className="bg-primary-foreground/15 flex size-6 items-center justify-center rounded-md">
          <Plus className="size-4" />
        </span>
        Add Note
      </Button>

      <div className="relative min-w-0 flex-1">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search notes"
          className="bg-muted/40 h-10 rounded-lg border-transparent pl-9 shadow-none"
          aria-label="Search notes"
        />
      </div>

      <div className="flex shrink-0 items-center gap-1 self-end sm:self-auto">
        <Button
          type="button"
          variant={layoutMode === "grid" ? "secondary" : "ghost"}
          size="icon"
          className={cn("size-9 rounded-lg")}
          onClick={() => onLayoutModeChange("grid")}
          aria-label="Grid view"
          aria-pressed={layoutMode === "grid"}
        >
          <LayoutGrid className="size-4" />
        </Button>
        <Button
          type="button"
          variant={layoutMode === "list" ? "secondary" : "ghost"}
          size="icon"
          className={cn("size-9 rounded-lg")}
          onClick={() => onLayoutModeChange("list")}
          aria-label="List view"
          aria-pressed={layoutMode === "list"}
        >
          <List className="size-4" />
        </Button>
      </div>
    </div>
  );
}
