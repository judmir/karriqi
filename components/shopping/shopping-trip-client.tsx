"use client";

import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";

import { PageHeader } from "@/components/patterns/page-header";
import { ShoppingList } from "@/components/shopping/shopping-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isUuid } from "@/lib/shopping/is-uuid";
import {
  insertUncheckedShoppingListItem,
  sortShoppingListItems,
} from "@/lib/shopping/list-order";
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
import { createClient as createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { ShoppingListItem, StapleItem } from "@/types/shopping";

type TripState = {
  items: ShoppingListItem[];
  catalog: StapleItem[];
};

type ShoppingListRow = {
  id: string;
  user_id: string;
  staple_id: string | null;
  name: string;
  quantity: string | null;
  checked: boolean;
  position: number;
  created_at: string;
};

function normalizeItemLabel(label: string) {
  return label.trim().toLowerCase().replace(/\s+/g, " ");
}

function rowToItem(row: ShoppingListRow): ShoppingListItem {
  return {
    id: row.id,
    stapleId: row.staple_id ?? undefined,
    name: row.name,
    quantity: row.quantity ?? undefined,
    checked: row.checked,
    addedAt: row.created_at,
  };
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
    items: sortShoppingListItems(initialItems),
    catalog: [...staples],
  });
  const [draft, setDraft] = useState("");
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

  /**
   * Supabase Realtime subscription — keeps the list in sync with the household
   * partner's edits live (no page reload). Idempotent merges by id ensure that
   * our own echoes are no-ops.
   */
  useEffect(() => {
    if (!listPersistence || !householdOwnerId) return;

    const supabase = createBrowserSupabaseClient();
    const channel = supabase
      .channel(`shopping_list_items:household=${householdOwnerId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "shopping_list_items",
          filter: `user_id=eq.${householdOwnerId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
            const row = payload.new as ShoppingListRow;
            const incoming = rowToItem(row);
            positionsRef.current.set(row.id, row.position);
            setTrip((t) => {
              const existingIdx = t.items.findIndex((i) => i.id === incoming.id);
              if (existingIdx >= 0) {
                const existing = t.items[existingIdx];
                if (
                  existing.name === incoming.name &&
                  existing.checked === incoming.checked &&
                  (existing.quantity ?? null) === (incoming.quantity ?? null) &&
                  (existing.stapleId ?? null) === (incoming.stapleId ?? null)
                ) {
                  return t;
                }
                const next = t.items.slice();
                next[existingIdx] = { ...existing, ...incoming };
                return { ...t, items: sortShoppingListItems(next) };
              }
              return {
                ...t,
                items: sortShoppingListItems([...t.items, incoming]),
              };
            });
          } else if (payload.eventType === "DELETE") {
            const row = payload.old as { id?: string };
            if (!row?.id) return;
            positionsRef.current.delete(row.id);
            setTrip((t) => {
              if (!t.items.some((i) => i.id === row.id)) return t;
              return { ...t, items: t.items.filter((i) => i.id !== row.id) };
            });
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [householdOwnerId, listPersistence]);

  const doneCount = useMemo(
    () => items.filter((i) => i.checked).length,
    [items],
  );

  const showClearConfirm = useMemo(
    () => items.length > 0 && items.every((i) => i.checked),
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
    const itemsNext = insertUncheckedShoppingListItem(items, next);
    const position = itemsNext.findIndex((i) => i.id === next.id);
    setTrip((t) => ({ ...t, items: itemsNext }));
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
    const itemsNext = insertUncheckedShoppingListItem(items, next);
    const position = itemsNext.findIndex((i) => i.id === next.id);
    setTrip((t) => ({ ...t, items: itemsNext }));
    persistItem(next, position);
    setDraft("");
  }

  function handleItemsChange(next: ShoppingListItem[]) {
    const ordered = sortShoppingListItems(next);

    const prevById = new Map(items.map((i) => [i.id, i]));
    const nextById = new Map(ordered.map((i) => [i.id, i]));

    const removed: ShoppingListItem[] = [];
    for (const prev of items) {
      if (!nextById.has(prev.id)) removed.push(prev);
    }

    if (purchasePersistence) {
      for (const item of ordered) {
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

    setTrip((t) => ({ ...t, items: ordered }));

    if (listPersistence) {
      ordered.forEach((item, index) => {
        const prev = prevById.get(item.id);
        const prevPos = positionsRef.current.get(item.id);
        const fieldsChanged =
          prev &&
          (prev.name !== item.name ||
            prev.checked !== item.checked ||
            (prev.quantity ?? null) !== (item.quantity ?? null) ||
            (prev.stapleId ?? null) !== (item.stapleId ?? null));
        if (!prev || fieldsChanged || prevPos !== index) {
          persistItem(item, index);
        }
      });
      for (const item of removed) {
        positionsRef.current.delete(item.id);
        void deleteShoppingListItem(item.id).then((r) => {
          if (!r.ok) {
            toast.error(`Couldn't remove "${item.name}": ${r.message}`);
          }
        });
      }
    }
  }

  function setAllChecked(checked: boolean) {
    if (items.every((item) => item.checked === checked)) return;
    const nextItems = sortShoppingListItems(
      items.map((item) => ({ ...item, checked })),
    );
    setTrip((t) => ({ ...t, items: nextItems }));
    if (listPersistence) {
      nextItems.forEach((item, index) => persistItem(item, index));
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
        {showClearConfirm ? (
          <div
            role="alertdialog"
            aria-labelledby="clear-confirm-title"
            className="border-primary/30 bg-primary/5 flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <p id="clear-confirm-title" className="text-sm">
              Nice — everything is checked. Clear the list?
            </p>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="sm:shrink-0"
              onClick={confirmClearList}
            >
              Clear list
            </Button>
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
