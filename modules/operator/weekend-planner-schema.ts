import { z } from "zod";

import { isoInstant, uuidLike } from "@/modules/operator/ingest-primitives";

const weekendPlannerItemSchema = z.object({
  rank: z.number().int(),
  title: z.string().min(1),
  subtitle: z.union([z.string().min(1), z.null()]).optional(),
  startsAt: isoInstant,
  endsAt: z.union([isoInstant, z.null()]).optional(),
  category: z.string().min(1),
  costText: z.string().min(1),
  travelTimeText: z.string().min(1),
  bookingUrl: z.union([z.string().url(), z.null()]).optional(),
  isIndoor: z.boolean(),
  isRainFallback: z.boolean(),
  weatherNote: z.union([z.string().min(1), z.null()]).optional(),
});

/** Nested JSON stored in `operator_entries.payload` for `kind = weekend_planner` */
export const weekendPlannerPayloadSchema = z
  .object({
    locationLabel: z.string().min(1),
    audience: z.string().min(1),
    weatherSummary: z.union([z.string().min(1), z.null()]).optional(),
    items: z.array(weekendPlannerItemSchema).min(1).max(3),
  })
  .superRefine((data, ctx) => {
    const ranks = [...data.items.map((item) => item.rank)].sort((a, b) => a - b);
    const expected = data.items.map((_, i) => i + 1);
    let ok =
      ranks.length === data.items.length && new Set(ranks).size === ranks.length;

    if (ok) {
      for (let i = 0; i < ranks.length; i++) {
        if (ranks[i] !== expected[i]) {
          ok = false;
          break;
        }
      }
    }

    if (!ok) {
      ctx.addIssue({
        code: "custom",
        message:
          "`items[].rank` must be unique sequential integers starting at 1 (e.g. 1, 2).",
      });
    }
  });

/** POST /api/operator/entries JSON body — branch `kind: "weekend_planner"` */
export const weekendPlannerIngestSchema = z
  .object({
    userId: uuidLike,
    kind: z.literal("weekend_planner"),
    title: z.string().min(1),
    summary: z.union([z.string().min(1), z.null()]).optional(),
    dedupeKey: z.string().min(1),
    startsAt: z.union([isoInstant, z.null()]).optional(),
    endsAt: z.union([isoInstant, z.null()]).optional(),
    payload: weekendPlannerPayloadSchema,
  })
  .strict();

export type WeekendPlannerPayload = z.infer<typeof weekendPlannerPayloadSchema>;
export type WeekendPlannerIngestBody = z.infer<typeof weekendPlannerIngestSchema>;
