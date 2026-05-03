import { z } from "zod";

import { apartmentFindingIngestSchema } from "@/modules/operator/apartment-finding-schema";
import { weekendPlannerIngestSchema } from "@/modules/operator/weekend-planner-schema";

/** POST /api/operator/entries — Hermes operator ingest (discriminated by `kind`). */
export const operatorEntryIngestSchema = z.discriminatedUnion("kind", [
  weekendPlannerIngestSchema,
  apartmentFindingIngestSchema,
]);

export type OperatorEntryIngestBody = z.infer<typeof operatorEntryIngestSchema>;
