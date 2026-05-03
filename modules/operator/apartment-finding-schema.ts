import { z } from "zod";

import { isoInstant, uuidLike } from "@/modules/operator/ingest-primitives";

const roomsFact = z.union([z.number(), z.string().min(1), z.null()]).optional();

/** Nested JSON stored in `operator_entries.payload` for `kind = apartment_finding`. */
export const apartmentFindingPayloadSchema = z
  .object({
    location: z.string().min(1),
    priceText: z.string().min(1),
    sqm: z.union([z.number().positive(), z.null()]).optional(),
    rooms: roomsFact,
    verdict: z.string().min(1),
    hermesEvaluation: z.string().min(1),
    sourceUrl: z.string().url(),
  })
  .strict();

/** POST /api/operator/entries branch for apartment findings. */
export const apartmentFindingIngestSchema = z
  .object({
    userId: uuidLike,
    kind: z.literal("apartment_finding"),
    title: z.string().min(1),
    summary: z.union([z.string().min(1), z.null()]).optional(),
    dedupeKey: z.string().min(1),
    startsAt: z.union([isoInstant, z.null()]).optional(),
    endsAt: z.union([isoInstant, z.null()]).optional(),
    payload: apartmentFindingPayloadSchema,
  })
  .strict();

export type ApartmentFindingPayload = z.infer<typeof apartmentFindingPayloadSchema>;
export type ApartmentFindingIngestBody = z.infer<typeof apartmentFindingIngestSchema>;
