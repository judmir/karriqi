import { describe, expect, it } from "vitest";

import {
  emptySpeechSession,
  mergeSpeechEventDescription,
  parseSpeechSession,
  serializeSpeechSession,
  type SpeechSessionData,
} from "@/lib/rehab/speech-session";
import { SPEECH_EVENT_DESCRIPTION_STUB } from "@/modules/rehab/neuro-rehab-2026/speech-content";

describe("speech-session", () => {
  it("round-trips ratings and spontaneous selections", () => {
    const session: SpeechSessionData = {
      ...emptySpeechSession(),
      ratings: { clarity: 7, effort: 4 },
      spontaneousDone: true,
      spontaneousDoneAt: "2026-06-24T10:00:00.000Z",
      spontaneous: {
        speechFelt: "clear",
        bodyFelt: "tired",
        tomorrowNotice: "breath",
      },
      hardSounds: ["rr", "gj"],
    };

    const raw = serializeSpeechSession(session);
    expect(raw).toBeTruthy();
    expect(parseSpeechSession(raw)).toEqual(session);
  });

  it("preserves session data when syncing template descriptions", () => {
    const existing = serializeSpeechSession({
      ...emptySpeechSession(),
      ratings: { fatigue: 6 },
      spontaneousDone: false,
      spontaneousDoneAt: null,
      hardSounds: [],
    });

    const merged = mergeSpeechEventDescription(
      SPEECH_EVENT_DESCRIPTION_STUB,
      existing,
    );

    expect(parseSpeechSession(merged).ratings.fatigue).toBe(6);
  });
});
