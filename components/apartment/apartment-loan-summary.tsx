"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { FactList } from "@/components/apartment/apartment-property-summary";
import {
  APARTMENT_ALL_IN_COST_EUR,
  APARTMENT_CASH_ITEMS,
  APARTMENT_LOAN,
  APARTMENT_PAYOUT_WARNING,
  APARTMENT_TOTAL_CASH_NEEDED_EUR,
} from "@/lib/apartment/cicerostrasse-we28-data";
import {
  formatEuro,
  formatEuroWhole,
  formatPercent,
} from "@/lib/apartment/apartment-utils";
import type { ApartmentFact } from "@/types/apartment";

const LOAN_DETAIL_FACTS: ApartmentFact[] = [
  {
    label: "Nominal rate (Sollzins)",
    value: `${formatPercent(APARTMENT_LOAN.nominalRatePct)} p.a., fixed`,
  },
  {
    label: "Effective rate",
    value: `${formatPercent(APARTMENT_LOAN.effectiveRatePct)} p.a.`,
  },
  {
    label: "Fixed until (Zinsbindung)",
    value: APARTMENT_LOAN.fixedUntil,
  },
  {
    label: "Initial Tilgung",
    value: `${formatPercent(APARTMENT_LOAN.initialTilgungPct)} p.a.`,
    hint: "Repayment rate — the principal share of the annuity at the start",
  },
  {
    label: "Sondertilgung",
    value: `${formatPercent(APARTMENT_LOAN.sondertilgungPct)} per year = ${formatEuro(APARTMENT_LOAN.sondertilgungMaxPerYearEur)}/year`,
    hint: "Optional extra repayment allowance",
  },
  {
    label: "Bereitstellungszins-free period",
    value: `${APARTMENT_LOAN.bereitstellungszinsFreeDays} days`,
    hint: "No commitment interest during this period",
  },
  {
    label: "Bereitstellungszins after free period",
    value: `${formatPercent(APARTMENT_LOAN.bereitstellungszinsMonthlyPct)} per month on the undrawn amount`,
  },
  {
    label: "Payout condition",
    value:
      "Auszahlungsabruf (payout request) after the notary Fälligkeitsmitteilung — recipients and amounts come from the notary notice",
  },
];

export function ApartmentLoanSummary() {
  const [detailsOpen, setDetailsOpen] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Financing — {APARTMENT_LOAN.lender}</CardTitle>
        <CardDescription>
          Final loan contract signed (2026-06)
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <LoanStat
            label="Loan amount"
            value={formatEuroWhole(APARTMENT_LOAN.loanAmountEur)}
          />
          <LoanStat
            label="Nominal rate"
            value={`${formatPercent(APARTMENT_LOAN.nominalRatePct)} p.a.`}
          />
          <LoanStat
            label="Monthly payment"
            value={formatEuro(APARTMENT_LOAN.monthlyPaymentEur)}
          />
          <LoanStat label="Fixed until" value={APARTMENT_LOAN.fixedUntil} />
        </div>

        <Alert variant="warning">
          <AlertTriangle aria-hidden />
          <AlertTitle>Wait for the Fälligkeitsmitteilung</AlertTitle>
          <AlertDescription>{APARTMENT_PAYOUT_WARNING}</AlertDescription>
        </Alert>

        <div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDetailsOpen(true)}
          >
            More details
          </Button>
        </div>
      </CardContent>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Loan details — {APARTMENT_LOAN.lender}</DialogTitle>
            <DialogDescription>
              Darlehensvertrag FINAL (2026-06). German terms with English
              explanations.
            </DialogDescription>
          </DialogHeader>

          <FactList title="Conditions" facts={LOAN_DETAIL_FACTS} />
          <Separator />

          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-medium">Equity / cash calculation</h3>
            <dl className="flex flex-col gap-1.5 text-sm">
              {APARTMENT_CASH_ITEMS.map((item) => (
                <div
                  key={item.label}
                  className="flex items-baseline justify-between gap-2"
                >
                  <dt className="text-muted-foreground">
                    {item.label}
                    {item.hint ? (
                      <span className="block text-xs">{item.hint}</span>
                    ) : null}
                  </dt>
                  <dd className="font-medium tabular-nums">
                    {formatEuro(Math.abs(item.amountEur))}
                    {item.amountEur < 0 ? " (financed)" : ""}
                  </dd>
                </div>
              ))}
              <Separator className="my-1" />
              <div className="flex items-baseline justify-between gap-2">
                <dt className="font-medium">Estimated total buyer cash</dt>
                <dd className="font-semibold tabular-nums">
                  {formatEuro(APARTMENT_TOTAL_CASH_NEEDED_EUR)}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <dt className="text-muted-foreground">Estimated all-in cost</dt>
                <dd className="tabular-nums">
                  {formatEuro(APARTMENT_ALL_IN_COST_EUR)}
                </dd>
              </div>
            </dl>
          </div>

          <Alert variant="warning">
            <AlertTriangle aria-hidden />
            <AlertDescription>{APARTMENT_PAYOUT_WARNING}</AlertDescription>
          </Alert>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function LoanStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
