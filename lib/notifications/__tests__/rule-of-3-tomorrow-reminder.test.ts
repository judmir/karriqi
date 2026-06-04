import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import { runRuleOf3TomorrowReminderNotifications } from "@/lib/notifications/rule-of-3-tomorrow-reminder";
import * as dispatchModule from "@/lib/notifications/dispatch";
import * as adminModule from "@/lib/supabase/admin";

describe("runRuleOf3TomorrowReminderNotifications", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-04T20:30:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("skips outside the 21:00 hour in Europe/London", async () => {
    vi.setSystemTime(new Date("2026-06-04T12:00:00.000Z"));
    const adminSpy = vi.spyOn(adminModule, "createAdminClient");

    const result = await runRuleOf3TomorrowReminderNotifications();

    expect(result).toEqual({ notified: 0 });
    expect(adminSpy).not.toHaveBeenCalled();
  });
});

describe("runRuleOf3TomorrowReminderNotifications (21:00 window)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-04T20:30:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("returns zero when admin client is unavailable", async () => {
    vi.spyOn(adminModule, "createAdminClient").mockReturnValue(null);

    const result = await runRuleOf3TomorrowReminderNotifications();

    expect(result).toEqual({ notified: 0 });
  });

  it("notifies users with incomplete tomorrow plans", async () => {
    const dispatch = vi
      .spyOn(dispatchModule, "dispatchNotification")
      .mockResolvedValue(undefined);

    const from = vi.fn().mockImplementation((table: string) => {
      if (table === "push_subscriptions") {
        return {
          select: () =>
            Promise.resolve({ data: [{ user_id: "user-a" }], error: null }),
        };
      }
      if (table === "rule_of_3_evening_reminder_sends") {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: () =>
                  Promise.resolve({ data: null, error: null }),
              }),
            }),
          }),
          insert: () => Promise.resolve({ error: null }),
        };
      }
      if (table === "rule_of_3_days") {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: () =>
                  Promise.resolve({ data: null, error: null }),
              }),
            }),
          }),
        };
      }
      return {};
    });

    vi.spyOn(adminModule, "createAdminClient").mockReturnValue({
      from,
    } as unknown as ReturnType<typeof adminModule.createAdminClient>);

    const result = await runRuleOf3TomorrowReminderNotifications();

    expect(result).toEqual({ notified: 1 });
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Rule of 3",
        body: "Choose tomorrow's 3 before the day ends (21:00)",
        recipientUserIds: ["user-a"],
        href: "/rule-of-3",
      }),
    );
  });
});
