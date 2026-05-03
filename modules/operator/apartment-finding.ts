import {
  apartmentFindingPayloadSchema,
  type ApartmentFindingPayload,
} from "@/modules/operator/apartment-finding-schema";

export function tryParseApartmentFindingPayload(
  payload: unknown,
): ApartmentFindingPayload | null {
  const parsed = apartmentFindingPayloadSchema.safeParse(payload);
  return parsed.success ? parsed.data : null;
}
