import { describe, expect, it } from "vitest";

import { normalizeSpeechRecordingNote } from "@/lib/rehab/speech-recording-note";

describe("normalizeSpeechRecordingNote", () => {
  it("trims and nulls empty notes", () => {
    expect(normalizeSpeechRecordingNote("  hello  ")).toBe("hello");
    expect(normalizeSpeechRecordingNote("   ")).toBeNull();
    expect(normalizeSpeechRecordingNote(null)).toBeNull();
  });
});
