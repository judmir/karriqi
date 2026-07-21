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
 * Sources: exposé (2026-06), notary deeds UVZ 1917/2026 S + 1918/2026 S
 * (30 June 2026), Lloyds Darlehensvertrag FINAL (2026-06) and the
 * 2026-07-04 payment breakdown.
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

/** Notary deed facts for the property "More details" dialog (English). */
export const APARTMENT_NOTARY_FACTS: ApartmentFact[] = [
  {
    label: "Purchase agreement",
    value:
      "Condominium purchase agreement dated 30 June 2026 (UVZ-Nr. 1917/2026 S)",
    hint: "Wohnungseigentumskaufvertrag",
  },
  {
    label: "Land charge deed",
    value: "Land charge creation dated 30 June 2026 (UVZ-Nr. 1918/2026 S)",
    hint: "Grundschuldbestellung",
  },
  {
    label: "Seller",
    value: "Brandenburg Properties 3 S.à r.l.",
  },
  {
    label: "Buyers",
    value: "Savina Karriqi + Judmir Karriqi",
  },
  {
    label: "Land register object",
    value:
      "Condominium land register of Berlin-Wilmersdorf, folio 34860, unit no. 28",
    hint: "Wohnungsgrundbuch · Blatt 34860 · Einheit Nr. 28",
  },
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
    value:
      "Condominium purchase agreement 30 June 2026 (UVZ-Nr. 1917/2026 S)",
  },
  {
    label: "Land charge deed",
    value: "Grundschuldbestellung 30 June 2026 (UVZ-Nr. 1918/2026 S)",
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
    source: "UVZ-Nr. 1917/2026 S (30 June 2026)",
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
    examples: [
      "Wohnungseigentumskaufvertrag UVZ-Nr. 1917/2026 S (30 June 2026)",
      "Grundschuldbestellung UVZ-Nr. 1918/2026 S (30 June 2026)",
    ],
  },
  {
    id: "grundbuch-grundschuld",
    title: "Grundbuch / Grundschuld",
    description: "Land register entries and mortgage charge documents.",
    status: "available",
    examples: [
      "Berlin-Wilmersdorf Blatt 34860, Einheit Nr. 28",
      "Grundschuldbestellung UVZ-Nr. 1918/2026 S",
    ],
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

/** Move-in & relocation checklist (kind = "movein") — after keys. */
export const APARTMENT_MOVE_IN_CHECKLIST: ApartmentProgressStep[] = [
  {
    id: "anmeldung",
    title: "Anmeldung (Bürgeramt)",
    description: "Register at Cicerostraße within the legal deadline.",
    status: "todo",
  },
  {
    id: "nachsendeauftrag",
    title: "Post forwarding (Nachsendeauftrag)",
    status: "todo",
  },
  {
    id: "internet-new-address",
    title: "Internet contract at new address",
    status: "todo",
  },
  {
    id: "energy-utilities",
    title: "Energy / utilities at new home",
    description:
      "Fernwärme via Hausverwaltung; confirm any tenant-metered services.",
    status: "todo",
  },
  {
    id: "hausverwaltung-intro",
    title: "Intro with Hausverwaltung",
    description: "Hausgeld, repairs, cellar, mailbox, house rules.",
    status: "todo",
  },
  {
    id: "hausgeld-sepa",
    title: "Hausgeld SEPA / payment setup",
    status: "todo",
  },
  {
    id: "hausrat-insurance",
    title: "Home contents insurance (Hausrat)",
    status: "todo",
  },
  {
    id: "liability-insurance",
    title: "Personal liability insurance (Privathaftpflicht)",
    status: "todo",
  },
  {
    id: "life-insurance-review",
    title: "Life insurance review / update",
    status: "todo",
  },
  {
    id: "rundfunkbeitrag",
    title: "GEZ / Rundfunkbeitrag address update",
    status: "todo",
  },
  {
    id: "bank-address",
    title: "Bank & card correspondence address",
    status: "todo",
  },
  {
    id: "employer-finanzamt",
    title: "Employer / Finanzamt address if needed",
    status: "todo",
  },
  {
    id: "mailbox-nameplate",
    title: "Mailbox nameplate & doorbell",
    status: "todo",
  },
  {
    id: "furniture-delivery",
    title: "Plan furniture delivery & access",
    status: "todo",
  },
];

/** Rental apartment notice checklist (kind = "rental"). */
export const APARTMENT_RENTAL_CHECKLIST: ApartmentProgressStep[] = [
  {
    id: "notice-period-check",
    title: "Check notice period (Kündigungsfrist)",
    description: "Confirm earliest lawful termination date in the rental contract.",
    status: "todo",
  },
  {
    id: "schriftform-check",
    title: "Confirm Schriftform requirement",
    description: "Some contracts require a signed letter — email alone may not count.",
    status: "todo",
  },
  {
    id: "kuendigung-written",
    title: "Send formal written Kündigung",
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
  {
    id: "cancel-rental-utilities",
    title: "Cancel / transfer rental utilities",
    description: "Internet, electricity or other contracts tied to the old flat.",
    status: "todo",
  },
];

/**
 * Editable room list seed — dimensions from the 2026-06 dimensioned floorplan PDF.
 * Geometry for the 3D view lives in we28-floorplan-geometry.ts.
 */
export const APARTMENT_ROOMS_SEED: Omit<ApartmentRoom, "id">[] = [
  { name: "Zimmer 1 (living room)", areaM2: 20.9, widthM: 4.52, lengthM: 4.67, notes: "001 · PDF Flächenübersicht", sortOrder: 0, isApproximate: false },
  { name: "Flur (hallway)", areaM2: 11.3, widthM: 6.72, lengthM: 1.71, notes: "002 · corridor strip", sortOrder: 1, isApproximate: false },
  { name: "Zimmer 2 (bedroom)", areaM2: 20.2, widthM: 3.45, lengthM: 5.77, notes: "003 · PDF Flächenübersicht", sortOrder: 2, isApproximate: false },
  { name: "Küche (kitchen)", areaM2: 8.8, widthM: 4.4, lengthM: 2.0, notes: "004 · PDF Flächenübersicht", sortOrder: 3, isApproximate: false },
  { name: "Bad (bathroom)", areaM2: 5.9, widthM: 2.17, lengthM: 2.72, notes: "005 · PDF Flächenübersicht", sortOrder: 4, isApproximate: false },
  { name: "Zimmer 3 (kids room)", areaM2: 11.9, widthM: 4.39, lengthM: 2.71, notes: "006 · PDF Flächenübersicht", sortOrder: 5, isApproximate: false },
  { name: "Balkon (balcony)", areaM2: 6.0, widthM: 4.52, lengthM: 1.37, notes: "007 · 50% rule toward living area", sortOrder: 6, isApproximate: false },
];

export const APARTMENT_PAYOUT_WARNING =
  "Do not pay the purchase price or submit the payout request before the official Fälligkeitsmitteilung. Use the notary notice as the controlling source for recipient accounts and the payment split.";
