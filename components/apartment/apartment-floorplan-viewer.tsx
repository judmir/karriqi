"use client";

import { ExternalLink } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatAreaM2 } from "@/lib/apartment/apartment-utils";
import { WE28_FLOORPLAN_SOURCE } from "@/lib/apartment/we28-floorplan-geometry";
import { cn } from "@/lib/utils";

export function ApartmentFloorplanViewer() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2">
          Floorplan
          <Badge variant="secondary">Dimensioned · 1:100</Badge>
        </CardTitle>
        <CardDescription>
          {WE28_FLOORPLAN_SOURCE.label}. Living area{" "}
          {formatAreaM2(WE28_FLOORPLAN_SOURCE.livingAreaM2)} per
          Flächenübersicht ({WE28_FLOORPLAN_SOURCE.unit}).
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex justify-end">
          <a
            href={WE28_FLOORPLAN_SOURCE.pdfPath}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            <ExternalLink data-icon="inline-start" />
            Open PDF
          </a>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-muted/10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={WE28_FLOORPLAN_SOURCE.previewPath}
            alt="Cicerostraße WE28 dimensioned floorplan"
            className="h-auto w-full"
          />
        </div>
      </CardContent>
    </Card>
  );
}
