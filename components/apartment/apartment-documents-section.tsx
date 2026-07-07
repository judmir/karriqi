"use client";

import { Clock, FileText, Lock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  APARTMENT_DOCUMENT_CATEGORIES,
  APARTMENT_EXPECTED_DOCUMENTS,
} from "@/lib/apartment/cicerostrasse-we28-data";
import type { ApartmentDocumentStatus } from "@/types/apartment";

const STATUS_BADGES: Record<
  ApartmentDocumentStatus,
  { label: string; variant: "secondary" | "outline" | "destructive" }
> = {
  available: { label: "Available", variant: "secondary" },
  expected: { label: "Expected", variant: "outline" },
  sensitive: { label: "Sensitive — offline only", variant: "destructive" },
  superseded: { label: "Superseded", variant: "outline" },
};

export function ApartmentDocumentsSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Documents</CardTitle>
        <CardDescription>
          Categories mirror the case folder. Files stay in Dropbox — sensitive
          documents (income proofs, IBANs, tax IDs) are never shown in the app.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <ul className="grid gap-2 sm:grid-cols-2">
          {APARTMENT_DOCUMENT_CATEGORIES.map((category) => {
            const badge = STATUS_BADGES[category.status];
            return (
              <li
                key={category.id}
                className="flex flex-col gap-1 rounded-xl border border-border p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="flex items-center gap-1.5 text-sm font-medium">
                    {category.status === "sensitive" ? (
                      <Lock className="size-3.5 text-muted-foreground" aria-hidden />
                    ) : (
                      <FileText className="size-3.5 text-muted-foreground" aria-hidden />
                    )}
                    {category.title}
                  </p>
                  <Badge variant={badge.variant} className="shrink-0">
                    {badge.label}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {category.description}
                </p>
                {category.examples && category.examples.length > 0 ? (
                  <p className="text-xs text-muted-foreground/80">
                    e.g. {category.examples.join(", ")}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>

        <div className="rounded-xl border border-dashed border-border p-3">
          <p className="mb-2 flex items-center gap-1.5 text-sm font-medium">
            <Clock className="size-3.5 text-muted-foreground" aria-hidden />
            Still expected later
          </p>
          <ul className="grid gap-1 text-sm text-muted-foreground sm:grid-cols-2">
            {APARTMENT_EXPECTED_DOCUMENTS.map((doc) => (
              <li key={doc} className="flex items-center gap-1.5">
                <span
                  aria-hidden
                  className="size-1 shrink-0 rounded-full bg-muted-foreground/50"
                />
                {doc}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
