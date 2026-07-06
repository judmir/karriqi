"use client";

import { useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useHomeStore } from "@/stores/home-store";
import type { RoomDesign } from "@/types/home";

export function DesignList({
  designs,
  selectedId,
  onSelect,
}: {
  designs: RoomDesign[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const removeDesign = useHomeStore((s) => s.removeDesign);
  const [pending, startTransition] = useTransition();

  if (designs.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No designs yet. Describe a style below to generate your first one.
      </p>
    );
  }

  function remove(id: string) {
    if (!confirm("Delete this design?")) return;
    startTransition(() => {
      void removeDesign(id);
    });
  }

  return (
    <ul className="space-y-2">
      {designs.map((design) => {
        const isSelected = design.id === selectedId;
        return (
          <li key={design.id}>
            <div
              className={cn(
                "border-border flex items-start justify-between gap-2 rounded-lg border p-3 transition-colors",
                isSelected ? "bg-accent" : "hover:bg-muted/50",
              )}
            >
              <button
                type="button"
                onClick={() => onSelect(design.id)}
                className="min-w-0 flex-1 text-left"
              >
                <p className="truncate text-sm font-medium">{design.title}</p>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  {design.layout.furniture.length} items
                  {design.warnings.length > 0 ? null : null}
                </p>
                {design.warnings.length > 0 ? (
                  <Badge variant="outline" className="mt-1.5">
                    {design.warnings.length} layout warning
                    {design.warnings.length > 1 ? "s" : ""}
                  </Badge>
                ) : null}
              </button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={pending}
                onClick={() => remove(design.id)}
              >
                Delete
              </Button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
