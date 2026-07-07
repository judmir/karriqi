"use client";

import { Mail } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useApartmentStore } from "@/stores/apartment-store";
import type {
  ApartmentProgressStep,
  ApartmentStepKind,
} from "@/types/apartment";

function ChecklistItems({
  kind,
  steps,
  idPrefix,
}: {
  kind: ApartmentStepKind;
  steps: ApartmentProgressStep[];
  idPrefix: string;
}) {
  const setStepState = useApartmentStore((state) => state.setStepState);

  return (
    <ul className="flex flex-col gap-2">
      {steps.map((step) => {
        const checkboxId = `${idPrefix}-${step.id}`;
        return (
          <li key={step.id} className="flex items-start gap-2.5">
            <Checkbox
              id={checkboxId}
              checked={step.status === "done"}
              onCheckedChange={async (checked) => {
                const result = await setStepState(kind, step.id, {
                  status: checked ? "done" : "todo",
                });
                if (!result.ok) {
                  toast.error(result.message);
                }
              }}
            />
            <div className="min-w-0">
              <Label
                htmlFor={checkboxId}
                className={
                  step.status === "done"
                    ? "text-muted-foreground line-through"
                    : undefined
                }
              >
                {step.title}
              </Label>
              {step.description ? (
                <p className="text-xs text-muted-foreground">
                  {step.description}
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/** Rental apartment Kündigung reminder card (kind = "rental"). */
export function ApartmentRentalNotice() {
  const rentalSteps = useApartmentStore((state) => state.rentalSteps);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rental apartment — Kündigung</CardTitle>
        <CardDescription>
          Give notice for the current rented apartment once the purchase
          timeline is safe.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Alert variant="warning">
          <Mail aria-hidden />
          <AlertTitle>Schriftform check</AlertTitle>
          <AlertDescription>
            If the rental contract requires written form (Schriftform), a
            signed letter is needed — email alone may not be enough. Keep
            delivery proof.
          </AlertDescription>
        </Alert>
        <ChecklistItems
          kind="rental"
          steps={rentalSteps}
          idPrefix="apartment-rental"
        />
      </CardContent>
    </Card>
  );
}

/** Post-closing checklist card (kind = "closing"). */
export function ApartmentPostClosingChecklist() {
  const closingSteps = useApartmentStore((state) => state.closingSteps);
  const doneCount = closingSteps.filter((s) => s.status === "done").length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Post-closing checklist</CardTitle>
        <CardDescription>
          {doneCount} of {closingSteps.length} done — payment, handover and
          move-in admin.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChecklistItems
          kind="closing"
          steps={closingSteps}
          idPrefix="apartment-closing"
        />
      </CardContent>
    </Card>
  );
}
