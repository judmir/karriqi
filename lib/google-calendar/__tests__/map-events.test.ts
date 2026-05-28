import { describe, expect, it } from "vitest";

import {
  googleEventToKarriqiInsert,
  karriqiEventToGoogleBody,
} from "@/lib/google-calendar/map-events";

describe("google calendar map-events", () => {
  it("maps timed Google events to Karriqi rows", () => {
    const mapped = googleEventToKarriqiInsert({
      userId: "user-1",
      calendarId: "primary",
      item: {
        id: "google-1",
        etag: '"abc"',
        summary: "Team sync",
        description: "Notes",
        updated: "2026-05-27T10:00:00.000Z",
        start: { dateTime: "2026-05-27T14:00:00.000Z" },
        end: { dateTime: "2026-05-27T15:00:00.000Z" },
      },
    });

    expect(mapped).toMatchObject({
      user_id: "user-1",
      title: "Team sync",
      description: "Notes",
      all_day: false,
      google_event_id: "google-1",
      source: "google",
    });
  });

  it("maps all-day Karriqi rows to Google date fields", () => {
    const body = karriqiEventToGoogleBody({
      title: "Holiday",
      description: null,
      start_at: "2026-05-27T00:00:00.000Z",
      end_at: "2026-05-28T00:00:00.000Z",
      all_day: true,
    });

    expect(body).toEqual({
      summary: "Holiday",
      description: undefined,
      start: { date: "2026-05-27" },
      end: { date: "2026-05-28" },
    });
  });
});
