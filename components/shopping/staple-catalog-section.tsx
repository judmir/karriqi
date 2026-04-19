"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useMemo, useState } from "react";

import { Section } from "@/components/patterns/section";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createStaple } from "@/lib/shopping/shopping-actions";
import type { StapleItem } from "@/types/shopping";

function formatRelativeDays(iso: string | undefined) {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  const days = Math.round((Date.now() - then) / (24 * 60 * 60 * 1000));
  if (days <= 0) return "today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

export function StapleCatalogSection({
  initialStaples,
  persistCatalog = false,
}: {
  initialStaples: StapleItem[];
  persistCatalog?: boolean;
}) {
  const router = useRouter();
  const [staples, setStaples] = useState<StapleItem[]>(initialStaples);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [unit, setUnit] = useState("");
  const [typicalIntervalDays, setTypicalIntervalDays] = useState("");

  const sorted = useMemo(
    () => [...staples].sort((a, b) => a.name.localeCompare(b.name)),
    [staples],
  );

  async function addStaple(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    const interval = typicalIntervalDays.trim();
    const intervalNum =
      interval === "" ? undefined : Number.parseInt(interval, 10);
    const typical =
      intervalNum !== undefined && !Number.isNaN(intervalNum)
        ? intervalNum
        : undefined;

    if (persistCatalog) {
      const r = await createStaple({
        name: trimmed,
        category: category.trim() || undefined,
        unit: unit.trim() || undefined,
        typicalIntervalDays: typical,
      });
      if (r.ok) {
        setName("");
        setCategory("");
        setUnit("");
        setTypicalIntervalDays("");
        router.refresh();
      }
      return;
    }

    const next: StapleItem = {
      id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `staple-${Date.now()}`,
      name: trimmed,
      category: category.trim() || undefined,
      unit: unit.trim() || undefined,
      typicalIntervalDays: typical,
      createdAt: new Date().toISOString(),
    };
    setStaples((prev) => [next, ...prev]);
    setName("");
    setCategory("");
    setUnit("");
    setTypicalIntervalDays("");
  }

  return (
    <Section title="Staple catalog">
      <p className="text-muted-foreground max-w-prose text-sm leading-relaxed">
        Items you buy often. Last purchase is updated when you check an item off
        on the shopping list.
      </p>

      <Card size="sm">
        <CardHeader>
          <CardTitle>Add staple</CardTitle>
          <CardDescription>
            {persistCatalog
              ? "Saved to your account."
              : "Saved only in this session when not signed in with Supabase."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={addStaple} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="staple-name">Name</Label>
              <Input
                id="staple-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Oat milk"
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="staple-category">Category</Label>
              <Input
                id="staple-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Dairy"
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="staple-unit">Unit</Label>
              <Input
                id="staple-unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="e.g. 1 L"
                autoComplete="off"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="staple-interval">
                Typical restock interval (days)
              </Label>
              <Input
                id="staple-interval"
                inputMode="numeric"
                value={typicalIntervalDays}
                onChange={(e) => setTypicalIntervalDays(e.target.value)}
                placeholder="e.g. 7"
                autoComplete="off"
              />
            </div>
            <div className="flex sm:col-span-2">
              <Button type="submit">Add to catalog</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <ul className="grid gap-3">
        {sorted.map((item) => {
          const last = formatRelativeDays(item.lastPurchasedAt);
          return (
            <li key={item.id}>
              <Card size="sm">
                <CardHeader className="border-b pb-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <CardTitle>{item.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {[item.category, item.unit].filter(Boolean).join(" · ") ||
                          "No category or unit"}
                      </CardDescription>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled
                        title="Coming in a later phase"
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        disabled
                        title="Coming in a later phase"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-3">
                  <dl className="text-muted-foreground grid gap-1 text-xs sm:grid-cols-2">
                    <div>
                      <dt className="font-medium text-foreground">
                        Typical interval
                      </dt>
                      <dd>
                        {item.typicalIntervalDays != null
                          ? `${item.typicalIntervalDays} days`
                          : "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-medium text-foreground">
                        Last purchased
                      </dt>
                      <dd>{last ?? "—"}</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
