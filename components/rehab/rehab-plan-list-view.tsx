"use client";

import { ChevronDown, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { RehabMarkdown } from "@/components/rehab/rehab-markdown";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { REHAB_PLAN_CATALOG_ROOT_ID } from "@/modules/rehab/neuro-rehab-2026/plan-catalog";
import { cn } from "@/lib/utils";
import { useRehabPlanListStore } from "@/stores/rehab-plan-list-store";
import type { RehabPlanListItem } from "@/types/rehab";

type FilterTab = "all" | "todo" | "done";

type TaskGroup = {
  label: string | null;
  tasks: RehabPlanListItem[];
};

const textareaClassName = cn(
  "border-input bg-background placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30",
  "min-h-20 w-full resize-y rounded-lg border px-3 py-2 text-sm leading-relaxed outline-none transition-colors focus-visible:ring-3",
);

const filterTabs: { id: FilterTab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "todo", label: "To do" },
  { id: "done", label: "Done" },
];

function buildChildrenMap(items: RehabPlanListItem[]) {
  const map = new Map<string | null, RehabPlanListItem[]>();
  for (const item of items) {
    const bucket = map.get(item.parentId) ?? [];
    bucket.push(item);
    map.set(item.parentId, bucket);
  }
  for (const bucket of map.values()) {
    bucket.sort((a, b) => a.sortOrder - b.sortOrder);
  }
  return map;
}

function collectTasks(
  sectionId: string,
  childrenMap: Map<string | null, RehabPlanListItem[]>,
): RehabPlanListItem[] {
  const tasks: RehabPlanListItem[] = [];
  for (const child of childrenMap.get(sectionId) ?? []) {
    if (child.kind === "task") {
      tasks.push(child);
    } else if (child.kind === "section") {
      tasks.push(...collectTasks(child.id, childrenMap));
    }
  }
  return tasks;
}

function collectGuides(
  sectionId: string,
  childrenMap: Map<string | null, RehabPlanListItem[]>,
): RehabPlanListItem[] {
  const guides: RehabPlanListItem[] = [];
  for (const child of childrenMap.get(sectionId) ?? []) {
    if (child.kind === "guide") {
      guides.push(child);
    } else if (child.kind === "section") {
      guides.push(...collectGuides(child.id, childrenMap));
    }
  }
  return guides;
}

function getTaskGroups(
  sectionId: string,
  childrenMap: Map<string | null, RehabPlanListItem[]>,
): TaskGroup[] {
  const groups: TaskGroup[] = [];
  let loose: RehabPlanListItem[] = [];

  for (const child of childrenMap.get(sectionId) ?? []) {
    if (child.kind === "task") {
      loose.push(child);
    } else if (child.kind === "section") {
      if (loose.length > 0) {
        groups.push({ label: null, tasks: loose });
        loose = [];
      }
      const tasks = collectTasks(child.id, childrenMap);
      if (tasks.length > 0) {
        groups.push({ label: child.title, tasks });
      }
    }
  }

  if (loose.length > 0) {
    groups.push({ label: null, tasks: loose });
  }

  return groups;
}

function itemMatchesQuery(item: RehabPlanListItem, query: string): boolean {
  const haystack = `${item.title} ${item.body} ${item.notes}`.toLowerCase();
  return haystack.includes(query);
}

function taskMatchesFilter(task: RehabPlanListItem, tab: FilterTab): boolean {
  const done = Boolean(task.completedAt);
  if (tab === "todo") {
    return !done;
  }
  if (tab === "done") {
    return done;
  }
  return true;
}

function PlanItemNotes({
  itemId,
  notes,
  onSave,
}: {
  itemId: string;
  notes: string;
  onSave: (itemId: string, notes: string) => void;
}) {
  const [draft, setDraft] = useState(notes);

  useEffect(() => {
    setDraft(notes);
  }, [notes]);

  return (
    <div className="space-y-1.5 pt-3">
      <Label htmlFor={`plan-notes-${itemId}`} className="text-muted-foreground text-xs">
        Notes
      </Label>
      <textarea
        id={`plan-notes-${itemId}`}
        className={textareaClassName}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => {
          if (draft !== notes) {
            onSave(itemId, draft);
          }
        }}
        placeholder="Dates, results, links…"
      />
    </div>
  );
}

