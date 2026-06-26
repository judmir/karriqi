import { beforeEach, describe, expect, it, vi } from "vitest";

import type { RehabPlanEvent } from "@/types/rehab";

vi.mock("@/lib/rehab/rehab-plan-actions", () => ({
  createRehabPlanEvent: vi.fn(),
  deleteRehabPlanEvent: vi.fn(),
  deleteRehabSeries: vi.fn(),
  splitRehabSeries: vi.fn(),
  toggleRehabPlanEventCompleted: vi.fn(),
  updateRehabPlanEvent: vi.fn(),
  upsertRehabOccurrenceOverride: vi.fn(),
}));

vi.mock("@/lib/rehab/speech-recording-client", () => ({
  completeSpeechRecordingUploadClient: vi.fn(),
  deleteSpeechRecordingClient: vi.fn(),
  replaceSpeechRecordingClient: vi.fn(),
  updateSpeechRecordingNoteClient: vi.fn(),
}));

vi.mock("@/stores/load-actions", () => ({
  loadRehabPlanStoreAction: vi.fn(),
}));

import { toggleRehabPlanEventCompleted } from "@/lib/rehab/rehab-plan-actions";
import { loadRehabPlanStoreAction } from "@/stores/load-actions";
import {
  rehabPlanStoreHasPendingCompletions,
  useRehabPlanStore,
} from "@/stores/rehab-plan-store";

const baseEvent: RehabPlanEvent = {
  id: "11111111-1111-4111-8111-111111111111",
  userId: "user",
  title: "Stretch",
  description: null,
  startAt: "2026-06-26T09:00:00.000Z",
  endAt: "2026-06-26T09:30:00.000Z",
  allDay: false,
  color: "blue",
  source: "local",
  completedAt: null,
  eventKind: "custom",
  programId: null,
  planWeek: null,
  seriesId: null,
  recurrence: null,
  recurrenceAt: null,
  recurrenceCancelled: false,
  speechRecordings: [],
  createdAt: "2026-06-26T08:00:00.000Z",
  updatedAt: "2026-06-26T08:00:00.000Z",
};

describe("rehab plan store completion pending", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useRehabPlanStore.getState().reset();
    vi.mocked(toggleRehabPlanEventCompleted).mockResolvedValue({ ok: true });
  });

  it("keeps optimistic completion during refresh until server catches up", async () => {
    useRehabPlanStore.setState({
      events: [baseEvent],
      persistence: true,
      loadedAt: Date.now(),
    });

    await useRehabPlanStore.getState().toggleCompleted(baseEvent.id, true);

    expect(
      useRehabPlanStore.getState().events[0]?.completedAt,
    ).not.toBeNull();
    expect(rehabPlanStoreHasPendingCompletions()).toBe(true);
    expect(toggleRehabPlanEventCompleted).not.toHaveBeenCalled();

    vi.mocked(loadRehabPlanStoreAction).mockResolvedValue({
      ok: true,
      events: [{ ...baseEvent, completedAt: null }],
      persistence: true,
    });

    await useRehabPlanStore.getState().refresh();

    expect(rehabPlanStoreHasPendingCompletions()).toBe(true);
    expect(
      useRehabPlanStore.getState().events[0]?.completedAt,
    ).not.toBeNull();

    await vi.advanceTimersByTimeAsync(450);
    await Promise.resolve();

    expect(toggleRehabPlanEventCompleted).toHaveBeenCalledWith({
      id: baseEvent.id,
      completed: true,
    });

    vi.mocked(loadRehabPlanStoreAction).mockResolvedValue({
      ok: true,
      events: [
        {
          ...baseEvent,
          completedAt: "2026-06-26T09:05:00.000Z",
        },
      ],
      persistence: true,
    });

    await useRehabPlanStore.getState().refresh();

    expect(useRehabPlanStore.getState().events[0]?.completedAt).toBe(
      "2026-06-26T09:05:00.000Z",
    );
  });
});
