"use client";

import { type FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";
import { ChevronDown, ChevronUp, Plus } from "lucide-react";

import { ShoppingList } from "@/components/shopping/shopping-list";
import { SwipeRevealRow } from "@/components/shopping/swipe-reveal-row";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { rankDueSoonStaples } from "@/lib/shopping/suggestions";
import { mergeDevSuggestedStaples } from "@/lib/shopping/mock-suggested-staples";
import { useShoppingListRealtime } from "@/hooks/use-shopping-list-realtime";
import { useShoppingStore } from "@/stores/shopping-store";
import type { StapleItem } from "@/types/shopping";

function normalizeItemLabel(label: string) {
  return label.trim().toLowerCase().replace(/\s+/g, " ");
}

const SUGGESTION_PREVIEW_LIMIT = 8;

function SuggestedSectionHeader({
  count,
  expanded,
  onToggle,
}: {
  count: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      className="text-muted-foreground hover:text-foreground flex w-full items-center justify-between gap-2 text-left text-xs font-medium tracking-wide uppercase transition-colors"
      aria-expanded={expanded}
      aria-controls="shopping-suggested-panel"
      onClick={onToggle}
    >
      <span>Suggested</span>
      <span className="inline-flex items-center gap-1.5 normal-case tracking-normal">
        {count > 0 ? (
          <span className="text-muted-foreground/80 text-[0.65rem] tabular-nums">
            {count}
          </span>
        ) : null}
        {expanded ? (
          <ChevronUp className="size-3.5 shrink-0" aria-hidden />
        ) : (
          <ChevronDown className="size-3.5 shrink-0" aria-hidden />
        )}
      </span>
    </button>
  );
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

  const [suggestedSectionExpanded, setSuggestedSectionExpanded] = useState(true);
  const [showAllSuggestions, setShowAllSuggestions] = useState(false);
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

  const catalogForSuggestions = useMemo(
    () => mergeDevSuggestedStaples(catalog),
    [catalog],
  );

  const dueSoon = useMemo(
    () =>
      rankDueSoonStaples({
        staples: catalogForSuggestions,
        excludeStapleIds: stapleIdsOnList,
        medianIntervalByStapleId,
      }),
    [catalogForSuggestions, stapleIdsOnList, medianIntervalByStapleId],
  );

  const dueSoonStapleIds = useMemo(
    () => new Set(dueSoon.map((d) => d.staple.id)),
    [dueSoon],
  );

  const suggestedCatalog = useMemo(
    () => [
      ...catalogForSuggestions.filter(
        (s) =>
          dueSoonStapleIds.has(s.id) &&
          !stapleIdsOnList.has(s.id) &&
          !s.hiddenFromSuggestions &&
          !dismissedSet.has(s.id),
      ),
      ...catalogForSuggestions.filter(
        (s) =>
          !dueSoonStapleIds.has(s.id) &&
          !stapleIdsOnList.has(s.id) &&
          !s.hiddenFromSuggestions &&
          !dismissedSet.has(s.id),
      ),
    ],
    [catalogForSuggestions, dueSoonStapleIds, stapleIdsOnList, dismissedSet],
  );

  const previewSuggestedCatalog = useMemo(
    () => suggestedCatalog.slice(0, SUGGESTION_PREVIEW_LIMIT),
    [suggestedCatalog],
  );
  const visibleSuggestedCatalog = useMemo(
    () => (showAllSuggestions ? suggestedCatalog : previewSuggestedCatalog),
    [previewSuggestedCatalog, showAllSuggestions, suggestedCatalog],
  );
  const hiddenSuggestionCount =
    suggestedCatalog.length - previewSuggestedCatalog.length;

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
        <SuggestedSectionHeader
          count={suggestedCatalog.length}
          expanded={suggestedSectionExpanded}
          onToggle={() => setSuggestedSectionExpanded((current) => !current)}
        />
        {!suggestedSectionExpanded ? null : suggestedCatalog.length === 0 ? (
          <p className="text-muted-foreground text-sm">—</p>
        ) : (
          <>
            <div
              id="shopping-suggested-panel"
              className="flex flex-wrap gap-2"
            >
              {visibleSuggestedCatalog.map((staple) => (
                <SuggestedItemChip
                  key={staple.id}
                  staple={staple}
                  onAdd={() => handleAddFromStaple(staple)}
                  onDismiss={() => dismissSuggested(staple.id)}
                />
              ))}
            </div>
            {hiddenSuggestionCount > 0 ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-muted-foreground mt-1 inline-flex h-8 w-fit items-center gap-1 px-2 text-xs"
                onClick={() => setShowAllSuggestions((current) => !current)}
              >
                {showAllSuggestions ? (
                  <>
                    Show fewer <ChevronUp className="size-3" aria-hidden />
                  </>
                ) : (
                  <>
                    Show {hiddenSuggestionCount} more{" "}
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
