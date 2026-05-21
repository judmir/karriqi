import type { ShoppingListItem } from "@/types/shopping";

/** Stable order within a group using each item's index in `items`. */
function indexOrder(items: ShoppingListItem[]) {
  const indexOf = new Map(items.map((item, index) => [item.id, index]));
  return (a: ShoppingListItem, b: ShoppingListItem) =>
    (indexOf.get(a.id) ?? 0) - (indexOf.get(b.id) ?? 0);
}

/** Unchecked on top, checked on bottom (Apple Notes–style). */
export function sortShoppingListItems(
  items: ShoppingListItem[],
): ShoppingListItem[] {
  const byIndex = indexOrder(items);
  const unchecked = items.filter((i) => !i.checked).sort(byIndex);
  const checked = items.filter((i) => i.checked).sort(byIndex);
  return [...unchecked, ...checked];
}

/**
 * After toggling `toggledId`, place it at the top of its new section:
 * - checked → first row in the checked block (below all unchecked)
 * - unchecked → last row in the unchecked block (above all checked)
 */
export function reorderShoppingListAfterToggle(
  items: ShoppingListItem[],
  toggledId: string,
): ShoppingListItem[] {
  const toggled = items.find((i) => i.id === toggledId);
  if (!toggled) return sortShoppingListItems(items);

  const byIndex = indexOrder(items);
  const unchecked = items.filter((i) => !i.checked && i.id !== toggledId).sort(byIndex);
  const checked = items.filter((i) => i.checked && i.id !== toggledId).sort(byIndex);

  if (toggled.checked) {
    return [...unchecked, toggled, ...checked];
  }
  return [...unchecked, toggled, ...checked];
}

/** Insert a new unchecked item at the bottom of the unchecked block. */
export function insertUncheckedShoppingListItem(
  items: ShoppingListItem[],
  item: ShoppingListItem,
): ShoppingListItem[] {
  const sorted = sortShoppingListItems(items);
  const firstCheckedIdx = sorted.findIndex((i) => i.checked);
  const insertAt = firstCheckedIdx === -1 ? sorted.length : firstCheckedIdx;
  return [
    ...sorted.slice(0, insertAt),
    item,
    ...sorted.slice(insertAt),
  ];
}
