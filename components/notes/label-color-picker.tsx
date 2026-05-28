"use client";

import { useState } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { labelDotClass } from "@/lib/notes/label-styles";
import { cn } from "@/lib/utils";
import { NOTE_LABEL_COLORS, type NoteLabelColor } from "@/types/notes";

export function LabelColorPicker({
  value,
  onChange,
  className,
  size = "md",
}: {
  value: NoteLabelColor;
  onChange: (color: NoteLabelColor) => void;
  className?: string;
  size?: "sm" | "md";
}) {
  const dotSize = size === "sm" ? "size-5" : "size-6";

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {NOTE_LABEL_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          aria-label={`Color ${color}`}
          aria-pressed={value === color}
          className={cn(
            dotSize,
            "cursor-pointer rounded-full ring-offset-2 ring-offset-popover transition",
            labelDotClass[color],
            value === color
              ? "ring-2 ring-foreground"
              : "opacity-80 hover:opacity-100",
          )}
          onClick={() => onChange(color)}
        />
      ))}
    </div>
  );
}

export function LabelColorDot({
  color,
  className,
  size = "md",
}: {
  color: NoteLabelColor;
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-full",
        size === "sm" ? "size-2.5" : "size-3",
        labelDotClass[color],
        className,
      )}
      aria-hidden
    />
  );
}

/** Color bullet that opens a dropdown palette (works inside dialogs). */
export function LabelColorBulletButton({
  color,
  onColorChange,
  "aria-label": ariaLabel,
}: {
  color: NoteLabelColor;
  onColorChange: (color: NoteLabelColor) => void;
  "aria-label"?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        type="button"
        className="hover:bg-muted cursor-pointer flex size-8 shrink-0 items-center justify-center rounded-md transition"
        aria-label={ariaLabel ?? "Change label color"}
      >
        <LabelColorDot color={color} size="md" className="size-3" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-auto p-3">
        <LabelColorPicker
          value={color}
          size="sm"
          onChange={(next) => {
            onColorChange(next);
            setOpen(false);
          }}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
