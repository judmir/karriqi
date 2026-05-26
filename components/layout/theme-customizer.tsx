"use client";

import { Ban, ChevronDown, Palette } from "lucide-react";
import { useTransition, type ReactNode } from "react";
import { toast } from "sonner";

import { updateThemeAppearance } from "@/lib/auth/appearance-actions";
import { useAppearance } from "@/components/providers/appearance-provider";
import { useMainLayoutUser } from "@/components/layout/main-layout-user-context";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { sanitizeAppearanceState } from "@/lib/theme/appearance";
import { cn } from "@/lib/utils";

type SegmentedOption<T extends string> = {
  value: T;
  label: string;
  icon?: ReactNode;
  iconOnly?: boolean;
};

function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  className,
}: {
  value: T;
  options: readonly SegmentedOption<T>[];
  onChange: (next: T) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid overflow-hidden rounded-lg border border-border bg-background",
        className,
      )}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((option, index) => {
        const selected = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            className={cn(
              "flex h-10 items-center justify-center gap-1.5 px-3 text-sm transition-colors",
              index > 0 && "border-l border-border",
              selected
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
            )}
            aria-pressed={selected}
            aria-label={option.label}
            onClick={() => onChange(option.value)}
          >
            {option.icon ? option.icon : null}
            <span className={cn(option.iconOnly && "sr-only")}>
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function CustomizerSection({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-foreground">{label}</p>
      {children}
    </div>
  );
}

const scaleOptions = [
  {
    value: "default",
    label: "Default",
    icon: <Ban className="size-4" />,
    iconOnly: true,
  },
  { value: "xs", label: "XS" },
  { value: "lg", label: "LG" },
] as const;

const radiusOptions = [
  {
    value: "default",
    label: "Default",
    icon: <Ban className="size-4" />,
    iconOnly: true,
  },
  { value: "sm", label: "SM" },
  { value: "md", label: "MD" },
  { value: "lg", label: "LG" },
  { value: "xl", label: "XL" },
] as const;

export function ThemeCustomizer() {
  const [, startTransition] = useTransition();
  const { appearance, resetAppearance, updateAppearance } = useAppearance();
  const { userId } = useMainLayoutUser();

  function saveAppearance(nextAppearance: typeof appearance) {
    if (!userId) {
      return;
    }

    startTransition(() => {
      void (async () => {
        const result = await updateThemeAppearance(nextAppearance);
        if (!result.ok) {
          toast.error(result.message);
        }
      })();
    });
  }

  function applyPatch(patch: Partial<typeof appearance>) {
    const nextAppearance = sanitizeAppearanceState({
      ...appearance,
      ...patch,
    });
    updateAppearance(patch);
    saveAppearance(nextAppearance);
  }

  function resetAndSave() {
    resetAppearance();
    saveAppearance(sanitizeAppearanceState({}));
  }

  return (
    <Popover>
      <PopoverTrigger
        className={cn(
          "ring-offset-background focus-visible:ring-ring inline-flex size-9 items-center justify-center rounded-full outline-none transition-colors focus-visible:ring-2 focus-visible:ring-offset-2",
          "text-muted-foreground hover:bg-muted hover:text-foreground",
        )}
        aria-label="Theme customizer"
      >
        <Palette className="size-4" aria-hidden />
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[calc(100vw-1rem)] max-w-[22rem] rounded-2xl border border-border bg-popover p-4 shadow-xl"
      >
        <div className="space-y-4">
          <CustomizerSection label="Theme preset:">
            <button
              type="button"
              className="flex h-10 w-full items-center justify-between rounded-lg border border-border bg-background px-3 text-left text-sm text-foreground"
              disabled
            >
              <span>{appearance.preset === "default" ? "Default" : appearance.preset}</span>
              <ChevronDown className="size-4 text-muted-foreground" aria-hidden />
            </button>
          </CustomizerSection>

          <CustomizerSection label="Scale:">
            <SegmentedControl
              value={appearance.scale}
              options={scaleOptions}
              onChange={(scale) => applyPatch({ scale })}
            />
          </CustomizerSection>

          <CustomizerSection label="Radius:">
            <SegmentedControl
              value={appearance.radius}
              options={radiusOptions}
              onChange={(radius) => applyPatch({ radius })}
            />
          </CustomizerSection>

          <Button
            type="button"
            variant="outline"
            className="w-full justify-center"
            onClick={resetAndSave}
          >
            Reset to Default
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
