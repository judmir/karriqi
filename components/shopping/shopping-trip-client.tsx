"use client";

import { type FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";
import { ChevronDown, ChevronUp, Plus } from "lucide-react";

import { ShoppingList } from "@/components/shopping/shopping-list";
import { SwipeRevealRow } from "@/components/shopping/swipe-reveal-row";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { rankDueSoonStaples } from "@/lib/shopping/suggestions";
import { useShoppingListRealtime } from "@/hooks/use-shopping-list-realtime";
import { useShoppingStore } from "@/stores/shopping-store";
import type { StapleItem } from "@/types/shopping";

function normalizeItemLabel(label: string) {
  return label.trim().toLowerCase().replace(/\s+/g, " ");
}

function SuggestedItemChip({
  staple,
  onAdd,
  onDismiss,
}: {
  staple: StapleItem;
  onAdd: () => void;
  onDismiss: () => void;
}) {
  return (
    <SwipeRevealRow
      className="inline-flex max-w-full rounded-full align-top"
      contentClassName="rounded-full"
      deleteLabel="Remove"
      onSwipeDelete={onDismiss}
      onTap={onAdd}
    >
      <div
        role="button"
        tabIndex={0}
        aria-label={`Add ${staple.name} to list`}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onAdd();
          }
        }}
        className="text-foreground hover:bg-muted/80 inline-flex max-w-full cursor-pointer items-center gap-1 rounded-full px-3 py-1.5 text-sm transition-colors"
      >
        <span className="truncate">{staple.name}</span>
        <Plus className="text-muted-foreground size-3 shrink-0" aria-hidden />
      </div>
    </SwipeRevealRow>
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

export function ShoppingTripClient() {
  const items = useShoppingStore((s) => s.listItems);
  const catalog = useShoppingStore((s) => s.staples);
  const dismissedSuggestedIds = useShoppingStore((s) => s.dismissedSuggestedIds);
  const listPersistence = useShoppingStore((s) => s.listPersistence);
  const householdOwnerId = useShoppingStore((s) => s.householdOwnerId);
  const medianIntervalByStapleId = useShoppingStore(
    (s) => s.medianIntervalByStapleId,
  );
  const replaceListItems = useShoppingStore((s) => s.replaceListItems);
  const toggleListItem = useShoppingStore((s) => s.toggleListItem);
  const addItemFromStaple = useShoppingStore((s) => s.addItemFromStaple);
  const addFreeTextItem = useShoppingStore((s) => s.addFreeTextItem);
  const setAllChecked = useShoppingStore((s) => s.setAllChecked);
  const clearAllItems = useShoppingStore((s) => s.clearAllItems);
  const dismissSuggested = useShoppingStore((s) => s.dismissSuggested);
  const promoteFreeTextToSuggested = useShoppingStore(
    (s) => s.promoteFreeTextToSuggested,
  );

  const [showAllSuggestionsOnMobile, setShowAllSuggestionsOnMobile] =
    useState(true);
  const [draft, setDraft] = useState("");

  useShoppingListRealtime({
    enabled: listPersistence,
    householdOwnerId,
  });

  const itemLabelSet = useMemo(
    () => new Set(items.map((item) => normalizeItemLabel(item.name))),
    [items],
  );
  const normalizedDraft = normalizeItemLabel(draft);
  const draftHasDuplicateLabel =
    normalizedDraft.length > 0 && itemLabelSet.has(normalizedDraft);

  const doneCount = useMemo(
    () => items.filter((i) => i.checked).length,
    [items],
  );

  const showClearConfirm = useMemo(
    () => items.length > 0 && items.every((i) => i.checked),
    [items],
  );

  const stapleIdsOnList = useMemo(
    () =>
      new Set(items.map((i) => i.stapleId).filter(Boolean) as string[]),
    [items],
  );

  const dismissedSet = useMemo(
    () => new Set(dismissedSuggestedIds),
    [dismissedSuggestedIds],
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
        (s) =>
          dueSoonStapleIds.has(s.id) &&
          !stapleIdsOnList.has(s.id) &&
          !s.hiddenFromSuggestions &&
          !dismissedSet.has(s.id),
      ),
      ...catalog.filter(
        (s) =>
          !dueSoonStapleIds.has(s.id) &&
          !stapleIdsOnList.has(s.id) &&
          !s.hiddenFromSuggestions &&
          !dismissedSet.has(s.id),
      ),
    ],
    [catalog, dueSoonStapleIds, stapleIdsOnList, dismissedSet],
  );

  const MOBILE_SUGGESTION_LIMIT = 8;
  const quickSuggestedCatalog = useMemo(
    () => suggestedCatalog.slice(0, MOBILE_SUGGESTION_LIMIT),
    [suggestedCatalog],
  );
  const visibleSuggestedCatalog = useMemo(
    () => (showAllSuggestionsOnMobile ? suggestedCatalog : quickSuggestedCatalog),
    [quickSuggestedCatalog, showAllSuggestionsOnMobile, suggestedCatalog],
  );

  function handleAddFromStaple(staple: StapleItem) {
    const added = addItemFromStaple(staple);
    if (!added) {
      toast.info(`"${staple.name}" is already on your list.`);
    }
  }

  function handleAddFreeText(e: FormEvent) {
    e.preventDefault();
    const name = draft.trim();
    if (!name) return;
    if (addFreeTextItem(name)) {
      setDraft("");
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          Suggested
        </h2>
        {suggestedCatalog.length === 0 ? (
          <p className="text-muted-foreground text-sm">—</p>
        ) : (
          <>
            <div className="flex flex-wrap gap-2 sm:hidden">
              {visibleSuggestedCatalog.map((staple) => (
                <SuggestedItemChip
                  key={staple.id}
                  staple={staple}
                  onAdd={() => handleAddFromStaple(staple)}
                  onDismiss={() => dismissSuggested(staple.id)}
                />
              ))}
            </div>
            <div className="hidden flex-wrap gap-2 sm:flex">
              {suggestedCatalog.map((staple) => (
                <SuggestedItemChip
                  key={staple.id}
                  staple={staple}
                  onAdd={() => handleAddFromStaple(staple)}
                  onDismiss={() => dismissSuggested(staple.id)}
                />
              ))}
            </div>
            {suggestedCatalog.length > MOBILE_SUGGESTION_LIMIT ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-muted-foreground mt-1 inline-flex h-8 w-fit items-center gap-1 px-2 text-xs sm:hidden"
                onClick={() => setShowAllSuggestionsOnMobile((current) => !current)}
              >
                {showAllSuggestionsOnMobile ? (
                  <>
                    Show fewer <ChevronUp className="size-3" aria-hidden />
                  </>
                ) : (
                  <>
                    Show{" "}
                    {suggestedCatalog.length - quickSuggestedCatalog.length} more{" "}
                    <ChevronDown className="size-3" aria-hidden />
                  </>
                )}
              </Button>
            ) : null}
          </>
        )}
      </div>

      <div className="space-y-3">
        <h2 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          List
        </h2>
        <form onSubmit={handleAddFreeText} className="flex gap-2">
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
              onClick={clearAllItems}
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
              onClick={clearAllItems}
            >
              Remove all ({items.length})
            </Button>
          </div>
        ) : null}
        <ShoppingList
          items={items}
          onToggleItem={toggleListItem}
          onItemsChange={replaceListItems}
          onPromoteToSuggested={(id) => void promoteFreeTextToSuggested(id)}
        />
      </div>
    </div>
  );
}
