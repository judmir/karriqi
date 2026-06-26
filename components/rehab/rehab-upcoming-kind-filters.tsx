"use client";

import { CirclePlus, Search, X } from "lucide-react";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { rehabEventKindPickerVisual } from "@/lib/rehab/rehab-event-kind-visual";
import {
  UPCOMING_KIND_FILTER_IDS,
  UPCOMING_KIND_FILTERS,
  type UpcomingKindFilterId,
} from "@/lib/rehab/rehab-upcoming-utils";
import { cn } from "@/lib/utils";

const MAX_VISIBLE_BADGES = 2;

export function RehabUpcomingKindFilters({
  selected,
  onChange,
}: {
  selected: UpcomingKindFilterId[];
  onChange: (next: UpcomingKindFilterId[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const visibleOptions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return UPCOMING_KIND_FILTER_IDS;
    }
    return UPCOMING_KIND_FILTER_IDS.filter((id) =>
      UPCOMING_KIND_FILTERS[id].label.toLowerCase().includes(normalized),
    );
  }, [query]);

  const selectedLabels = selected.map((id) => UPCOMING_KIND_FILTERS[id].label);

  function toggle(id: UpcomingKindFilterId) {
    onChange(
      selected.includes(id)
        ? selected.filter((item) => item !== id)
        : [...selected, id],
    );
  }

  function clearAll() {
    onChange([]);
    setQuery("");
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 border-dashed"
            />
          }
        >
          <CirclePlus className="text-muted-foreground" aria-hidden />
          Type
          {selected.length > 0 ? (
            <>
              <Separator
                orientation="vertical"
                className="mx-0.5 hidden h-4 sm:block"
              />
              <div className="hidden items-center gap-1 sm:flex">
                {selectedLabels.length > MAX_VISIBLE_BADGES ? (
                  <Badge variant="secondary" className="rounded-sm px-1.5 font-normal">
                    {selected.length} selected
                  </Badge>
                ) : (
                  selectedLabels.map((label) => (
                    <Badge
                      key={label}
                      variant="secondary"
                      className="rounded-sm px-1.5 font-normal"
                    >
                      {label}
                    </Badge>
                  ))
                )}
              </div>
              <Badge
                variant="secondary"
                className="rounded-sm px-1.5 font-normal sm:hidden"
              >
                {selected.length}
              </Badge>
            </>
          ) : null}
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0" align="start" sideOffset={6}>
          <div className="border-border border-b p-2">
            <div className="relative">
              <Search
                className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2"
                aria-hidden
              />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Type"
                className="h-8 border-transparent bg-transparent pl-8 text-sm shadow-none"
                aria-label="Search task types"
              />
            </div>
          </div>
          <div
            className="max-h-64 overflow-y-auto p-1"
            role="listbox"
            aria-label="Task types"
            aria-multiselectable="true"
          >
            {visibleOptions.length === 0 ? (
              <p className="text-muted-foreground px-2 py-6 text-center text-sm">
                No types found.
              </p>
            ) : (
              visibleOptions.map((id) => {
                const { label, kinds } = UPCOMING_KIND_FILTERS[id];
                const visual = rehabEventKindPickerVisual(kinds[0]!);
                const Icon = visual.icon;
                const checked = selected.includes(id);

                return (
                  <div
                    key={id}
                    role="option"
                    aria-selected={checked}
                    tabIndex={0}
                    onClick={() => toggle(id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        toggle(id);
                      }
                    }}
                    className={cn(
                      "hover:bg-muted/70 flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                      checked && "bg-muted/50",
                    )}
                  >
                    <Checkbox
                      checked={checked}
                      tabIndex={-1}
                      aria-hidden
                      className="pointer-events-none"
                    />
                    <Icon
                      className="size-3.5 shrink-0"
                      style={{ color: visual.hex }}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1 truncate">{label}</span>
                  </div>
                );
              })
            )}
          </div>
          {selected.length > 0 ? (
            <div className="border-border border-t p-1">
              <button
                type="button"
                onClick={clearAll}
                className="text-muted-foreground hover:text-foreground w-full rounded-md px-2 py-1.5 text-center text-sm transition-colors"
              >
                Clear filters
              </button>
            </div>
          ) : null}
        </PopoverContent>
      </Popover>

      {selected.length > 0 ? (
        <button
          type="button"
          onClick={clearAll}
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "text-muted-foreground hover:text-foreground h-8 px-2 lg:px-3",
          )}
        >
          Reset
          <X className="size-3.5" aria-hidden />
        </button>
      ) : null}
    </div>
  );
}
