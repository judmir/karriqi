import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import { runRuleOf3MorningReminderNotifications } from "@/lib/notifications/rule-of-3-morning-reminder";
import * as dispatchModule from "@/lib/notifications/dispatch";
import * as adminModule from "@/lib/supabase/admin";

describe("runRuleOf3MorningReminderNotifications", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-16T07:15:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("skips outside the 08:15 window in Europe/London", async () => {
    vi.setSystemTime(new Date("2026-06-16T12:00:00.000Z"));
    const adminSpy = vi.spyOn(adminModule, "createAdminClient");

    const result = await runRuleOf3MorningReminderNotifications();

    expect(result).toEqual({ notified: 0 });
    expect(adminSpy).not.toHaveBeenCalled();
  });
});

describe("runRuleOf3MorningReminderNotifications (08:15 window)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-16T07:15:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("returns zero when admin client is unavailable", async () => {
    vi.spyOn(adminModule, "createAdminClient").mockReturnValue(null);

    const result = await runRuleOf3MorningReminderNotifications();

    expect(result).toEqual({ notified: 0 });
  });

  it("notifies users with no priorities set for today", async () => {
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
      if (table === "rule_of_3_morning_reminder_sends") {
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

    const result = await runRuleOf3MorningReminderNotifications();

    expect(result).toEqual({ notified: 1 });
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Rule of 3",
        body: "Set your 3 priorities for today before you dive in.",
        recipientUserIds: ["user-a"],
        href: "/rule-of-3",
      }),
    );
  });
});
