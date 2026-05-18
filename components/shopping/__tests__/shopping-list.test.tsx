import { fireEvent, render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { ShoppingList } from "@/components/shopping/shopping-list";
import type { ShoppingListItem } from "@/types/shopping";

const items: ShoppingListItem[] = [
  {
    id: "item-1",
    name: "Milk",
    checked: false,
    addedAt: "2026-05-05T18:00:00.000Z",
  },
];

function getGestureTarget() {
  const row = screen.getByText("Milk").closest("li");
  const target = row?.children.item(1);
  if (!(target instanceof HTMLElement)) {
    throw new Error("Shopping list row gesture target was not found.");
  }
  return target;
}

describe("ShoppingList", () => {
  beforeAll(() => {
    HTMLElement.prototype.setPointerCapture = vi.fn();
    HTMLElement.prototype.releasePointerCapture = vi.fn();
  });

  it("does not remove an item during vertical scroll", () => {
    const onItemsChange = vi.fn();

    render(<ShoppingList items={items} onItemsChange={onItemsChange} />);

    const target = getGestureTarget();
    fireEvent.pointerDown(target, { clientX: 100, clientY: 200, pointerId: 1 });
    fireEvent.pointerMove(target, { clientX: 48, clientY: 120, pointerId: 1 });
    fireEvent.pointerUp(target, { clientX: 48, clientY: 120, pointerId: 1 });

    expect(onItemsChange).not.toHaveBeenCalled();
  });

  it("removes an item after a clear left swipe", () => {
    const onItemsChange = vi.fn();

    render(<ShoppingList items={items} onItemsChange={onItemsChange} />);

    const target = getGestureTarget();
    fireEvent.pointerDown(target, { clientX: 100, clientY: 100, pointerId: 1 });
    fireEvent.pointerMove(target, { clientX: 48, clientY: 102, pointerId: 1 });
    fireEvent.pointerUp(target, { clientX: 48, clientY: 102, pointerId: 1 });

    expect(onItemsChange).toHaveBeenCalledWith([]);
  });

  it("tints the row with the creator's profile color when set", () => {
    const tinted: ShoppingListItem[] = [
      { ...items[0], createdByColor: "rose" },
    ];

    render(<ShoppingList items={tinted} onItemsChange={vi.fn()} />);

    const target = getGestureTarget();
    expect(target.getAttribute("data-creator-color")).toBe("rose");
    expect(target.style.boxShadow).toContain("inset");
  });

  it("does not render a tint for items without a creator color", () => {
    render(<ShoppingList items={items} onItemsChange={vi.fn()} />);

    const target = getGestureTarget();
    expect(target.getAttribute("data-creator-color")).toBeNull();
    expect(target.style.boxShadow).toBe("");
  });
});
