import type {
  ApartmentCashItem,
  ApartmentDocumentCategory,
  ApartmentFact,
  ApartmentLoanData,
  ApartmentProgressStep,
  ApartmentPropertyData,
  ApartmentRoom,
} from "@/types/apartment";

/**
 * Static seed data for the Cicerostraße WE28 purchase.
 * Sources: exposé (2026-06), signed notary contract (SN13), Lloyds
 * Darlehensvertrag FINAL (2026-06) and the 2026-07-04 payment breakdown.
 * No IBANs, tax IDs or account numbers here on purpose.
 */

export const APARTMENT_PROPERTY: ApartmentPropertyData = {
  name: "Cicerostraße WE28",
  address: "Cicerostraße 3, 10709 Berlin",
  unit: "WE 28",
  floor: "2. OG",
  livingAreaM2: 81.78,
  profile: "3-room family apartment",
  hausgeldMonthlyEur: 341.29,
  mea: "125.50 / 10,000",
  buildingYear: 1965,
  heating: "Fernwärme (district heating)",
  energyConsumption: "95.8 kWh/(m²·a)",
  energyCertificateValidUntil: "20.03.2029",
  purchasePriceEur: 545_000,
  brokerFeeEur: 0,
};

export const APARTMENT_LOAN: ApartmentLoanData = {
  lender: "Lloyds Bank",
  loanAmountEur: 487_350,
  nominalRatePct: 3.81,
  effectiveRatePct: 3.9,
  fixedUntil: "30 June 2036",
  initialTilgungPct: 2.0,
  monthlyPaymentEur: 2_359.59,
  sondertilgungPct: 5,
  sondertilgungMaxPerYearEur: 24_367.5,
  bereitstellungszinsFreeDays: 183,
  bereitstellungszinsMonthlyPct: 0.25,
};

export const APARTMENT_CASH_ITEMS: ApartmentCashItem[] = [
  { label: "Purchase price (Kaufpreis)", amountEur: 545_000 },
  { label: "Lloyds loan", amountEur: -487_350, hint: "Financed portion" },
  {
    label: "Buyer equity gap on purchase price",
    amountEur: 57_650,
    hint: "Purchase price minus loan",
  },
  {
    label: "Grunderwerbsteuer (Berlin, 6%)",
    amountEur: 32_700,
    hint: "Real estate transfer tax — paid after tax office notice",
  },
  {
    label: "Notary + Grundbuch (est.)",
    amountEur: 9_810,
    hint: "Estimated ~1.8% of purchase price",
  },
  { label: "Broker fee", amountEur: 0, hint: "No broker fee in current notes" },
];

export const APARTMENT_TOTAL_CASH_NEEDED_EUR = 100_160;
export const APARTMENT_ALL_IN_COST_EUR = 587_510;

/** Facts for the property "More details" dialog. */
export const APARTMENT_PROPERTY_FACTS: ApartmentFact[] = [
  { label: "Address", value: "Cicerostraße 3, 10709 Berlin" },
  { label: "Unit", value: "WE 28" },
  { label: "Floor", value: "2. OG (2nd upper floor)" },
  { label: "Living area", value: "81.78 m²" },
  { label: "Layout", value: "3-room family apartment" },
  {
    label: "MEA (Miteigentumsanteil)",
    value: "125.50 / 10,000",
    hint: "Co-ownership share of the whole property",
  },
  { label: "Building year", value: "1965" },
  { label: "Heating", value: "Fernwärme (district heating)" },
];

export const APARTMENT_HAUSGELD_FACTS: ApartmentFact[] = [
  {
    label: "Hausgeld (monthly)",
    value: "€341.29",
    hint: "Monthly owner service charge paid to the Hausverwaltung",
  },
  {
    label: "Covers",
    value: "Building operation, maintenance reserve, house management",
    hint: "Exact split per WEG Wirtschaftsplan — see WEG/Hausgeld documents",
  },
  {
    label: "Set up after handover",
    value: "Hausgeld mandate / standing order to Hausverwaltung",
  },
];

export const APARTMENT_ENERGY_FACTS: ApartmentFact[] = [
  {
    label: "Energy consumption",
    value: "95.8 kWh/(m²·a)",
    hint: "Verbrauchsausweis (consumption-based certificate)",
  },
  { label: "Certificate valid until", value: "20.03.2029" },
  { label: "Heating type", value: "Fernwärme (district heating)" },
];

export const APARTMENT_DOCUMENT_SOURCES: ApartmentFact[] = [
  {
    label: "Exposé",
    value: "2026-06 Cicerostraße WE28 Exposé (long version)",
  },
  {
    label: "Floorplans",
    value: "Dimensioned floorplan, render, 2. OG plan (2026-06)",
  },
  {
    label: "Purchase contract",
    value: "Signed notary purchase contract SN13 (2026-06)",
  },
  {
    label: "Loan contract",
    value: "Lloyds Darlehensvertrag FINAL (2026-06)",
  },
  {
    label: "Payment breakdown",
    value: "Payment breakdown after Fälligkeitsmitteilung (2026-07-04)",
  },
];

