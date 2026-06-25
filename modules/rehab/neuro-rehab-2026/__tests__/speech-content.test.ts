import { describe, expect, it } from "vitest";

import { PROGRAM_START } from "@/modules/rehab/neuro-rehab-2026/constants";
import {
  SPEECH_EVENT_DESCRIPTION_STUB,
  buildSpeechDescriptionForDate,
  speechDayPlanForDate,
  speechReadingTextForDate,
} from "@/modules/rehab/neuro-rehab-2026/speech-content";
import {
  SPEECH_BASELINE_A,
  SPEECH_BASELINE_B,
  SPEECH_ROTATING_TEXTS,
} from "@/modules/rehab/neuro-rehab-2026/speech-reading-texts";

describe("speech-content", () => {
  it("stores a short stub on generated events", () => {
    expect(buildSpeechDescriptionForDate(PROGRAM_START)).toBe(
      SPEECH_EVENT_DESCRIPTION_STUB,
    );
  });

  it("picks one articulation text on Mon/Wed/Fri", () => {
    const monday = new Date(2026, 5, 15);
    const tuesday = new Date(2026, 5, 16);

    expect(speechDayPlanForDate(monday).includeArticulation).toBe(true);
    expect(speechReadingTextForDate(monday).body).toBe(SPEECH_BASELINE_B.body);
    expect(speechReadingTextForDate(tuesday).body).not.toBe(
      SPEECH_BASELINE_B.body,
    );
  });

  it("never schedules English — Thu gets rotating Albanian text", () => {
    const thursday = new Date(2026, 5, 18);
    expect(speechReadingTextForDate(thursday).body).toBe(
      SPEECH_ROTATING_TEXTS[4]!.body,
    );
    expect(speechReadingTextForDate(thursday).title).not.toMatch(/English/i);
  });

  it("uses baseline A on program Sundays", () => {
    const sunday = new Date(2026, 5, 21);
    expect(speechReadingTextForDate(sunday).body).toBe(SPEECH_BASELINE_A.body);
  });

  it("uses baseline A on weekly anchor days", () => {
    expect(speechReadingTextForDate(PROGRAM_START).body).toBe(
      SPEECH_BASELINE_A.body,
    );
  });

  it("cycles rotating Albanian texts on other days", () => {
    const tuesday = new Date(2026, 5, 16);
    expect(speechReadingTextForDate(tuesday).body).toBe(
      SPEECH_ROTATING_TEXTS[2].body,
    );
  });
});
