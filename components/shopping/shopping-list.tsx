"use client";

import { ListPlus, X } from "lucide-react";
import { useRef, useState } from "react";

import { cn } from "@/lib/utils";
import type { ShoppingListItem } from "@/types/shopping";

const REVEAL_PX = 72;
const DELETE_THRESHOLD_PX = 44;

function ShoppingListRow({
  item,
  onToggle,
  onRemove,
  onPromoteToSuggested,
}: {
  item: ShoppingListItem;
  onToggle: () => void;
  onRemove: () => void;
  onPromoteToSuggested?: () => void;
}) {
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startOffset: number } | null>(null);
  const showPromote = !item.stapleId && onPromoteToSuggested;

  function clamp(n: number) {
    return Math.min(0, Math.max(-REVEAL_PX, n));
  }

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if ((e.target as HTMLElement).closest("input, button")) return;
    dragRef.current = { startX: e.clientX, startOffset: offset };
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    setOffset(clamp(dragRef.current.startOffset + dx));
  }

  function finishPointer(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragRef.current) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
    const dx = e.clientX - dragRef.current.startX;
    const finalOffset = clamp(dragRef.current.startOffset + dx);
    dragRef.current = null;
    setDragging(false);
    if (finalOffset <= -DELETE_THRESHOLD_PX) {
      onRemove();
    }
    setOffset(0);
  }

  return (
    <li className="relative overflow-hidden rounded-lg">
      <div
        className="bg-destructive/15 text-destructive absolute inset-y-0 right-0 flex w-[4.5rem] items-center justify-center text-xs font-medium"
        aria-hidden
      >
        Delete
      </div>
      <div
        className={cn(
          "bg-background relative z-10 flex w-full items-start gap-0.5 py-2.5",
          !dragging && "transition-transform duration-200 ease-out",
        )}
        style={{ transform: `translateX(${offset}px)` }}
      >
        <div
          className="flex min-w-0 flex-1 touch-pan-y select-none items-start gap-3"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={finishPointer}
          onPointerCancel={finishPointer}
        >
          <input
            type="checkbox"
            checked={item.checked}
            onChange={onToggle}
            className="border-input text-primary focus-visible:ring-ring mt-0.5 size-4 shrink-0 rounded border bg-transparent focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            aria-label={`Got ${item.name}`}
          />
          <span
            className={cn(
              "min-w-0 flex-1 text-sm leading-snug",
              item.checked && "text-muted-foreground line-through",
            )}
          >
            {item.name}
          </span>
        </div>
        {showPromote ? (
          <button
            type="button"
            onClick={() => onPromoteToSuggested?.()}
            className="text-muted-foreground hover:text-foreground mt-0.5 shrink-0 rounded-md p-1 transition-colors"
            aria-label={`Save ${item.name} as a suggested item`}
            title="Add to suggested"
          >
            <ListPlus className="size-4" aria-hidden />
          </button>
        ) : null}
        <button
          type="button"
          onClick={onRemove}
          className="text-muted-foreground hover:text-foreground mt-0.5 shrink-0 rounded-md p-1 transition-colors"
          aria-label={`Remove ${item.name}`}
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
    </li>
  );
}

export function ShoppingList({
  items,
  onItemsChange,
  onPromoteToSuggested,
}: {
  items: ShoppingListItem[];
  onItemsChange: (next: ShoppingListItem[]) => void;
  onPromoteToSuggested?: (itemId: string) => void;
}) {
  function toggleChecked(id: string) {
    onItemsChange(
      items.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i)),
    );
  }

  function removeItem(id: string) {
    onItemsChange(items.filter((i) => i.id !== id));
  }

  if (items.length === 0) {
    return (
      <p className="text-muted-foreground py-2 text-sm">Nothing here yet.</p>
    );
  }

  return (
    <ul className="flex flex-col divide-y divide-border/80">
      {items.map((item) => (
        <ShoppingListRow
          key={item.id}
          item={item}
          onToggle={() => toggleChecked(item.id)}
          onRemove={() => removeItem(item.id)}
          onPromoteToSuggested={
            onPromoteToSuggested
              ? () => onPromoteToSuggested(item.id)
              : undefined
          }
        />
      ))}
    </ul>
  );
}
