import { DEFAULT_ALBANIAN_STAPLES } from "@/lib/shopping/default-albanian-staples";
import type { StapleItem } from "@/types/shopping";

const base = new Date("2026-01-01T12:00:00.000Z").getTime();

/** Mock catalog when Supabase is off — same items as DB default seed. */
export const mockStaples: StapleItem[] = DEFAULT_ALBANIAN_STAPLES.map(
  (s, index) => {
    const createdAt = new Date(base + index * 60 * 60 * 1000).toISOString();
    const lastOffsets = [4, 10, undefined, 2, 5, 12, 6, 8, 3, 5];
    const off = lastOffsets[index];
    return {
      id: s.mockId,
      name: s.name,
      typicalIntervalDays: s.typicalIntervalDays,
      createdAt,
      ...(off != null
        ? {
            lastPurchasedAt: new Date(
              Date.now() - off * 24 * 60 * 60 * 1000,
            ).toISOString(),
          }
        : {}),
    };
  },
);
