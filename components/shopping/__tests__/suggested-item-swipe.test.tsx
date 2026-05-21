import { fireEvent, render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { SwipeRevealRow } from "@/components/shopping/swipe-reveal-row";

describe("Suggested item swipe", () => {
  beforeAll(() => {
    HTMLElement.prototype.setPointerCapture = vi.fn();
    HTMLElement.prototype.releasePointerCapture = vi.fn();
  });

  it("dismisses a suggested item after a clear left swipe", () => {
    const onDismiss = vi.fn();
    const onTap = vi.fn();

    render(
      <SwipeRevealRow
        deleteLabel="Remove"
        onSwipeDelete={onDismiss}
        onTap={onTap}
      >
        <div>Oat milk</div>
      </SwipeRevealRow>,
    );

    const target = screen.getByText("Oat milk").closest("[data-swipe-row]");
    if (!(target instanceof HTMLElement)) {
      throw new Error("Swipe target was not found.");
    }

    fireEvent.pointerDown(target, { clientX: 100, clientY: 100, pointerId: 1 });
    fireEvent.pointerMove(target, { clientX: 48, clientY: 102, pointerId: 1 });
    fireEvent.pointerUp(target, { clientX: 48, clientY: 102, pointerId: 1 });

    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(onTap).not.toHaveBeenCalled();
  });

  it("does not dismiss during vertical scroll", () => {
    const onDismiss = vi.fn();

    render(
      <SwipeRevealRow deleteLabel="Remove" onSwipeDelete={onDismiss}>
        <div>Bread</div>
      </SwipeRevealRow>,
    );

    const target = screen.getByText("Bread").closest("[data-swipe-row]");
    if (!(target instanceof HTMLElement)) {
      throw new Error("Swipe target was not found.");
    }

    fireEvent.pointerDown(target, { clientX: 100, clientY: 200, pointerId: 1 });
    fireEvent.pointerMove(target, { clientX: 48, clientY: 120, pointerId: 1 });
    fireEvent.pointerUp(target, { clientX: 48, clientY: 120, pointerId: 1 });

    expect(onDismiss).not.toHaveBeenCalled();
  });
});
