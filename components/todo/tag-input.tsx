"use client";

import { Search } from "lucide-react";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DEFAULT_TODO_TAG_ICON,
  filterTodoTagIcons,
  TODO_TAG_ICON_COLOR,
  todoTagIconComponent,
} from "@/lib/todo/tag-icons";
import { cn } from "@/lib/utils";
import type { TodoTag } from "@/types/todo";

function tagMatchesQuery(tag: TodoTag, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return false;
  return tag.label.toLowerCase().includes(q);
}

export function TagInput({
  label,
  icon,
  existingTags,
  onLabelChange,
  onIconChange,
  disabled = false,
  inputId,
}: {
  label: string;
  icon: string;
  existingTags: TodoTag[];
  onLabelChange: (label: string) => void;
  onIconChange: (icon: string) => void;
  disabled?: boolean;
  inputId?: string;
}) {
  const fallbackId = useId();
  const textInputId = inputId ?? fallbackId;
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const [iconSearch, setIconSearch] = useState("");
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  const SelectedIcon = todoTagIconComponent(icon);
  const filteredIcons = useMemo(
    () => filterTodoTagIcons(iconSearch),
    [iconSearch],
  );

  const suggestions = useMemo(() => {
    if (!label.trim()) return [];
    return existingTags.filter((tag) => tagMatchesQuery(tag, label));
  }, [existingTags, label]);

  useEffect(() => {
    setHighlightIndex(0);
  }, [label, suggestions.length]);

  useEffect(() => {
    const exact = existingTags.find(
      (tag) => tag.label.toLowerCase() === label.trim().toLowerCase(),
    );
    if (exact && exact.icon !== icon) {
      onIconChange(exact.icon);
    }
  }, [existingTags, icon, label, onIconChange]);

  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setSuggestionsOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  function selectTag(tag: TodoTag) {
    onLabelChange(tag.label);
    onIconChange(tag.icon);
    setSuggestionsOpen(false);
  }

  function onTextChange(next: string) {
    onLabelChange(next);
    const trimmed = next.trim();
    if (!trimmed) {
      setSuggestionsOpen(false);
      return;
    }
    const hasMatch = existingTags.some((tag) => tagMatchesQuery(tag, next));
    setSuggestionsOpen(hasMatch);
  }

  function onTextKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!suggestionsOpen || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((i) => (i + 1) % suggestions.length);
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex(
        (i) => (i - 1 + suggestions.length) % suggestions.length,
      );
      return;
    }
    if (e.key === "Enter" && suggestions[highlightIndex]) {
      e.preventDefault();
      selectTag(suggestions[highlightIndex]!);
      return;
    }
    if (e.key === "Escape") {
      setSuggestionsOpen(false);
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <div
        className={cn(
          "border-input bg-background flex h-8 w-full overflow-hidden rounded-lg border",
          "focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50",
          "dark:bg-input/30",
          disabled && "pointer-events-none opacity-50",
        )}
      >
        <Popover
          open={iconPickerOpen}
          onOpenChange={(open) => {
            setIconPickerOpen(open);
            if (!open) setIconSearch("");
          }}
        >
          <PopoverTrigger
            type="button"
            disabled={disabled}
            aria-label="Choose tag icon"
            className={cn(
              "border-input hover:bg-muted/60",
              "inline-flex h-full w-9 shrink-0 items-center justify-center border-r transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
            )}
          >
            <SelectedIcon
              className="size-4"
              style={{ color: TODO_TAG_ICON_COLOR }}
              aria-hidden
            />
          </PopoverTrigger>
          <PopoverContent align="start" className="w-72 p-3">
            <div className="space-y-3">
              <div className="relative">
                <Search
                  className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2"
                  aria-hidden
                />
                <Input
                  autoFocus
                  value={iconSearch}
                  onChange={(e) => setIconSearch(e.target.value)}
                  placeholder="Search icons…"
                  className="h-8 pl-8"
                  aria-label="Search icons"
                />
              </div>
              <div className="grid max-h-52 grid-cols-4 gap-1 overflow-y-auto">
                {filteredIcons.map((option) => {
                  const Icon = option.Icon;
                  const selected = option.key === icon;
                  return (
                    <button
                      key={option.key}
                      type="button"
                      title={option.label}
                      aria-label={option.label}
                      aria-pressed={selected}
                      onClick={() => {
                        onIconChange(option.key);
                        setIconPickerOpen(false);
                        setIconSearch("");
                      }}
                      className={cn(
                        "inline-flex aspect-square items-center justify-center rounded-lg transition-colors",
                        "hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        selected
                          ? "bg-[#F66500]/15 ring-[#F66500]/30 ring-1"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <Icon
                        className="size-4"
                        style={selected ? { color: TODO_TAG_ICON_COLOR } : undefined}
                        aria-hidden
                      />
                    </button>
                  );
                })}
              </div>
              {filteredIcons.length === 0 ? (
                <p className="text-muted-foreground text-center text-xs">
                  No icons match your search.
                </p>
              ) : null}
            </div>
          </PopoverContent>
        </Popover>

        <input
          id={textInputId}
          type="text"
          value={label}
          disabled={disabled}
          placeholder="Tag name"
          autoComplete="off"
          onChange={(e) => onTextChange(e.target.value)}
          onFocus={() => {
            if (label.trim() && suggestions.length > 0) {
              setSuggestionsOpen(true);
            }
          }}
          onKeyDown={onTextKeyDown}
          className={cn(
            "placeholder:text-muted-foreground min-w-0 flex-1 bg-transparent px-2.5 text-sm outline-none",
          )}
        />
      </div>

      {suggestionsOpen && suggestions.length > 0 ? (
        <ul
          role="listbox"
          aria-label="Existing tags"
          className="border-border bg-popover absolute top-[calc(100%+4px)] z-50 w-full overflow-hidden rounded-lg border shadow-md"
        >
          {suggestions.map((tag, index) => {
            const TagIcon = todoTagIconComponent(tag.icon);
            const highlighted = index === highlightIndex;
            return (
              <li key={tag.id} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={highlighted}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => selectTag(tag)}
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors",
                    highlighted
                      ? "bg-muted text-foreground"
                      : "text-foreground hover:bg-muted/70",
                  )}
                >
                  <TagIcon
                    className="size-4 shrink-0"
                    style={{ color: TODO_TAG_ICON_COLOR }}
                    aria-hidden
                  />
                  <span className="truncate">{tag.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

export function TodoTagChip({
  label,
  icon,
  className,
}: {
  label: string;
  icon?: string | null;
  className?: string;
}) {
  const TagIcon = todoTagIconComponent(icon ?? DEFAULT_TODO_TAG_ICON);
  return (
    <span
      className={cn(
        "inline-flex w-fit max-w-full shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-border px-2 py-0.5",
        "text-xs font-medium whitespace-nowrap text-foreground",
        "transition-[color,box-shadow]",
        "[&>svg]:pointer-events-none [&>svg]:size-3",
        className,
      )}
      title={label}
    >
      <TagIcon style={{ color: TODO_TAG_ICON_COLOR }} aria-hidden />
      <span className="truncate">{label}</span>
    </span>
  );
}
