import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { runRehabReminderNotifications } from "@/lib/notifications/rehab-reminders";
import * as dispatchModule from "@/lib/notifications/dispatch";
import * as adminModule from "@/lib/supabase/admin";

type QueryResult = { data: unknown; error: null };

function chain(result: QueryResult, extra: Record<string, unknown> = {}) {
  const terminal = () => Promise.resolve(result);
  const builder: Record<string, unknown> = {
    ...extra,
    then: (resolve: (value: QueryResult) => void) => terminal().then(resolve),
  };
  for (const method of [
    "select",
    "is",
    "eq",
    "not",
    "gte",
    "lte",
    "in",
    "update",
  ]) {
    builder[method] = () => chain(result, extra);
  }
  return builder;
}

describe("runRehabReminderNotifications", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-17T13:55:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("returns zero when admin client is unavailable", async () => {
    vi.spyOn(adminModule, "createAdminClient").mockReturnValue(null);

    const result = await runRehabReminderNotifications();

    expect(result).toEqual({ notified: 0 });
  });

  it("skips completed standalone timed events", async () => {
    const dispatch = vi
      .spyOn(dispatchModule, "dispatchNotification")
      .mockResolvedValue(undefined);

    const from = vi.fn().mockImplementation((table: string) => {
      if (table === "rehab_plan_events") {
        return chain({ data: [], error: null });
      }
      if (table === "rehab_event_reminders") {
        return chain({ data: [], error: null });
      }
      return chain({ data: [], error: null });
    });

    vi.spyOn(adminModule, "createAdminClient").mockReturnValue({
      from,
    } as unknown as ReturnType<typeof adminModule.createAdminClient>);

    const result = await runRehabReminderNotifications();

    expect(result).toEqual({ notified: 0 });
    expect(dispatch).not.toHaveBeenCalled();
  });

  it("skips completed recurring occurrences", async () => {
    const dispatch = vi
      .spyOn(dispatchModule, "dispatchNotification")
      .mockResolvedValue(undefined);

    const from = vi.fn().mockImplementation((table: string) => {
      if (table === "rehab_plan_events") {
        return {
          select: (columns: string) => {
            if (columns === "id") {
              return chain({ data: [], error: null });
            }
            if (columns === "series_id, recurrence_at") {
              return chain({
                data: [
                  {
                    series_id: "series-1",
                    recurrence_at: "2026-06-17T14:00:00.000Z",
                  },
                ],
                error: null,
              });
            }
            if (columns.includes("recurrence_rule")) {
              return chain({
                data: [
                  {
                    id: "master-1",
                    user_id: "user-a",
                    title: "Daily walk",
                    start_at: "2026-06-10T14:00:00.000Z",
                    end_at: "2026-06-10T14:30:00.000Z",
                    recurrence_rule: JSON.stringify({
                      freq: "daily",
                      interval: 1,
                    }),
                    series_id: "series-1",
                  },
                ],
                error: null,
              });
            }
            return chain({ data: [], error: null });
          },
        };
      }
      if (table === "rehab_event_reminders") {
        return chain({ data: [], error: null });
      }
      return chain({ data: [], error: null });
    });

    vi.spyOn(adminModule, "createAdminClient").mockReturnValue({
      from,
    } as unknown as ReturnType<typeof adminModule.createAdminClient>);

    const result = await runRehabReminderNotifications();

    expect(result).toEqual({ notified: 0 });
    expect(dispatch).not.toHaveBeenCalled();
  });

  it("notifies for incomplete timed events", async () => {
    const dispatch = vi
      .spyOn(dispatchModule, "dispatchNotification")
      .mockResolvedValue(undefined);

    const from = vi.fn().mockImplementation((table: string) => {
      if (table === "rehab_plan_events") {
        return {
          select: (columns: string) => {
            if (columns === "id") {
              return chain({
                data: [{ id: "event-1" }],
                error: null,
              });
            }
            if (columns.includes("recurrence_rule")) {
              return chain({ data: [], error: null });
            }
            return chain({
              data: [
                {
                  id: "event-1",
                  user_id: "user-a",
                  title: "Speech practice",
                  start_at: "2026-06-17T14:00:00.000Z",
                },
              ],
              error: null,
            });
          },
          update: () => chain({ data: null, error: null }),
        };
      }
      return chain({ data: [], error: null });
    });

    vi.spyOn(adminModule, "createAdminClient").mockReturnValue({
      from,
    } as unknown as ReturnType<typeof adminModule.createAdminClient>);

    const result = await runRehabReminderNotifications();

    expect(result).toEqual({ notified: 1 });
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Speech practice",
        body: "Starting in 5 minutes",
        recipientUserIds: ["user-a"],
      }),
    );
  });
});
