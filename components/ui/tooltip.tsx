"use client";

import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip";
import * as React from "react";

import { cn } from "@/lib/utils";

function TooltipProvider({
  delay = 150,
  closeDelay = 0,
  ...props
}: TooltipPrimitive.Provider.Props) {
  return (
    <TooltipPrimitive.Provider
      delay={delay}
      closeDelay={closeDelay}
      {...props}
    />
  );
}

function Tooltip({ ...props }: TooltipPrimitive.Root.Props) {
  return <TooltipPrimitive.Root data-slot="tooltip" {...props} />;
}

function TooltipTrigger({ ...props }: TooltipPrimitive.Trigger.Props) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />;
}

function TooltipContent({
  align = "center",
  side = "top",
  sideOffset = 6,
  anchor,
  className,
  children,
  ...props
}: TooltipPrimitive.Popup.Props &
  Pick<
    TooltipPrimitive.Positioner.Props,
    "align" | "side" | "sideOffset" | "anchor"
  >) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Positioner
        className="isolate z-50 outline-none"
        align={align}
        side={side}
        sideOffset={sideOffset}
        anchor={anchor}
      >
        <TooltipPrimitive.Popup
          data-slot="tooltip-content"
          className={cn(
            "z-50 origin-(--transform-origin) rounded-md bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground shadow-md duration-150 outline-none data-[side=bottom]:slide-in-from-top-1 data-[side=left]:slide-in-from-right-1 data-[side=right]:slide-in-from-left-1 data-[side=top]:slide-in-from-bottom-1 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            className,
          )}
          {...props}
        >
          <TooltipPrimitive.Arrow
            data-slot="tooltip-arrow"
            className={cn(
              "size-0",
              "data-[side=top]:border-x-[5px] data-[side=top]:border-x-transparent data-[side=top]:border-t-[6px] data-[side=top]:border-t-primary",
              "data-[side=bottom]:border-x-[5px] data-[side=bottom]:border-x-transparent data-[side=bottom]:border-b-[6px] data-[side=bottom]:border-b-primary",
              "data-[side=left]:border-y-[5px] data-[side=left]:border-y-transparent data-[side=left]:border-l-[6px] data-[side=left]:border-l-primary",
              "data-[side=right]:border-y-[5px] data-[side=right]:border-y-transparent data-[side=right]:border-r-[6px] data-[side=right]:border-r-primary",
            )}
          />
          {children}
        </TooltipPrimitive.Popup>
      </TooltipPrimitive.Positioner>
    </TooltipPrimitive.Portal>
  );
}

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger };
