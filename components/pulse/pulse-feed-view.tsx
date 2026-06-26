"use client";

import { useMemo, useState } from "react";

import { PulseCard } from "@/components/pulse/pulse-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { usePulseStore } from "@/stores/pulse-store";
import {
  filterPulseItems,
  PULSE_FILTER_LABELS,
  pulseItemNeedsAction,
  type PulseFilter,
} from "@/types/pulse";

const FILTERS: PulseFilter[] = [
  "all",
  "new",
  "saved",
  "needs_action",
  "high_impact",
  "berlin_life",
];

function PulseFilterNav({
  active,
  onChange,
  compact = false,
}: {
  active: PulseFilter;
  onChange: (filter: PulseFilter) => void;
  compact?: boolean;
}) {
  return (
    <nav
      className={cn(
        "flex flex-col gap-1",
        compact && "max-lg:flex-row max-lg:flex-wrap max-lg:gap-2",
      )}
      aria-label="Pulse filters"
    >
      {FILTERS.map((filter) => (
        <Button
          key={filter}
          type="button"
          variant={active === filter ? "secondary" : "ghost"}
          size="sm"
          className={cn(
            "justify-start",
            compact && "max-lg:rounded-full max-lg:px-3",
          )}
          onClick={() => onChange(filter)}
        >
          {PULSE_FILTER_LABELS[filter]}
        </Button>
      ))}
    </nav>
  );
}

function PulseWidgets({ items }: { items: ReturnType<typeof filterPulseItems> }) {
  const needsAction = items.filter(pulseItemNeedsAction).slice(0, 5);
  const highImpact = items
    .filter((item) => item.impact === "high" && item.status !== "dismissed")
    .slice(0, 5);
  const recentSources = [...items]
    .filter((item) => item.sourceTitle || item.sourceUrl)
    .slice(0, 5);

  return (
    <div className="space-y-4">
      <Card className="border-border/70">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Needs action</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {needsAction.length === 0 ? (
            <p className="text-muted-foreground">Nothing urgent right now.</p>
          ) : (
            needsAction.map((item) => (
              <p key={item.id} className="leading-snug">
                {item.title}
              </p>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="border-border/70">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">High impact</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {highImpact.length === 0 ? (
            <p className="text-muted-foreground">No high-impact items yet.</p>
          ) : (
            highImpact.map((item) => (
              <p key={item.id} className="leading-snug">
                {item.title}
              </p>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="border-border/70">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Recent sources</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {recentSources.length === 0 ? (
            <p className="text-muted-foreground">Sources will appear as items arrive.</p>
          ) : (
            recentSources.map((item) => (
              <p key={item.id} className="text-muted-foreground leading-snug">
                {item.sourceTitle ?? item.sourceUrl}
              </p>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function PulseFeedView() {
  const items = usePulseStore((state) => state.items);
  const filter = usePulseStore((state) => state.filter);
  const setFilter = usePulseStore((state) => state.setFilter);
  const setItemStatus = usePulseStore((state) => state.setItemStatus);
  const createTaskFromItem = usePulseStore((state) => state.createTaskFromItem);
  const [busyId, setBusyId] = useState<string | null>(null);

  const filteredItems = useMemo(
    () => filterPulseItems(items, filter),
    [items, filter],
  );

  async function withBusy<T>(itemId: string, action: () => Promise<T>): Promise<T> {
    setBusyId(itemId);
    try {
      return await action();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-8 md:px-6">
      <p className="text-muted-foreground mb-6 max-w-2xl text-sm leading-relaxed">
        Private feed of things worth knowing or acting on.
      </p>

      <div className="grid gap-6 lg:grid-cols-12">
        <aside className="hidden lg:col-span-3 lg:block">
          <Card className="border-border/70">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <PulseFilterNav active={filter} onChange={setFilter} />
            </CardContent>
          </Card>
        </aside>

        <section className="space-y-4 lg:col-span-6">
          <div className="lg:hidden">
            <PulseFilterNav active={filter} onChange={setFilter} compact />
          </div>

          {filteredItems.length === 0 ? (
            <Card className="border-border/70 border-dashed">
              <CardContent className="text-muted-foreground py-12 text-center text-sm leading-relaxed">
                Pulse is ready. Hermes will push Berlin Life updates here.
              </CardContent>
            </Card>
          ) : (
            filteredItems.map((item) => (
              <PulseCard
                key={item.id}
                item={item}
                busy={busyId === item.id}
                onSave={() =>
                  withBusy(item.id, () => setItemStatus(item.id, "saved"))
                }
                onDismiss={() =>
                  withBusy(item.id, () => setItemStatus(item.id, "dismissed"))
                }
                onMarkActed={() =>
                  withBusy(item.id, () => setItemStatus(item.id, "acted"))
                }
                onCreateTask={() => withBusy(item.id, () => createTaskFromItem(item.id))}
              />
            ))
          )}
        </section>

        <aside className="lg:col-span-3">
          <PulseWidgets items={items} />
        </aside>
      </div>
    </div>
  );
}
