"use client";

import { type FormEvent, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";

import { PageHeader } from "@/components/patterns/page-header";
import { ShoppingList } from "@/components/shopping/shopping-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isUuid } from "@/lib/shopping/is-uuid";
import { newShoppingListItemId } from "@/lib/shopping/new-list-item-id";
import {
  clearShoppingList,
  createStaple,
  deleteShoppingListItem,
  recordPurchase,
  setAllShoppingListItemsChecked,
  upsertShoppingListItem,
} from "@/lib/shopping/shopping-actions";
import { rankDueSoonStaples } from "@/lib/shopping/suggestions";
import { useShoppingListRealtime } from "@/hooks/use-shopping-list-realtime";
import type { ShoppingListItem, StapleItem } from "@/types/shopping";

type TripState = {
  items: ShoppingListItem[];
  catalog: StapleItem[];
};

function normalizeItemLabel(label: string) {
  return label.trim().toLowerCase().replace(/\s+/g, " ");
}

function SuggestedItemChip({
  staple,
  onAdd,
}: {
  staple: StapleItem;
  onAdd: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onAdd}
      aria-label={`Add ${staple.name} to list`}
      className="text-foreground hover:bg-muted/80 inline-flex cursor-pointer items-center gap-1 rounded-full bg-transparent px-3 py-1 text-sm transition-colors select-none"
    >
      <span>{staple.name}</span>
      <Plus className="text-muted-foreground size-3" aria-hidden />
    </button>
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
  householdOwnerId = null,
}: {
  initialItems: ShoppingListItem[];
  staples: StapleItem[];
  purchasePersistence?: boolean;
  /** When true, list changes are saved to Supabase (requires shopping_list_items migration). */
  listPersistence?: boolean;
  /** Learned days-between-buys per staple id (from DB); empty when offline / mock. */
  medianIntervalByStapleId?: Record<string, number>;
  /** Canonical household owner uuid (used to scope Supabase Realtime subscription). */
  householdOwnerId?: string | null;
}) {
  const [trip, setTrip] = useState<TripState>({
    items: initialItems,
    catalog: [...staples],
  });
  const [draft, setDraft] = useState("");
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  // Items whose `position` we already assigned on insert; used to guess the next position.
  const positionsRef = useRef<Map<string, number>>(
    new Map(initialItems.map((i, idx) => [i.id, idx])),
  );

  const { items, catalog } = trip;
  const itemLabelSet = useMemo(
    () => new Set(items.map((item) => normalizeItemLabel(item.name))),
    [items],
  );
  const normalizedDraft = normalizeItemLabel(draft);
  const draftHasDuplicateLabel =
    normalizedDraft.length > 0 && itemLabelSet.has(normalizedDraft);

  useShoppingListRealtime({
    enabled: listPersistence,
    householdOwnerId,
    positionsRef,
    patchItems: (updater) =>
      setTrip((t) => ({ ...t, items: updater(t.items) })),
  });

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

  function nextPosition() {
    let max = -1;
    positionsRef.current.forEach((p) => {
      if (p > max) max = p;
    });
    return max + 1;
  }

  function persistItem(item: ShoppingListItem, position: number) {
    if (!listPersistence) return;
    positionsRef.current.set(item.id, position);
    void upsertShoppingListItem({
      id: item.id,
      stapleId: item.stapleId ?? null,
      name: item.name,
      quantity: item.quantity ?? null,
      checked: item.checked,
      position,
    }).then((r) => {
      if (!r.ok) {
        toast.error(`Couldn't save "${item.name}": ${r.message}`);
      }
    });
  }

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
    const position = nextPosition();
    setTrip((t) => ({ ...t, items: [...t.items, next] }));
    persistItem(next, position);
  }

  function addFreeText(e: FormEvent) {
    e.preventDefault();
    const name = draft.trim();
    if (!name) return;
    if (itemLabelSet.has(normalizeItemLabel(name))) {
      return;
    }
    const next: ShoppingListItem = {
      id: newShoppingListItemId(),
      name,
      checked: false,
      addedAt: new Date().toISOString(),
    };
    const position = nextPosition();
    setTrip((t) => ({ ...t, items: [...t.items, next] }));
    setDraft("");
    persistItem(next, position);
  }

  function handleItemsChange(next: ShoppingListItem[]) {
    const prevAllChecked =
      items.length > 0 && items.every((item) => item.checked);
    const nextAllChecked =
      next.length > 0 && next.every((item) => item.checked);

    const prevById = new Map(items.map((i) => [i.id, i]));
    const nextById = new Map(next.map((i) => [i.id, i]));

    const removed: ShoppingListItem[] = [];
    for (const prev of items) {
      if (!nextById.has(prev.id)) removed.push(prev);
    }

    const changed: ShoppingListItem[] = [];
    for (const n of next) {
      const prev = prevById.get(n.id);
      if (!prev) continue;
      if (
        prev.name !== n.name ||
        prev.checked !== n.checked ||
        (prev.quantity ?? null) !== (n.quantity ?? null) ||
        (prev.stapleId ?? null) !== (n.stapleId ?? null)
      ) {
        changed.push(n);
      }
    }

    if (purchasePersistence) {
      for (const item of next) {
        const prev = prevById.get(item.id);
        if (prev && !prev.checked && item.checked) {
          const rawId = item.stapleId ?? null;
          const stapleId = rawId && isUuid(rawId) ? rawId : null;
          void recordPurchase({
            stapleId,
            itemName: item.name,
          }).then((r) => {
            if (r.ok && r.stapleIdForCatalog && r.purchasedAt) {
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

    if (listPersistence) {
      for (const item of changed) {
        const position = positionsRef.current.get(item.id) ?? nextPosition();
        persistItem(item, position);
      }
      for (const item of removed) {
        positionsRef.current.delete(item.id);
        void deleteShoppingListItem(item.id).then((r) => {
          if (!r.ok) {
            toast.error(`Couldn't remove "${item.name}": ${r.message}`);
          }
        });
      }
    }

    if (nextAllChecked && !prevAllChecked) {
      setClearConfirmOpen(true);
    }
  }

  function setAllChecked(checked: boolean) {
    if (items.every((item) => item.checked === checked)) return;
    setTrip((t) => ({
      ...t,
      items: t.items.map((item) => ({ ...item, checked })),
    }));
    if (listPersistence) {
      void setAllShoppingListItemsChecked(checked).then((r) => {
        if (!r.ok) {
          toast.error(`Couldn't update list: ${r.message}`);
        }
      });
    }
  }

  function removeAllItems() {
    setTrip((t) => ({ ...t, items: [] }));
    positionsRef.current.clear();
    setClearConfirmOpen(false);
    if (listPersistence) {
      void clearShoppingList().then((r) => {
        if (!r.ok) {
          toast.error(`Couldn't clear list: ${r.message}`);
        }
      });
    }
  }

  function confirmClearList() {
    removeAllItems();
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
      if (listPersistence) {
        const updated = { ...item, stapleId };
        const position = positionsRef.current.get(itemId) ?? nextPosition();
        persistItem(updated, position);
      }
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
            {suggestedCatalog.map((staple) => (
              <SuggestedItemChip
                key={staple.id}
                staple={staple}
                onAdd={() => addFromStaple(staple)}
              />
            ))}
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
        {clearConfirmOpen ? (
          <div
            role="alertdialog"
            aria-labelledby="clear-confirm-title"
            className="border-primary/30 bg-primary/5 flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <p id="clear-confirm-title" className="text-sm">
              Nice — everything is checked. Clear the list?
            </p>
            <div className="flex gap-2 sm:shrink-0">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setClearConfirmOpen(false)}
              >
                Keep
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={confirmClearList}
              >
                Clear list
              </Button>
            </div>
          </div>
        ) : null}
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