function PlanTaskCard({
  task,
  expanded,
  onToggleExpanded,
  onToggleCompleted,
  onSaveNotes,
}: {
  task: RehabPlanListItem;
  expanded: boolean;
  onToggleExpanded: (id: string) => void;
  onToggleCompleted: (id: string, completed: boolean) => void;
  onSaveNotes: (id: string, notes: string) => void;
}) {
  const completed = Boolean(task.completedAt);

  return (
    <div className="bg-card border-border rounded-xl border p-3 shadow-sm sm:p-4">
      <div className="flex items-start gap-3">
        <Checkbox
          checked={completed}
          onCheckedChange={(checked) =>
            onToggleCompleted(task.id, checked === true)
          }
          className="mt-1 shrink-0 cursor-pointer"
          aria-label={`Mark ${task.title} complete`}
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <button
              type="button"
              className={cn(
                "min-w-0 flex-1 text-left text-sm font-medium leading-snug",
                completed && "text-muted-foreground line-through",
              )}
              onClick={() => onToggleExpanded(task.id)}
            >
              {task.title}
            </button>

            <div className="flex shrink-0 items-center gap-2">
              <Badge
                variant={completed ? "secondary" : "outline"}
                className={cn(
                  !completed &&
                    "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
                )}
              >
                {completed ? "Done" : "To do"}
              </Badge>
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground cursor-pointer rounded-md p-0.5 transition-colors"
                aria-expanded={expanded}
                aria-label="Toggle details"
                onClick={() => onToggleExpanded(task.id)}
              >
                <ChevronDown
                  className={cn(
                    "size-4 transition-transform",
                    !expanded && "-rotate-90",
                  )}
                />
              </button>
            </div>
          </div>

          {expanded ? (
            <div className="animate-in fade-in-0 slide-in-from-top-1 pt-2 duration-200">
              {task.body.trim() ? (
                <RehabMarkdown content={task.body} className="text-sm" />
              ) : null}
              <PlanItemNotes
                itemId={task.id}
                notes={task.notes}
                onSave={onSaveNotes}
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function PlanGuideCard({ guide }: { guide: RehabPlanListItem }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-muted/30 border-border/60 rounded-lg border px-3 py-2">
      <button
        type="button"
        className="text-muted-foreground flex w-full cursor-pointer items-center justify-between gap-2 text-left text-xs"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        <span>{guide.title}</span>
        <ChevronDown
          className={cn("size-3.5 shrink-0 transition-transform", !open && "-rotate-90")}
        />
      </button>
      {open ? (
        <RehabMarkdown content={guide.body} className="mt-2 text-sm" />
      ) : null}
    </div>
  );
}

function PlanSectionBlock({
  section,
  childrenMap,
  expanded,
  onToggle,
  filterTab,
  query,
  expandedTasks,
  onToggleTask,
  onToggleCompleted,
  onSaveNotes,
}: {
  section: RehabPlanListItem;
  childrenMap: Map<string | null, RehabPlanListItem[]>;
  expanded: boolean;
  onToggle: (id: string) => void;
  filterTab: FilterTab;
  query: string;
  expandedTasks: Set<string>;
  onToggleTask: (id: string) => void;
  onToggleCompleted: (id: string, completed: boolean) => void;
  onSaveNotes: (id: string, notes: string) => void;
}) {
  const allTasks = useMemo(
    () => collectTasks(section.id, childrenMap),
    [section.id, childrenMap],
  );
  const guides = useMemo(
    () => collectGuides(section.id, childrenMap),
    [section.id, childrenMap],
  );
  const groups = useMemo(
    () => getTaskGroups(section.id, childrenMap),
    [section.id, childrenMap],
  );

  const visibleTasks = useMemo(() => {
    return allTasks.filter(
      (task) =>
        taskMatchesFilter(task, filterTab) &&
        (!query || itemMatchesQuery(task, query)),
    );
  }, [allTasks, filterTab, query]);

  const doneCount = allTasks.filter((task) => task.completedAt).length;

  if (visibleTasks.length === 0 && query) {
    return null;
  }

  if (allTasks.length === 0 && guides.length === 0) {
    return null;
  }

  return (
    <section className="space-y-2">
      <button
        type="button"
        className="hover:bg-muted/40 flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg px-1 py-2 text-left transition-colors"
        onClick={() => onToggle(section.id)}
        aria-expanded={expanded}
      >
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold">{section.title}</h2>
          {allTasks.length > 0 ? (
            <p className="text-muted-foreground mt-0.5 text-xs">
              {doneCount} of {allTasks.length} done
            </p>
          ) : null}
        </div>
        <ChevronDown
          className={cn(
            "text-muted-foreground size-4 shrink-0 transition-transform",
            !expanded && "-rotate-90",
          )}
        />
      </button>

      {expanded ? (
        <div className="space-y-3 pb-2 pl-1">
          {groups.map((group) => {
            const tasks = group.tasks.filter(
              (task) =>
                taskMatchesFilter(task, filterTab) &&
                (!query || itemMatchesQuery(task, query)),
            );
            if (tasks.length === 0) {
              return null;
            }

            return (
              <div key={group.label ?? "default"} className="space-y-2">
                {group.label ? (
                  <p className="text-muted-foreground px-1 text-xs font-medium">
                    {group.label}
                  </p>
                ) : null}
                {tasks.map((task) => (
                  <PlanTaskCard
                    key={task.id}
                    task={task}
                    expanded={expandedTasks.has(task.id)}
                    onToggleExpanded={onToggleTask}
                    onToggleCompleted={onToggleCompleted}
                    onSaveNotes={onSaveNotes}
                  />
                ))}
              </div>
            );
          })}

          {guides.length > 0 ? (
            <div className="space-y-2 pt-1">
              {guides.map((guide) => (
                <PlanGuideCard key={guide.id} guide={guide} />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function PlanGuideSection({
  guide,
  expanded,
  onToggle,
}: {
  guide: RehabPlanListItem;
  expanded: boolean;
  onToggle: (id: string) => void;
}) {
  return (
    <section className="space-y-2">
      <button
        type="button"
        className="hover:bg-muted/40 flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg px-1 py-2 text-left transition-colors"
        onClick={() => onToggle(guide.id)}
        aria-expanded={expanded}
      >
        <h2 className="text-sm font-semibold">{guide.title}</h2>
        <ChevronDown
          className={cn(
            "text-muted-foreground size-4 shrink-0 transition-transform",
            !expanded && "-rotate-90",
          )}
        />
      </button>
      {expanded ? (
        <div className="bg-card border-border rounded-xl border p-4 shadow-sm">
          <RehabMarkdown content={guide.body} className="text-sm" />
        </div>
      ) : null}
    </section>
  );
}

export function RehabPlanListView() {
  const items = useRehabPlanListStore((state) => state.items);
  const toggleCompleted = useRehabPlanListStore((state) => state.toggleCompleted);
  const updateNotes = useRehabPlanListStore((state) => state.updateNotes);

  const { doneCount, taskCount } = useMemo(() => {
    let done = 0;
    let total = 0;
    for (const item of items) {
      if (item.kind !== "task") {
        continue;
      }
      total += 1;
      if (item.completedAt) {
        done += 1;
      }
    }
    return { doneCount: done, taskCount: total };
  }, [items]);

  const [filterTab, setFilterTab] = useState<FilterTab>("all");
  const [query, setQuery] = useState("");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    () => new Set(),
  );
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(
    () => new Set(),
  );

  const childrenMap = useMemo(() => buildChildrenMap(items), [items]);
  const topLevel = useMemo(
    () => childrenMap.get(REHAB_PLAN_CATALOG_ROOT_ID) ?? [],
    [childrenMap],
  );

  const normalizedQuery = query.trim().toLowerCase();

  useEffect(() => {
    if (!normalizedQuery) {
      return;
    }

    const next = new Set<string>();
    for (const item of topLevel) {
      if (item.kind === "guide") {
        if (itemMatchesQuery(item, normalizedQuery)) {
          next.add(item.id);
        }
        continue;
      }

      const tasks = collectTasks(item.id, childrenMap);
      if (
        tasks.some(
          (task) =>
            itemMatchesQuery(task, normalizedQuery) &&
            taskMatchesFilter(task, filterTab),
        )
      ) {
        next.add(item.id);
      }
    }

    setExpandedSections(next);
  }, [normalizedQuery, filterTab, topLevel, childrenMap]);

  const toggleSection = useCallback((id: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const toggleTask = useCallback((id: string) => {
    setExpandedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleSaveNotes = useCallback(
    (itemId: string, notes: string) => {
      void updateNotes(itemId, notes);
    },
    [updateNotes],
  );

  const handleToggleCompleted = useCallback(
    (itemId: string, completed: boolean) => {
      void toggleCompleted(itemId, completed);
    },
    [toggleCompleted],
  );

  const visibleSectionCount = useMemo(() => {
    return topLevel.filter((item) => {
      if (item.kind === "guide") {
        return !normalizedQuery || itemMatchesQuery(item, normalizedQuery);
      }
      const tasks = collectTasks(item.id, childrenMap);
      if (tasks.length === 0) {
        return false;
      }
      if (normalizedQuery) {
        return tasks.some(
          (task) =>
            itemMatchesQuery(task, normalizedQuery) &&
            taskMatchesFilter(task, filterTab),
        );
      }
      return tasks.some((task) => taskMatchesFilter(task, filterTab));
    }).length;
  }, [topLevel, childrenMap, normalizedQuery, filterTab]);

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <div className="border-border shrink-0 space-y-4 border-b px-4 py-4 md:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-heading text-xl font-semibold tracking-tight">
              Plan
            </h1>
            <p className="text-muted-foreground mt-0.5 text-xs">
              {doneCount} of {taskCount} checklist items done
            </p>
          </div>

          <div className="relative w-full sm:max-w-xs">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search…"
              className="pl-9"
              aria-label="Search plan"
            />
          </div>
        </div>

        <div className="bg-muted inline-flex w-fit rounded-lg p-1">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={cn(
                "cursor-pointer rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                filterTab === tab.id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
              onClick={() => setFilterTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-6">
        {visibleSectionCount === 0 ? (
          <p className="text-muted-foreground py-8 text-center text-sm">
            No items match this filter.
          </p>
        ) : (
          <div className="space-y-4">
            {topLevel.map((item) => {
              if (item.kind === "guide") {
                if (normalizedQuery && !itemMatchesQuery(item, normalizedQuery)) {
                  return null;
                }
                return (
                  <PlanGuideSection
                    key={item.id}
                    guide={item}
                    expanded={expandedSections.has(item.id)}
                    onToggle={toggleSection}
                  />
                );
              }

              const sectionTasks = collectTasks(item.id, childrenMap);
              if (sectionTasks.length === 0) {
                return null;
              }

              return (
                <PlanSectionBlock
                  key={item.id}
                  section={item}
                  childrenMap={childrenMap}
                  expanded={expandedSections.has(item.id)}
                  onToggle={toggleSection}
                  filterTab={filterTab}
                  query={normalizedQuery}
                  expandedTasks={expandedTasks}
                  onToggleTask={toggleTask}
                  onToggleCompleted={handleToggleCompleted}
                  onSaveNotes={handleSaveNotes}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
