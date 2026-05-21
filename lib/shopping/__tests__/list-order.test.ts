import { describe, expect, it } from "vitest";

import {
  insertUncheckedShoppingListItem,
  reorderShoppingListAfterToggle,
  sortShoppingListItems,
} from "@/lib/shopping/list-order";
import type { ShoppingListItem } from "@/types/shopping";

function item(
  id: string,
  name: string,
  checked: boolean,
): ShoppingListItem {
  return {
    id,
    name,
    checked,
    addedAt: "2026-05-05T18:00:00.000Z",
  };
}

describe("sortShoppingListItems", () => {
  it("places unchecked items before checked items", () => {
    const items = [
      item("c", "Cheese", true),
      item("a", "Apples", false),
      item("b", "Bread", true),
    ];
    expect(sortShoppingListItems(items).map((i) => i.id)).toEqual([
      "a",
      "c",
      "b",
    ]);
  });
});

describe("reorderShoppingListAfterToggle", () => {
  it("moves a newly checked item to the top of the checked block", () => {
    const items = [
      item("a", "Apples", false),
      item("b", "Bread", false),
      item("c", "Cheese", true),
    ];
    const toggled = items.map((i) =>
      i.id === "b" ? { ...i, checked: true } : i,
    );
    expect(
      reorderShoppingListAfterToggle(toggled, "b").map((i) => i.id),
    ).toEqual(["a", "b", "c"]);
  });

  it("moves an unchecked item to the bottom of the unchecked block", () => {
    const items = [
      item("a", "Apples", false),
      item("b", "Bread", true),
      item("c", "Cheese", true),
    ];
    const toggled = items.map((i) =>
      i.id === "c" ? { ...i, checked: false } : i,
    );
    expect(
      reorderShoppingListAfterToggle(toggled, "c").map((i) => i.id),
    ).toEqual(["a", "c", "b"]);
  });
});

describe("insertUncheckedShoppingListItem", () => {
  it("appends before the checked section", () => {
    const items = [item("a", "Apples", false), item("b", "Bread", true)];
    const next = insertUncheckedShoppingListItem(items, item("c", "Milk", false));
    expect(next.map((i) => i.id)).toEqual(["a", "c", "b"]);
  });
});
