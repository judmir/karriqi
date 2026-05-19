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
  const target = row?.querySelector("[data-swipe-row]");
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

  it("toggles checked state when the checkbox is clicked", () => {
    const onItemsChange = vi.fn();

    render(<ShoppingList items={items} onItemsChange={onItemsChange} />);

    fireEvent.click(screen.getByRole("checkbox", { name: "Got Milk" }));

    expect(onItemsChange).toHaveBeenCalledWith([
      { ...items[0], checked: true },
    ]);
  });

  it("promotes an item to suggested after a clear right swipe", () => {
    const onItemsChange = vi.fn();
    const onPromoteToSuggested = vi.fn();

    render(
      <ShoppingList
        items={items}
        onItemsChange={onItemsChange}
        onPromoteToSuggested={onPromoteToSuggested}
      />,
    );

    const target = getGestureTarget();
    fireEvent.pointerDown(target, { clientX: 40, clientY: 100, pointerId: 1 });
    fireEvent.pointerMove(target, { clientX: 100, clientY: 102, pointerId: 1 });
    fireEvent.pointerUp(target, { clientX: 100, clientY: 102, pointerId: 1 });

    expect(onPromoteToSuggested).toHaveBeenCalledWith("item-1");
  });
});
