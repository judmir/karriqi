import { z } from "@/modules/ingest/openapi/zod-openapi";
import { isoInstantSchema, uuidSchema } from "@/modules/ingest/primitives";
import {
  PULSE_CATEGORIES,
  PULSE_IMPACTS,
  PULSE_SOURCE_TYPES,
  PULSE_STATUSES,
  PULSE_URGENCIES,
} from "@/types/pulse";

const pulseCategorySchema = z.enum(PULSE_CATEGORIES);
const pulseImpactSchema = z.enum(PULSE_IMPACTS);
const pulseUrgencySchema = z.enum(PULSE_URGENCIES);
const pulseStatusSchema = z.enum(PULSE_STATUSES);
const pulseSourceTypeSchema = z.enum(PULSE_SOURCE_TYPES);

export const pulseItemIngestSchema = z
  .object({
    id: uuidSchema.optional().meta({
      description: "Existing pulse item id for update; omit to create.",
    }),
    title: z.string().min(1),
    summary: z.string().min(1),
    whyItMatters: z.union([z.string().min(1), z.null()]).optional(),
    suggestedAction: z.union([z.string().min(1), z.null()]).optional(),
    category: pulseCategorySchema,
    impact: pulseImpactSchema,
    urgency: pulseUrgencySchema,
    status: pulseStatusSchema.optional().meta({ description: "Defaults to new." }),
    sourceType: pulseSourceTypeSchema.optional().meta({
      description: "Defaults to cron.",
    }),
    sourceUrl: z.union([z.string().url(), z.null()]).optional(),
    sourceTitle: z.union([z.string().min(1), z.null()]).optional(),
    startsAt: z.union([isoInstantSchema, z.null()]).optional(),
    dueAt: z.union([isoInstantSchema, z.null()]).optional(),
    expiresAt: z.union([isoInstantSchema, z.null()]).optional(),
    dedupeKey: z.string().min(1),
    confidence: z
      .number()
      .min(0)
      .max(1)
      .nullable()
      .optional()
      .meta({ description: "Optional model confidence from 0 to 1." }),
    payload: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();

export const pulseItemsIngestSchema = z
  .object({
    userId: uuidSchema,
    items: z.array(pulseItemIngestSchema).min(1).max(50),
  })
  .strict()
  .openapi("PulseItemsIngest");

export type PulseItemsIngestBody = z.infer<typeof pulseItemsIngestSchema>;
export type PulseItemIngest = z.infer<typeof pulseItemIngestSchema>;
