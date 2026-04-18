"use client";

import { type FormEvent, useMemo, useState } from "react";

import { ShoppingList } from "@/components/shopping/shopping-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { newShoppingListItemId } from "@/lib/shopping/new-list-item-id";
import { cn } from "@/lib/utils";
import type { ShoppingListItem, StapleItem } from "@/types/shopping";

type TripState = {
  items: ShoppingListItem[];
  catalog: StapleItem[];
};

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
}: {
  initialItems: ShoppingListItem[];
  staples: StapleItem[];
}) {
  const [trip, setTrip] = useState<TripState>({
    items: initialItems,
    catalog: [...staples],
  });
  const [draft, setDraft] = useState("");

  const { items, catalog } = trip;

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

  function addFromStaple(staple: StapleItem) {
    const next: ShoppingListItem = {
      id: newShoppingListItemId(),
      stapleId: staple.id,
      name: staple.name,
      checked: false,
      addedAt: new Date().toISOString(),
    };
    setTrip((t) => ({ ...t, items: [...t.items, next] }));
  }

  function addFreeText(e: FormEvent) {
    e.preventDefault();
    const name = draft.trim();
    if (!name) return;
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

  function promoteFreeTextToSuggested(itemId: string) {
    setTrip((t) => {
      const item = t.items.find((i) => i.id === itemId);
      if (!item || item.stapleId) return t;
      const name = item.name.trim();
      if (!name) return t;

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
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          Suggested
        </h2>
        {catalog.length === 0 ? (
          <p className="text-muted-foreground text-sm">—</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {catalog.map((staple) => {
              const onList = stapleIdsOnList.has(staple.id);
              return (
                <button
                  key={staple.id}
                  type="button"
                  disabled={onList}
                  onClick={() => addFromStaple(staple)}
                  aria-label={
                    onList
                      ? `${staple.name} is already on your list`
                      : `Add ${staple.name} to list`
                  }
                  className={cn(
                    "rounded-full border px-3 py-1 text-sm transition-colors",
                    onList
                      ? "text-muted-foreground border-border/70 cursor-default opacity-80"
                      : "border-border bg-background text-foreground hover:bg-muted/80",
                  )}
                >
                  {staple.name}
                </button>
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
            autoComplete="off"
            className="flex-1"
          />
          <Button type="submit" variant="secondary">
            Add
          </Button>
        </form>
        <TripProgress done={doneCount} total={items.length} />
        <ShoppingList
          items={items}
          onItemsChange={(next) => setTrip((t) => ({ ...t, items: next }))}
          onPromoteToSuggested={promoteFreeTextToSuggested}
        />
      </div>
    </div>
  );
}
