import { describe, expect, it } from "vitest";

import { NOTIFICATION_KINDS } from "@/lib/notifications/kinds";
import {
  PUSH_NOTIFICATION_ACTION,
  pushActionContextForDispatch,
  pushActionsForKind,
} from "@/lib/notifications/push-actions";

describe("pushActionsForKind", () => {
  it("exposes mark complete for rehab reminders", () => {
    expect(pushActionsForKind(NOTIFICATION_KINDS.rehabReminder)).toEqual([
      {
        action: PUSH_NOTIFICATION_ACTION.markComplete,
        title: "Mark as completed",
      },
    ]);
  });

  it("exposes mark complete for stale todos", () => {
    expect(pushActionsForKind(NOTIFICATION_KINDS.todoStale)).toEqual([
      {
        action: PUSH_NOTIFICATION_ACTION.markComplete,
        title: "Mark as completed",
      },
    ]);
  });

  it("returns no actions for informational kinds", () => {
    expect(pushActionsForKind(NOTIFICATION_KINDS.shoppingListUpdated)).toEqual([]);
  });
});

describe("pushActionContextForDispatch", () => {
  it("merges metadata for actionable kinds", () => {
    expect(
      pushActionContextForDispatch({
        kind: NOTIFICATION_KINDS.rehabReminder,
        metadata: {
          rehab_plan_event_id: "11111111-1111-4111-8111-111111111111",
          occurrence_at: "2026-06-17T12:00:00.000Z",
        },
      }),
    ).toEqual({
      kind: NOTIFICATION_KINDS.rehabReminder,
      rehab_plan_event_id: "11111111-1111-4111-8111-111111111111",
      occurrence_at: "2026-06-17T12:00:00.000Z",
    });
  });
});