/** Progress to keys — seed defaults; user status overrides come from DB. */
export const APARTMENT_PROGRESS_STEPS: ApartmentProgressStep[] = [
  {
    id: "gather-docs",
    title: "Gather all documents from agent",
    status: "done",
    source: "Property docs folder",
  },
  {
    id: "reservation-fee",
    title: "Pay reservation fee",
    status: "done",
  },
  {
    id: "interhyp-loan-discussion",
    title: "Discuss with Interhyp/Daniel to arrange loan",
    status: "done",
  },
  {
    id: "decide-loan",
    title: "Decide loan agreement with bank",
    status: "done",
    source: "Lloyds Darlehensvertrag FINAL",
  },
  {
    id: "sign-bank-docs",
    title: "Sign bank documents",
    status: "done",
  },
  {
    id: "postident",
    title: "Complete PostIdent",
    status: "done",
  },
  {
    id: "sign-notary-contract",
    title: "Sign notary agreement / purchase contract",
    status: "done",
    source: "Signed notary purchase contract SN13",
  },
  {
    id: "wait-faelligkeitsmitteilung",
    title: "Wait for Fälligkeitsmitteilung from notary",
    description:
      "Kaufpreisfälligkeitsmitteilung: the notary confirms all payout conditions are met and states recipients, amounts and the payment deadline. Nothing is paid before this arrives.",
    status: "current",
    source: "Notary (expected)",
  },
  {
    id: "kuendigung-rental",
    title: "Send Kündigung for current rented apartment",
    description:
      "Formal written notice for the rental. Check Schriftform requirement and keep delivery proof.",
    status: "todo",
  },
  {
    id: "auszahlungsabruf",
    title: "Fill Auszahlungsabruf from the Fälligkeitsmitteilung",
    description:
      "Payout request to Lloyds using the exact recipients, IBANs, amounts and deadline from the notary notice. The notary notice is the controlling source.",
    status: "todo",
    source: "Fälligkeitsmitteilung (controlling)",
  },
  {
    id: "send-payout-docs",
    title: "Send Fälligkeitsmitteilung + Auszahlungsabruf to Interhyp/Lloyds",
    status: "todo",
  },
  {
    id: "pay-equity",
    title: "Pay own equity / down payment per notary notice",
    status: "todo",
    source: "Fälligkeitsmitteilung (controlling)",
  },
  {
    id: "equity-proof",
    title: "Send proof of equity transfer to bank if required",
    status: "todo",
  },
  {
    id: "pay-notary",
    title: "Pay notary invoice",
    status: "todo",
    source: "Notary invoice (expected)",
  },
  {
    id: "pay-grunderwerbsteuer",
    title: "Pay Grunderwerbsteuer (Berlin tax notice)",
    description: "6% of purchase price = €32,700. Paid after the tax office notice arrives.",
    status: "todo",
    source: "Grunderwerbsteuer notice (expected)",
  },
  {
    id: "pay-grundbuch",
    title: "Pay Grundbuch / court invoice if separate",
    status: "todo",
  },
  {
    id: "confirm-payout",
    title: "Confirm Lloyds payout / disbursement",
    status: "todo",
  },
  {
    id: "handover-appointment",
    title: "Arrange handover / key appointment",
    status: "todo",
  },
  {
    id: "handover-protocol",
    title: "Handover protocol",
    description:
      "Keys, meter readings, defects, mailbox/cellar, Hausverwaltung contacts.",
    status: "todo",
  },
  {
    id: "move-in-admin",
    title: "Move-in admin",
    description:
      "Insurance, Anmeldung/address changes, utilities/internet, Hausgeld mandate if needed.",
    status: "todo",
  },
];

/** Document categories mirroring the Dropbox folder structure (no direct file links). */
export const APARTMENT_DOCUMENT_CATEGORIES: ApartmentDocumentCategory[] = [
  {
    id: "property-docs",
    title: "Property docs",
    description: "Exposé, floorplans, unit facts.",
    status: "available",
    examples: ["Exposé (long)", "Dimensioned floorplan", "2. OG plan"],
  },
  {
    id: "teilungserklaerung",
    title: "Teilungserklärung",
    description: "Declaration of division — unit definition and MEA.",
    status: "available",
  },
  {
    id: "weg-hausgeld",
    title: "WEG / Hausgeld",
    description: "Owners' association minutes, Wirtschaftsplan, Hausgeld details.",
    status: "available",
  },
  {
    id: "technical-environment",
    title: "Technical / environment",
    description: "Energy certificate, technical reports, environment checks.",
    status: "available",
  },
  {
    id: "confirmations-insurance",
    title: "Confirmations / insurance",
    description: "Building insurance and other confirmations.",
    status: "available",
  },
  {
    id: "financing-interhyp",
    title: "Financing — Daniel / Interhyp",
    description: "Financing offers and correspondence.",
    status: "sensitive",
    examples: ["Contains income docs — not shown in app"],
  },
  {
    id: "lloyds-bank",
    title: "Lloyds Bank",
    description: "Final loan contract and bank correspondence.",
    status: "sensitive",
    examples: ["Darlehensvertrag FINAL (2026-06)"],
  },
  {
    id: "notary",
    title: "Notary",
    description: "Draft and signed purchase contract.",
    status: "available",
    examples: ["Signed purchase contract SN13 (Fotokopie)"],
  },
  {
    id: "grundbuch-grundschuld",
    title: "Grundbuch / Grundschuld",
    description: "Land register entries and mortgage charge documents.",
    status: "available",
  },
  {
    id: "payments-invoices-tax",
    title: "Payments / invoices / tax",
    description: "Payment breakdown, invoices, tax notices.",
    status: "available",
    examples: ["Payment breakdown 2026-07-04"],
  },
];

