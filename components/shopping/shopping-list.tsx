"use client";

import { ListPlus, X } from "lucide-react";
import { useLayoutEffect, useMemo, useRef, useState } from "react";

import {
  reorderShoppingListAfterToggle,
  sortShoppingListItems,
} from "@/lib/shopping/list-order";
import { cn } from "@/lib/utils";
import type { ShoppingListItem } from "@/types/shopping";

const ROW_MOVE_MS = 220;

function useShoppingListFlip(itemIds: string[]) {
  const listRef = useRef<HTMLUListElement>(null);
  const topsRef = useRef<Map<string, number>>(new Map());

  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;

    const rows = list.querySelectorAll<HTMLElement>("[data-item-id]");
    const nextTops = new Map<string, number>();

    rows.forEach((row) => {
      const id = row.dataset.itemId;
      if (!id) return;

      const top = row.getBoundingClientRect().top;
      nextTops.set(id, top);

      const prevTop = topsRef.current.get(id);
      if (prevTop === undefined) return;

      const deltaY = prevTop - top;
      if (Math.abs(deltaY) < 1) return;

      row.style.transition = "none";
      row.style.transform = `translateY(${deltaY}px)`;

      requestAnimationFrame(() => {
        row.style.transition = `transform ${ROW_MOVE_MS}ms ease-out`;
        row.style.transform = "";
      });
    });

    topsRef.current = nextTops;
  }, [itemIds.join("|")]);

  return listRef;
}

const REVEAL_PX = 72;
const DELETE_THRESHOLD_PX = 44;
const PROMOTE_THRESHOLD_PX = 44;
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
  const showPromote = Boolean(!item.stapleId && onPromoteToSuggested);

  function clamp(n: number) {
    if (n > 0) {
      if (!showPromote) return 0;
      return Math.min(REVEAL_PX, n);
    }
    return Math.max(-REVEAL_PX, n);
  }

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if ((e.target as HTMLElement).closest("button")) return;
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
      wasSwiping &&
      showPromote &&
      finalOffset >= PROMOTE_THRESHOLD_PX
    ) {
      onPromoteToSuggested?.();
    } else if (
      !wasSwiping &&
      Math.abs(dx) < TAP_TOGGLE_PX &&
      Math.abs(dy) < TAP_TOGGLE_PX
    ) {
      onToggle();
    }
    setOffset(0);
  }

  const fromSuggested = Boolean(item.stapleId);

  return (
    <li
      data-item-id={item.id}
      className="relative overflow-hidden rounded-lg will-change-transform"
    >
      {showPromote ? (
        <div
          className="bg-primary/15 text-primary absolute inset-y-0 left-0 flex w-[4.5rem] items-center justify-center gap-1 text-xs font-medium"
          aria-hidden
        >
          <ListPlus className="size-3.5" aria-hidden />
          Suggest
        </div>
      ) : null}
      <div
        className="bg-destructive/15 text-destructive absolute inset-y-0 right-0 flex w-[4.5rem] items-center justify-center text-xs font-medium"
        aria-hidden
      >
        Delete
      </div>
      <div
        className={cn(
          "bg-background relative z-10 flex w-full items-start gap-3 py-2.5",
          !dragging && "transition-transform duration-200 ease-out",
        )}
        style={{ transform: `translateX(${offset}px)` }}
      >
        <input
          type="checkbox"
          checked={item.checked}
          onChange={onToggle}
          className="border-input text-primary focus-visible:ring-ring mt-0.5 size-4 shrink-0 cursor-pointer rounded border bg-transparent focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          aria-label={`Got ${item.name}`}
        />
        <div
          data-swipe-row=""
          className="flex min-w-0 flex-1 cursor-pointer touch-pan-y select-none items-start gap-0.5"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={finishPointer}
          onPointerCancel={finishPointer}
        >
          <span
            className={cn(
              "flex min-w-0 flex-1 items-center gap-2 text-sm leading-snug",
              item.checked && "text-muted-foreground line-through",
            )}
          >
            {fromSuggested ? (
              <span
                className="bg-primary/70 inline-block size-1.5 shrink-0 rounded-full"
                aria-hidden
              />
            ) : null}
            {item.name}
          </span>
          <button
            type="button"
            onClick={onRemove}
            className="text-muted-foreground hover:text-foreground mt-0.5 shrink-0 rounded-md p-1 transition-colors"
            aria-label={`Remove ${item.name}`}
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
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
  const displayItems = useMemo(() => sortShoppingListItems(items), [items]);
  const listRef = useShoppingListFlip(displayItems.map((i) => i.id));

  function toggleChecked(id: string) {
    const toggled = items.map((i) =>
      i.id === id ? { ...i, checked: !i.checked } : i,
    );
    onItemsChange(reorderShoppingListAfterToggle(toggled, id));
  }

  function removeItem(id: string) {
    onItemsChange(items.filter((i) => i.id !== id));
  }

  if (displayItems.length === 0) {
    return (
      <p className="text-muted-foreground py-2 text-sm">Nothing here yet.</p>
    );
  }

  return (
    <ul
      ref={listRef}
      className="flex flex-col divide-y divide-border/80"
    >
      {displayItems.map((item) => (
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
