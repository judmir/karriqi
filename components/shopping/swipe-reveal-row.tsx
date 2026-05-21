"use client";

import { useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export const SWIPE_REVEAL_PX = 72;
export const SWIPE_DELETE_THRESHOLD_PX = 44;
export const SWIPE_PROMOTE_THRESHOLD_PX = 44;
const SWIPE_INTENT_PX = 8;
/** Max horizontal movement (px) to count as a tap instead of a swipe. */
const TAP_PX = 10;

type SwipeRevealRowProps = {
  children: ReactNode;
  onSwipeDelete: () => void;
  onSwipePromote?: () => void;
  /** Fires on a short press without a horizontal swipe (e.g. add suggested item). */
  onTap?: () => void;
  deleteLabel?: string;
  promoteLabel?: ReactNode;
  className?: string;
  contentClassName?: string;
};

export function SwipeRevealRow({
  children,
  onSwipeDelete,
  onSwipePromote,
  onTap,
  deleteLabel = "Delete",
  promoteLabel,
  className,
  contentClassName,
}: SwipeRevealRowProps) {
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    startOffset: number;
    swiping: boolean;
  } | null>(null);
  const showPromote = Boolean(onSwipePromote && promoteLabel);

  function clamp(n: number) {
    if (n > 0) {
      if (!showPromote) return 0;
      return Math.min(SWIPE_REVEAL_PX, n);
    }
    return Math.max(-SWIPE_REVEAL_PX, n);
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
    if (wasSwiping && finalOffset <= -SWIPE_DELETE_THRESHOLD_PX) {
      onSwipeDelete();
    } else if (
      wasSwiping &&
      showPromote &&
      finalOffset >= SWIPE_PROMOTE_THRESHOLD_PX
    ) {
      onSwipePromote?.();
    } else if (
      !wasSwiping &&
      onTap &&
      Math.abs(dx) < TAP_PX &&
      Math.abs(dy) < TAP_PX
    ) {
      onTap();
    }
    setOffset(0);
  }

  return (
    <div className={cn("relative overflow-hidden rounded-lg", className)}>
      {showPromote ? (
        <div
          className="bg-primary/15 text-primary absolute inset-y-0 left-0 flex w-[4.5rem] items-center justify-center gap-1 text-xs font-medium"
          aria-hidden
        >
          {promoteLabel}
        </div>
      ) : null}
      <div
        className="bg-destructive/15 text-destructive absolute inset-y-0 right-0 flex w-[4.5rem] items-center justify-center text-xs font-medium"
        aria-hidden
      >
        {deleteLabel}
      </div>
      <div
        data-swipe-row=""
        className={cn(
          "bg-background relative z-10 touch-pan-y select-none",
          !dragging && "transition-transform duration-200 ease-out",
          contentClassName,
        )}
        style={{ transform: `translateX(${offset}px)` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={finishPointer}
        onPointerCancel={finishPointer}
      >
        {children}
      </div>
    </div>
  );
}
