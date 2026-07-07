export type ApartmentStepStatus = "done" | "current" | "todo" | "blocked";

/** Which checklist a step belongs to (matches apartment_step_states.kind). */
export type ApartmentStepKind = "progress" | "closing" | "rental";

export type ApartmentProgressStep = {
  id: string;
  title: string;
  description?: string;
  status: ApartmentStepStatus;
  /** ISO date (yyyy-mm-dd) when the step was done / is due. */
  date?: string;
  notes?: string;
  /** Human reference to the controlling source document. */
  source?: string;
};

export type ApartmentImage = {
  id: string;
  /** Path inside the apartment-images storage bucket ("" for local-only images). */
  storagePath: string;
  /** Display URL: signed storage URL or local object URL fallback. */
  src: string;
  title: string;
  caption?: string;
  isCover?: boolean;
  sortOrder: number;
};

export type ApartmentDocumentStatus =
  | "available"
  | "expected"
  | "sensitive"
  | "superseded";

export type ApartmentDocumentCategory = {
  id: string;
  title: string;
  description: string;
  status: ApartmentDocumentStatus;
  examples?: string[];
};

export type ApartmentRoom = {
  id: string;
  name: string;
  areaM2: number | null;
  widthM: number | null;
  lengthM: number | null;
  notes: string | null;
  sortOrder: number;
  /** True until dimensions are verified against the dimensioned floorplan. */
  isApproximate?: boolean;
};

/** Simple label/value pair for fact lists in detail dialogs. */
export type ApartmentFact = {
  label: string;
  value: string;
  hint?: string;
};

export type ApartmentPropertyData = {
  name: string;
  address: string;
  unit: string;
  floor: string;
  livingAreaM2: number;
  profile: string;
  hausgeldMonthlyEur: number;
  mea: string;
  buildingYear: number;
  heating: string;
  energyConsumption: string;
  energyCertificateValidUntil: string;
  purchasePriceEur: number;
  brokerFeeEur: number;
};

export type ApartmentLoanData = {
  lender: string;
  loanAmountEur: number;
  nominalRatePct: number;
  effectiveRatePct: number;
  fixedUntil: string;
  initialTilgungPct: number;
  monthlyPaymentEur: number;
  sondertilgungPct: number;
  sondertilgungMaxPerYearEur: number;
  bereitstellungszinsFreeDays: number;
  bereitstellungszinsMonthlyPct: number;
};

export type ApartmentCashItem = {
  label: string;
  amountEur: number;
  hint?: string;
};

/** DB row shape for step state overrides. */
export type ApartmentStepState = {
  kind: ApartmentStepKind;
  stepKey: string;
  status: ApartmentStepStatus;
  date: string | null;
  notes: string | null;
};
