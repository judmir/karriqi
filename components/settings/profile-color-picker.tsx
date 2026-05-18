"use client";

import { Check, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { updateProfileColor } from "@/lib/auth/profile-actions";
import { PROFILE_COLORS, type ProfileColorId } from "@/lib/profile/colors";
import { cn } from "@/lib/utils";

export function ProfileColorPicker({
  initialColorId,
}: {
  initialColorId: ProfileColorId | null;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<ProfileColorId | null>(
    initialColorId,
  );
  const [pending, startTransition] = useTransition();

  function choose(next: ProfileColorId | null) {
    if (next === selected) return;
    const prev = selected;
    setSelected(next);
    startTransition(() => {
      void (async () => {
        const r = await updateProfileColor(next);
        if (!r.ok) {
          setSelected(prev);
          toast.error(r.message);
          return;
        }
        toast.success(
          next === null ? "Color cleared." : "Profile color saved.",
        );
        router.refresh();
      })();
    });
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <p className="text-foreground text-sm font-medium">Profile color</p>
        <p className="text-muted-foreground text-xs leading-relaxed">
          Items you add to the shared shopping list are highlighted with this
          color so your household can see who added what.
        </p>
      </div>
      <div
        role="radiogroup"
        aria-label="Profile color"
        className="flex flex-wrap items-center gap-2"
      >
        {PROFILE_COLORS.map((color) => {
          const isSelected = color.id === selected;
          return (
            <button
              key={color.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={color.name}
              disabled={pending}
              onClick={() => choose(color.id)}
              className={cn(
                "focus-visible:ring-ring relative inline-flex size-8 cursor-pointer items-center justify-center rounded-full border transition-transform focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60",
                isSelected
                  ? "border-foreground/80 scale-110"
                  : "border-border/60 hover:scale-105",
              )}
              style={{ backgroundColor: color.swatch }}
              title={color.name}
            >
              {isSelected ? (
                <Check
                  className="size-4 text-white drop-shadow"
                  aria-hidden
                />
              ) : null}
            </button>
          );
        })}
        <button
          type="button"
          aria-label="No color"
          aria-pressed={selected === null}
          disabled={pending}
          onClick={() => choose(null)}
          className={cn(
            "focus-visible:ring-ring text-muted-foreground hover:text-foreground inline-flex size-8 cursor-pointer items-center justify-center rounded-full border border-dashed transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60",
            selected === null
              ? "border-foreground/60 text-foreground"
              : "border-border/60",
          )}
          title="No color"
        >
          <X className="size-3.5" aria-hidden />
        </button>
      </div>
    </div>
  );
}
