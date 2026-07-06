"use client";

import { ExternalLink } from "lucide-react";

import {
  furnitureShoppingUrl,
  shoppingLinkLabel,
} from "@/lib/home/shopping-links";
import type { RoomLayout } from "@/types/home";

/** Furniture of the selected design with links to buy each suggested product. */
export function FurnitureShoppingList({ layout }: { layout: RoomLayout }) {
  if (layout.furniture.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        This design has no furniture yet.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {layout.furniture.map((item, i) => {
        const url = furnitureShoppingUrl(item);
        return (
          <li
            key={`${item.label}-${i}`}
            className="border-border flex items-center justify-between gap-3 rounded-lg border p-3"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{item.label}</p>
              <p className="text-muted-foreground mt-0.5 text-xs">
                {item.widthCm} × {item.depthCm} cm
                {item.product ? (
                  <>
                    {" · "}
                    {item.retailer ? `${item.retailer} ` : ""}
                    {item.product}
                  </>
                ) : null}
                {item.color ? ` · ${item.color}` : null}
              </p>
            </div>
            {url ? (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary inline-flex shrink-0 items-center gap-1 text-xs font-medium hover:underline"
              >
                {shoppingLinkLabel(item)}
                <ExternalLink className="size-3" aria-hidden />
              </a>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
