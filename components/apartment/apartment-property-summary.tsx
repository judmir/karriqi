"use client";

import { useState } from "react";
import {
  Banknote,
  Building2,
  Flame,
  Landmark,
  Ruler,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  APARTMENT_DOCUMENT_SOURCES,
  APARTMENT_ENERGY_FACTS,
  APARTMENT_HAUSGELD_FACTS,
  APARTMENT_PROPERTY,
  APARTMENT_PROPERTY_FACTS,
} from "@/lib/apartment/cicerostrasse-we28-data";
import {
  calcProgressPercent,
  formatAreaM2,
  formatEuro,
  formatEuroWhole,
} from "@/lib/apartment/apartment-utils";
import type { ApartmentFact } from "@/types/apartment";
import { useApartmentStore } from "@/stores/apartment-store";

type Stat = {
  label: string;
  value: string;
  sub?: string;
  icon: LucideIcon;
};

export function ApartmentPropertySummary() {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const progressSteps = useApartmentStore((state) => state.progressSteps);
  const percent = calcProgressPercent(progressSteps);

  const stats: Stat[] = [
    {
      label: "Purchase price",
      value: formatEuroWhole(APARTMENT_PROPERTY.purchasePriceEur),
      sub: "No broker fee",
      icon: Banknote,
    },
    {
      label: "Living area",
      value: formatAreaM2(APARTMENT_PROPERTY.livingAreaM2),
      sub: APARTMENT_PROPERTY.profile,
      icon: Ruler,
    },
    {
      label: "Floor / unit",
      value: `${APARTMENT_PROPERTY.floor} · ${APARTMENT_PROPERTY.unit}`,
      sub: `Built ${APARTMENT_PROPERTY.buildingYear}`,
      icon: Building2,
    },
    {
      label: "Hausgeld",
      value: `${formatEuro(APARTMENT_PROPERTY.hausgeldMonthlyEur)}/mo`,
      sub: `MEA ${APARTMENT_PROPERTY.mea}`,
      icon: Landmark,
    },
    {
      label: "Energy",
      value: APARTMENT_PROPERTY.energyConsumption,
      sub: APARTMENT_PROPERTY.heating,
      icon: Zap,
    },
    {
      label: "Purchase status",
      value: `${percent}% to keys`,
      sub: "Contract signed — awaiting Fälligkeitsmitteilung",
      icon: Flame,
    },
  ];

  return (
    <section aria-label="Apartment overview" className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg font-semibold">Overview</h2>
        <Button variant="outline" size="sm" onClick={() => setDetailsOpen(true)}>
          More details
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label} size="sm">
            <CardContent className="flex items-start gap-3">
              <div className="rounded-lg bg-muted p-2 text-muted-foreground">
                <stat.icon className="size-4" aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="truncate font-medium">{stat.value}</p>
                {stat.sub ? (
                  <p className="truncate text-xs text-muted-foreground">
                    {stat.sub}
                  </p>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{APARTMENT_PROPERTY.name}</DialogTitle>
            <DialogDescription>{APARTMENT_PROPERTY.address}</DialogDescription>
          </DialogHeader>

          <FactList title="Property facts" facts={APARTMENT_PROPERTY_FACTS} />
          <Separator />
          <FactList
            title="Hausgeld (monthly owner charge)"
            facts={APARTMENT_HAUSGELD_FACTS}
          />
          <Separator />
          <FactList
            title="Energy certificate"
            facts={APARTMENT_ENERGY_FACTS}
          />
          <Separator />
          <FactList
            title="Document sources"
            facts={APARTMENT_DOCUMENT_SOURCES}
          />
          <Badge variant="outline" className="w-fit">
            Private data — no IBANs or tax IDs stored here
          </Badge>
        </DialogContent>
      </Dialog>
    </section>
  );
}

export function FactList({
  title,
  facts,
}: {
  title: string;
  facts: ApartmentFact[];
}) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-medium">{title}</h3>
      <dl className="flex flex-col gap-1.5">
        {facts.map((fact) => (
          <div
            key={fact.label}
            className="grid grid-cols-[minmax(0,40%)_1fr] gap-2 text-sm"
          >
            <dt className="text-muted-foreground">{fact.label}</dt>
            <dd>
              {fact.value}
              {fact.hint ? (
                <span className="block text-xs text-muted-foreground">
                  {fact.hint}
                </span>
              ) : null}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
