import { z } from "zod";

export const isoInstant = z.string().refine(
  (s) => Number.isFinite(Date.parse(s)),
  "Invalid ISO 8601 timestamp",
);

export const uuidLike = z.string().regex(
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  "Must be a UUID",
);
