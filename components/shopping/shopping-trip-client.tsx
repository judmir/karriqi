"use client";

import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/patterns/page-header";
import { ShoppingList } from "@/components/shopping/shopping-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { isUuid } from "@/lib/shopping/is-uuid";
import { newShoppingListItemId } from "@/lib/shopping/new-list-item-id";
import {
  createStaple,
  recordPurchase,
  saveShoppingListItems,
} from "@/lib/shopping/shopping-actions";
import { rankDueSoonStaples } from "@/lib/shopping/suggestions";
import { cn } from "@/lib/utils";
import type { ShoppingListItem, StapleItem } from "@/types/shopping";

type TripState = {
  items: ShoppingListItem[];
  catalog: StapleItem[];
};

const SUGGESTED_REVEAL_PX = 72;
const SUGGESTED_DELETE_THRESHOLD_PX = 44;
const SUGGESTED_TAP_PX = 10;

function normalizeItemLabel(label: string) {
  return label.trim().toLowerCase().replace(/\s+/g, " ");
}

function SuggestedItemChip({
  staple,
  dueDetail,
  onAdd,
  onDelete,
}: {
  staple: StapleItem;
  dueDetail?: string;
  onAdd: () => void;
  onDelete: () => void;
}) {
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startOffset: number } | null>(null);
  const suppressClickRef = useRef(false);
  const isDueSoon = Boolean(dueDetail);
  const showDeleteReveal = dragging || offset < -1;

  function clamp(n: number) {
    return Math.min(0, Math.max(-SUGGESTED_REVEAL_PX, n));
  }

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
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
    if (finalOffset <= -SUGGESTED_DELETE_THRESHOLD_PX) {
      suppressClickRef.current = true;
      onDelete();
    } else if (Math.abs(dx) < SUGGESTED_TAP_PX) {
      suppressClickRef.current = true;
      onAdd();
    }
    setOffset(0);
  }

  const chip = (
    <button
      type="button"
      onClick={() => {
        if (suppressClickRef.current) {
          suppressClickRef.current = false;
          return;
        }
        onAdd();
      }}
      aria-label={
        isDueSoon
          ? `Add ${staple.name} to list. ${dueDetail}`
          : `Add ${staple.name} to list`
      }
      className={cn(
        "cursor-pointer rounded-full border px-3 py-1 text-sm transition-colors",
        isDueSoon
          ? "border-primary/35 bg-background text-foreground hover:bg-primary/10"
          : "border-border bg-background text-foreground hover:bg-muted/80",
      )}
    >
      {isDueSoon ? (
        <span
          className="mr-1 inline-block size-1.5 rounded-full bg-primary/80 align-middle"
          aria-hidden
        />
      ) : null}
      {staple.name}
    </button>
  );

  return (
    <div className="relative overflow-hidden rounded-full">
      <div
        className={cn(
          "bg-destructive/15 text-destructive absolute inset-y-0 right-0 flex w-[4.5rem] items-center justify-center text-xs font-medium transition-opacity duration-150",
          showDeleteReveal ? "opacity-100" : "opacity-0",
        )}
        aria-hidden
      >
        Delete
      </div>
      <div
        className={cn(
          "relative z-10 w-fit touch-pan-y",
          !dragging && "transition-transform duration-200 ease-out",
        )}
        style={{ transform: `translateX(${offset}px)` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={finishPointer}
        onPointerCancel={finishPointer}
      >
        {isDueSoon && dueDetail ? (
          <Tooltip>
            <TooltipTrigger render={chip} />
            <TooltipContent>{dueDetail}</TooltipContent>
          </Tooltip>
        ) : (
          chip
        )}
      </div>
    </div>
  );
}

function TripProgress({ done, total }: { done: number; total: number }) {
  if (total === 0) return null;
  const pct = Math.round((done / total) * 100);

  return (
    <div className="space-y-1">
      <div className="text-muted-foreground flex justify-end text-xs tabular-nums">
        {done}/{total}
      </div>
      <div
        className="bg-muted h-1 w-full overflow-hidden rounded-full"
        role="progressbar"
        aria-valuenow={done}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label={`${done} of ${total} items done`}
      >
        <div
          className="bg-primary h-full rounded-full transition-[width] duration-200 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function ShoppingTripClient({
  initialItems,
  staples,
  purchasePersistence = false,
  listPersistence = false,
  medianIntervalByStapleId = {},
}: {
  initialItems: ShoppingListItem[];
  staples: StapleItem[];
  purchasePersistence?: boolean;
  /** When true, list changes are saved to Supabase (requires shopping_list_items migration). */
  listPersistence?: boolean;
  /** Learned days-between-buys per staple id (from DB); empty when offline / mock. */
  medianIntervalByStapleId?: Record<string, number>;
}) {
  const [trip, setTrip] = useState<TripState>({
    items: initialItems,
    catalog: [...staples],
  });
  const [draft, setDraft] = useState("");
  const skipListPersistRef = useRef(true);

  const { items, catalog } = trip;
  const itemLabelSet = useMemo(
    () => new Set(items.map((item) => normalizeItemLabel(item.name))),
    [items],
  );
  const normalizedDraft = normalizeItemLabel(draft);
  const draftHasDuplicateLabel =
    normalizedDraft.length > 0 && itemLabelSet.has(normalizedDraft);

  useEffect(() => {
    if (!listPersistence) return;
    if (skipListPersistRef.current) {
      skipListPersistRef.current = false;
      return;
    }
    const timer = setTimeout(() => {
      void saveShoppingListItems(items);
    }, 200);
    return () => clearTimeout(timer);
  }, [items, listPersistence]);

  const doneCount = useMemo(
    () => items.filter((i) => i.checked).length,
    [items],
  );

  /** Staple ids already on the trip list (used to dim chips, not hide them). */
  const stapleIdsOnList = useMemo(
    () =>
      new Set(items.map((i) => i.stapleId).filter(Boolean) as string[]),
    [items],
  );

  const dueSoon = useMemo(
    () =>
      rankDueSoonStaples({
        staples: catalog,
        excludeStapleIds: stapleIdsOnList,
        medianIntervalByStapleId,
      }),
    [catalog, stapleIdsOnList, medianIntervalByStapleId],
  );

  const dueSoonStapleIds = useMemo(
    () => new Set(dueSoon.map((d) => d.staple.id)),
    [dueSoon],
  );

  const dueSoonDetailByStapleId = useMemo(
    () => new Map(dueSoon.map(({ staple, detail }) => [staple.id, detail])),
    [dueSoon],
  );

  const suggestedCatalog = useMemo(
    () => [
      ...catalog.filter(
        (s) => dueSoonStapleIds.has(s.id) && !stapleIdsOnList.has(s.id),
      ),
      ...catalog.filter(
        (s) => !dueSoonStapleIds.has(s.id) && !stapleIdsOnList.has(s.id),
      ),
    ],
    [catalog, dueSoonStapleIds, stapleIdsOnList],
  );

  function addFromStaple(staple: StapleItem) {
    if (itemLabelSet.has(normalizeItemLabel(staple.name))) {
      toast.info(`"${staple.name}" is already on your list.`);
      return;
    }
    const next: ShoppingListItem = {
      id: newShoppingListItemId(),
      stapleId: staple.id,
      name: staple.name,
      checked: false,
      addedAt: new Date().toISOString(),
    };
    setTrip((t) => ({ ...t, items: [...t.items, next] }));
  }

  function removeSuggestedStaple(stapleId: string) {
    setTrip((t) => ({
      ...t,
      catalog: t.catalog.filter((s) => s.id !== stapleId),
    }));
  }

  function addFreeText(e: FormEvent) {
    e.preventDefault();
    const name = draft.trim();
    if (!name) return;
    if (itemLabelSet.has(normalizeItemLabel(name))) {
      return;
    }
    setTrip((t) => ({
      ...t,
      items: [
        ...t.items,
        {
          id: newShoppingListItemId(),
          name,
          checked: false,
          addedAt: new Date().toISOString(),
        },
      ],
    }));
    setDraft("");
  }

  function handleItemsChange(next: ShoppingListItem[]) {
    if (purchasePersistence) {
      const prevById = new Map(items.map((i) => [i.id, i]));
      for (const item of next) {
        const prev = prevById.get(item.id);
        if (prev && !prev.checked && item.checked) {
          const rawId = item.stapleId ?? null;
          const stapleId = rawId && isUuid(rawId) ? rawId : null;
          void recordPurchase({
            stapleId,
            itemName: item.name,
          }).then((r) => {
            if (
              r.ok &&
              r.stapleIdForCatalog &&
              r.purchasedAt
            ) {
              setTrip((cur) => ({
                ...cur,
                catalog: cur.catalog.map((s) =>
                  s.id === r.stapleIdForCatalog
                    ? { ...s, lastPurchasedAt: r.purchasedAt }
                    : s,
                ),
              }));
            }
          });
        }
      }
    }
    setTrip((t) => ({ ...t, items: next }));
  }

  function setAllChecked(checked: boolean) {
    handleItemsChange(items.map((item) => ({ ...item, checked })));
  }

  function removeAllItems() {
    handleItemsChange([]);
  }

  async function promoteFreeTextToSuggested(itemId: string) {
    const item = items.find((i) => i.id === itemId);
    if (!item || item.stapleId) return;
    const name = item.name.trim();
    if (!name) return;

    if (purchasePersistence) {
      const r = await createStaple({
        name,
        unit: item.quantity,
      });
      if (!r.ok) return;
      const stapleId = r.id;
      const createdAt = new Date().toISOString();
      setTrip((t) => {
        const existingMeta = t.catalog.find((s) => s.id === stapleId);
        const catalogNext = existingMeta
          ? t.catalog
          : [
              ...t.catalog,
              {
                id: stapleId,
                name,
                unit: item.quantity,
                createdAt,
              },
            ];
        const itemsNext = t.items.map((i) =>
          i.id === itemId ? { ...i, stapleId } : i,
        );
        return { catalog: catalogNext, items: itemsNext };
      });
      return;
    }

    setTrip((t) => {
      const existing = t.catalog.find(
        (s) => s.name.trim().toLowerCase() === name.toLowerCase(),
      );
      let catalogNext = t.catalog;
      let stapleId: string;
      if (existing) {
        stapleId = existing.id;
      } else {
        stapleId = `staple-${newShoppingListItemId()}`;
        catalogNext = [
          ...t.catalog,
          {
            id: stapleId,
            name,
            unit: item.quantity,
            createdAt: new Date().toISOString(),
          },
        ];
      }
      const itemsNext = t.items.map((i) =>
        i.id === itemId ? { ...i, stapleId } : i,
      );
      return { catalog: catalogNext, items: itemsNext };
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader segments={["Shopping"]} />

      <div className="space-y-2">
        <h2 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          Suggested
        </h2>
        {suggestedCatalog.length === 0 ? (
          <p className="text-muted-foreground text-sm">—</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {suggestedCatalog.map((staple) => {
              const dueDetail = dueSoonDetailByStapleId.get(staple.id);
              return (
                <SuggestedItemChip
                  key={staple.id}
                  staple={staple}
                  dueDetail={dueDetail}
                  onAdd={() => addFromStaple(staple)}
                  onDelete={() => removeSuggestedStaple(staple.id)}
                />
              );
            })}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <h2 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          List
        </h2>
        <form onSubmit={addFreeText} className="flex gap-2">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Add item"
            aria-label="Add item"
            aria-invalid={draftHasDuplicateLabel}
            aria-describedby={draftHasDuplicateLabel ? "add-item-error" : undefined}
            autoComplete="off"
            className="flex-1"
          />
          <Button type="submit" variant="secondary">
            Add
          </Button>
        </form>
        {draftHasDuplicateLabel ? (
          <p id="add-item-error" className="text-destructive text-xs">
            This item is already on your list.
          </p>
        ) : null}
        <TripProgress done={doneCount} total={items.length} />
        {items.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setAllChecked(true)}
            >
              Check all
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setAllChecked(false)}
            >
              Uncheck all
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={removeAllItems}
            >
              Remove all ({items.length})
            </Button>
          </div>
        ) : null}
        <ShoppingList
          items={items}
          onItemsChange={handleItemsChange}
          onPromoteToSuggested={(id) => void promoteFreeTextToSuggested(id)}
        />
      </div>
    </div>
  );
}
