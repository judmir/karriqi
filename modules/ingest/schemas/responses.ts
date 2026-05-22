import { z } from "@/modules/ingest/openapi/zod-openapi";
import { uuidSchema } from "@/modules/ingest/primitives";

export const ingestSuccessResponseSchema = z
  .object({
    status: z.literal("ok"),
    results: z.array(
      z.object({
        id: uuidSchema,
        action: z.enum(["created", "updated"]),
      }),
    ),
  })
  .openapi("IngestSuccessResponse");

export const ingestErrorResponseSchema = z
  .object({
    error: z.string(),
    details: z.unknown().optional(),
  })
  .openapi("IngestErrorResponse");
