import type { WeekendPlannerIngestBody } from "@/modules/operator/weekend-planner-schema";

export function buildWeekendPlannerIngest(
  overrides: Partial<WeekendPlannerIngestBody> = {},
): WeekendPlannerIngestBody {
  const base: WeekendPlannerIngestBody = {
    userId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    kind: "weekend_planner",
    title: "Weekend options",
    summary: "Three strong Berlin family options for this weekend.",
    dedupeKey: "weekend-planner-2026-05-09",
    startsAt: "2026-05-09T00:00:00+02:00",
    endsAt: "2026-05-10T23:59:59+02:00",
    payload: {
      locationLabel: "Berlin",
      audience: "family",
      weatherSummary: "Saturday mixed, Sunday sunny",
      items: [
        {
          rank: 1,
          title: "Naturkundemuseum family workshop",
          subtitle: "Hands-on dinosaur session",
          startsAt: "2026-05-09T11:00:00+02:00",
          endsAt: "2026-05-09T12:30:00+02:00",
          category: "museum",
          costText: "€24 family ticket",
          travelTimeText: "28 min",
          bookingUrl: "https://example.com/",
          isIndoor: true,
          isRainFallback: false,
          weatherNote: null,
        },
        {
          rank: 2,
          title: "Tempelhofer Feld picnic window",
          subtitle: "Best outdoor slot on Sunday",
          startsAt: "2026-05-10T14:00:00+02:00",
          endsAt: "2026-05-10T16:30:00+02:00",
          category: "park",
          costText: "Free",
          travelTimeText: "22 min",
          bookingUrl: "https://example.com/",
          isIndoor: false,
          isRainFallback: false,
          weatherNote: "Weather looks good",
        },
        {
          rank: 3,
          title: "FEZ Berlin",
          subtitle: "Indoor fallback if rain hits",
          startsAt: "2026-05-10T13:00:00+02:00",
          endsAt: "2026-05-10T17:00:00+02:00",
          category: "indoor-play",
          costText: "€10–15",
          travelTimeText: "35 min",
          bookingUrl: "https://example.com/",
          isIndoor: true,
          isRainFallback: true,
          weatherNote: null,
        },
      ],
    },
  };

  return { ...base, ...overrides };
}