/** Documents still expected later in the process. */
export const APARTMENT_EXPECTED_DOCUMENTS: string[] = [
  "Notary invoice",
  "Grundbuchamt invoice",
  "Grunderwerbsteuer notice (Berlin, 6%)",
  "Kaufpreisfälligkeitsmitteilung",
  "Lloyds payout confirmation",
  "Seller payment confirmation",
  "Handover protocol",
  "Keys / meter readings",
];

/** Post-closing checklist (kind = "closing"). */
export const APARTMENT_CLOSING_CHECKLIST: ApartmentProgressStep[] = [
  { id: "faelligkeitsmitteilung-received", title: "Fälligkeitsmitteilung received", status: "todo" },
  { id: "auszahlungsabruf-sent", title: "Auszahlungsabruf filled & sent", status: "todo" },
  { id: "equity-paid", title: "Equity paid", status: "todo" },
  { id: "bank-payout-confirmed", title: "Bank payout confirmed", status: "todo" },
  { id: "grunderwerbsteuer-paid", title: "Grunderwerbsteuer paid", status: "todo" },
  { id: "notary-paid", title: "Notary paid", status: "todo" },
  { id: "grundbuch-fee-paid", title: "Grundbuch fee paid", status: "todo" },
  { id: "handover-booked", title: "Handover appointment booked", status: "todo" },
  { id: "handover-protocol-done", title: "Handover protocol completed", status: "todo" },
  { id: "keys-received", title: "Keys received", status: "todo" },
  { id: "meter-readings", title: "Meter readings captured", status: "todo" },
  { id: "hausverwaltung-contacted", title: "Hausverwaltung contacted", status: "todo" },
  { id: "anmeldung", title: "Address changes / Anmeldung", status: "todo" },
  { id: "internet-utilities", title: "Internet / utilities", status: "todo" },
  { id: "insurance-reviewed", title: "Insurance reviewed", status: "todo" },
];

/** Rental apartment notice checklist (kind = "rental"). */
export const APARTMENT_RENTAL_CHECKLIST: ApartmentProgressStep[] = [
  {
    id: "kuendigung-written",
    title: "Send formal written Kündigung",
    description:
      "If the contract requires Schriftform, email alone may not be enough — send a signed letter.",
    status: "todo",
  },
  {
    id: "delivery-proof",
    title: "Keep delivery proof",
    description: "Einwurf-Einschreiben or handover with witness.",
    status: "todo",
  },
  {
    id: "rental-handover",
    title: "Plan rental handover",
    description: "Deposit return, meter readings, defects/photos.",
    status: "todo",
  },
];

/**
 * Editable room list seed — APPROXIMATE values only.
 * The dimensioned floorplan PDF could not be parsed automatically; verify each
 * room against 2026-06 Floorplan_Dimensioned before treating these as exact.
 */
export const APARTMENT_ROOMS_SEED: Omit<ApartmentRoom, "id">[] = [
  { name: "Wohnzimmer (living room)", areaM2: 24, widthM: null, lengthM: null, notes: "Estimate", sortOrder: 0, isApproximate: true },
  { name: "Schlafzimmer (bedroom)", areaM2: 15, widthM: null, lengthM: null, notes: "Estimate", sortOrder: 1, isApproximate: true },
  { name: "Kinderzimmer (kids room)", areaM2: 12, widthM: null, lengthM: null, notes: "Estimate", sortOrder: 2, isApproximate: true },
  { name: "Küche (kitchen)", areaM2: 9, widthM: null, lengthM: null, notes: "Estimate", sortOrder: 3, isApproximate: true },
  { name: "Bad (bathroom)", areaM2: 5.5, widthM: null, lengthM: null, notes: "Estimate", sortOrder: 4, isApproximate: true },
  { name: "Flur (hallway)", areaM2: 9, widthM: null, lengthM: null, notes: "Estimate", sortOrder: 5, isApproximate: true },
  { name: "Balkon (balcony)", areaM2: 4, widthM: null, lengthM: null, notes: "Estimate — usually counted ~50% toward living area", sortOrder: 6, isApproximate: true },
];

export const APARTMENT_PAYOUT_WARNING =
  "Do not pay the purchase price or submit the payout request before the official Fälligkeitsmitteilung. Use the notary notice as the controlling source for recipient accounts and the payment split.";
