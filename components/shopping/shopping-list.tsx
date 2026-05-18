"use client";

import { ListPlus, X } from "lucide-react";
import { useRef, useState } from "react";

import { getProfileColor } from "@/lib/profile/colors";
import { cn } from "@/lib/utils";
import type { ShoppingListItem } from "@/types/shopping";

const REVEAL_PX = 72;
const DELETE_THRESHOLD_PX = 44;
const SWIPE_INTENT_PX = 8;
/** Max horizontal movement (px) to count as a tap on the row (toggle checked). */
const TAP_TOGGLE_PX = 10;

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
  const dragRef = useRef<{
    startX: number;
    startY: number;
    startOffset: number;
    swiping: boolean;
  } | null>(null);
  const showPromote = !item.stapleId && onPromoteToSuggested;
  const creatorColor = getProfileColor(item.createdByColor);

  function clamp(n: number) {
    return Math.min(0, Math.max(-REVEAL_PX, n));
  }

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if ((e.target as HTMLElement).closest("input, button")) return;
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startOffset: offset,
      swiping: false,
    };
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;

    if (!dragRef.current.swiping) {
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);
      if (absY > SWIPE_INTENT_PX && absY > absX) {
        dragRef.current = null;
        setOffset(0);
        return;
      }
      if (absX <= SWIPE_INTENT_PX || absX <= absY) return;

      dragRef.current.swiping = true;
      setDragging(true);
      e.currentTarget.setPointerCapture(e.pointerId);
    }

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
    const dy = e.clientY - dragRef.current.startY;
    const finalOffset = clamp(dragRef.current.startOffset + dx);
    const wasSwiping = dragRef.current.swiping;
    dragRef.current = null;
    setDragging(false);
    if (wasSwiping && finalOffset <= -DELETE_THRESHOLD_PX) {
      onRemove();
    } else if (
      !wasSwiping &&
      Math.abs(dx) < TAP_TOGGLE_PX &&
      Math.abs(dy) < TAP_TOGGLE_PX
    ) {
      onToggle();
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
          "bg-background relative z-10 flex w-full cursor-pointer touch-pan-y select-none items-start gap-0.5 py-2.5 pl-2",
          !dragging && "transition-transform duration-200 ease-out",
        )}
        style={{
          transform: `translateX(${offset}px)`,
          boxShadow: creatorColor
            ? `inset 3px 0 0 0 ${creatorColor.accent}`
            : undefined,
        }}
        data-creator-color={item.createdByColor ?? undefined}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={finishPointer}
        onPointerCancel={finishPointer}
      >
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <input
            type="checkbox"
            checked={item.checked}
            onChange={onToggle}
            onClick={(e) => e.stopPropagation()}
            className="border-input text-primary focus-visible:ring-ring mt-0.5 size-4 shrink-0 cursor-pointer rounded border bg-transparent focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
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
