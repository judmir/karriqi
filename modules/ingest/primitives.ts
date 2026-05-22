import { z } from "@/modules/ingest/openapi/zod-openapi";

/** UUID string (any version); matches Supabase auth user ids. */
export const uuidSchema = z
  .string()
  .regex(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    "Must be a UUID",
  )
  .meta({ description: "Supabase auth user id (household member or owner)." });

export const isoInstantSchema = z.string().refine(
  (s) => Number.isFinite(Date.parse(s)),
  "Invalid ISO 8601 timestamp",
);
