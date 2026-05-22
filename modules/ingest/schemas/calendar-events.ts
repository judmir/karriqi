import { z } from "@/modules/ingest/openapi/zod-openapi";
import { isoInstantSchema, uuidSchema } from "@/modules/ingest/primitives";
import { CALENDAR_EVENT_COLORS } from "@/types/calendar";

const calendarColorSchema = z.enum(CALENDAR_EVENT_COLORS);

export const calendarEventIngestSchema = z
  .object({
    id: uuidSchema.optional()
      .meta({ description: "Existing event id for update; omit to create." }),
    title: z.string().min(1),
    description: z.union([z.string().min(1), z.null()]).optional(),
    startAt: isoInstantSchema,
    endAt: isoInstantSchema,
    allDay: z.boolean().optional().meta({ description: "Defaults to false." }),
    color: calendarColorSchema.optional().meta({ description: "Defaults to blue." }),
  })
  .strict()
  .superRefine((data, ctx) => {
    const start = Date.parse(data.startAt);
    const end = Date.parse(data.endAt);
    if (Number.isFinite(start) && Number.isFinite(end) && end < start) {
      ctx.addIssue({
        code: "custom",
        message: "endAt must be on or after startAt",
        path: ["endAt"],
      });
    }
  });

export const calendarEventsIngestSchema = z
  .object({
    userId: uuidSchema,
    events: z.array(calendarEventIngestSchema).min(1).max(50),
  })
  .strict()
  .openapi("CalendarEventsIngest");

export type CalendarEventsIngestBody = z.infer<typeof calendarEventsIngestSchema>;
export type CalendarEventIngest = z.infer<typeof calendarEventIngestSchema>;
