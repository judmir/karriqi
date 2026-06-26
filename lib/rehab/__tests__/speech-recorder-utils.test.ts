import { describe, expect, it } from "vitest";

import {
  consolidateSpeechRecorderChunks,
  formatSpeechDuration,
} from "@/lib/rehab/speech-recorder-utils";

describe("formatSpeechDuration", () => {
  it("formats minutes and seconds for short clips", () => {
    expect(formatSpeechDuration(0)).toBe("0:00");
    expect(formatSpeechDuration(75)).toBe("1:15");
  });

  it("formats hours for long sessions", () => {
    expect(formatSpeechDuration(54 * 60 + 12)).toBe("54:12");
    expect(formatSpeechDuration(3_661)).toBe("1:01:01");
  });
});

describe("consolidateSpeechRecorderChunks", () => {
  it("merges many small chunks into fewer blob parts", () => {
    const chunks = Array.from({ length: 120 }, (_, index) =>
      new Blob([`chunk-${index}`], { type: "audio/webm" }),
    );

    const consolidated = consolidateSpeechRecorderChunks(chunks, "audio/webm", 8);

    expect(consolidated.length).toBeLessThanOrEqual(8);
    const originalSize = new Blob(chunks, { type: "audio/webm" }).size;
    const consolidatedSize = new Blob(consolidated, { type: "audio/webm" }).size;
    expect(consolidatedSize).toBe(originalSize);
  });

  it("leaves small chunk lists unchanged", () => {
    const chunks = [new Blob(["a"], { type: "audio/webm" })];
    expect(consolidateSpeechRecorderChunks(chunks, "audio/webm")).toEqual(chunks);
  });
});
